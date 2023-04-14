import * as api from "#/lib/api/index.js";
import * as db from "#/lib/db/index.js";
import { env } from "$env/dynamic/private";
import type * as sveltekit from "@sveltejs/kit";

const allowRegistration = true;
let registrationSecret: Promise<Buffer> | undefined;

if (env["REGISTRATION_SECRET"]) {
  registrationSecret = db
    .hashPassword(env["REGISTRATION_SECRET"])
    .then((hash) => Buffer.from(hash));
}

export async function POST(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  if (!allowRegistration) {
    return api.respondError(403, "Registration is disabled");
  }

  let body: api.RegisterRequest;
  try {
    body = await ev.request.json();
    api.AssertStrongPassword(body.password);
  } catch (err) {
    return api.respondError(400, err);
  }

  if (registrationSecret) {
    const secret = ev.request.headers.get("X-Registration-Secret");
    if (
      !secret ||
      !(await db.comparePassword(await registrationSecret, secret))
    ) {
      return api.respondError(403, "Not authorized");
    }
  }

  let user: db.prisma.User;
  try {
    user = await db.client.user.create({
      data: {
        id: db.newID(),
        username: body.username,
        passhash: Buffer.from(await db.hashPassword(body.password)),
        attributes: {},
      },
    });
  } catch (err) {
    return api.respondError(401, err);
  }

  let resp: api.RegisterResponse;
  try {
    const session = await db.createSession(user);
    resp = {
      id: session.id.toString(),
      userID: session.userID.toString(),
      token: session.token,
      expiresAt: session.expiresAt.toISOString() as api.Timestamp,
    };
  } catch (err) {
    return api.respondError(500, err);
  }

  return api.respond(resp);
}
