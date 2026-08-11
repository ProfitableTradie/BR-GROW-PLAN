# BR Grow Plan

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ProfitableTradie/BR-GROW-PLAN)


A five-year scenario forecaster and growth planner for Profitable Tradie Boardroom members.

**One self-contained HTML file.** No build step, no server, no dependencies, no CDN. Open it in a browser and it works. Email it to your accountant and it still works.

```
public/index.html             the application, as Render serves it
BR-Grow-Plan.html            the same file, for emailing or opening locally
src/                          the source fragments — edit these, then ./build.sh
render.yaml                   Render Blueprint (static site)
DEPLOY.md                     step-by-step terminal instructions
render-create.sh              creates the Render service from the terminal
server.js                     zero-dependency Node server, only for a Web Service deploy
RENDER.md                     how to deploy and how to push to your repo
CALC-SPEC.md                  every formula, input, default and rounding rule
TEST-RESULTS.md               golden test cases and the defect audit of the original workbook
```

**To get it live: [DEPLOY.md](DEPLOY.md)** — copy-paste terminal steps from unzip to a working URL. [RENDER.md](RENDER.md) covers the settings in more detail and the Web Service alternative.

---

## Why it exists

Boardroom takes an owner who works *in* their business and turns them into a CEO who owns an *asset*. Two outcomes come out of that, and they are the only two being chased:

1. **Freedom — time and money.** Time and money the owner can actually use.
2. **An asset — sellable or a legacy.** A value that exists independently of the owner.

Every screen in this tool has to serve one of those. The single chart that carries the whole thesis is on the Five-Year Rolling tab: owner hours falling while business value rises. If those two lines move together, the plan is buying revenue with the owner's time and it has failed.

---

## The ten tabs

| | Tab | What it answers |
|---|---|---|
| 01 | **Vision** | What do five years look like — for the business and for the life behind it |
| 02 | **Baseline** | Twelve months of what actually happened |
| 03 | **Key Metrics** | Current, target and the size of the gap, across money, funnel, delivery, people and freedom |
| 04 | **Budget & Workforce** | Desired vs actuals → assumptions → workforce planning, one department at a time, then the consolidated view on budget |
| 05 | **Strategies** | The levers. Not a to-do list — the forecast is the sum of these |
| 06 | **Scenarios** | Plan A (Base), Plan B (Stretch), Plan C (Conservative), side by side, with guardrails |
| 07 | **Five-Year Rolling** | The horizon: P&L, team, cash, freedom, value |
| 08 | **One Year** | Year 1 to twelve months — budget, forecast and actual side by side — plus the ninety-day rocks |
| 09 | **Consolidated** | The boardroom one-pager, built to print |
| 10 | **Org Chart** | Today → Year 5, generated from the capacity engine, with the owner's roles clearing |

Plus **Setup** for the money settings, wellness baseline and targets, role costs and the self-test.

### Budget & Workforce — the old workbook's shape, done right

This is the tab that replaces the department sheets from `BR Growth Plan Calculator.xlsx`, in the same order they ran:

1. **Where this department is now** — read straight from the baseline.
2. **Desired versus actuals** — the four-column block: *margin ideals · desired numbers · current actuals · delta*, from desired profit all the way down to leads required.
3. **Assumptions** — revenue per on-tools member, spans of control, pricing hours, pricing minutes, tradesmen per office person. **Each department carries its own**, because a projects division prices nothing like a service division.
4. **Workforce planning** — new hires on tools, total team size, team leaders, ops managers, pricing hours, pricing personnel, extra office staff.
5. **Consolidated view on budget** — money and volume add, ratios are re-derived from the totals, headcount adds, and assumptions are revenue-weighted. Never summed.

---

## How the forecast actually works

Revenue is never projected directly. The **drivers** are projected and revenue falls out of them:

```
leads → (lead-to-quote rate) → quotes → (quote-to-win rate) → jobs
      → × average job value → revenue → × gross margin → gross profit
      → − fixed costs → net profit
```

Each strategy carries one or more **levers** — `gross margin +2pp`, `leads +25 a month`, `owner hours −8 a week` — with a start month, a full-effect month, a ramp shape and a confidence percentage. The five-year picture is the ramped, confidence-weighted sum of those levers applied to the baseline, month by month for sixty months.

Change one number in one strategy card and it flows through Key Metrics, Scenarios, Five-Year, One Year, Consolidated, the Org Chart, the Freedom Score and the business valuation.

Full detail in [CALC-SPEC.md](CALC-SPEC.md).

---

## Using it

- **Load example** on the Baseline tab fills a plausible trade business so you can see the whole thing working. Every number is editable.
- **Paste from spreadsheet** takes a block of twelve columns straight out of Xero or Excel.
- **Save / Save as** writes a `.json` file. In Chrome and Edge it writes back into the same file; elsewhere it downloads. **Open…** or drag a `.json` onto the window to load one.
- **Print pack** prints all ten tabs to A4 with colour intact.
- **Export the model to CSV** (Assumptions tab) drops the whole five-year model into Excel.
- **Run the self-test** (Setup tab, or `?selftest=1`) runs 51 checks with hand-calculated expected answers.

Data lives in memory and in the file you save. Nothing is written to browser storage and nothing leaves the machine.

---

## Requirements

Any modern browser. Chrome or Edge for save-in-place; Safari and Firefox fall back to download. Works down to tablet width; phones get a usable read-only view.
