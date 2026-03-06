# Telegram Wallet P2P MCP Server

> ⚠️ **Unofficial** — This project is not affiliated with, endorsed by, or related to Telegram or Wallet.

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server providing read-only tools for Telegram Wallet P2P market data analytics.

## Tools

| Tool | Description |
|---|---|
| `get_p2p_ads` | Fetch active P2P ads filtered by crypto/fiat/side |
| `get_market_summary` | Aggregated analytics: price stats, payment methods, merchant distribution |
| `get_best_price` | Find the best available buy/sell price |

All tools return structured JSON suitable for AI consumption.

## Setup

### Prerequisites

- Node.js 18+
- A Wallet P2P API key ([how to get one](https://help.wallet.tg/article/934-p2p-api))

### Installation

```bash
npm install -g @furkankoykiran/telegram-wallet-p2p-mcp
```

Or build from source:

```bash
cd packages/mcp
npm install
npm run build
```

### Configuration

Set your API key as an environment variable:

```bash
export WALLET_P2P_API_KEY=your-api-key
```

### Usage with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "telegram-wallet-p2p": {
      "command": "npx",
      "args": ["@furkankoykiran/telegram-wallet-p2p-mcp"],
      "env": {
        "WALLET_P2P_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Usage with VS Code

Add to your VS Code settings (`.vscode/mcp.json`):

```json
{
  "servers": {
    "telegram-wallet-p2p": {
      "command": "npx",
      "args": ["@furkankoykiran/telegram-wallet-p2p-mcp"],
      "env": {
        "WALLET_P2P_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Example Prompts

Once connected, you can ask your AI assistant:

- *"What's the current best price for selling USDT in RUB?"*
- *"Show me a market summary for BTC/USD buy ads"*
- *"List all USDT/RUB sell ads that accept Tinkoff"*

## License

MIT
