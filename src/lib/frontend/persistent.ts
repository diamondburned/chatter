import * as store from "svelte/store";

// writable creates a store.Writable instance with persistence using the
// browser's local storage.
export function writable<T>(
  key: string,
  def?: T,
  start?: store.StartStopNotifier<T>
): store.Writable<T> {
  const v = localStorage.getItem(key);
  if (v) {
    try {
      def = JSON.parse(v);
    } catch (err) {
      console.log(`cannot restore ${key} from localStorage, will use default`);
    }
  }

  const w = store.writable<T>(
    def,
    start
      ? (set) =>
          start((v) => {
            set(v);
            localStorage.setItem(key, JSON.stringify(v));
          })
      : undefined
  );

  return {
    subscribe: w.subscribe,
    set(v) {
      w.set(v);
      localStorage.setItem(key, JSON.stringify(v));
    },
    update(fn) {
      w.update((v) => {
        v = fn(v);
        localStorage.setItem(key, JSON.stringify(v));
        return v;
      });
    },
  };
}
