import { useEffect } from "react";
import type { User } from "../../domain/entities";
import { useContainer } from "../AppContext";

export function useOrderEvaluation(
  user: User | null,
  price: number,
  onTriggered: () => void,
) {
  const { evaluateOrders } = useContainer();

  useEffect(() => {
    if (!user) return;
    const trade = evaluateOrders.execute({ userId: user.id, price });
    if (trade) onTriggered();
  }, [user, price, evaluateOrders, onTriggered]);
}
