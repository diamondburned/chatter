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
    const userID = ev.params.id;

    const user = await db.client.user.findUniqueOrThrow({
      where: {
        id: userID,
      },
    });

    const resp: api.UserResponse = db.convertUser(user);
    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}

export async function PATCH(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  const url = new URL(ev.request.url);

  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const userID = ev.params.id;
    const body: api.UpdateUserRequest = await ev.request.json();

    // https://github.com/prisma/prisma/discussions/3070
    const oldAttributes = await db.client.user.findUniqueOrThrow({
      where: { id: userID },
      select: { attributes: true },
    });

    const newAttributes = {
      ...(oldAttributes.attributes as api.User["attributes"]),
      ...body.attributes,
    };

    const user = await db.client.user.update({
      where: { id: userID },
      data: {
        username: body.username,
        attributes: newAttributes,
      },
    });

    const resp: api.UpdateUserResponse = db.convertUser(user);
    return api.respond(resp);
  } catch (err) {
    return api.respondError(400, err);
  }
}
