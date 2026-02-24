# Contributing to Telegram Wallet P2P SDK

> ⚠️ **Unofficial Project** — This SDK is not affiliated with Telegram or Wallet.

Thank you for your interest in contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests to ensure everything passes
6. Commit with a clear message
7. Push to your fork and open a Pull Request

## Development Setup

### Python SDK

```bash
cd packages/python
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest tests/ -v
```

### Node.js SDK

```bash
cd packages/node
npm install
npm test
npm run build
```

### MCP Server

```bash
cd packages/mcp
npm install
npm run build
```

## Guidelines

- **Do not add speculative endpoints** — only implement what is documented in the [official API docs](https://docs.wallet.tg/p2p)
- **Keep it read-only** — no trading or order placement features
- **Maintain type safety** — all new code must be fully typed
- **Write tests** — every new feature should have corresponding tests
- **Follow existing patterns** — keep the architecture consistent across packages

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Specify which package is affected (Python, Node, or MCP)

## Versioning

We follow [Semantic Versioning](https://semver.org/). All packages share the same version number.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
