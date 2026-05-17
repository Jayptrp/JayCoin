import { useCallback, useEffect, useState } from "react";
import type {
  OpenOrders,
  Trade,
  User,
  Wallet,
} from "../../domain/entities";
import { useContainer } from "../AppContext";

export interface SessionState {
  user: User | null;
  wallet: Wallet | null;
  orders: OpenOrders | null;
  trades: Trade[];
}

export function useSession() {
  const container = useContainer();
  const [state, setState] = useState<SessionState>({
    user: null,
    wallet: null,
    orders: null,
    trades: [],
  });

  const refresh = useCallback(
    (user: User) => {
      setState({
        user,
        wallet: container.wallets.get(user.id),
        orders: container.orders.get(user.id),
        trades: container.trades.list(user.id),
      });
    },
    [container],
  );

  useEffect(() => {
    const existingId = container.users.getCurrentUserId();
    if (!existingId) return;
    const user = container.users.findById(existingId);
    if (!user) return;
    container.catchUpOrders.execute({ userId: user.id });
    refresh(user);
  }, [container, refresh]);

  const signIn = useCallback(
    (nickname?: string) => {
      const user = container.authenticateOrCreate.execute(nickname);
      refresh(user);
      return user;
    },
    [container, refresh],
  );

  const reload = useCallback(() => {
    if (state.user) refresh(state.user);
  }, [refresh, state.user]);

  return { ...state, signIn, reload };
}
