import type * as api from "#/lib/api/index.js";
import { APITester, assert, assertEq } from "#/lib/testing/index.js";
import { describe, it } from "vitest";

let addr = process.env["TESTING_API"];
if (!addr) {
  console.log("using default API address (http://127.0.0.1:3000)");
  addr = "127.0.0.1:3000";
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
    assertEq(sync.me.id, meID);
  });

  it("update user", async () => {
    await tester.patch<api.UpdateUserRequest, api.UpdateUserResponse>(
      `/api/v0/users/me`,
      {
        username: "tester bester", // ok copilot
        attributes: {
          avatar: "data:x;base64,",
          mastodon: "@_@botsin.space",
        },
      }
    );

    const user2 = await tester.get<api.UserResponse>(`/api/v0/users/me`, {});
    assertEq(user2.id, meID);
    assertEq(user2.username, "tester bester");
    assertEq(user2.attributes.avatar, "data:x;base64,");
    assertEq(user2.attributes.mastodon, "@_@botsin.space");
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
    console.debug(`synced to ${sync.ack}:`, sync);

    assert(sync.events[ourRoomID], "no events for our room");
    assertEq(sync.events[ourRoomID].length, 1);

    assert(sync.me.ownsRooms.length > 0, "no owned rooms");
    assert(
      sync.me.ownsRooms.find((r) => r.id == ourRoomID),
      "no our owned room"
    );

    assert(sync.me.joinedRooms.length > 0, "no joined rooms");
    assert(
      sync.me.joinedRooms.find((r) => r.id == ourRoomID),
      "no our joined room"
    );
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

    assert(sync.events[ourRoomID], "no events for our room");
    assert(
      sync.events[ourRoomID].find(
        (ev) => ev.id === ourMessageID && ev.type == "message_create"
      ),
      `expected to find message_create event ${ourMessageID}`
    );
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

    assert(!Object.entries(sync.events).length);
    assert(!sync.me.ownsRooms.find((r) => r.id == ourRoomID));
    assert(!sync.me.joinedRooms.find((r) => r.id == ourRoomID));
  });

  it("list rooms", async () => {
    const list = await tester.get<api.ListRoomsResponse>("/api/v0/rooms", {
      ownerID: meID,
    });

    assert(
      !list.rooms.find((r) => r.id === ourRoomID),
      "expected our room to be gone"
    );
  });

  it("upload asset", async () => {
    const post = await fetch(tester.fromPath(`/api/v0/assets`), {
      method: "POST",
      body: "hello world",
      headers: tester.headers,
    });
    assert(post.ok, `got ${post.status} ${post.statusText}`);

    const resp = (await post.json()) as api.OKResponse<api.UploadAssetResponse>;
    assert(resp.hash);
    assertEq(resp.type, "text/plain; charset=utf-8");
    assertEq(resp.size, 11);

    const get = await fetch(tester.fromPath(`/api/v0/assets/${resp.hash}`));
    assert(get.ok, `got ${get.status} ${get.statusText}`);
    assertEq(get.headers.get("content-type"), "text/plain; charset=utf-8");
    assertEq(await get.text(), "hello world");
  });
});
