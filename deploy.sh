#!/usr/bin/env bash
# Branch Live deploy — deploys AND commits atomically.
# WHY: work that is deployed but NOT committed gets wiped by the next
# `git reset --hard` / `git checkout`. That has cost us the video embeds,
# Scout sparkle, and caret fixes MULTIPLE times. Deploy = commit. No exceptions.
#
# Usage:  ./deploy.sh "commit message describing what changed"
set -e
cd "$(dirname "$0")"

echo "▶ syntax check"
node --check worker.js

echo "▶ deploy worker"
npx wrangler deploy

# Deploy Pages only if any HTML (landing page etc.) changed since last commit
if git status --porcelain -- '*.html' | grep -q .; then
  echo "▶ HTML changed → deploy pages"
  npx wrangler pages deploy . --project-name branchlive --branch main --commit-dirty
fi

MSG="${1:-deploy $(date +%F\ %H:%M)}"
echo "▶ commit: $MSG"
git add -A
if git commit -m "$MSG"; then
  git log --oneline -1
else
  echo "(nothing to commit — working tree already clean)"
fi
echo "✓ done — deployed AND committed. Safe from resets."
