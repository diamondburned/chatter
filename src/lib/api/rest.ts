import * as api from "#lib/api/index.js";

// respondError is a helper function to respond with an error.
export function respondError(code: number, why: any, message = ""): Response {
  const whyString =
    why instanceof Error ? why.message.replace("Error: ", "") : `${why}`;
  const body: api.ErrorResponse = {
    error: message ? `${message}: ${whyString}` : whyString,
  };
  return new Response(JSON.stringify(body), { status: code });
}

// respond is a helper function to respond with a JSON body. The status code is
// 200 if body is provided, otherwise 204.
export function respond<T>(body: T = null): Response {
  return new Response(body ? JSON.stringify(body) : null, {
    status: body ? 200 : 204,
  });
}

// ErrorResponse is a generic error response.
export type ErrorResponse = {
  error: string;
};

// Response wraps a response type with an ErrorResponse.
export type FailableResponse<T> = ErrorResponse | T;

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
  createdAt: api.Timestamp;
  expiresAt: api.Timestamp;
}>;

// RegisterRequest is a request to register a new user.
export type RegisterRequest = {
  username: string;
  password: string;
  secret?: string;
};

// RegisterResponse is the same as LoginResponse.
export type RegisterResponse = FailableResponse<LoginResponse>;

// SendMessageRequest is a request to send a message.
export type SendMessageRequest = Omit<api.Message, "id" | "author">;

// SendMessageResponse is the response to a send message request.
export type SendMessageResponse = FailableResponse<api.Message>;

// MessagesRequest is a request to get messages. If before is not specified, the
// most recent messages are returned, otherwise the messages before the message
// with the specified ID are returned.
export type MessagesRequest = {
  roomID: string;
  before?: string; // Message ID
  limit?: number; // max 100, default 100
};

// MessagesResponse is the response to a messages request. Messages are ordered
// from newest to oldest.
export type MessagesResponse = FailableResponse<api.Message[]>;

// RoomRequest is a request to get a room.
export type RoomRequest = {
  roomID: string;
};

// RoomResponse is the response to a room request.
export type RoomResponse = FailableResponse<api.Room>;

// JoinRoomRequest is a request to join a room.
export type JoinRoomRequest = {
  roomID: string;
};

// JoinRoomResponse is the response to a join room request.
export type JoinRoomResponse = FailableResponse<{}>;

// ListRoomsRequest is a request to list and query rooms.
export type ListRoomsRequest = {
  query?: string;
  limit?: number; // max 100, default 100
  page?: number; // default 0
};

// ListRoomsResponse is the response to a list rooms request.
export type ListRoomsResponse = FailableResponse<{
  rooms: api.Room[];
  hasMore?: boolean;
}>;

// SyncRequest is a request to sync the client with the server.
export type SyncRequest = {
  // lastSync is the last sync time that the client received from a
  // SyncResponse. If the client has never synced, this should be null.
  lastSync: api.Timestamp | null;
};

// SyncResponse is the response to a sync request.
export type SyncResponse = FailableResponse<{
  // ackTimestamp is returned to the client to acknowledge the sync. The client
  // should send this timestamp in the next sync request.
  ackTimestamp: api.Timestamp;
  // me is the current user.
  me: api.Me;
  // messages is the list of new messages that correspond to the rooms the user
  // is in. They are ordered from newest to oldest. The field maps room IDs to a
  // list of messages. Only messages that are newer than the last sync timestamp
  // are returned. There will be a limit of 100 messages per room. To get more
  // messages, the client should send a MessagesRequest.
  messages: Record<string, api.Message[]>;
}>;
