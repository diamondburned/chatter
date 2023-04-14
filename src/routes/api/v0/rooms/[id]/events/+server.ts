import * as api from "#/lib/api/index.js";
import * as db from "#/lib/db/index.js";
import type * as sveltekit from "@sveltejs/kit";

export async function GET(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  const url = new URL(ev.request.url);

  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ev.params.id;
    const body: api.RoomEventsRequest = {
      limit: api.scanURLParam(url, "limit"),
      before: api.scanURLParam(url, "before"),
    };

    await db.joinRoom(session, roomID);

    const limit = body.limit ? Math.min(body.limit, 100) : 100;

    const events = await db.client.event.findMany({
      where: { roomID },
      include: { author: true },
      take: limit,
      cursor: body.before ? { id: body.before } : undefined,
    });

    const resp: api.RoomEventsResponse = events.map((ev) =>
      db.convertEvent(ev, ev.author)
    );

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}

const allowedEvents = new Set([
  "message_create",
  "message_update",
  "message_delete",
]);

export async function POST(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ev.params.id;
    const body: api.SendEventRequest = await ev.request.json();

    if (!allowedEvents.has(body.type)) {
      throw new Error("invalid event type");
    }

    await db.joinRoom(session, roomID);

    const event = await db.client.event.create({
      data: {
        id: db.newID(),
        type: body.type,
        roomID: roomID,
        authorID: session.userID,
        content: body.content,
      },
      include: {
        author: true,
      },
    });

    const resp: api.SendEventResponse = db.convertEvent(event, event.author);

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}
