#!/bin/sh
# One command to get this on Render.
#
#   ./deploy.sh
#
# Rebuilds the app, commits, and pushes to
# github.com/ProfitableTradie/BR-GROW-PLAN.
#
# It will NEVER overwrite an existing main. If main already has commits,
# it pushes a branch and prints a link to open a pull request instead.
set -e
cd "$(dirname "$0")"

REMOTE="https://github.com/ProfitableTradie/BR-GROW-PLAN.git"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTE"

echo "→ Building…"
./build.sh

git add -A
if git diff --cached --quiet; then
  echo "→ Nothing new to commit."
else
  git commit -q -m "Boardroom Growth Plan — update"
  echo "→ Committed."
fi

echo "→ Checking what is already on GitHub…"
if git fetch --quiet origin main 2>/dev/null; then
  BRANCH="growth-plan-$(date +%Y%m%d-%H%M)"
  echo "→ main already has history. Pushing a branch instead — nothing is overwritten."
  git branch -f "$BRANCH" HEAD >/dev/null
  git push -q -u origin "$BRANCH"
  echo
  echo "  Done. Open a pull request here, then merge it:"
  echo "  https://github.com/ProfitableTradie/BR-GROW-PLAN/compare/main...$BRANCH?expand=1"
else
  echo "→ main is empty. Pushing straight to main."
  git push -q -u origin main
  echo
  echo "  Done. Code is on GitHub."
fi

cat <<'NEXT'

  Next, in the Render dashboard:

  • If a service is already pointed at this repo — set
      Build command      ./build.sh
      Publish directory  public
    and hit Manual Deploy → Deploy latest commit.

  • If there is no service yet — New → Blueprint, pick this repo, Apply.
    render.yaml does the rest.

  Then open your live URL with ?selftest=1 on the end. It should say
  "51 passed · 0 failed".
NEXT
