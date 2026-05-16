import { useState } from "react";
import type { User, Wallet } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useContainer } from "../AppContext";
import { formatCoins, formatMoney } from "../format";

type Mode = "BUY" | "SELL";

interface Props {
  user: User;
  wallet: Wallet;
  price: number;
  onTraded: () => void;
}

export function TradeForm({ user, wallet, price, onTraded }: Props) {
  const { buy, sell } = useContainer();
  const [mode, setMode] = useState<Mode>("BUY");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number.parseFloat(amount);
  const hasInput = Number.isFinite(numericAmount) && numericAmount > 0;

  function submit() {
    setError(null);
    try {
      if (mode === "BUY") {
        buy.execute({ userId: user.id, cashAmount: numericAmount, price });
      } else {
        sell.execute({ userId: user.id, coinAmount: numericAmount, price });
      }
      setAmount("");
      onTraded();
    } catch (err) {
      if (err instanceof DomainError) setError(err.message);
      else setError("Trade failed. Try again.");
    }
  }

  const previewCoins = hasInput && mode === "BUY" ? numericAmount / price : 0;
  const previewCash = hasInput && mode === "SELL" ? numericAmount * price : 0;

  return (
    <div className="rounded-xl border border-jay-border bg-jay-panel p-4">
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-jay-border">
        <button
          type="button"
          onClick={() => setMode("BUY")}
          className={`py-2 text-sm font-semibold ${
            mode === "BUY"
              ? "bg-jay-up text-slate-900"
              : "bg-jay-bg text-slate-400"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setMode("SELL")}
          className={`py-2 text-sm font-semibold ${
            mode === "SELL"
              ? "bg-jay-down text-white"
              : "bg-jay-bg text-slate-400"
          }`}
        >
          Sell
        </button>
      </div>

      <label className="mt-4 block text-xs uppercase tracking-wider text-slate-400">
        {mode === "BUY" ? "Spend (USD)" : "Sell (JAY)"}
      </label>
      <input
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        inputMode="decimal"
        placeholder="0.00"
        className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-3 font-mono text-lg outline-none focus:border-jay-accent"
      />

      <div className="mt-2 flex gap-2">
        {[0.25, 0.5, 1].map((fraction) => (
          <button
            type="button"
            key={fraction}
            onClick={() => {
              const base = mode === "BUY" ? wallet.cash : wallet.coins;
              setAmount(round(base * fraction, mode === "BUY" ? 2 : 6));
            }}
            className="flex-1 rounded-lg border border-jay-border bg-jay-bg py-2 text-xs text-slate-300 active:opacity-80"
          >
            {fraction * 100}%
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {mode === "BUY"
          ? hasInput
            ? `≈ ${formatCoins(previewCoins)}`
            : `Balance ${formatMoney(wallet.cash)}`
          : hasInput
            ? `≈ ${formatMoney(previewCash)}`
            : `Holding ${formatCoins(wallet.coins)}`}
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-jay-down/40 bg-jay-down/10 px-3 py-2 text-sm text-jay-down">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={!hasInput}
        onClick={submit}
        className={`mt-4 w-full rounded-lg px-4 py-3 text-base font-semibold disabled:opacity-40 ${
          mode === "BUY"
            ? "bg-jay-up text-slate-900"
            : "bg-jay-down text-white"
        }`}
      >
        {mode === "BUY" ? "Buy JayCoin" : "Sell JayCoin"}
      </button>
    </div>
  );
}

function round(value: number, decimals: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const factor = 10 ** decimals;
  return (Math.floor(value * factor) / factor).toString();
}
