import * as astro from "astro";
import * as api from "#lib/api/index.js";
import * as db from "#lib/db/index.js";

export async function get(ctx: astro.APIContext): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ctx.params.id;

    const room = await db.client.room.findUniqueOrThrow({
      where: { id: roomID },
      include: {
        owner: true,
      },
    });

    const resp: api.RoomResponse = db.convertRoom(room, room.owner);

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}

export async function patch(ctx: astro.APIContext): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const body: api.UpdateRoomRequest = await ctx.request.json();
    const roomID = ctx.params.id;

    await db.client.room.findFirstOrThrow({
      select: { id: true },
      where: { id: roomID, ownerID: session.userID },
    });

    const room = await db.client.room.update({
      data: {
        name: body.name,
        attributes: body.attributes,
      },
      where: { id: roomID },
      include: {
        owner: true,
      },
    });

    const resp: api.UpdateRoomResponse = db.convertRoom(room, room.owner);

    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}

export async function del(ctx: astro.APIContext): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ctx.params.id;

    await db.client.room.findFirstOrThrow({
      select: { id: true },
      where: { id: roomID, ownerID: session.userID },
    });

    await db.client.room.delete({
      where: { id: roomID },
    });

    return api.respond();
  } catch (err) {
    return api.respondError(400, err);
  }
}
