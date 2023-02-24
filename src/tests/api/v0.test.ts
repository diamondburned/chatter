import * as api from "#lib/api/";
import { APITester, assert, assertEq } from "#lib/testing/";
import { describe, it } from "vitest";

const addr = process.env["TESTING_API"];
if (!addr) {
  throw new Error(`missing $TESTING_API address`);
}

describe("api/v0", () => {
  let lastSync;
  let ourRoomID;
  let ourMessageID;

  const tester = new APITester(addr);

  it("login", async () => {
    const login = await tester.post<api.LoginRequest, api.LoginResponse>(
      "/api/v0/login",
      {
        username: "diamond",
        password: "deeznuts",
      }
    );
    tester.headers.set("Authorization", login.token);
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {});
    lastSync = sync.ackTimestamp;
    console.log(`synced to ${sync.ackTimestamp}:`, sync);
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

  it.todo("list rooms");

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {
      lastSync,
    });
    lastSync = sync.ackTimestamp;
    console.log(`synced to ${sync.ackTimestamp}:`, sync);

    assert(sync.events.length == 0);

    assert(sync.me.ownsRooms.length > 0);
    assert(sync.me.ownsRooms.find((r) => r.id == ourRoomID));

    assert(sync.me.joinedRooms.length > 0);
    assert(sync.me.joinedRooms.find((r) => r.id == ourRoomID));
  });

  it("send message", async () => {
    const msg = await tester.post<
      api.SendMessageRequest,
      api.SendMessageResponse
    >(`/api/v0/rooms/${ourRoomID}/messages`, { markdown: "hello world" });
    ourMessageID = msg.id;

    assert(msg.id);
    assertEq(msg.content.markdown, "hello world");
  });

  it("sync", async () => {
    const sync = await tester.get<api.SyncResponse>("/api/v0/sync", {
      lastSync,
    });
    lastSync = sync.ackTimestamp;
    console.log(`synced to ${sync.ackTimestamp}:`, sync);

    assert(sync.events.length == 1);
    assertEq(sync.events[0].id, ourMessageID);
    assertEq(sync.events[0].type, "message_create");
  });

  it.todo("list messages");

  it.todo("delete messages");

  it.todo("sync");

  it.todo("delete room");

  it.todo("sync");

  it.todo("list rooms");
});
