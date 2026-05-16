export interface KeyValueStore {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class LocalStorageKeyValueStore implements KeyValueStore {
  read<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    window.localStorage.removeItem(key);
  }
}

export const STORAGE_KEYS = {
  currentUserId: "jaybile:currentUserId",
  users: "jaybile:users",
  wallet: (userId: string) => `jaybile:wallet:${userId}`,
  orders: (userId: string) => `jaybile:orders:${userId}`,
  trades: (userId: string) => `jaybile:trades:${userId}`,
};
