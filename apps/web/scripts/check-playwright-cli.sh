#!/usr/bin/env bash
set -euo pipefail

echo "Playwright CLI: $(pnpm exec playwright --version)"
echo "Running browser, dev-server, page-load, console, network, keyboard, and screenshot checks..."

pnpm exec playwright test tests/health/playwright-cli-health.test.ts \
  --workers=1 \
  --reporter=line

echo "Playwright CLI health check passed."
