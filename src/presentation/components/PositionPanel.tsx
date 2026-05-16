import { useEffect, useState } from "react";
import type { OpenOrders, User, Wallet } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { unrealizedPnL } from "../../domain/pricing";
import { useContainer } from "../AppContext";
import {
  formatCoins,
  formatMoney,
  formatPercent,
  formatPrice,
} from "../format";

interface Props {
  user: User;
  wallet: Wallet;
  orders: OpenOrders;
  price: number;
  onUpdated: () => void;
}

export function PositionPanel({ user, wallet, orders, price, onUpdated }: Props) {
  const { setOrders } = useContainer();
  const [sl, setSl] = useState<string>("");
  const [tp, setTp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSl(orders.stopLoss != null ? String(orders.stopLoss) : "");
    setTp(orders.takeProfit != null ? String(orders.takeProfit) : "");
  }, [orders.stopLoss, orders.takeProfit]);

  const hasPosition = wallet.coins > 0;
  const pnl = unrealizedPnL(wallet, price);
  const pnlPercent =
    wallet.avgEntryPrice > 0 ? price / wallet.avgEntryPrice - 1 : 0;

  function save() {
    setError(null);
    try {
      const parsedSl = parse(sl);
      const parsedTp = parse(tp);
      setOrders.execute({
        userId: user.id,
        stopLoss: parsedSl,
        takeProfit: parsedTp,
      });
      onUpdated();
    } catch (err) {
      if (err instanceof DomainError) setError(err.message);
      else setError("Could not save orders.");
    }
  }

  function clear() {
    setError(null);
    try {
      setOrders.execute({ userId: user.id, stopLoss: null, takeProfit: null });
      onUpdated();
    } catch (err) {
      if (err instanceof DomainError) setError(err.message);
    }
  }

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Position</h2>
        {hasPosition && (
          <span
            className={pnl >= 0 ? "text-jay-up" : "text-jay-down"}
            aria-label="unrealized profit and loss"
          >
            {formatMoney(pnl)} ({formatPercent(pnlPercent)})
          </span>
        )}
      </div>

      {hasPosition ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-400">Holding</dt>
          <dd className="text-right font-mono">{formatCoins(wallet.coins)}</dd>
          <dt className="text-slate-400">Avg entry</dt>
          <dd className="text-right font-mono">
            {formatPrice(wallet.avgEntryPrice)}
          </dd>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          No open position. Buy JayCoin to set SL/TP.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400">
            Stop loss
          </label>
          <input
            value={sl}
            onChange={(event) => setSl(event.target.value)}
            inputMode="decimal"
            placeholder="—"
            disabled={!hasPosition}
            className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono outline-none focus:border-jay-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400">
            Take profit
          </label>
          <input
            value={tp}
            onChange={(event) => setTp(event.target.value)}
            inputMode="decimal"
            placeholder="—"
            disabled={!hasPosition}
            className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono outline-none focus:border-jay-accent disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-jay-down/40 bg-jay-down/10 px-3 py-2 text-sm text-jay-down">
          {error}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!hasPosition}
          className="rounded-lg bg-jay-accent py-2 font-semibold text-jay-bg disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!hasPosition}
          className="rounded-lg border border-jay-border py-2 text-sm text-slate-300 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function parse(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
