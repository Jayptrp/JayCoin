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
  const { setOrders, sell } = useContainer();
  const [editing, setEditing] = useState(false);
  const [sl, setSl] = useState<string>("");
  const [tp, setTp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSl(orders.stopLoss != null ? String(orders.stopLoss) : "");
    setTp(orders.takeProfit != null ? String(orders.takeProfit) : "");
    setEditing(false);
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
      setEditing(false);
      onUpdated();
    } catch (err) {
      if (err instanceof DomainError) setError(err.message);
      else setError("Could not save orders.");
    }
  }

  function cancel() {
    setError(null);
    setSl(orders.stopLoss != null ? String(orders.stopLoss) : "");
    setTp(orders.takeProfit != null ? String(orders.takeProfit) : "");
    setEditing(false);
  }

  function closePosition() {
    setError(null);
    if (!hasPosition) return;
    try {
      sell.execute({
        userId: user.id,
        coinAmount: wallet.coins,
        price,
        reason: "MANUAL",
      });
      onUpdated();
    } catch (err) {
      if (err instanceof DomainError) setError(err.message);
      else setError("Could not close position.");
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

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Orders
        </span>
        {hasPosition && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="edit stop loss and take profit"
            title="Edit"
            className="rounded-md border border-jay-border bg-jay-bg p-1.5 text-slate-300 hover:text-jay-accent active:opacity-80"
          >
            <PencilIcon />
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500">
            Stop loss
          </label>
          {editing ? (
            <input
              value={sl}
              onChange={(event) => setSl(event.target.value)}
              inputMode="decimal"
              placeholder="—"
              autoFocus
              className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono outline-none focus:border-jay-accent"
            />
          ) : (
            <div className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono text-slate-300">
              {orders.stopLoss != null ? formatPrice(orders.stopLoss) : "—"}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500">
            Take profit
          </label>
          {editing ? (
            <input
              value={tp}
              onChange={(event) => setTp(event.target.value)}
              inputMode="decimal"
              placeholder="—"
              className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono outline-none focus:border-jay-accent"
            />
          ) : (
            <div className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-2 font-mono text-slate-300">
              {orders.takeProfit != null ? formatPrice(orders.takeProfit) : "—"}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-jay-down/40 bg-jay-down/10 px-3 py-2 text-sm text-jay-down">
          {error}
        </div>
      )}

      {editing && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-jay-accent py-2 font-semibold text-jay-bg"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded-lg border border-jay-border py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {hasPosition && !editing && (
        <button
          type="button"
          onClick={closePosition}
          className="mt-3 w-full rounded-lg border border-jay-down/60 bg-jay-down/10 py-2 text-sm font-semibold text-jay-down hover:bg-jay-down/20 active:opacity-80"
        >
          Close position @ {formatPrice(price)}
        </button>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
      <path d="M9.5 3.5l3 3" />
    </svg>
  );
}

function parse(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
