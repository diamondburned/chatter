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

    // console.log("=======");
    // console.log(`syncing: ${lastAck} <= x <= ${ack}`);
    // console.log("=======");

    let user = await db.client.user.findUniqueOrThrow({
      where: { id: session.userID },
    });

    const ownsRoomsQuery = await db.client.room.findMany({
      where: { ownerID: session.userID },
    });
    const ownsRooms = ownsRoomsQuery.map((r) => db.convertRoom(r, user));

    const joinedRoomsQuery = await db.client.room.findMany({
      where: { members: { some: { userID: session.userID } } },
      include: { owner: true },
    });
    const joinedRooms = joinedRoomsQuery.map((r) => db.convertRoom(r, r.owner));
    const joinedRoomIDs = joinedRooms.map((r) => r.id);

    const events: Record<string, api.RoomEvent[]> = {};
    if (joinedRoomIDs.length > 0) {
      const eventsQuery = await db.client.$queryRaw<
        (db.prisma.Event & {
          username: db.prisma.User["username"];
          userAttributes: db.prisma.User["attributes"];
        })[]
      >`
        SELECT 
          * 
        FROM 
          unnest(ARRAY[${db.Prisma.join(joinedRoomIDs)}]) AS "matchingID" 
        LEFT JOIN LATERAL (
          SELECT 
            public."Event".*, 
            public."User"."username" AS "username", 
            public."User"."attributes" AS "userAttributes" 
          FROM 
            public."Event" 
          INNER JOIN public."User" ON public."User"."id" = public."Event"."authorID" 
          WHERE 
            public."Event"."roomID" = "matchingID" AND
            public."Event"."id" > ${lastAck} AND
            public."Event"."id" <= ${ack}
          ORDER BY 
            public."Event"."id" DESC 
          LIMIT 
            100
        ) AS subquery ON true;
      `;

      joinedRoomsQuery.forEach((r) => {
        events[r.id] = eventsQuery
          .filter((e) => e.id) // no event for the current room
          .filter((e) => e.roomID === r.id) // only events for the current room
          .map((e) =>
            db.convertEvent(e, {
              id: e.authorID,
              username: e.username,
              passhash: null,
              attributes: e.userAttributes,
            })
          );
      });
    }

    // console.log("======= CUT HERE =======");

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
