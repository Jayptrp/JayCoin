import type { Wallet } from "./entities";

export function unrealizedPnL(wallet: Wallet, price: number): number {
  if (wallet.coins <= 0) return 0;
  return (price - wallet.avgEntryPrice) * wallet.coins;
}

export function portfolioValue(wallet: Wallet, price: number): number {
  return wallet.cash + wallet.coins * price;
}

export function applyBuy(
  wallet: Wallet,
  coinsBought: number,
  price: number,
): Wallet {
  const cost = coinsBought * price;
  const newCoins = wallet.coins + coinsBought;
  const newAvg =
    newCoins === 0
      ? 0
      : (wallet.avgEntryPrice * wallet.coins + price * coinsBought) / newCoins;
  return {
    ...wallet,
    cash: wallet.cash - cost,
    coins: newCoins,
    avgEntryPrice: newAvg,
  };
}

export function applySell(
  wallet: Wallet,
  coinsSold: number,
  price: number,
): Wallet {
  const proceeds = coinsSold * price;
  const newCoins = wallet.coins - coinsSold;
  return {
    ...wallet,
    cash: wallet.cash + proceeds,
    coins: newCoins,
    avgEntryPrice: newCoins === 0 ? 0 : wallet.avgEntryPrice,
  };
}
