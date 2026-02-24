# Telegram Wallet P2P SDK — Node.js / TypeScript

> ⚠️ **Unofficial SDK** — This project is not affiliated with, endorsed by, or related to Telegram or Wallet.

A fully typed TypeScript SDK for the [Telegram Wallet P2P API](https://docs.wallet.tg/p2p).

## Features

- 🔷 **TypeScript-first** — Full type safety with strict mode
- 🌐 **Zero dependencies** — Uses native `fetch` (Node.js 18+)
- 🔁 **Auto-retry** — Exponential backoff on rate limits and server errors
- 📊 **Analytics** — Built-in utilities for price analysis and filtering
- 🔑 **Safe auth** — API key passed via constructor, never logged

## Installation

```bash
npm install telegram-wallet-p2p
```

## Quick Start

```typescript
import { WalletP2PClient, TradeSide } from "telegram-wallet-p2p";

const client = new WalletP2PClient({
  apiKey: process.env.WALLET_P2P_API_KEY!,
});

const response = await client.getOnlineItems({
  cryptoCurrency: "USDT",
  fiatCurrency: "RUB",
  side: TradeSide.SELL,
});

for (const item of response.data) {
  console.log(`${item.nickname}: ${item.price} ${item.fiatCurrency}`);
}
```

## Analytics

```typescript
import { bestPrice, priceSpread, marketSummary, TradeSide } from "telegram-wallet-p2p";

// Find the best sell price
const best = bestPrice(response.data, TradeSide.SELL);

// Get price statistics
const spread = priceSpread(response.data);
// => { min: "95.0000", max: "102.5000", avg: "98.7500", ... }

// Full market summary
const summary = marketSummary(response.data);
```

## API Reference

### `new WalletP2PClient(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your Wallet P2P API key |
| `baseUrl` | `string` | `https://p2p.walletbot.me` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `maxRetries` | `number` | `3` | Retry attempts on 429/5xx |
| `retryBaseDelay` | `number` | `1000` | Base delay in ms for exponential backoff |

### `client.getOnlineItems(params)`

Fetches active P2P ads. Returns `Promise<GetOnlineItemsResponse>`.

## Error Handling

```typescript
import {
  BadRequestError,       // 400 — unsupported currency
  AuthenticationError,   // 401 — invalid API key
  AccessDeniedError,     // 403 — access denied
  RateLimitError,        // 429 — rate limit exceeded
  ServerError,           // 5xx — server error
} from "telegram-wallet-p2p";
```

## License

MIT
