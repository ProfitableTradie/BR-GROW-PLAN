/* ─── 04 BUDGET & WORKFORCE ─────────────────────────────────────
   The old workbook's shape, done right: per department, Desired vs
   Actuals → Assumptions → Workforce Planning, then a Consolidated
   View on Budget that adds money and headcount but weights assumptions. */

function divPath(id){ return 'divisions.'+S.divisions.findIndex(d=>d.id===id); }

/* Margin ideals column = each money line as a share of required revenue,
   exactly as the original Consolidated sheet computed C6 = D6/D10. */
function budgetRows(f, nz){
  const R = f.revenue;
  const pctOf = v => div(v, R);
  return [
    {grp:'Money'},
    {l:'Desired net profit, a month', input:'t.netProfit', ideal:pctOf(f.netProfit),
      desired:f.netProfit, actual:nz.netProfitM, fmt:'money', help:'After your own salary is paid'},
    {l:'Fixed costs incl. your salary', input:'t.fixedCosts', ideal:pctOf(f.fixedCosts),
      desired:f.fixedCosts, actual:nz.fixedM, fmt:'money', lower:true, help:'From your P&L, monthly'},
    {l:'Required gross profit', ideal:pctOf(f.requiredGP), desired:f.requiredGP,
      actual:nz.gpM, fmt:'money', help:'Desired profit + fixed costs'},
    {l:'Target gross margin', input:'t.gpPct', kind:'pct', ideal:f.gpPct,
      desired:f.gpPct, actual:nz.gpPct, fmt:'pct', help:'Gross profit ÷ revenue'},
    {l:'Required monthly sales', ideal:R?1:null, desired:f.revenue, actual:nz.revenueM,
      fmt:'money', big:true, help:'Required gross profit ÷ gross margin'},
    {grp:'The funnel'},
    {l:'Average job value', input:'t.avgJobValue', desired:f.avgJobValue,
      actual:nz.avgJobValue, fmt:'money', help:'Revenue ÷ number of jobs'},
    {l:'Jobs needed each month', desired:f.jobs, actual:nz.jobsM, fmt:'n1',
      help:'Required sales ÷ average job value'},
    {l:'Quote → win rate', input:'t.quoteWin', kind:'pct', desired:f.quoteWin, actual:nz.quoteWin,
      fmt:'pct', help:'Jobs won ÷ quotes issued'},
    {l:'Quotes needed each month', desired:f.quotes, actual:nz.quotesM, fmt:'n1',
      help:'Jobs ÷ win rate'},
    {l:'Lead → quote rate', input:'t.leadQuote', kind:'pct', desired:f.leadQuote, actual:nz.leadQuote,
      fmt:'pct', help:'Set 100% if you only track one conversion rate'},
    {l:'Leads needed each month', desired:f.leads, actual:nz.leadsM, fmt:'n1', big:true,
      help:'Quotes ÷ lead-to-quote rate'}
  ];
}

function budgetTable(divId, f, nz, showInputs){
  const rows = budgetRows(f, nz);
  const base = divId ? divPath(divId)+'.' : null;
  return `<div class="scrollx"><table class="t bud">
    <thead><tr><th>Where the business needs to get to</th><th>Margin ideals</th>
      <th>Desired numbers</th><th>Current actuals</th><th>Delta</th><th></th></tr></thead><tbody>
    ${rows.map(r=>{
      if(r.grp) return `<tr class="grp"><td colspan="6">${esc(r.grp)}</td></tr>`;
      const F = FMT[r.fmt]||n0;
      const shown = r.desired;
      const delta = (shown==null||r.actual==null||!Number.isFinite(shown)||!Number.isFinite(r.actual))
                    ? null : shown-r.actual;
      /* Delta = what has to change. On a "more is better" line a positive delta is
         a gap; on a "lower is better" line a positive delta means you have room. */
      const ahead = delta==null ? null : (r.lower ? delta>=0 : delta<=0);
      const isInput = !!(r.input && showInputs && base);
      const cell = isInput
        ? `<input type="number" step="${r.kind==='pct'?'0.1':'any'}" data-path="${esc(base+r.input)}" data-kind="${r.kind==='pct'?'pct':'num'}" value="${r.kind==='pct'?(num(getPath(base+r.input))*100).toFixed(1):(num(getPath(base+r.input))||'')}" aria-label="${esc(r.l)}">`
        : `<b>${F(shown)}</b>`;
      return `<tr class="${r.big?'tot':''}"><td>${esc(r.l)}${r.help?`<div class="tiny">${esc(r.help)}</div>`:''}</td>
        <td class="ideal">${r.ideal!=null?pct(r.ideal):''}</td>
        <td class="want ${isInput?'inp':'calc'}">${cell}</td>
        <td>${F(r.actual)}</td>
        <td class="${ahead==null?'':(ahead?'up':'down')}">${delta==null?'—':signed(delta,F)}</td>
        <td>${ahead==null?'<span class="pill neutral">—</span>'
              :(Math.abs(delta)<1e-9?'<span class="pill good">On target</span>'
              :(ahead?'<span class="pill good">Ahead</span>':'<span class="pill bad">Gap</span>'))}</td></tr>`;
    }).join('')}
  </tbody></table></div>`;
}

/* The department sheets ran the six assumptions and the seven workforce
   figures as one continuous block, with the calculated rows sitting
   directly under the typed ones. Same order, same wording. */
const ASSUMPTION_FIELDS = [
  ['revPerHead','Average Revenue Per On-tools Team Member','Revenue ÷ number on tools, per month','money'],
  ['spanTL','Span of Control for Team Leader','How many on-tools people one leader carries',''],
  ['spanOM','Span of Control for Ops Manager','How many team leaders one ops manager carries',''],
  ['omThreshold','Team Leaders Before an Ops Manager Is Needed','Below this you or a leader covers it — and that counts as owner-dependence',''],
  ['pricingCapacity','Available Pricing Hours for FT Estimator / month','',''],
  ['tradesPerOffice','Number of Tradesmen per Extra Office Personnel','',''],
  ['pricingMinutes','Average Time Spent Pricing Per Job (Minutes)','60 for service work, 300 for projects','']
];

function assumptionsTable(dv, cap, capNow){
  const dpath = divPath(dv.id);
  const flag = (need, have) => need==null ? ''
    : (need>have ? '<span class="pill bad">Hire Needed</span>'
                 : '<span class="pill good">Has Capacity</span>');
  const OUT = [
    {l:'New Hires Needed on Tools', v:cap.hires, f:n0,
      pill: cap.hires>0?'<span class="pill bad">Hire Needed</span>':'<span class="pill good">Has Capacity</span>',
      note: cap.needed!=null?`${n1(cap.needed)} needed exactly · ${n0(cap.current)} on tools today`:''},
    {l:'Total On-Tools Team Size Needed', v:cap.target, f:n0, pill:'',
      note: cap.util!=null?`${pct(cap.util,0)} utilised at ${n0(cap.target)} people`:''},
    {l:'Team Leaders Needed', v:cap.teamLeaders, f:n0, pill:flag(cap.teamLeaders, capNow.teamLeaders),
      note:`${n0(capNow.teamLeaders)} carried by today's revenue`},
    {l:'Operations Managers Needed', v:cap.opsManagers, f:n0, pill:flag(cap.opsManagers, capNow.opsManagers),
      note:`${n0(capNow.opsManagers)} carried by today's revenue`},
    {l:'Total Time Spent Pricing Per Month (Hours)', v:cap.pricingHours, f:n0, pill:'',
      note:'Quotes needed × pricing minutes ÷ 60'},
    {l:'Number of Pricing Personnel Needed', v:cap.estimators, f:n0, pill:flag(cap.estimators, capNow.estimators),
      note: cap.estimatorUtil!=null?`${pct(cap.estimatorUtil,0)} utilised`:''},
    {l:'Number of Extra Office Personnel', v:cap.office, f:n0, pill:flag(cap.office, capNow.office), note:''}
  ];
  return `<div class="scrollx"><table class="t asm">
    <thead><tr><th>Assumptions</th><th>Value</th><th></th></tr></thead><tbody>
    ${ASSUMPTION_FIELDS.map(([k,l,h])=>`<tr><td>${esc(l)}${h?`<div class="tiny">${esc(h)}</div>`:''}</td>
      <td class="inp" style="width:150px"><input type="number" step="any" data-path="${esc(dpath+'.a.'+k)}" value="${num(dv.a[k])||''}" aria-label="${esc(l)}" style="width:118px;text-align:right;border:1px solid var(--rule);border-radius:6px;padding:6px 9px;background:var(--paper-2);font-variant-numeric:tabular-nums"></td>
      <td style="width:150px"></td></tr>`).join('')}
    <tr class="rule"><td colspan="3"></td></tr>
    ${OUT.map(r=>`<tr><td>${esc(r.l)}${r.note?`<div class="tiny">${esc(r.note)}</div>`:''}</td>
      <td class="calc"><b>${r.f(r.v)}</b></td>
      <td>${r.pill}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function renderBudget(){
  if(!S.divisionsOn) UI.div='WOB';
  else if(UI.div==='WOB'){ const a=S.divisions.find(d=>d.active&&d.id!=='WOB'); UI.div=a?a.id:'D1'; }
  const dv = currentDivision();
  const nz = normalise(dv), f = funnel(dv.t);
  const cap  = capacity(f.revenue, f.quotes, dv.a, {onTools:nz.onTools});
  const capN = capacity(nz.revenueM, nz.quotesM, dv.a, {onTools:nz.onTools});
  const B = budget();
  const dpath = divPath(dv.id);

  return head('04 · The budget','Budget & Workforce',
    `Where the business is now, where it needs to get to, and the team that gets it there — set one department at a time, then rolled up. This is the shape of the original Boardroom calculator: <strong>desired versus actuals</strong>, then the <strong>assumptions</strong> behind it, then the <strong>workforce planning</strong> that falls out of both.`)

  + (S.divisionsOn ? `<div class="divchips">
      ${S.divisions.filter(d=>d.id!=='WOB').map(d=>`<button class="divchip ${d.id===UI.div?'on':(d.active?'':'off')}" data-divsel="${d.id}">${esc(d.name)}${d.active?'':' · off'}</button>`).join('')}
    </div>
    <div class="btnrow" style="margin-top:10px">
      <label class="toggle"><input type="checkbox" data-divactive="${esc(dv.id)}" ${dv.active?'checked':''}> ${esc(dv.name)} is active</label>
      <input class="divname" data-divname="${esc(dv.id)}" value="${esc(dv.name)}" aria-label="Division name">
      <span class="tiny">Only active departments roll into the consolidated view.</span>
    </div>` : `<div class="btnrow" style="margin-top:22px"><span class="pill accent">Whole of business</span>
      <span class="tiny">Turn on divisions in Setup to budget department by department.</span></div>`)

  + `<div class="legend"><span><i class="swin"></i>Type into the <b>amber</b> boxes</span>
      <span><i class="swout"></i>The <b>dark</b> boxes calculate</span>
      <span>Nothing labelled as an input is ever a formula.</span></div>`

  + sech(`Where ${dv.name} is now`, `${nz.n} of 12 months entered on the Baseline tab`)
  + `<div class="mgrid">
      ${metric('Revenue', nz.revenueM,'money','Per month','','bg_rev')}
      ${metric('Gross margin', nz.gpPct,'pct','Total GP ÷ total revenue','','bg_gp')}
      ${metric('Net profit', nz.netProfitM,'money','Per month, derived','','bg_np')}
      ${metric('Average job value', nz.avgJobValue,'money','Revenue ÷ jobs','','bg_ajv')}
      ${metric('Jobs', nz.jobsM,'n1','Per month','','bg_j')}
      ${metric('On tools', nz.onTools,'n1','Latest month entered','','bg_ot')}
    </div>`

  + sech('Desired versus actuals', 'Type into the Desired column — everything else calculates')
  + budgetTable(dv.id, f, nz, true)
  + `<div class="cap"><b>Margin ideals</b> shows each line as a share of the required monthly sales, so you can see the shape of the business you are aiming at: ${pct(div(f.netProfit,f.revenue))} profit, ${pct(div(f.fixedCosts,f.revenue))} fixed costs, ${pct(f.gpPct)} gross margin. <b>Delta</b> is what has to change. Green means you are already there or better.</div>`

  + sech('Assumptions', `${esc(dv.name)} — to deliver ${money(f.revenue)} a month`)
  + assumptionsTable(dv, cap, capN)
  + `<div class="cap">The seven figures above the line are yours to set; the seven below are what they produce. These ship with the Profitable Tradie defaults — change them to match how ${esc(dv.name)} actually runs, because a projects division prices nothing like a service division, and that is exactly why each department carries its own set.<br><br><b>"Hire Needed"</b> compares the requirement against what today's revenue already carries — it is not a rounding test. The exact fractional requirement sits under every rounded figure, so you can see whether you are hiring for 0.2 of a person or 2.4.</div>`

  + (S.divisionsOn ? sech('Consolidated view on budget', `${B.per.length} active division${B.per.length===1?'':'s'} — money and volume add up, ratios are re-derived from the totals`)
  + budgetTable(null, {requiredGP:B.total.requiredGP, revenue:B.total.revenue, jobs:B.total.jobs,
      quotes:B.total.quotes, leads:B.total.leads, netProfit:B.total.netProfit,
      fixedCosts:B.total.fixedCosts, gpPct:B.total.gpPct, avgJobValue:B.total.avgJobValue,
      quoteWin:B.total.quoteWin, leadQuote:B.total.leadQuote},
      {netProfitM:B.b.netProfitM, fixedM:B.b.fixedM, gpM:B.b.gpM, gpPct:B.b.gpPct,
       revenueM:B.b.revenueM, avgJobValue:B.b.avgJobValue, jobsM:B.b.jobsM,
       quoteWin:B.b.quoteWin, quotesM:B.b.quotesM, leadQuote:B.b.leadQuote, leadsM:B.b.leadsM}, false)
  : '')

  + (S.divisionsOn ? sech('Department breakdown','Money and headcount add up · assumptions never do')
    + `<div class="scrollx"><table class="t"><thead><tr><th>Department</th><th>Desired sales</th><th>Desired profit</th>
        <th>Gross margin</th><th>Jobs</th><th>Leads</th><th>On tools</th><th>Hires</th><th>Share of budget</th></tr></thead><tbody>
      ${B.per.map(x=>`<tr><td>${esc(x.div.name)}</td><td>${money0k(x.f.revenue)}</td><td>${money0k(x.f.netProfit)}</td>
        <td>${pct(x.f.gpPct)}</td><td>${n1(x.f.jobs)}</td><td>${n1(x.f.leads)}</td>
        <td>${n0(x.cap.target)}</td><td>${n0(x.cap.hires)}</td><td>${pct(div(x.f.revenue,B.total.revenue))}</td></tr>`).join('')}
      <tr class="tot"><td>Consolidated</td><td>${money0k(B.total.revenue)}</td><td>${money0k(B.total.netProfit)}</td>
        <td>${pct(B.total.gpPct)}</td><td>${n1(B.total.jobs)}</td><td>${n1(B.total.leads)}</td>
        <td>${n0(B.capTotal.target)}</td><td>${n0(B.capTotal.hires)}</td><td>100.0%</td></tr>
    </tbody></table></div>`

    + sech('Assumptions by department','Shown side by side and weighted — never added together')
    + `<div class="scrollx"><table class="t"><thead><tr><th>Assumption</th>
        ${B.per.map(x=>`<th>${esc(x.div.name)}</th>`).join('')}<th>Weighted</th></tr></thead><tbody>
      ${ASSUMPTION_FIELDS.map(([k,l])=>`<tr><td>${esc(l)}</td>
        ${B.per.map(x=>`<td>${k==='revPerHead'?money(num(x.div.a[k])):n1(num(x.div.a[k]))}</td>`).join('')}
        <td class="want"><b>${k==='revPerHead'?money(B.b.a[k]):n1(B.b.a[k])}</b></td></tr>`).join('')}
    </tbody></table></div>
    <div class="cap">The weighted column is ${esc(B.b.a.weightBasis)}. In the original workbook this row was a <code>SUM</code> — five departments each with a span of control of six consolidated to a span of thirty. Spans, revenue per head and pricing rates are properties of how a department runs, so they are averaged, not added.</div>`

    + sech('Workforce by department','Headcount does add up')
    + `<div class="scrollx"><table class="t"><thead><tr><th>Role</th>
        ${B.per.map(x=>`<th>${esc(x.div.name)}</th>`).join('')}<th>Total</th></tr></thead><tbody>
      ${[['target','On tools needed'],['hires','New hires on tools'],['teamLeaders','Team leaders'],
         ['opsManagers','Operations managers'],['estimators','Pricing personnel'],['office','Extra office personnel'],
         ['pricingHours','Pricing hours a month']].map(([k,l])=>
        `<tr class="${k==='target'?'':''}"><td>${esc(l)}</td>${B.per.map(x=>`<td>${n0(x.cap[k])}</td>`).join('')}<td class="want"><b>${n0(B.capTotal[k])}</b></td></tr>`).join('')}
      <tr class="tot"><td>Total team</td>${B.per.map(x=>`<td>${n0(x.cap.total)}</td>`).join('')}<td class="want"><b>${n0(B.capTotal.total)}</b></td></tr>
    </tbody></table></div>` : '')

  + `<div class="note">This budget is the monthly run rate the business has to hit. The One Year tab takes it and shapes it across twelve months; the Scenarios tab forecasts how the strategy stack gets you there.</div>`;
}
