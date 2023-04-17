import * as ulid from "ulid";

// Timestamp is an RFC3339 timestamp string.
export type Timestamp = `${string}T${string}`;

// DateToTimestamp converts a Date to a Timestamp.
export function DateToTimestamp(d: Date): Timestamp {
  return d.toISOString() as Timestamp;
}

// DateFromID returns the date from a ULID.
export function DateFromID(id: string): Date {
  const t = ulid.decodeTime(id);
  return new Date(t);
}

// Resource describes a resource that can either be a remote file or a data
// URL-encoded/inlined file.
export type Resource =
  | `http://${string}`
  | `https://${string}`
  | `data:${string};base64,${string}`;

// Color is a color in the form of #RRGGBB.
export type Color = `#${string}`;

// User represents a user.
export type User = {
  id: string;
  username: string;
  attributes: Partial<{
    avatar: Resource;
    color: Color;
    socials: Record<string, string>;
    [key: string]: any;
  }>;
};

// shortenID shortens a long user ID to a short ID.
export function shortenID(id: string): string {
  // Adler32 implementation taken from
  // https://en.wikipedia.org/wiki/Adler-32#Example_implementation
  function hasher(s: string) {
    const adlerMod = 65521;
    let a = 1;
    let b = 0;
    for (let i = 0; i < s.length; i++) {
      a = (a + s.charCodeAt(i)) % adlerMod;
      b = (b + a) % adlerMod;
    }
    return (b << 16) | a;
  }
  return (hasher(id) % 0xffff).toString(16).toUpperCase();
}

// Me is the current user.
export type Me = User & {
  ownsRooms: Room[];
  joinedRooms: Room[];
};

// Room represents a chat room.
export type Room = {
  id: string;
  name: string;
  owner: User;
  attributes?: Partial<{
    topic: string;
    color: Color;
    avatar: Resource;
    [key: string]: any;
  }>;
};

// RoomEventType is a generic type that describes a room event.
export type RoomEventType<EventType, T> = {
  readonly type: EventType;
  id: string;
  roomID: string;
  author: User;
  content: T;
};

// RoomEvent describes a room event. A room event is immutable with the
// exception of update and delete events. Note that the client may or may not
// obey updates and deletes.
export type RoomEvent =
  | RoomEventType<"update_room", Partial<Room>>
  | RoomEventType<"member_join", User>
  | RoomEventType<"member_leave", { id: string }>
  | RoomEventType<"message_create", MessageContent>
  | RoomEventType<"message_update", Partial<MessageContent>>
  | RoomEventType<"message_delete", { id: string }>;

// MessageContent describes the content of a message.
export type MessageContent = Partial<{
  markdown: string;
  embeds: Record<
    string,
    {
      url: string;
      title?: string;
      description?: string;
      thumbnail?: Resource;
    }
  >;
  [key: string]: any;
}>;

const txtenc = new TextEncoder();

// AssertStrongPassword is a function that checks if a password is strong
// enough. If the password is weak, then an exception is thrown.
export function AssertStrongPassword(password: string) {
  if (password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }
  // Ensure that the password is 72 bytes maximum.
  if (txtenc.encode(password).length > 72) {
    throw new Error("password is too long, must be 72 bytes maximum");
  }
}
