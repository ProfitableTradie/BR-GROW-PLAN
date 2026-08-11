# Test Results — Boardroom Growth Plan

Run the suite in the app: **Setup → Run the self-test**, or open the file with `?selftest=1`.

## Golden test cases

```
51 passed · 0 failed

PASS  1 · 12 months recognised
PASS  1 · revenue total
PASS  1 · GP% is total GP ÷ total revenue
PASS  1 · net profit is derived, not entered
PASS  1 · average job value
PASS  2 · partial baseline months
PASS  2 · monthly revenue uses 4 months
PASS  2 · empty months excluded from totals
PASS  3 · zero revenue → GP% is null not NaN
PASS  3 · zero revenue → no Infinity
PASS  4 · zero jobs → average job value null
PASS  5 · required GP
PASS  5 · required revenue
PASS  5 · 100% conversion → leads = jobs
PASS  5 · funnel back-checks to the profit asked for
PASS  5 · on-tools exact requirement
PASS  5 · rounded up to whole people
PASS  5 · hires = target − current, never a MOD test
PASS  5 · utilisation shown separately
PASS  5 · team leaders at span 6
PASS  5 · ops manager threshold respected
PASS  5 · pricing hours come from quotes
PASS  5 · estimators
PASS  6 · no strategies → year 1 = baseline × market growth
PASS  6 · year 2 compounds
PASS  7 · overlapping levers sum in percentage points
PASS  7 · confidence weights the lever
PASS  7 · a lever starting in month 7 affects only half of year 1
PASS  8 · only active divisions roll up
PASS  8 · revenue sums across active divisions
PASS  8 · span of control is NOT summed
PASS  8 · revenue per head is revenue-weighted
PASS  8 · inactive divisions contribute nothing
PASS  8b · desired sales add across departments
PASS  8b · desired profit adds
PASS  8b · consolidated margin is re-derived, not averaged
PASS  8b · consolidated margin is NOT the mean of 40% and 50%
PASS  8b · jobs add across departments
PASS  8b · consolidated average job value re-derived
PASS  8b · quotes add
PASS  8b · consolidated win rate re-derived
PASS  8b · pricing minutes weighted, not summed
PASS  8b · pricing minutes are not 360
PASS  8b · workforce headcount DOES add up
PASS  8b · hires add up
PASS  8b · switching a department off removes it from the budget
PASS  9 · lower-is-better scores upward
PASS  9 · higher-is-better scores upward
PASS  9 · target equal to baseline does not divide by zero
PASS  9 · out-of-range clamps to 100
PASS  10 · fuzzed inputs produce no NaN or Infinity
=== CONSOLE ===
```

Executed headless in Chromium at 1440×1000. Zero console errors, zero page errors across all ten tabs.

## What each case proves

| Case | Proves |
|---|---|
| 1 | A clean 12-month baseline: totals, period-ratio gross margin, derived net profit, average job value |
| 2 | A partial (4-month) baseline uses only entered months and does not average empty ones in |
| 3 | Zero revenue produces `null`, not `NaN`, `Infinity` or `#DIV/0!` |
| 4 | Zero jobs produces `null` for average job value |
| 5 | 100% conversion collapses leads to jobs; the funnel back-checks to the profit asked for; capacity rounding, the hiring rule, spans of control and pricing hours are all correct |
| 6 | A scenario with no strategies moves only by the macro assumptions, and compounds year on year |
| 7 | Two strategies on the same driver sum; confidence weights the lever; a lever starting in month 7 affects only half of year 1 |
| 8 | Divisions: only active ones roll up, revenue sums, spans of control are **not** summed, revenue per head is revenue-weighted, and five inactive divisions holding $999,999 a month contribute nothing |
| 8b | **Consolidated view on budget**: desired sales and profit add across departments; consolidated gross margin is re-derived from the totals (42.9%) and is *not* the mean of the two department margins (45%); jobs and quotes add; average job value and win rate are re-derived; pricing minutes of 300 and 60 weight to 208.8 and are *not* summed to 360; workforce headcount **does** add up; switching a department off removes it from the budget |
| 9 | The Freedom Score scores upward in both directions, guards target = baseline, and clamps out-of-range values |
| 10 | A fuzzed state (alternating $0 and $1e12 revenue, negative cost of sales, zero everything else, negative target profit) produces no non-finite number anywhere in the five-year model |

## The fourteen defects in the original workbook

| # | Defect in `BR Growth Plan Calculator.xlsx` | How it is fixed |
|---|---|---|
| 1 | `Consolidated` **SUMs assumptions** across departments — five departments each with a span of control of 6 consolidated to a span of 30. Same for revenue per head, pricing hours and pricing minutes. | Assumptions are never summed. `weightedAssumptions()` returns a revenue-weighted average and the weighting basis is printed on screen. Self-test 8 asserts span of control stays at 6 across two divisions. |
| 2 | `Consolidated!Q30` points at `'Dept D'!D42` where every other cell in that column points at Dept E — a silent wrong number. | There are no hand-written cross-references. One state object, derived views. Nothing can drift. |
| 3 | The funnel roll-up aggregates only Projects + Dept A–D. **Dept E, F and G are silently excluded** from every consolidated funnel figure. | `business()` iterates every active division. Self-test 8 fills five inactive divisions with $999,999 a month and asserts the total does not move. |
| 4 | `F43`/`F44` "Hire Needed" flags test `MOD(A1,1)` and `MOD(A2,1)` — empty cells. They can only ever return "Has Capacity". | `hires = max(0, ceil(needed) − current)`. Self-test 5 asserts 8.57 needed against 6 current gives 3 hires. |
| 5 | `IF(MOD(x,1)<>0,"Hire Needed","")` is wrong logic: any fraction flags a hire even with spare capacity, and an exact integer above current headcount flags nothing. | Requirement, rounded plan and utilisation % are three separate figures, all displayed. |
| 6 | Every ratio row is unguarded — `=SUM(C8/C7)` with zero revenue returns `#DIV/0!`. The workbook ships showing errors. | Guarded division throughout; `null` renders as `—`. Self-tests 3, 4 and 10 assert no `NaN` or `Infinity` survives a fuzzed state. |
| 7 | Rows labelled **"Enter Your Fixed Costs (Incl. Your Salary)"** contain a formula, not an input. The label lies about the cell. | Inputs and derived values are visually distinct and never mislabelled. Derived rows carry a tint and cannot be typed into. |
| 8 | `Projects!D19` (Desired Profit) is empty while the whole chain below depends on it. | A completeness panel names every missing input and what breaks without it. |
| 9 | Months run C, D, E, **G** — column F is an unlabelled gap sitting inside `AVERAGE(C7:G7)`. Only four months are captured. | Twelve contiguous, calendar-labelled months. |
| 10 | Baseline GP% is `AVERAGE(monthly GP%)` — an average of ratios, not the business's actual margin. | `GP% = ΣGP / ΣRevenue`. The monthly spread is reported separately. Self-test 1 asserts this to 1e-9. |
| 11 | Two pricing-hours formulas on one sheet: `D42` monthly and `F42` using a `12/44` weekly factor, compared against a monthly capacity figure. | One formula, `quotes × minutes ÷ 60`, units stated on screen. |
| 12 | Net Profit is a typed input that can contradict Revenue − GP − Fixed Costs above it. | Net profit is always derived. A reported figure can be entered and is shown as a variance. Self-test 1 asserts the derived value. |
| 13 | Pricing workload is driven off **leads**, not quotes. Not every lead gets priced. | Explicit three-stage funnel: leads → quotes → jobs. Pricing time applies to quotes. Self-test 5 asserts pricing hours come from quotes. |
| 14 | `=SUM(D6)-G6`, `=SUM(C8/C7)`, `=+I10` — SUM wrapped around single cells throughout. | Clean expressions; the whole engine is 8 pure functions documented in CALC-SPEC.md. |

## Other checks

- **Horizontal overflow** — none at 1440, 1024 or 820 px.
- **Print pack** — all ten tabs render to A4 with backgrounds intact (556 KB sample PDF).
- **Reconciliation** — org chart people cost is split into the cost-of-sales bucket (on tools, team leaders) and the fixed-cost bucket (owner, ops managers, estimators, office) and each is reconciled against the matching forecast line rather than comparing the whole wage bill to fixed costs.
- **Bad tokens** — no `NaN`, `Infinity`, `undefined` or `#DIV` appears in the rendered text of any tab with the example business loaded.

## Deployment verification

Run against a fresh `git clone` of this repo, to prove the Render pipeline end to end:

| Step | Result |
|---|---|
| `./build.sh` from a clean checkout (no `public/`, no root HTML) | builds `public/index.html`, 167,656 bytes |
| `node server.js` on `process.env.PORT` | listening, no dependencies installed |
| `GET /?selftest=1` over HTTP | **51 passed · 0 failed** |
| `GET /healthz` | `200 {"status":"ok"}` |
| `GET /some/deep/path` | serves the app (rewrite fallback) |
| `GET /../server.js`, `/%2e%2e/server.js`, `/..%2f..%2fetc%2fpasswd`, `/../../package.json` | **403 Forbidden** — no file outside `public/` is reachable |
| Console and page errors during the run | none |

Static-site deploys skip `server.js` entirely; `render.yaml` sets `buildCommand: ./build.sh` and `staticPublishPath: ./public`, which is the same build the table above exercises.

## Known limitations in this build

1. Six of the seven Freedom Score components interpolate linearly from baseline to the year-5 target; only owner hours are modelled from the strategy stack. Per-year wellness targets are the obvious next addition.
2. Department budgets set the monthly run rate; the five-year scenario engine still projects the business as a whole rather than department by department. Per-department five-year forecasting is the next structural step.
3. Completed years do not yet lock as actuals — the rolling window is built but the year-end roll-forward is manual.
4. Role costs in the org chart are single figures per role, not per named person.
