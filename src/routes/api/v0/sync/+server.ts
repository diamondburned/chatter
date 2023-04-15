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
    const lastAck: string | undefined = url.searchParams.has("lastAck")
      ? url.searchParams.get("lastAck")
      : undefined;

    const now = Date.now();
    const ack = db.newID(now);

    console.log(`syncing: ${lastAck} <= x <= ${now}`);

    const user = await db.client.user.findUniqueOrThrow({
      where: { id: session.userID },
      include: {
        ownsRooms: {
          include: {
            owner: true,
          },
        },
        joinedRooms: {
          select: {
            room: {
              include: {
                owner: true,
                events: {
                  take: 100,
                  where: {
                    id: {
                      gte: lastAck,
                      lte: ack,
                    },
                  },
                  orderBy: { id: "desc" },
                  include: { author: true },
                },
              },
            },
          },
        },
      },
    });

    const joinedRooms = user.joinedRooms
      .map((m) => m.room)
      .map((r) => db.convertRoom(r, r.owner));
    const ownsRooms = user.ownsRooms.map((r) => db.convertRoom(r, r.owner));

    const events: Record<string, api.RoomEvent[]> = {};
    for (const { room } of user.joinedRooms) {
      events[room.id] = room.events.map((ev) => db.convertEvent(ev, ev.author));
    }

    const sync: api.SyncResponse = {
      me: {
        ...db.convertUser(user),
        joinedRooms,
        ownsRooms,
      },
      ack,
      events,
    };

    return api.respond(sync);
  } catch (err) {
    return api.respondError(400, err);
  }
}
