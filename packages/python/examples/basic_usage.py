"""
Example: Basic usage of the Telegram Wallet P2P SDK (Unofficial)

Before running:
  pip install telegram-wallet-p2p

Set your API key as an environment variable:
  export WALLET_P2P_API_KEY=your-api-key

This is an UNOFFICIAL SDK.
Not affiliated with Telegram or Wallet.
"""

import asyncio
import os

from telegram_wallet_p2p import WalletP2PClient, TradeSide
from telegram_wallet_p2p.analytics import best_price, market_summary, price_spread


async def main():
    api_key = os.environ.get("WALLET_P2P_API_KEY")
    if not api_key:
        print("Error: Set WALLET_P2P_API_KEY environment variable")
        return

    async with WalletP2PClient(api_key=api_key) as client:
        # Fetch USDT/RUB sell ads
        response = await client.get_online_items(
            crypto_currency="USDT",
            fiat_currency="RUB",
            side=TradeSide.SELL,
            page_size=20,
        )

        print(f"Found {len(response.data)} ads\n")

        # Display each ad
        for item in response.data:
            print(
                f"  [{item.merchant_level.value}] {item.nickname} — "
                f"₽{item.price}/USDT — "
                f"Qty: {item.last_quantity} — "
                f"Methods: {', '.join(item.payments)}"
            )

        # Analytics
        print("\n--- Price Spread ---")
        spread = price_spread(response.data)
        if spread:
            for key, value in spread.items():
                print(f"  {key}: {value}")

        print("\n--- Best Price ---")
        best = best_price(response.data, TradeSide.SELL)
        if best:
            print(f"  Best sell: ₽{best.price} by {best.nickname}")

        print("\n--- Market Summary ---")
        summary = market_summary(response.data)
        for key, value in summary.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
