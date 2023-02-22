import * as prisma from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as api from "#lib/api/";
import { simpleflake } from "simpleflakes";

export { Prisma } from "@prisma/client";
export { prisma };
export const client = new prisma.PrismaClient();

export async function comparePassword(
  userPasshash: Buffer,
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, userPasshash.toString());
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 11);
}

// newID generates a new ID.
export function newID(t = Date.now()): bigint {
  return simpleflake(t);
}

// SessionMaxAge is the maximum age of a session in milliseconds.
export const SessionMaxAge = 1000 * 60 * 60 * 24 * 7; // 7 days

// createSession inserts a new session into the database and returns the session
// object.
export async function createSession(
  user: prisma.User
): Promise<prisma.Session> {
  return await client.session.create({
    data: {
      id: newID(),
      token: crypto.randomBytes(24).toString("base64"),
      userID: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SessionMaxAge),
    },
  });
}

// authorize checks the session token and returns the session object if the
// session is valid.
export async function authorize(request: Request): Promise<prisma.Session> {
  const oldSession = await client.session.findFirstOrThrow({
    where: {
      token: request.headers.get("Athorization"),
      expiresAt: { gt: new Date() },
    },
  });

  return await client.session.update({
    where: { id: oldSession.id },
    data: { expiresAt: new Date(Date.now() + SessionMaxAge) },
  });
}
