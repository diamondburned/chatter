import * as astro from "astro";
import * as api from "#lib/api/index.js";
import * as db from "#lib/db/index.js";

const allowRegistration = true;
let registrationSecret: Promise<Buffer> | undefined;

if (process.env["REGISTRATION_SECRET"]) {
  registrationSecret = db
    .hashPassword(process.env["REGISTRATION_SECRET"])
    .then((hash) => Buffer.from(hash));
}

export async function post(ctx: astro.APIContext): Promise<Response> {
  if (!allowRegistration) {
    return api.respondError(403, "Registration is disabled");
  }

  let body: api.RegisterRequest;
  try {
    body = await ctx.request.json();
    api.AssertStrongPassword(body.password);
  } catch (err) {
    return api.respondError(400, err);
  }

  if (registrationSecret) {
    const secret = ctx.request.headers.get("X-Registration-Secret");
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
