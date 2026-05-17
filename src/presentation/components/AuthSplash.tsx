import { useState } from "react";

interface Props {
  onSignIn: (nickname?: string) => void;
}

export function AuthSplash({ onSignIn }: Props) {
  const [nickname, setNickname] = useState("");

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-jay-border bg-jay-panel p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-jay-accent">JayBile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Trade JayCoin at live (simulated) prices.
        </p>

        <label className="mt-6 block text-xs uppercase tracking-wider text-slate-400">
          Nickname (optional)
        </label>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="e.g. jay"
          className="mt-1 w-full rounded-lg border border-jay-border bg-jay-bg px-3 py-3 text-base outline-none focus:border-jay-accent"
          autoFocus
          inputMode="text"
          autoCapitalize="none"
        />

        <button
          type="button"
          onClick={() => onSignIn(nickname)}
          className="mt-4 w-full rounded-lg bg-jay-accent px-4 py-3 text-base font-semibold text-jay-bg transition hover:brightness-110 active:opacity-80"
        >
          Enter market
        </button>

        <p className="mt-4 text-xs text-slate-500">
          Returning users with the same nickname pick up where they left off.
          Otherwise a fresh wallet with $10,000 is created.
        </p>
      </div>
    </div>
  );
}
