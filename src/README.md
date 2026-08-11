# Source fragments

`boardroom-growth-plan.html` in the repo root is the deliverable. It is built by concatenating
these fragments in order, which keeps a 2,000-line single-file app editable in pieces:

    cat 01-head.html 02-body.html 03-core.js 04-charts.js 05-tabs.js 05b-budget.js 06-app.js > ../boardroom-growth-plan.html

| Fragment | Contents |
|---|---|
| `01-head.html` | `<head>`, design tokens, all CSS including print |
| `02-body.html` | Top bar, left rail, the ten empty tab containers |
| `03-core.js`   | State model and the calculation engine (pure functions) |
| `04-charts.js` | Hand-built SVG charts, formatters, render helpers |
| `05-tabs.js`   | One render function per tab |
| `05b-budget.js`| Budget & Workforce: desired vs actuals, assumptions, workforce, consolidated |
| `06-app.js`    | Routing, events, save/load, CSV, self-test |

Edit a fragment, re-run the `cat`, done. There is no other build step.
