import { useCallback } from "react";
import { AuthSplash } from "./components/AuthSplash";
import { Header } from "./components/Header";
import { HistoryPanel } from "./components/HistoryPanel";
import { PositionPanel } from "./components/PositionPanel";
import { PriceChart } from "./components/PriceChart";
import { PriceTicker } from "./components/PriceTicker";
import { TradeForm } from "./components/TradeForm";
import { useOrderEvaluation } from "./hooks/useOrderEvaluation";
import { usePrice } from "./hooks/usePrice";
import { useSession } from "./hooks/useSession";

export function App() {
  const { user, wallet, orders, trades, signIn, reload } = useSession();
  const { current, history } = usePrice();

  const handleTriggered = useCallback(() => reload(), [reload]);
  useOrderEvaluation(user, current.price, handleTriggered);

  if (!user || !wallet || !orders) {
    return <AuthSplash onSignIn={signIn} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <Header user={user} wallet={wallet} price={current.price} />
      <main className="flex flex-col gap-3 p-4 pb-10">
        <PriceTicker price={current.price} />
        <PriceChart history={history} />
        <TradeForm
          user={user}
          wallet={wallet}
          price={current.price}
          onTraded={reload}
        />
        <PositionPanel
          user={user}
          wallet={wallet}
          orders={orders}
          price={current.price}
          onUpdated={reload}
        />
        <HistoryPanel trades={trades} />
        <footer className="pt-2 text-center text-[10px] text-slate-600">
          JayBile · simulated market · localStorage only
        </footer>
      </main>
    </div>
  );
}
