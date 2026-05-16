import type { User, Wallet } from "../../domain/entities";
import { portfolioValue } from "../../domain/pricing";
import { formatMoney } from "../format";

interface Props {
  user: User;
  wallet: Wallet;
  price: number;
}

export function Header({ user, wallet, price }: Props) {
  const total = portfolioValue(wallet, price);
  return (
    <header className="sticky top-0 z-10 border-b border-jay-border bg-jay-bg/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Hello, {user.nickname}
          </div>
          <div className="truncate font-mono text-sm text-slate-300">
            Portfolio {formatMoney(total)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-slate-400">
            Cash
          </div>
          <div className="font-mono text-sm text-slate-200">
            {formatMoney(wallet.cash)}
          </div>
        </div>
      </div>
    </header>
  );
}
