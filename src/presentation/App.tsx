import { useCallback, useState } from "react";
import { findTimeframe, type TimeframeId } from "../domain/timeframes";
import { AuthSplash } from "./components/AuthSplash";
import { Header } from "./components/Header";
import { HistoryPanel } from "./components/HistoryPanel";
import { PositionPanel } from "./components/PositionPanel";
import { PriceChart } from "./components/PriceChart";
import { PriceTicker } from "./components/PriceTicker";
import { TimeframePicker } from "./components/TimeframePicker";
import { TradeForm } from "./components/TradeForm";
import { useOrderEvaluation } from "./hooks/useOrderEvaluation";
import { usePriceData } from "./hooks/usePriceData";
import { useSession } from "./hooks/useSession";

export function App() {
  const { user, wallet, orders, trades, signIn, reload } = useSession();
  const [timeframe, setTimeframe] = useState<TimeframeId>("5m");
  const { current, points } = usePriceData(timeframe);

  const handleTriggered = useCallback(() => reload(), [reload]);
  useOrderEvaluation(user, current.price, handleTriggered);

  if (!user || !wallet || !orders) {
    return <AuthSplash onSignIn={signIn} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col">
      <Header user={user} wallet={wallet} price={current.price} />
      <main className="grid gap-3 p-4 pb-10 lg:grid-cols-3 lg:gap-4 lg:p-6">
        <section className="flex min-w-0 flex-col gap-3 lg:col-span-2 lg:gap-4">
          <PriceTicker price={current.price} />
          <TimeframePicker selected={timeframe} onChange={setTimeframe} />
          <PriceChart points={points} label={findTimeframe(timeframe).label} />
          <div className="hidden lg:block">
            <HistoryPanel trades={trades} />
          </div>
        </section>

        <aside className="flex flex-col gap-3 lg:gap-4">
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
        </aside>

        <div className="lg:hidden">
          <HistoryPanel trades={trades} />
        </div>

        <footer className="pt-2 text-center text-[10px] text-slate-600 lg:col-span-3">
          JayBile · deterministic JayCoin market · localStorage only
        </footer>
      </main>
    </div>
  );
}
