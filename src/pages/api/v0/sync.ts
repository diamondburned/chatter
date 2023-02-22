import * as astro from "astro";
import * as api from "#lib/api/";
import * as db from "#lib/db/";

export async function get(ctx: astro.APIContext): Promise<Response> {
  const url = new URL(ctx.request.url);

  let session;
  try {
    session = await db.authorize(ctx.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  let lastSync: number | undefined;
  try {
    if (url.searchParams.has("lastSync")) {
      const t = Date.parse(url.searchParams.get("lastSync"));
      if (isNaN) {
        throw new Error("invalid lastSync");
      }
      lastSync = t;
    }
  } catch (err) {
    return api.respondError(400, err);
  }

  try {
    const ack = new Date(Date.now()).toISOString() as api.Timestamp;

    const user = await db.client.user.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        ownsRooms: {
          include: {
            owner: true,
          },
        },
        joinedRooms: {
          include: {
            owner: true,
            messages: {
              cursor: lastSync ? { id: db.newID(lastSync) } : {},
              take: 100,
              orderBy: { id: "desc" },
              include: { author: true },
            },
          },
        },
      },
    });

    const mapRooms: (
      rooms: (typeof user)["ownsRooms"] | (typeof user)["joinedRooms"]
    ) => api.Room[] = (rooms) => {
      return rooms.map((room) => ({
        id: room.id.toString(),
        name: room.name,
        owner: {
          id: room.owner.id.toString(),
          username: room.owner.username,
          avatar: room.owner.avatar as api.Resource,
          color: room.owner.color as api.Color,
        },
        createdAt: room.createdAt.toISOString() as api.Timestamp,
      }));
    };

    const joinedRooms = mapRooms(user.joinedRooms);
    const ownsRooms = mapRooms(user.ownsRooms);

    const messages: Record<string, api.Message[]> = {};
    for (const room of user.joinedRooms) {
      messages[room.id.toString()] = room.messages.map((message) => ({
        id: message.id.toString(),
        author: {
          id: message.authorID.toString(),
          username: message.author.username,
          avatar: message.author.avatar as api.Resource,
          color: message.author.color as api.Color,
        },
        createdAt: message.createdAt.toISOString() as api.Timestamp,
        content: message.content as api.Message["content"],
        embeds: message.embeds as api.Message["embeds"],
      }));
    }

    const sync: api.SyncResponse = {
      ackTimestamp: ack,
      me: {
        id: user.id.toString(),
        username: user.username,
        avatar: user.avatar as api.Resource,
        color: user.color as api.Color,
        ownsRooms,
        joinedRooms,
      },
      messages,
    };

    return api.respond(sync);
  } catch (err) {
    return api.respondError(500, err);
  }
}
