import type { User, UserId } from "../../domain/entities";
import type { UserRepository } from "../../application/ports";
import { type KeyValueStore, STORAGE_KEYS } from "./storage";

export class LocalStorageUserRepository implements UserRepository {
  constructor(private readonly store: KeyValueStore) {}

  getCurrentUserId(): UserId | null {
    return this.store.read<UserId>(STORAGE_KEYS.currentUserId);
  }

  setCurrentUserId(id: UserId): void {
    this.store.write(STORAGE_KEYS.currentUserId, id);
  }

  findById(id: UserId): User | null {
    const all = this.readAll();
    return all[id] ?? null;
  }

  findByNickname(nickname: string): User | null {
    const target = nickname.trim().toLowerCase();
    if (!target) return null;
    const all = this.readAll();
    for (const user of Object.values(all)) {
      if (user.nickname.toLowerCase() === target) return user;
    }
    return null;
  }

  save(user: User): void {
    const all = this.readAll();
    all[user.id] = user;
    this.store.write(STORAGE_KEYS.users, all);
  }

  private readAll(): Record<UserId, User> {
    return this.store.read<Record<UserId, User>>(STORAGE_KEYS.users) ?? {};
  }
}
