#!/bin/bash
set -e

# Usage: ./scripts/bump-version.sh <new_version>

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: ./scripts/bump-version.sh <new_version>"
  exit 1
fi

echo "Bumping version to $NEW_VERSION..."

# 1. Update Python (pyproject.toml)
sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" packages/python/pyproject.toml

# 2. Update Node.js (package.json)
sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" packages/node/package.json

# 3. Update MCP (package.json)
sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" packages/mcp/package.json

echo "Version bumped in all packages."
