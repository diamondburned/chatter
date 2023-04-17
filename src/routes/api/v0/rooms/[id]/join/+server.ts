import * as api from "#/lib/api/index.js";
import * as db from "#/lib/db/index.js";
import type * as sveltekit from "@sveltejs/kit";

export async function POST(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ev.params.id;

    await db.client.roomMember.create({
      data: {
        roomID,
        userID: session.userID,
      },
    });

    return api.respond();
  } catch (err) {
    return api.respondError(400, err);
  }
}

export async function DELETE(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const roomID = ev.params.id;

    const deleted = await db.client.roomMember.deleteMany({
      where: {
        room: {
          id: roomID,
          // Assert that the user is not the owner of the room.
          NOT: { ownerID: session.userID },
        },
        user: {
          id: session.userID,
        },
      },
    });
    if (deleted.count == 0) {
      return api.respondError(400, "room does not exist or you are the owner");
    }

    return api.respond();
  } catch (err) {
    return api.respondError(400, err);
  }
}
