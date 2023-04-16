import * as store from "svelte/store";
import * as api from "#/lib/api/index.js";
import * as persistent from "#/lib/frontend/persistent.js";

interface Toast {
  message: string;
  type: "error" | "success";
}

export const toasts = store.writable<Toast | null>(null);

export const showSettings = store.writable(false);

export const SyncEndpoint = "/api/v0/sync";
export const EventsLimit = 250;

// State is the current state of the user. It stays up to date by handling every
// new sync response.
export type State = {
  ack?: string;
  me?: api.Me;
  events: Record<string, api.RoomEvent[]>;
};

// token stores the user's token persistently.
export const token = persistent.writable<string | null>("chatter_token", null);

// state contains the current state of the user.
export const state = store.writable<State>({
  events: {},
});

// updateState updates the state with the given sync response.
export function updateState(s: State, sync: api.OKResponse<api.SyncResponse>) {
  s.ack = sync.ack;
  s.me = sync.me;
  for (const [roomID, roomEvents] of Object.entries(sync.events)) {
    const events = s.events[roomID] ?? [];
    s.events[roomID] = [...roomEvents, ...events].slice(0, EventsLimit);
  }
}

// sync calls the API to sync the client with the server using the given state.
export async function sync(
  s: store.Writable<State> = state,
  tok = store.get(token)
) {
  const lastAck = store.get(s).ack;

  const headers = new Headers();
  headers.append("Authorization", tok);
  headers.append("Content-Type", "application/json");

  const path = SyncEndpoint + (lastAck ? `?lastAck=${lastAck}` : "");
  const resp = await api.request<api.SyncResponse>(path, { headers });

  s.update((s) => {
    if (s.ack == lastAck) {
      updateState(s, resp);
    }
    return s;
  });
}
