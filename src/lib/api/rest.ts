import type * as api from "#/lib/api/index.js";

// respondError is a helper function to respond with an error.
export function respondError(code: number, why: any, message = ""): Response {
  console.debug("request failed: " + message, why);

  const errstr = fmterr(why);
  const body: api.ErrorResponse = {
    error: message ? `${message}: ${errstr}` : errstr,
  };
  return new Response(JSON.stringify(body), { status: code });
}

// request is a helper function to invoke a fetch() request.
export async function request<T extends FailableResponse<any>>(
  path: string,
  init?: RequestInit
): Promise<OKResponse<T>> {
  const resp = await fetch(path, init);
  const die = (err?) => {
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    throw err;
  };

  const body = await resp.json().catch(die);
  if (!resp.ok) {
    const err = body as api.ErrorResponse;
    if (err.error) {
      throw err.error;
    }
    die();
  }

  return body as OKResponse<T>;
}

function fmterr(err: any): string {
  return `${err}`
    .replace(/^Error:/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// respond is a helper function to respond with a JSON body. The status code is
// 200 if body is provided, otherwise 204.
export function respond<T>(body: T = null): Response {
  return new Response(body ? JSON.stringify(body) : null, {
    status: body ? 200 : 204,
  });
}

// scanURLParam is a helper function to scan a URL parameter into the given
// type.
export function scanURLParam<T>(
  url: URL,
  param: string,
  required = false
): T | undefined {
  const value = url.searchParams.get(param);
  if (!value) {
    if (required) {
      throw new Error(`missing required URL parameter: ${param}`);
    }
    return undefined;
  }

  switch (typeof value) {
    case "string":
      return value as T;
    case "number":
      return Number(value) as T;
    case "boolean":
      return Boolean(value) as T;
    case "object":
      return JSON.parse(value) as T;
    default:
      throw new Error(`unknown type: ${typeof value}`);
  }
}

// ErrorResponse is a generic error response.
export type ErrorResponse = {
  error: string;
};

// Response wraps a response type with an ErrorResponse.
export type FailableResponse<T extends Object> =
  | ErrorResponse
  | ({ error?: undefined } & T);

// OKResponse wraps a FailableResponse and returns the successful response type.
export type OKResponse<Failable extends FailableResponse<any>> = Extract<
  Failable,
  { error?: undefined }
>;

// LoginRequest is a login request.
export type LoginRequest = {
  username: string;
  password: string;
};

// LoginResponse is the response to a login request.
export type LoginResponse = FailableResponse<{
  id: string;
  token: string;
  userID: string;
  expiresAt: api.Timestamp;
}>;

// RegisterRequest is a request to register a new user.
export type RegisterRequest = {
  username: string;
  password: string;
};

// RegisterResponse is the same as LoginResponse.
export type RegisterResponse = FailableResponse<LoginResponse>;

// SendEventRequest is a request to send a message.
export type SendEventRequest = Pick<api.RoomEvent, "type" | "content">;

// SendMessageResponse is the response to a send message request.
export type SendEventResponse = FailableResponse<api.RoomEvent>;

// RoomEventsRequest is a request to get messages. If before is not specified,
// the most recent messages are returned, otherwise the messages before the
// message with the specified ID are returned.
export type RoomEventsRequest = {
  before?: string; // Message ID
  limit?: number; // max 100, default 100
};

// RoomEventsResponse is the response to a messages request. Messages are
// ordered from newest to oldest.
export type RoomEventsResponse = FailableResponse<
  Omit<api.RoomEvent, "roomID">[]
>;

// RoomRequest is a request to get a room.
export type RoomRequest = {};

// RoomResponse is the response to a room request.
export type RoomResponse = FailableResponse<api.Room>;

// CreateRoomRequest is a request to create a room.
export type CreateRoomRequest = Omit<api.Room, "id" | "owner" | "createdAt">;

// CreateRoomResponse is the response to a create room request.
export type CreateRoomResponse = FailableResponse<api.Room>;

// UpdateRoomRequest is a request to update a room.
export type UpdateRoomRequest = Partial<
  Omit<api.Room, "id" | "owner" | "createdAt">
>;

// UpdateRoomResponse is the response to an update room request.
export type UpdateRoomResponse = FailableResponse<api.Room>;

// DeleteRoomRequest is a request to delete a room.
export type DeleteRoomRequest = {};

// DeleteRoomResponse is the response to a delete room request.
export type DeleteRoomResponse = FailableResponse<{}>;

// ListRoomsRequest is a request to list and query rooms.
export type ListRoomsRequest = {
  query?: string;
  limit?: number; // max 100, default 100
  before?: string;
  ownerID?: string;
};

// ListRoomsResponse is the response to a list rooms request.
export type ListRoomsResponse = FailableResponse<{
  rooms: api.Room[];
  hasMore?: boolean;
}>;

// SyncRequest is a request to sync the client with the server.
export type SyncRequest = {
  // lastAck is the last ack time that the client received from a
  // SyncResponse. If the client has never synced, this should be null.
  lastAck: string | null;
};

// SyncResponse is the response to a sync request.
export type SyncResponse = FailableResponse<{
  // ack is returned to the client to acknowledge the sync. The client should
  // send this timestamp in the next sync request.
  ack: string;
  // me is the current user.
  me: api.Me;
  // events is the list of new events that correspond to the rooms the user is
  // in. They are ordered from newest to oldest. The field maps room IDs to a
  // list of messages. Only messages that are newer than the last sync timestamp
  // are returned. There will be a limit of 100 messages per room. To get more
  // messages, the client should send a RoomEventsRequest.
  events: Record<string, api.RoomEvent[]>;
}>;
