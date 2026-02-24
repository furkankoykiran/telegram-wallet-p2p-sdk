# Telegram Wallet P2P SDK — Python

> ⚠️ **Unofficial SDK** — This project is not affiliated with, endorsed by, or related to Telegram or Wallet.

A fully typed, async-first Python SDK for the [Telegram Wallet P2P API](https://docs.wallet.tg/p2p).

## Features

- 🔄 **Async-first** — Built on `aiohttp` for non-blocking I/O
- 🛡️ **Fully typed** — Pydantic models with complete type coverage
- 🔁 **Auto-retry** — Exponential backoff on rate limits and server errors
- 📊 **Analytics** — Built-in utilities for price analysis and filtering
- 🔑 **Safe auth** — API key passed via constructor, never logged

## Installation

```bash
pip install telegram-wallet-p2p
```

## Quick Start

```python
import asyncio
import os
from telegram_wallet_p2p import WalletP2PClient, TradeSide

async def main():
    async with WalletP2PClient(api_key=os.environ["WALLET_P2P_API_KEY"]) as client:
        response = await client.get_online_items(
            crypto_currency="USDT",
            fiat_currency="RUB",
            side=TradeSide.SELL,
        )
        for item in response.data:
            print(f"{item.nickname}: {item.price} {item.fiat_currency}")

asyncio.run(main())
```

## Analytics

```python
from telegram_wallet_p2p.analytics import best_price, price_spread, market_summary

# Find the best sell price
best = best_price(response.data, TradeSide.SELL)

# Get price statistics
spread = price_spread(response.data)
# => {"min": "95.00", "max": "102.50", "avg": "98.75", "median": "98.50", ...}

# Full market summary
summary = market_summary(response.data)
```

## API Reference

### `WalletP2PClient(api_key, *, base_url, timeout, max_retries, retry_base_delay)`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `api_key` | `str` | required | Your Wallet P2P API key |
| `base_url` | `str` | `https://p2p.walletbot.me` | API base URL |
| `timeout` | `int` | `30` | Request timeout in seconds |
| `max_retries` | `int` | `3` | Retry attempts on 429/5xx |
| `retry_base_delay` | `float` | `1.0` | Base delay for exponential backoff |

### `client.get_online_items(crypto_currency, fiat_currency, side, *, page, page_size)`

Fetches active P2P ads. Returns `GetOnlineItemsResponse`.

## Error Handling

```python
from telegram_wallet_p2p.exceptions import (
    BadRequestError,       # 400 — unsupported currency
    AuthenticationError,   # 401 — invalid API key
    AccessDeniedError,     # 403 — access denied
    RateLimitError,        # 429 — rate limit exceeded
    ServerError,           # 5xx — server error
)
```

## License

MIT
