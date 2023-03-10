import * as astro from "astro";
import * as api from "#lib/api/index.js";
import * as db from "#lib/db/index.js";

export async function get(ctx: astro.APIContext): Promise<Response> {
  const url = new URL(ctx.request.url);

  let session: db.prisma.Session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const body: api.ListRoomsRequest = {
      limit: api.scanURLParam(url, "limit"),
      query: api.scanURLParam(url, "query"),
      before: api.scanURLParam(url, "before"),
      ownerID: api.scanURLParam(url, "ownerID"),
    };

    const limit = body.limit ? Math.min(body.limit, 100) : 100;

    const rooms = await db.client.room.findMany({
      where: {
        AND: {
          name: body.query
            ? { contains: body.query, mode: "insensitive" }
            : undefined,
          ownerID: body.ownerID ? body.ownerID : undefined,
        },
      },
      include: {
        owner: true,
      },
      take: limit,
      cursor: body.before ? { id: body.before } : undefined,
    });

    const resp: api.ListRoomsResponse = {
      rooms: rooms.map((r) => db.convertRoom(r, r.owner)),
      hasMore: rooms.length === limit,
    };

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}

export async function post(ctx: astro.APIContext): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const body: api.CreateRoomRequest = await ctx.request.json();

    const room = await db.client.room.create({
      data: {
        id: db.newID(),
        name: body.name,
        owner: {
          connect: { id: session.userID },
        },
        attributes: body.attributes,
      },
      include: {
        owner: true,
      },
    });

    await db.joinRoom(session, room.id);

    const resp: api.CreateRoomResponse = db.convertRoom(room, room.owner);

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}
