#!/bin/sh
# Build the single-file app from the source fragments.
# Writes public/index.html (what Render serves) and BR-Grow-Plan.html
# (the copy you can email to an accountant).
set -e
cd "$(dirname "$0")"
mkdir -p public
cat src/01-head.html \
    src/02-body.html \
    src/03-core.js \
    src/04-charts.js \
    src/05-tabs.js \
    src/05b-budget.js \
    src/06-app.js > public/index.html
cp public/index.html BR-Grow-Plan.html
echo "built public/index.html ($(wc -c < public/index.html) bytes)"
