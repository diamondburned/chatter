import * as astro from "astro";
import * as api from "#lib/api/index.js";
import * as db from "#lib/db/index.js";

const allowRegistration = true;
let registrationSecret: Buffer | undefined;

if (process.env["REGISTRATION_SECRET"]) {
  db.hashPassword(process.env["REGISTRATION_SECRET"]).then((hash) => {
    registrationSecret = Buffer.from(hash);
  });
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
    if (
      !body.secret ||
      !(await db.comparePassword(registrationSecret, body.secret))
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
      createdAt: session.createdAt.toISOString() as api.Timestamp,
      expiresAt: session.expiresAt.toISOString() as api.Timestamp,
    };
  } catch (err) {
    return api.respondError(500, err);
  }

  return api.respond(resp);
}
