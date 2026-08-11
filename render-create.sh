#!/bin/sh
# Create the Render static site for this repo, from the terminal.
#
#   export RENDER_API_KEY=rnd_xxxxxxxx
#   ./render-create.sh
#
# Get the key from Render → top-right avatar → Account Settings → API Keys.
# The key is a secret. Revoke it when you are done if you do not need it again.
set -e

: "${RENDER_API_KEY:?Set RENDER_API_KEY first — see the comment at the top of this file}"

REPO="https://github.com/ProfitableTradie/BR-GROW-PLAN"
NAME="br-grow-plan"
API="https://api.render.com/v1"

extract() { tr ',' '\n' | grep -m1 "\"$1\"" | sed "s/.*\"$1\":\"\([^\"]*\)\".*/\1/"; }

echo "→ Finding your Render workspace…"
OWNERS=$(curl -sS -H "Authorization: Bearer $RENDER_API_KEY" "$API/owners?limit=20")
case "$OWNERS" in
  *Unauthorized*|*unauthorized*) echo "   The API key was rejected. Check you copied all of it."; exit 1 ;;
esac
OWNER_ID=$(printf '%s' "$OWNERS"   | extract id)
OWNER_NAME=$(printf '%s' "$OWNERS" | extract name)
[ -n "$OWNER_ID" ] || { echo "   Could not read a workspace id. Raw response:"; echo "$OWNERS"; exit 1; }
echo "   Workspace: $OWNER_NAME  ($OWNER_ID)"

echo "→ Creating the static site '$NAME'…"
BODY=$(cat <<JSON
{
  "type": "static_site",
  "name": "$NAME",
  "ownerId": "$OWNER_ID",
  "repo": "$REPO",
  "branch": "main",
  "autoDeploy": "yes",
  "serviceDetails": { "buildCommand": "", "publishPath": "public" }
}
JSON
)
RESP=$(curl -sS -X POST "$API/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY")

SERVICE_ID=$(printf '%s' "$RESP" | extract id)
URL=$(printf '%s' "$RESP" | tr ',' '\n' | grep -m1 '"url"' | sed 's/.*"url":"\([^"]*\)".*/\1/')

if [ -z "$SERVICE_ID" ]; then
  echo
  echo "   Render did not create the service. Its reply:"
  echo "$RESP"
  echo
  echo "   Most common cause: Render cannot see a PRIVATE repo until its GitHub"
  echo "   App is installed on the ProfitableTradie org. Fix that in Render →"
  echo "   Account Settings → GitHub → Configure, then run this again."
  exit 1
fi

echo "   Created: $SERVICE_ID"
[ -n "$URL" ] && echo "   URL:     $URL"
echo
echo "→ First deploy is building. Watch it at:"
echo "   https://dashboard.render.com/static/$SERVICE_ID"
echo
echo "   When it goes live, check the maths survived the trip:"
echo "   ${URL:-https://$NAME.onrender.com}/?selftest=1   →  should say 51 passed · 0 failed"
