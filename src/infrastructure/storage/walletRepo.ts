import { emptyWallet } from "../../domain/entities";
import type { UserId, Wallet } from "../../domain/entities";
import type { WalletRepository } from "../../application/ports";
import { type KeyValueStore, STORAGE_KEYS } from "./storage";

export class LocalStorageWalletRepository implements WalletRepository {
  constructor(private readonly store: KeyValueStore) {}

  get(userId: UserId): Wallet {
    return (
      this.store.read<Wallet>(STORAGE_KEYS.wallet(userId)) ?? emptyWallet(userId)
    );
  }

  save(wallet: Wallet): void {
    this.store.write(STORAGE_KEYS.wallet(wallet.userId), wallet);
  }
}
