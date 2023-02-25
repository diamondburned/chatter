import * as api from "#lib/api/";
import { APITester, assert, assertEq } from "#lib/testing/";
import { describe, it } from "vitest";

const addr = process.env["TESTING_API"];
if (!addr) {
  throw new Error(`missing $TESTING_API address`);
}

const registrationSecret = process.env["REGISTRATION_SECRET"] || "";

describe("api/v0", () => {
  let meID;
  let lastAck;
  let ourRoomID;
  let ourMessageID;

  const tester = new APITester(addr);
  tester.headers.set("X-Registration-Secret", registrationSecret);

  it("register", async () => {
    try {
      await tester.post<api.RegisterRequest, api.RegisterResponse>(
        "/api/v0/register",
        {
          username: "tester bester",
          password: "password",
        }
      );
    } catch (err) {
      // console.debug("cannot register, continuing anyway...", err);
    }
  });

  it("login", async () => {
    const login = await tester.post<api.LoginRequest, api.LoginResponse>(
      "/api/v0/login",
      {
        username: "tester bester",
        password: "password",
      }
    );
    meID = login.userID;
    tester.headers.set("Authorization", login.token);
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {});
    lastAck = sync.ack;
    // console.debug(`synced to ${sync.ack}:`, sync);
  });

  it("delete existing room", async () => {
    const list = await tester.get<api.ListRoomsResponse>("/api/v0/rooms", {
      ownerID: meID,
    });

    const testRoom = list.rooms.find((room) => room.name === "test room");
    if (!testRoom) {
      return;
    }

    // console.debug("deleting existing test room", testRoom);

    await tester.delete<api.DeleteRoomRequest, api.DeleteRoomResponse>(
      `/api/v0/rooms/${testRoom.id}`,
      { roomID: "" } // this is useless
    );
  });

  it("create room", async () => {
    const room = await tester.post<
      api.CreateRoomRequest,
      api.CreateRoomResponse
    >("/api/v0/rooms", { name: "test room" });
    ourRoomID = room.id;
    assert(room.id);
    assertEq(room.name, "test room");
  });

  it("list rooms", async () => {
    const list = await tester.get<api.ListRoomsResponse>("/api/v0/rooms", {
      ownerID: meID,
    });
    assert(list.rooms.length > 0);
    assert(list.rooms.find((r) => r.id === ourRoomID));
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {
      lastAck,
    });
    lastAck = sync.ack;
    // console.debug(`synced to ${sync.ack}:`, sync);

    assertEq(sync.events.length, 1);

    assert(sync.me.ownsRooms.length > 0);
    assert(sync.me.ownsRooms.find((r) => r.id == ourRoomID));

    assert(sync.me.joinedRooms.length > 0);
    assert(sync.me.joinedRooms.find((r) => r.id == ourRoomID));
  });

  it("send message event", async () => {
    const ev = await tester.post<api.SendEventRequest, api.SendEventResponse>(
      `/api/v0/rooms/${ourRoomID}/events`,
      {
        type: "message_create",
        content: { markdown: "hello world" },
      }
    );
    ourMessageID = ev.id;

    assert(ev.id);
    assertEq(ev.type, "message_create");
    assertEq(ev.content, { markdown: "hello world" });
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {
      lastAck,
    });
    lastAck = sync.ack;
    // console.debug(`synced to ${sync.ack}:`, sync);

    assertEq(sync.events.length, 1);
    assertEq(sync.events[0].id, ourMessageID);
    assertEq(sync.events[0].type, "message_create");
  });

  it("list events", async () => {
    const list = await tester.get<api.RoomEventsResponse>(
      `/api/v0/rooms/${ourRoomID}/events`,
      {}
    );
    // console.debug("got these events after sending message:", list);

    assert(list.length > 0);
    assert(list.find((e) => e.id == ourMessageID));
  });

  it.todo("delete messages");
  it.todo("sync");

  it("delete room", async () => {
    await tester.delete<api.DeleteRoomRequest, api.DeleteRoomResponse>(
      `/api/v0/rooms/${ourRoomID}`,
      { roomID: "" } // this is useless
    );
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {
      lastAck,
    });
    lastAck = sync.ack;
    // console.debug(`synced to ${sync.ack}:`, sync);

    assert(!sync.events.length);
    assert(!sync.me.ownsRooms.find((r) => r.id == ourRoomID));
    assert(!sync.me.joinedRooms.find((r) => r.id == ourRoomID));
  });

  it("list rooms", async () => {
    const list = await tester.get<api.ListRoomsResponse>("/api/v0/rooms", {
      ownerID: meID,
    });

    assert(!list.rooms.length);
    assert(!list.rooms.find((r) => r.id === ourRoomID));
  });
});
