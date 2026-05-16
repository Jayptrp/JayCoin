import type { Trade } from "../../domain/entities";
import {
  formatCoins,
  formatMoney,
  formatPrice,
  formatTime,
} from "../format";

interface Props {
  trades: Trade[];
}

const reasonLabel: Record<Trade["reason"], string> = {
  MANUAL: "",
  STOP_LOSS: "SL",
  TAKE_PROFIT: "TP",
};

export function HistoryPanel({ trades }: Props) {
  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-4">
      <h2 className="text-sm font-semibold text-slate-200">History</h2>
      {trades.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No trades yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-jay-border">
          {trades.slice(0, 20).map((trade) => {
            const isBuy = trade.side === "BUY";
            return (
              <li
                key={trade.id}
                className="grid grid-cols-3 items-center gap-2 py-2 text-xs"
              >
                <div>
                  <div
                    className={
                      isBuy
                        ? "font-semibold text-jay-up"
                        : "font-semibold text-jay-down"
                    }
                  >
                    {trade.side}
                    {reasonLabel[trade.reason] && (
                      <span className="ml-1 rounded bg-jay-bg px-1 text-[10px] text-slate-400">
                        {reasonLabel[trade.reason]}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    {formatTime(trade.timestamp)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  {formatCoins(trade.coins)}
                </div>
                <div className="text-right">
                  <div className="font-mono">{formatPrice(trade.price)}</div>
                  <div
                    className={
                      trade.cashDelta >= 0 ? "text-jay-up" : "text-jay-down"
                    }
                  >
                    {formatMoney(trade.cashDelta)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
