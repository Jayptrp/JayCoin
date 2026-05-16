import { createUser, emptyOrders, emptyWallet } from "../../domain/entities";
import type { User } from "../../domain/entities";
import type {
  Clock,
  IdGenerator,
  OrderRepository,
  UserRepository,
  WalletRepository,
} from "../ports";

interface Deps {
  users: UserRepository;
  wallets: WalletRepository;
  orders: OrderRepository;
  clock: Clock;
  ids: IdGenerator;
}

export class AuthenticateOrCreateUser {
  constructor(private readonly deps: Deps) {}

  execute(nickname?: string): User {
    const { users, wallets, orders, clock, ids } = this.deps;

    const existingId = users.getCurrentUserId();
    if (existingId) {
      const existing = users.findById(existingId);
      if (existing) return existing;
    }

    if (nickname && nickname.trim().length > 0) {
      const match = users.findByNickname(nickname);
      if (match) {
        users.setCurrentUserId(match.id);
        return match;
      }
    }

    const id = ids.next();
    const finalNickname =
      nickname && nickname.trim().length > 0
        ? nickname.trim()
        : `guest-${id.slice(0, 6)}`;
    const user = createUser(id, finalNickname, clock.now());
    users.save(user);
    users.setCurrentUserId(user.id);
    wallets.save(emptyWallet(user.id));
    orders.save(emptyOrders(user.id));
    return user;
  }
}
