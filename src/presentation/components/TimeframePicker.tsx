import { TIMEFRAMES, type TimeframeId } from "../../domain/timeframes";

interface Props {
  selected: TimeframeId;
  onChange: (id: TimeframeId) => void;
}

export function TimeframePicker({ selected, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="chart timeframe"
      className="flex gap-1 rounded-xl border border-jay-border bg-jay-panel p-1"
    >
      {TIMEFRAMES.map((tf) => {
        const active = tf.id === selected;
        return (
          <button
            key={tf.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tf.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-jay-accent text-jay-bg"
                : "text-slate-400 hover:bg-jay-bg hover:text-slate-200 active:bg-jay-bg"
            }`}
          >
            {tf.label}
          </button>
        );
      })}
    </div>
  );
}
