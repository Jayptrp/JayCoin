const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const coinFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatCoins(value: number): string {
  return `${coinFormatter.format(value)} JAY`;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}
