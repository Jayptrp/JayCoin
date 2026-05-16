import { emptyOrders } from "../../domain/entities";
import type { OpenOrders, UserId } from "../../domain/entities";
import type { OrderRepository } from "../../application/ports";
import { type KeyValueStore, STORAGE_KEYS } from "./storage";

export class LocalStorageOrderRepository implements OrderRepository {
  constructor(private readonly store: KeyValueStore) {}

  get(userId: UserId): OpenOrders {
    return (
      this.store.read<OpenOrders>(STORAGE_KEYS.orders(userId)) ??
      emptyOrders(userId)
    );
  }

  save(orders: OpenOrders): void {
    this.store.write(STORAGE_KEYS.orders(orders.userId), orders);
  }
}
