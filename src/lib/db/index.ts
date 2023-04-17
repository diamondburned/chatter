import * as prisma from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as ulid from "ulid";
import type * as api from "#/lib/api/index.js";
import assert from "assert";

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
export function newID(t?: number): string {
  return ulid.ulid(t);
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
      expiresAt: new Date(Date.now() + SessionMaxAge),
    },
  });
}

// authorize checks the session token and returns the session object if the
// session is valid.
export async function authorize(request: Request): Promise<prisma.Session> {
  if (!request.headers.get("Authorization")) {
    throw new Error("missing Authorization header");
  }

  const oldSession = await client.session.findFirstOrThrow({
    where: {
      token: request.headers.get("Authorization"),
      expiresAt: { gt: new Date() },
    },
  });

  return await client.session.update({
    where: { id: oldSession.id },
    data: { expiresAt: new Date(Date.now() + SessionMaxAge) },
  });
}

// joinRoom tacks the user into the room if they're not already in it.
// This function will emit a join event if the user is not already in the room.
export async function joinRoom(session: prisma.Session, roomID: string) {
  const where = { roomID_userID: { userID: session.userID, roomID } };

  try {
    // Fast path by just checking if the user is in the room.
    const member = await client.roomMember.findUnique({ where });
    if (member) {
      return;
    }

    await client.$transaction([
      client.roomMember.create({
        data: {
          roomID: roomID,
          userID: session.userID,
        },
      }),
      client.event.create({
        data: {
          id: newID(),
          type: "member_join",
          roomID: roomID,
          authorID: session.userID,
        },
      }),
    ]);
  } catch (err) {
    if (err.code === "P2034" || err.code === "P2002") {
      // Ignore duplicate key error.
      return;
    }
    throw err; // pretty bad
  }
}

export function convertUser(user: prisma.User): api.User {
  return {
    id: user.id.toString(),
    username: user.username,
    attributes: user.attributes as api.User["attributes"],
  };
}

export function convertRoom(room: prisma.Room, owner: prisma.User): api.Room {
  assert(room.ownerID === owner.id);
  return {
    id: room.id.toString(),
    name: room.name,
    owner: convertUser(owner),
    attributes: room.attributes as api.Room["attributes"],
  };
}

export function convertEvent(
  event: prisma.Event,
  author: prisma.User
): api.RoomEvent {
  assert(event.authorID === author.id);
  return {
    id: event.id.toString(),
    type: event.type as api.RoomEvent["type"],
    roomID: event.roomID.toString(),
    author: convertUser(author),
    content: event.content as api.RoomEvent["content"],
  } as api.RoomEvent;
}
