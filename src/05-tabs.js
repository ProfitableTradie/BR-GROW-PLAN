/* ═══ §TABS ══════════════════════════════════════════════════════ */
const UI = {tab:'vision', div:'WOB', orgYear:0};

function head(eyebrow, title, lead){
  return `<div class="pagehead"><div class="eyebrow">${esc(eyebrow)}</div>
    <h1 class="big">${esc(title)}</h1>${lead?`<p class="lead">${lead}</p>`:''}</div>`;
}
function sech(title, hint){
  return `<div class="sechead"><h2 class="sec">${esc(title)}</h2>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}

/* ─── 01 VISION ─────────────────────────────────────────────────── */
function renderVision(){
  const pr = project(S.active), y5 = pr.years[5], y0 = pr.years[0];
  const f5 = y5.freedom, f0 = y0.freedom;
  const dv = (y5.value.equity!=null && y0.value.equity!=null) ? y5.value.equity-y0.value.equity : null;
  const dh = (y5.ownerHours!=null && y0.ownerHours!=null) ? y0.ownerHours-y5.ownerHours : null;
  const perHour = (dv!=null && dh) ? dv/(dh*48) : null;

  return head('01 · The Intent','Vision',
    `Boardroom takes an owner who works <em>in</em> their business and turns them into a CEO who owns an <em>asset</em>. Two outcomes come out of that, and they are the only two we are chasing: <strong>freedom — time and money</strong>, and <strong>an asset that is sellable or a legacy</strong>. Everything in this plan has to serve one of them.`)

  + sech('The statement','In your words. It prints on every export.')
  + `<textarea class="full" data-path="vision.statement" data-kind="str" placeholder="In five years, on ${esc(fiveYearDate())}, my business will… and my life will…">${esc(S.vision.statement)}</textarea>`

  + sech('Five years from today', esc(fiveYearDate()))
  + `<div class="two">
      <div>
        <div class="sub">The Business</div><h3>What it becomes</h3>
        ${field('Revenue','vision.biz.revenue',{help:'Annual, excluding GST'})}
        ${field('Net profit','vision.biz.profit',{help:'Annual, after your salary'})}
        ${field('Business value','vision.biz.value',{help:'What it is worth to a buyer'})}
        ${field('Team size','vision.biz.team',{help:'Total people, including you'})}
        ${selectField('Your role','vision.biz.role',['Owner-Operator','CEO','CEO · Leader','CEO · Leader · Investor','Investor — out of the business'])}
      </div>
      <div>
        <div class="sub">The Life</div><h3>What it funds</h3>
        ${field('Hours worked per week','vision.life.hours')}
        ${field('Weeks of holiday a year','vision.life.holidays')}
        ${field('Weekends worked a month','vision.life.weekends')}
        ${field('Evenings home for dinner','vision.life.evenings',{help:'Out of seven'})}
        ${field('Personal income drawn','vision.life.income',{help:'Salary plus drawings, annual'})}
        <label class="lbl">What the money is for</label>
        <input type="text" class="full" data-path="vision.life.whatFor" data-kind="str" value="${esc(S.vision.life.whatFor)}" placeholder="The boat. The kids' school. Buying the building.">
      </div>
    </div>`

  + sech('Outcome one — Freedom', 'Time and money you can actually use')
  + `<div class="mgrid">
      ${metric('Freedom score today', f0.score, 'n0', 'Progress toward your own year-5 targets — today is the start line', '', 'fs0')}
      ${metric('Freedom score, year 5', f5.score, 'n0', 'Plan '+S.active, 'hero', 'fs5')}
      ${metric('Owner hours now', y0.ownerHours, 'hrs', 'Per week', '', 'oh0')}
      ${metric('Owner hours, year 5', y5.ownerHours, 'hrs', dh!=null?`${n1(dh)} hours a week bought back`:'', 'accent', 'oh5')}
    </div>`

  + sech('Outcome two — An asset', 'A value that exists without you')
  + `<div class="mgrid">
      ${metric('Business value today', y0.value.equity, 'money0k', `${n1(pr.scenario.multiple)}× normalised EBITDA`, '', 'v0')}
      ${metric('Business value, year 5', y5.value.equity, 'money0k', 'Plan '+S.active, 'hero', 'v5')}
      ${metric('Value created', dv, 'money0k', 'Over five years', 'accent', 'vd')}
      ${metric('Value per hour bought back', perHour, 'money', 'Per annual hour of your time released', '', 'vph')}
    </div>
    <div class="cap">The multiple is an assumption you set, not a valuation. A real valuation needs an adviser.</div>`

  + `<div class="note">Every strategy in this plan has to serve one of these two outcomes. If it does not grow the asset or buy back freedom, it does not belong in the programme.</div>`;
}
function fiveYearDate(){
  const d=new Date(); d.setFullYear(d.getFullYear()+5);
  return d.toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'});
}

/* ─── 02 BASELINE ───────────────────────────────────────────────── */
const GRID_ROWS = [
  {k:'rev',      l:'Revenue (excl GST)',        f:money},
  {k:'cos',      l:'Cost of sales',             f:money},
  {d:'gp',       l:'Gross profit',              f:money},
  {d:'gpPct',    l:'Gross profit %',            f:v=>pct(v)},
  {k:'fixed',    l:'Fixed costs',               f:money},
  {k:'ovh',      l:'Company overhead',          f:money},
  {d:'np',       l:'Net profit',                f:money},
  {k:'jobs',     l:'Jobs / invoices completed', f:n0},
  {d:'ajv',      l:'Average job value',         f:money},
  {k:'quotes',   l:'Quotes issued',             f:n0},
  {k:'leads',    l:'Leads received',            f:n0},
  {k:'ownerHrs', l:'Owner hours per week',      f:n1, avg:true},
  {k:'onTools',  l:'On-tools headcount',        f:n1, last:true},
  {k:'office',   l:'Office headcount',          f:n1, last:true}
];
function monthName(i){
  const m=(num(S.meta.startMonth)+i)%12;
  const y=num(S.meta.startYear)+Math.floor((num(S.meta.startMonth)+i)/12);
  return MONTHS[m]+' '+String(y).slice(2);
}
function currentDivision(){
  return S.divisions.find(d=>d.id===UI.div) || S.divisions[0];
}
function renderBaseline(){
  if(!S.divisionsOn) UI.div='WOB';
  else if(UI.div==='WOB'){ const a=S.divisions.find(d=>d.active&&d.id!=='WOB'); UI.div=a?a.id:'D1'; }
  const dv = currentDivision();
  const nz = normalise(dv), b = business();

  let grid = `<table class="t grid"><thead><tr><th>Month</th>`;
  for(let i=0;i<12;i++) grid+=`<th>${esc(monthName(i))}</th>`;
  grid+=`<th class="tot">Period</th></tr></thead><tbody>`;
  GRID_ROWS.forEach(r=>{
    if(r.d){
      grid+=`<tr class="der"><td>${esc(r.l)}</td>`;
      for(let i=0;i<12;i++){
        const m=dv.months[i]; let v=null;
        if(r.d==='gp')    v=(num(m.rev)||num(m.cos))?num(m.rev)-num(m.cos):null;
        if(r.d==='gpPct') v=div(num(m.rev)-num(m.cos), num(m.rev));
        if(r.d==='np')    v=(num(m.rev)||num(m.cos)||num(m.fixed))?num(m.rev)-num(m.cos)-num(m.fixed)-num(m.ovh):null;
        if(r.d==='ajv')   v=div(num(m.rev), num(m.jobs));
        grid+=`<td>${r.f(v)}</td>`;
      }
      let tv2=null;
      if(r.d==='gp') tv2=nz.gp; if(r.d==='gpPct') tv2=nz.gpPct;
      if(r.d==='np') tv2=nz.netProfit; if(r.d==='ajv') tv2=nz.avgJobValue;
      grid+=`<td class="tot">${r.f(tv2)}</td></tr>`;
    } else {
      grid+=`<tr><td>${esc(r.l)}</td>`;
      for(let i=0;i<12;i++){
        grid+=`<td><input type="number" step="any" data-grid="${esc(dv.id)}" data-m="${i}" data-k="${r.k}" value="${num(dv.months[i][r.k])||''}" aria-label="${esc(r.l+' '+monthName(i))}"></td>`;
      }
      const col=dv.months.filter(entered).map(m=>num(m[r.k]));
      let t = r.avg ? (col.length?sum(col)/col.length:null) : r.last ? (col.length?col[col.length-1]:null) : sum(col);
      if(!col.length) t=null;
      grid+=`<td class="tot">${r.f(t)}</td></tr>`;
    }
  });
  grid+=`</tbody></table>`;

  const missing=[];
  if(!nz.n) missing.push('no months entered yet');
  if(!nz.revenue) missing.push('revenue');
  if(!nz.jobs) missing.push('jobs');
  if(!nz.quotes) missing.push('quotes — conversion and pricing capacity need this');
  if(!nz.leads) missing.push('leads — the top of the funnel is estimated without this');
  if(!nz.onTools) missing.push('on-tools headcount — hiring plan needs this');

  return head('02 · Where you are','Baseline',
    `Twelve months of what actually happened. Every forecast in this plan is built on these numbers, so it is worth getting them right. Partial data is fine — the tool uses the months you enter and tells you how many that is.`)

  + (S.divisionsOn ? `<div class="divchips">
      ${S.divisions.filter(d=>d.id!=='WOB').map(d=>`<button class="divchip ${d.id===UI.div?'on':(d.active?'':'off')}" data-divsel="${d.id}">${esc(d.name)}${d.active?'':' · off'}</button>`).join('')}
    </div>
    <div class="btnrow">
      <label class="toggle"><input type="checkbox" data-divactive="${esc(dv.id)}" ${dv.active?'checked':''}> ${esc(dv.name)} is active</label>
      <input class="divname" data-divname="${esc(dv.id)}" value="${esc(dv.name)}" aria-label="Division name">
      <span class="tiny">Rename it to match how you actually run the business.</span>
    </div>` : '')

  + sech(S.divisionsOn?dv.name+' — twelve months':'Twelve months of actuals',
      `${nz.n} of 12 months entered · <button class="btn sm" id="btnPaste">Paste from spreadsheet</button> <button class="btn sm" id="btnDemo">Load example</button>`)
  + `<div class="scrollx">${grid}</div>`
  + `<div class="cap">Period figures are totals, not averages of monthly ratios — gross margin is total gross profit ÷ total revenue over the ${nz.n||0} months entered. Headcount is taken from the latest month entered; owner hours are the average.</div>`

  + sech('What that says about the business', S.divisionsOn?`Whole of business — ${b.divisions} active division${b.divisions===1?'':'s'}`:'')
  + `<div class="mgrid">
      ${metric('Revenue',b.revenueM,'money','Per month','', 'b_rev')}
      ${metric('Gross margin',b.gpPct,'pct', b.gpSpread?'':'Total GP ÷ total revenue','', 'b_gp')}
      ${metric('Net profit',b.netProfitM,'money','Per month, derived', b.netProfitM<0?'':'', 'b_np')}
      ${metric('Average job value',b.avgJobValue,'money','Revenue ÷ jobs','', 'b_ajv')}
      ${metric('Quote → win',b.quoteWin,'pct','Jobs ÷ quotes','', 'b_qw')}
      ${metric('Leads a month',b.leadsM,'n0', b.leadsImplied?'Implied — you are not counting leads':'Counted','', 'b_ld')}
    </div>`
  + (missing.length ? `<div class="alert" style="margin-top:18px"><div><b>Still needed</b>${esc(missing.join(' · '))}</div></div>`:'')
  + (nz.gpSpread ? `<div class="cap">Monthly gross margin ranged ${pct(nz.gpSpread.lo)} to ${pct(nz.gpSpread.hi)}, median ${pct(nz.gpSpread.mid)}. A wide spread usually means pricing or job costing is inconsistent, not that the margin is wrong.</div>`:'')

  + sech('Reconciliation','Optional — if your accountant gave you a figure')
  + `<div class="fgrid">${field('Net profit as reported','fin.reportedNetProfit',{help:'Annual, from your financials'})}
     ${outrow('Variance to the derived figure', (()=>{ const r=num(S.fin.reportedNetProfit); if(!r) return '—';
        const d2=r-(b.netProfitM||0)*12; return `<span class="${Math.abs(d2)<1?'flat':(d2>0?'up':'down')}">${signed(d2,money)}</span>`; })(),
        'The derived figure is never overwritten.')}</div>`;
}

/* ─── 03 KEY METRICS ────────────────────────────────────────────── */
function renderMetrics(){
  const B=budget(), b=B.b, F=B.total, a=b.a;
  const capT=B.capTotal, capC=B.capNowTotal;
  const W=S.wellness;

  const row=(label,cur,tgt,fmt,goodPos,help)=>{
    const f=FMT[fmt]||n0;
    const gap=(cur==null||tgt==null)?null:tgt-cur;
    const pctGap=(gap!=null&&cur)?gap/Math.abs(cur):null;
    return `<tr><td>${esc(label)}${help?`<div class="tiny">${esc(help)}</div>`:''}</td>
      <td>${f(cur)}</td><td>${f(tgt)}</td>
      <td>${gap==null?'—':signed(gap,f)}</td>
      <td>${pctGap==null?'—':pct(pctGap,0)}</td>
      <td style="width:110px"><div class="bargap"><i style="width:${gap==null||tgt==null||!tgt?0:clamp(0,100,(cur/tgt)*100)}%"></i></div></td>
      <td>${gapPill(gap==null?null:-gap, goodPos)}</td></tr>`;
  };
  const grp=(t2,tag)=>`<tr class="grp"><td colspan="7">${esc(t2)} <span class="pill accent" style="margin-left:8px">${esc(tag)}</span></td></tr>`;

  return head('03 · The scoreboard','Key Metrics',
    `Where you are, where you need to be, and the size of the gap. Targets come from the budget you set on the <strong>Budget &amp; Workforce</strong> tab — department by department if you run divisions, then consolidated here.`)
  + sech('Current · Target · Gap', `Target = the consolidated budget${S.divisionsOn?` across ${B.per.length} division${B.per.length===1?'':'s'}`:''}`)
  + `<div class="scrollx"><table class="t">
    <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Gap</th><th>Gap %</th><th></th><th></th></tr></thead>
    <tbody>
    ${grp('Money — monthly','Both')}
    ${row('Revenue',b.revenueM,F.revenue,'money',true)}
    ${row('Gross profit',b.gpM,F.requiredGP,'money',true)}
    ${row('Gross margin',b.gpPct,F.gpPct,'pct',true)}
    ${row('Fixed costs incl. your salary',b.fixedM,F.fixedCosts,'money',false)}
    ${row('Net profit',b.netProfitM,F.netProfit,'money',true)}
    ${grp('Sales & marketing — monthly','Asset')}
    ${row('Leads',b.leadsM,F.leads,'n0',true, b.leadsImplied?'Implied from jobs — start counting leads':'')}
    ${row('Lead → quote rate',b.leadQuote,F.leadQuote,'pct',true)}
    ${row('Quotes',b.quotesM,F.quotes,'n0',true)}
    ${row('Quote → win rate',b.quoteWin,F.quoteWin,'pct',true)}
    ${row('Jobs completed',b.jobsM,F.jobs,'n0',true)}
    ${row('Average job value',b.avgJobValue,F.avgJobValue,'money',true)}
    ${grp('Delivery & workflow','Freedom')}
    ${row('Revenue per on-tools person',div(b.revenueM,b.onTools),num(a.revPerHead),'money',true)}
    ${row('Pricing hours a month',capC.pricingHours,capT.pricingHours,'n0',false,'Quotes × pricing minutes ÷ 60')}
    ${grp('People','Both')}
    ${row('On tools',b.onTools,capT.target,'n1',true)}
    ${row('Team leaders',capC.teamLeaders,capT.teamLeaders,'n1',true)}
    ${row('Operations managers',capC.opsManagers,capT.opsManagers,'n1',true)}
    ${row('Pricing personnel',capC.estimators,capT.estimators,'n1',true)}
    ${row('Office / admin',b.office,capT.office,'n1',true)}
    ${grp('Freedom & wellness','Freedom')}
    ${row('Owner hours a week',b.ownerHours!=null?b.ownerHours:num(W.base.hours),num(W.targ.hours),'n1',false)}
    ${row('Hours ON the business %',num(W.base.onBiz)/100,num(W.targ.onBiz)/100,'pct',true)}
    ${row('Weeks it runs without you',num(W.base.weeksWithout),num(W.targ.weeksWithout),'n1',true)}
    ${row('Weeks of holiday taken',num(W.base.holidays),num(W.targ.holidays),'n1',true)}
    ${row('Weekends worked a month',num(W.base.weekends),num(W.targ.weekends),'n1',false)}
    ${row('Evenings home a week',num(W.base.evenings),num(W.targ.evenings),'n1',true)}
    ${row('Personal income drawn',num(W.base.income),num(W.targ.income),'money',true)}
    </tbody></table></div>`

  + sech('The team the budget needs', `Summed across division${S.divisionsOn?'s':''} · assumptions ${esc(a.weightBasis)}`)
  + `<div class="mgrid">
      ${metric('On tools needed', capT.target,'n0', capT.needed!=null?`${n1(capT.needed)} exact · ${pct(capT.util,0)} utilised`:'','', 'c_ot')}
      ${metric('Hires needed', capT.hires,'n0', `${n0(capT.current)} on tools today`, capT.hires>0?'accent':'', 'c_hi')}
      ${metric('Team leaders', capT.teamLeaders,'n0', `Span of ${n1(a.spanTL)}`,'', 'c_tl')}
      ${metric('Ops managers', capT.opsManagers,'n0', `Span of ${n1(a.spanOM)}`,'', 'c_om')}
      ${metric('Pricing hours', capT.pricingHours,'n0', `A month, from ${n1(F.quotes)} quotes`,'', 'c_ph')}
      ${metric('Pricing personnel', capT.estimators,'n0', 'Full-time equivalent','', 'c_es')}
    </div>
    <div class="cap">Set the numbers behind all of this on the Budget &amp; Workforce tab. Nothing on this page is typed in — every target is derived from the department budgets.</div>`;
}

/* ─── 04 STRATEGIES ─────────────────────────────────────────────── */
function cfi(label, inner, wide){
  return `<div class="cfi ${wide?'wide':''}"><label>${esc(label)}</label>${inner}</div>`;
}
function stratCard(s,i){
  const sel=(path,opts,val)=>`<select data-spath="${i}.${path}">${opts.map(o=>`<option value="${esc(o.v!=null?o.v:o)}"${(o.v!=null?o.v:o)===val?' selected':''}>${esc(o.l!=null?o.l:o)}</option>`).join('')}</select>`;
  const inp=(path,val,type)=>`<input type="${type||'number'}" step="any" data-spath="${i}.${path}" value="${type==='text'?esc(val):num(val)}">`;
  return `<div class="card" data-si="${i}">
    <button class="x" data-delstrat="${i}" title="Remove">×</button>
    <input type="text" class="full" style="font-family:var(--serif);font-size:19px;padding:7px 9px;margin-bottom:10px" data-spath="${i}.name" value="${esc(s.name)}" placeholder="Name the strategy">
    <div class="cmeta">
      <span class="pill ${s.outcome==='Freedom'?'accent':s.outcome==='Asset'?'good':'neutral'}">${esc(s.outcome)}</span>
      <span class="pill ${s.stage==='Scaling'?'good':'neutral'}">${esc(s.stage)}</span>
      ${['A','B','C'].map(k=>`<button class="pill ${(s.scenarios||[]).includes(k)?'accent':'neutral'}" data-stogscen="${i}|${k}" style="border:0;cursor:pointer">Plan ${k}</button>`).join('')}
    </div>
    <div class="cf">
      ${cfi('Domain', sel('domain',DOMAINS,s.domain), true)}
      ${cfi('Serves', sel('outcome',OUTCOMES,s.outcome))}
      ${cfi('Stage', `<select data-spath="${i}.stage" data-stage="${i}">${STAGES.map(d=>`<option${d===s.stage?' selected':''}${d==='Scaling'&&!s.refined?' disabled':''}>${esc(d)}</option>`).join('')}</select>`)}
      ${cfi('The mindset shift it needs', `<input type="text" data-spath="${i}.shift" value="${esc(s.shift)}" placeholder="Owner-Operator → CEO: stop quoting every job myself">`, true)}
      ${cfi('Owner', `<input type="text" data-spath="${i}.owner" value="${esc(s.owner)}">`)}
      ${cfi('Confidence %', inp('confidence',s.confidence))}
      ${cfi('Starts month', inp('startMonth',s.startMonth))}
      ${cfi('Full effect by month', inp('fullMonth',s.fullMonth))}
      ${cfi('Ramp', sel('ramp',[{v:'linear',l:'Linear'},{v:'s',l:'S-curve'}],s.ramp==='s'?'s':'linear'))}
      ${cfi('Cost per month', inp('cost',s.cost))}
    </div>
    <label class="toggle" style="margin:6px 0 2px;font-size:12.5px"><input type="checkbox" data-srefined="${i}" ${s.refined?'checked':''}> Refining complete — ready to scale</label>
    <label class="lbl">Levers — what this actually changes</label>
    ${(s.levers||[]).map((lv,j)=>`<div class="lever">
      <select data-spath="${i}.levers.${j}.driver">
        ${Object.keys(DRIVERS).map(k=>`<option value="${k}"${k===lv.driver?' selected':''}>${esc(DRIVERS[k].label)}</option>`).join('')}</select>
      <input type="number" step="any" data-spath="${i}.levers.${j}.value" value="${num(lv.value)}" style="width:74px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:5px 7px">
      <span class="lv">${DRIVERS[lv.driver]?esc(DRIVERS[lv.driver].fmt(num(lv.value))):''}</span>
      <button class="btn sm danger" data-dellever="${i}|${j}">×</button></div>`).join('')}
    <div class="btnrow" style="margin-top:11px"><button class="btn ghost sm" data-addlever="${i}">+ Add lever</button></div>
    <div class="tiny" style="margin-top:8px">${esc(strategyImpact(s))}</div>
  </div>`;
}
function strategyImpact(s){
  if(!s.levers||!s.levers.length) return 'No lever set — this changes nothing in the forecast.';
  const c=num(s.confidence)/100;
  return 'At '+n0(num(s.confidence))+'% confidence: '+s.levers.map(l=>DRIVERS[l.driver]?DRIVERS[l.driver].fmt(num(l.value)*c):'').filter(Boolean).join(' · ');
}
function renderStrategies(){
  const invalid = S.strategies.filter(s=>!s.levers||!s.levers.length).length;
  return head('04 · The work','Strategies',
    `Seven things, repeated in cycle. Each strategy carries a <strong>mindset shift</strong> — the member has to move through the shift in order to execute the strategy, and executing the strategy is what delivers the growth. This is not a to-do list: every strategy carries a <strong>lever</strong>, and the forecast is the sum of those levers. Change one and the five-year picture moves.`)
  + sech('The strategy stack', `${S.strategies.length} strategies · ${invalid} with no lever set`)
  + `<div class="btnrow" style="margin-top:0">
      <button class="btn accent" id="btnAddStrat">+ Add strategy</button>
      <button class="btn" id="btnStratLib">Add from the seven</button>
    </div>`
  + (S.strategies.length ? `<div class="cards" style="margin-top:20px">${S.strategies.map(stratCard).join('')}</div>`
     : `<div class="empty" style="margin-top:20px">No strategies yet. Add one — the forecast is flat until you do.</div>`)
  + `<div class="note">Refine before you scale. A member who scales an unrefined process adds revenue and loses freedom — which fails both of the outcomes in section 01.</div>`;
}

/* ─── 05 SCENARIOS ──────────────────────────────────────────────── */
function renderScenarios(){
  const P = {A:project('A'), B:project('B'), C:project('C')};
  const g = guardrails(P[S.active]);
  const cmp = (label,fmt,pick)=>`<tr><td>${esc(label)}</td>${['A','B','C'].map(k=>{
      const v=pick(P[k]); return `<td${k===S.active?' style="font-weight:700;color:var(--accent)"':''}>${(FMT[fmt]||n0)(v)}</td>`;
    }).join('')}</tr>`;

  return head('05 · The forecast','Scenarios',
    `Three plans, one baseline. Plan A is what you commit to in the room; B is what happens if it all lands; C is what happens if it does not. The switch at the top of the screen sets which one drives every tab below.`)

  + sech('Side by side', `Year 5 · ${S.strategies.length} strategies assigned across the three plans`)
  + `<div class="scrollx"><table class="t"><thead><tr><th>Year 5</th>
      ${['A','B','C'].map(k=>`<th${k===S.active?' style="color:var(--accent)"':''}>Plan ${k} · ${esc(S.scenarios[k].label)}</th>`).join('')}</tr></thead><tbody>
      ${cmp('Revenue','money0k',p=>p.years[5].rev)}
      ${cmp('Gross margin','pct',p=>p.years[5].gpPct)}
      ${cmp('EBITDA','money0k',p=>p.years[5].ebitda)}
      ${cmp('Net profit','money0k',p=>p.years[5].np)}
      ${cmp('Team size','n0',p=>p.years[5].cap.total)}
      ${cmp('Owner hours a week','n1',p=>p.years[5].ownerHours)}
      ${cmp('Business value','money0k',p=>p.years[5].value.equity)}
      ${cmp('Freedom score','n0',p=>p.years[5].freedom.score)}
      ${cmp('Cumulative cash','money0k',p=>p.years[5].cumCash)}
      ${cmp('Strategies assigned','n0',p=>strategiesFor(p.key).length)}
    </tbody></table></div>`
  + chartBox('Revenue by scenario','ch-scen',{type:'line',h:300,fmt:money0k,
      x:['Today','Y1','Y2','Y3','Y4','Y5'],
      series:[{name:'A',color:CH.accent,values:P.A.years.map(y=>y.rev)},
              {name:'B',color:CH.steel,dash:'6 4',values:P.B.years.map(y=>y.rev)},
              {name:'C',color:CH.muted,dash:'2 4',values:P.C.years.map(y=>y.rev)}]},
      'All three run off the same baseline. The distance between them is the value of the strategy stack, not of optimism.')

  + sech('Guardrails', `Plan ${S.active}`)
  + (g.length ? g.map(x=>`<div class="alert ${x.lvl==='bad'?'bad':''}"><div><b>${esc(x.t)}</b>${esc(x.m)}</div></div>`).join('')
     : `<div class="alert good"><div><b>Clear</b>Nothing in Plan ${S.active} trips a guardrail. Hiring rate, margin movement, cost per head and funding all sit inside their limits.</div></div>`)

  + sech('Assumptions behind each plan','Macro movement applies at the start of each year, before strategies')
  + `<div class="cards">${['A','B','C'].map(k=>{
      const sc=S.scenarios[k];
      return `<div class="card"><h3 class="ch">Plan ${k} · ${esc(sc.label)}</h3>
        <div class="f" style="padding:9px 0"><div class="flab"><div class="fl">EBITDA multiple</div><div class="fh">Sets the business value</div></div>
          <input type="number" step="0.1" data-path="scenarios.${k}.multiple" value="${num(sc.multiple)}" style="width:80px"></div>
        <table class="t" style="font-size:12.5px;margin-top:10px"><thead><tr><th>Year</th><th>Market</th><th>Price</th><th>Overhead</th></tr></thead><tbody>
        ${sc.macro.map((m,y)=>`<tr><td>Y${y+1}</td>
          <td><input type="number" step="0.5" data-path="scenarios.${k}.macro.${y}.market" data-kind="pct" value="${(num(m.market)*100).toFixed(1)}" style="width:62px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:3px 6px"></td>
          <td><input type="number" step="0.5" data-path="scenarios.${k}.macro.${y}.price" data-kind="pct" value="${(num(m.price)*100).toFixed(1)}" style="width:62px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:3px 6px"></td>
          <td><input type="number" step="0.5" data-path="scenarios.${k}.macro.${y}.ovh" data-kind="pct" value="${(num(m.ovh)*100).toFixed(1)}" style="width:62px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:3px 6px"></td></tr>`).join('')}
        </tbody></table>
        <div class="tiny" style="margin-top:9px">${strategiesFor(k).length} strategies assigned</div></div>`;
    }).join('')}</div>`;
}

/* ─── 06 FIVE YEAR ──────────────────────────────────────────────── */
function renderFiveYear(){
  const pr=project(S.active), Y=pr.years, X=['Today','Y1','Y2','Y3','Y4','Y5'];
  const y5=Y[5], y0=Y[0];
  const r=(label,fmt,pick,cls)=>`<tr class="${cls||''}"><td>${esc(label)}</td>${Y.map(y=>`<td>${(FMT[fmt]||n0)(pick(y))}</td>`).join('')}</tr>`;

  return head('06 · The horizon','Five-Year Rolling',
    `Plan ${S.active} across five years. As real years complete they replace forecast years and the window rolls forward.`)

  + `<div class="mgrid" style="margin-top:34px">
      ${metric('Revenue, year 5', y5.rev,'money0k', `from ${money0k(y0.rev)}`,'hero','f_rev')}
      ${metric('EBITDA, year 5', y5.ebitda,'money0k', `${pct(div(y5.ebitda,y5.rev),1)} of revenue`,'','f_eb')}
      ${metric('Business value', y5.value.equity,'money0k', `${n1(pr.scenario.multiple)}× EBITDA`,'accent','f_val')}
      ${metric('Owner hours', y5.ownerHours,'hrs', `from ${hrs(y0.ownerHours)} a week`,'','f_hrs')}
      ${metric('Team size', y5.cap.total,'n0', `from ${n0(y0.cap.total)} people`,'','f_team')}
      ${metric('Freedom score', y5.freedom.score,'n0', `from ${n0(y0.freedom.score)}`,'','f_fs')}
    </div>`

  + chartBox('The thesis — your hours down, the asset up','ch-dual',{type:'dual',h:330,x:X,
      left:{name:'Owner hours a week',fmt:v=>n0(v)+'h',values:Y.map(y=>y.ownerHours)},
      right:{name:'Business value',fmt:money0k,values:Y.map(y=>y.value.equity)}},
      'Two lines moving in opposite directions is the whole point of Boardroom. If they move together, the plan is buying revenue with your time.')

  + `<div class="chgrid">
      ${chartBox('Revenue, gross profit and EBITDA','ch-pnl',{type:'line',h:290,fmt:money0k,x:X,
        series:[{name:'Revenue',color:CH.ink,values:Y.map(y=>y.rev)},
                {name:'Gross profit',color:CH.steel,values:Y.map(y=>y.gp)},
                {name:'EBITDA',color:CH.accent,values:Y.map(y=>y.ebitda)}]})}
      ${chartBox('Team by role','ch-team',{type:'stack',h:290,fmt:n0,x:X,
        series:[{name:'On tools',color:CH.ink,values:Y.map(y=>y.cap.target)},
                {name:'Team leaders',color:CH.steel,values:Y.map(y=>y.cap.teamLeaders)},
                {name:'Ops managers',color:CH.accent,values:Y.map(y=>y.cap.opsManagers)},
                {name:'Estimators',color:'#8FA3AF',values:Y.map(y=>y.cap.estimators)},
                {name:'Office',color:CH.rule,values:Y.map(y=>y.cap.office)}]},
        'Headcount the revenue requires at your own benchmarks — not a number you type in. Today\'s column is what your current revenue needs, which may differ from who is actually on the payroll.')}
      ${chartBox('Freedom score','ch-free',{type:'line',h:290,fmt:n0,x:X,
        series:[{name:'Freedom',color:CH.accent,values:Y.map(y=>y.freedom.score)}]},
        'Weighted from your own baseline and your own year-5 targets. Owner hours are modelled; the rest interpolate.')}
      ${chartBox('Cash generated each year','ch-cash',{type:'bar',h:290,fmt:money0k,x:X.slice(1),
        series:[{name:'Cash after tax, capex and working capital',color:CH.steel,values:Y.slice(1).map(y=>y.cash)}]},
        'Profit is not cash. Growth absorbs working capital before it returns any.')}
    </div>`

  + sech('The numbers','Plan '+S.active)
  + `<div class="scrollx"><table class="t"><thead><tr><th></th>${X.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>
      <tr class="grp"><td colspan="7">Profit and loss</td></tr>
      ${r('Revenue','money0k',y=>y.rev)}
      ${r('Gross profit','money0k',y=>y.gp)}
      ${r('Gross margin','pct',y=>y.gpPct)}
      ${r('Fixed costs','money0k',y=>y.fixed)}
      ${r('Net profit','money0k',y=>y.np,'tot')}
      ${r('Normalised EBITDA','money0k',y=>y.ebitda)}
      <tr class="grp"><td colspan="7">The funnel, annual</td></tr>
      ${r('Leads','n0',y=>y.leads)}
      ${r('Quotes','n0',y=>y.quotes)}
      ${r('Jobs','n0',y=>y.jobs)}
      ${r('Average job value','money',y=>y.ajv)}
      <tr class="grp"><td colspan="7">People</td></tr>
      ${r('On tools','n0',y=>y.cap.target)}
      ${r('Team leaders','n0',y=>y.cap.teamLeaders)}
      ${r('Ops managers','n0',y=>y.cap.opsManagers)}
      ${r('Estimators','n0',y=>y.cap.estimators)}
      ${r('Office / admin','n0',y=>y.cap.office)}
      ${r('Total team','n0',y=>y.cap.total,'tot')}
      <tr class="grp"><td colspan="7">Cash</td></tr>
      ${r('Working capital movement','money0k',y=>y.dwc)}
      ${r('Tax','money0k',y=>y.tax)}
      ${r('Capex','money0k',y=>y.capex)}
      ${r('Cash generated','money0k',y=>y.cash)}
      ${r('Cumulative cash','money0k',y=>y.cumCash,'tot')}
      <tr class="grp"><td colspan="7">The two outcomes</td></tr>
      ${r('Owner hours a week','n1',y=>y.ownerHours)}
      ${r('Freedom score','n0',y=>y.freedom.score)}
      ${r('Business value','money0k',y=>y.value.equity,'tot')}
    </tbody></table></div>`;
}

/* ─── 08 ONE YEAR ───────────────────────────────────────────────── */
/* Seasonality is stored as an INDEX per month: 1.00 = an average month.
   Twelve indexes always average 1.00. Presets are calendar-order and are
   rotated to the member's baseline start month. */
const SEASON_PRESETS = {
  flat:   Array.from({length:12},()=>1),
  summer: [1.20,1.14,1.08,0.96,0.90,0.78,0.78,0.84,0.96,1.02,1.14,1.20],  // NZ: busy Nov–Mar
  winter: [0.84,0.90,0.96,1.02,1.14,1.20,1.20,1.14,1.02,0.96,0.84,0.78]   // busy Jun–Aug
};
function rotateToStart(cal){
  const st=num(S.meta.startMonth)%12;
  return Array.from({length:12},(_,i)=>cal[(st+i)%12]);
}
function renderOneYear(){
  const pr=project(S.active), R=pr.rows.filter(r=>r.y===1);
  const B=budget(), F=B.total;
  const seas=S.oneYear.seasonality.map(num);
  const meanIx=seas.length?sum(seas)/12:1, ok=Math.abs(meanIx-1)<0.005;
  const A=S.oneYear.actuals;
  const idx=i=>seasonIndex(i);
  const budgetRev=i=>(F.revenue||0)*idx(i);
  const maxIx=Math.max(...seas.map((_,i)=>seasonIndex(i)),0.0001);
  const mrow=(label,fmt,pick)=>`<tr><td>${esc(label)}</td>${R.map(r=>`<td>${(FMT[fmt]||n0)(pick(r))}</td>`).join('')}<td class="tot">${(FMT[fmt]||n0)(sum(R.map(pick)))}</td></tr>`;

  return head('08 · The year in front of you','One Year',
    `Year 1 broken to twelve months. Three lines run side by side all year: the <strong>budget</strong> you set on the Budget &amp; Workforce tab, the <strong>forecast</strong> from Plan ${S.active}, and the <strong>actuals</strong> you enter each month. This is the tab you bring to the room every cycle.`)

  + sech('Seasonality — how busy each month is',
      ok?`<span class="pill good">Averages 1.00× — balanced</span>`
        :`<span class="pill warn">Averages ${meanIx.toFixed(2)}×</span> <button class="btn sm" id="btnSeasNorm">Rebalance to 1.00×</button>`)
  + `<div class="explain">
      <b>What this is.</b> One number per month saying how busy it is compared with an average month.<br>
      <b>How to read it.</b> <b>1.00×</b> is an average month. <b>1.20×</b> means that month runs 20% busier than average; <b>0.80×</b> means 20% quieter. Across the twelve months they always average out to 1.00×.<br>
      <b>The easiest way to set it.</b> Press <b>Take the shape from my baseline</b> — it reads the twelve months you already entered and works the shape out for you.<br>
      <b>Why it matters.</b> A business that does 40% of its year in three months needs different cash, different hiring and different marketing timing than one that runs flat. Every monthly number on this page is shaped by these twelve.
    </div>`
  + `<div class="btnrow" style="margin-top:0">
      <button class="btn accent" data-seaspreset="baseline">Take the shape from my baseline</button>
      <button class="btn" data-seaspreset="flat">Flat year</button>
      <button class="btn" data-seaspreset="summer">Busy summer</button>
      <button class="btn" data-seaspreset="winter">Busy winter</button>
    </div>`
  + `<div class="scrollx"><table class="t"><thead><tr><th>Month</th><th>How busy</th>
      <th style="text-align:left">Compared with an average month</th><th>Share of the year</th><th>Budget revenue</th><th>Forecast revenue</th></tr></thead><tbody>
      ${seas.map((w,i)=>{
        const ix=idx(i), busy = ix>=1.08?'Busy':(ix<=0.92?'Quiet':'Average');
        return `<tr><td>${esc(monthName(i))}</td>
          <td style="width:118px"><div class="seasin"><input type="number" step="0.01" min="0" data-seas="${i}" value="${num(w).toFixed(2)}"><span>×</span></div></td>
          <td><div class="seasrow"><div class="seasbar"><i style="width:${clamp(0,100,(ix/maxIx)*100)}%"></i><u style="left:${clamp(0,100,(1/maxIx)*100)}%"></u></div>
            <span class="pill ${busy==='Busy'?'accent':busy==='Quiet'?'neutral':'good'}" style="min-width:62px;text-align:center">${busy}</span></div></td>
          <td>${pct(ix/12)}</td>
          <td>${money0k(budgetRev(i))}</td>
          <td>${money0k(R[i]?R[i].rev:null)}</td></tr>`;
      }).join('')}
      <tr class="tot"><td>The year</td><td>${meanIx.toFixed(2)}× average</td><td></td><td>100.0%</td>
        <td>${money0k((F.revenue||0)*12)}</td><td>${money0k(sum(R.map(r=>r.rev)))}</td></tr>
    </tbody></table></div>
    <div class="cap">The dark tick on each bar marks an average month. <b>Budget revenue</b> is the monthly run rate from your department budgets, shaped by these twelve numbers. <b>Forecast revenue</b> is Plan ${esc(S.active)} for the same month — it grows through the year because the strategy stack ramps.</div>`

  + sech('Budget, forecast and actual','The three lines the room looks at')
  + `<div class="scrollx"><table class="t grid"><thead><tr><th></th>${R.map((r,i)=>`<th>${esc(monthName(i))}</th>`).join('')}<th class="tot">Year</th></tr></thead><tbody>
      <tr class="grp"><td colspan="14">Revenue</td></tr>
      <tr class="der"><td>Budget</td>${seas.map((_,i)=>`<td>${money0k(budgetRev(i))}</td>`).join('')}<td class="tot">${money0k((F.revenue||0)*12)}</td></tr>
      <tr class="der"><td>Forecast — Plan ${esc(S.active)}</td>${R.map(r=>`<td>${money0k(r.rev)}</td>`).join('')}<td class="tot">${money0k(sum(R.map(r=>r.rev)))}</td></tr>
      <tr><td>Actual</td>${A.map((x,i)=>`<td><input type="number" step="any" data-act="${i}|rev" value="${x.rev==null?'':x.rev}"></td>`).join('')}<td class="tot">${A.some(x=>x.rev!=null)?money0k(sum(A.map(x=>num(x.rev)))):'—'}</td></tr>
      <tr class="der"><td>Actual vs budget</td>${A.map((x,i)=>{const v=x.rev==null?null:num(x.rev)-budgetRev(i); return `<td class="${v==null?'':v>=0?'up':'down'}">${v==null?'—':signed(v,money0k)}</td>`;}).join('')}<td class="tot"></td></tr>
      <tr class="grp"><td colspan="14">Net profit</td></tr>
      <tr class="der"><td>Budget</td>${seas.map((_,i)=>`<td>${money0k((F.netProfit||0)*idx(i))}</td>`).join('')}<td class="tot">${money0k((F.netProfit||0)*12)}</td></tr>
      <tr class="der"><td>Forecast — Plan ${esc(S.active)}</td>${R.map(r=>`<td>${money0k(r.np)}</td>`).join('')}<td class="tot">${money0k(sum(R.map(r=>r.np)))}</td></tr>
      <tr><td>Actual</td>${A.map((x,i)=>`<td><input type="number" step="any" data-act="${i}|np" value="${x.np==null?'':x.np}"></td>`).join('')}<td class="tot">${A.some(x=>x.np!=null)?money0k(sum(A.map(x=>num(x.np)))):'—'}</td></tr>
      <tr class="der"><td>Actual vs budget</td>${A.map((x,i)=>{const v=x.np==null?null:num(x.np)-(F.netProfit||0)*idx(i); return `<td class="${v==null?'':v>=0?'up':'down'}">${v==null?'—':signed(v,money0k)}</td>`;}).join('')}<td class="tot"></td></tr>
    </tbody></table></div>
    <div class="cap">Budget is a flat monthly run rate shaped by seasonality — it does not grow through the year. Forecast does, because the strategy stack ramps. Where the two diverge is the work the strategies are doing.</div>`

  + chartBox('Budget, forecast and actual revenue','ch-oy',{type:'line',h:300,fmt:money0k,
      x:Array.from({length:12},(_,i)=>monthName(i).split(' ')[0]),
      series:[{name:'Budget',color:CH.steel,dash:'5 4',values:seas.map((_,i)=>budgetRev(i))},
              {name:'Forecast',color:CH.accent,values:R.map(r=>r.rev)},
              {name:'Actual',color:CH.ink,values:A.map(x=>x.rev==null?null:num(x.rev))}]},
      'Actual only draws for the months you have entered.')

  + sech('The monthly plan','Every driver, Plan '+S.active)
  + `<div class="scrollx"><table class="t grid"><thead><tr><th></th>${R.map((r,i)=>`<th>${esc(monthName(i))}</th>`).join('')}<th class="tot">Year</th></tr></thead><tbody>
      ${mrow('Leads','n0',r=>r.leads)}
      ${mrow('Quotes','n0',r=>r.quotes)}
      ${mrow('Jobs','n0',r=>r.jobs)}
      ${mrow('Gross profit','money0k',r=>r.gp)}
      ${mrow('Fixed costs','money0k',r=>r.fixed)}
    </tbody></table></div>`

  + sech('Ninety-day rocks','Three to five commitments a quarter. This is what the room holds you to.')
  + `<div class="cards">${[0,1,2,3].map(q=>`<div class="card">
      <h3 class="ch">Quarter ${q+1}</h3>
      <div class="tiny" style="margin-bottom:8px">${esc(monthName(q*3))} – ${esc(monthName(q*3+2))}</div>
      ${(S.oneYear.rocks[q]||[]).map((rk,j)=>`<div class="lever">
        <input type="text" data-rock="${q}|${j}|text" value="${esc(rk.text)}" placeholder="The commitment" style="flex:1 1 100%;border:1px solid var(--rule);border-radius:5px;padding:5px 8px;font-size:12.5px;text-align:left">
        <input type="text" data-rock="${q}|${j}|owner" value="${esc(rk.owner)}" placeholder="Who" style="width:96px;border:1px solid var(--rule);border-radius:5px;padding:5px 8px;font-size:12px;text-align:left">
        <button class="btn sm danger" data-delrock="${q}|${j}" style="margin-left:auto">×</button></div>`).join('')}
      ${(S.oneYear.rocks[q]||[]).length>=5?'<div class="tiny" style="margin-top:8px">Five is the limit. More than five is a wish list.</div>':`<div class="btnrow" style="margin-top:10px"><button class="btn ghost sm" data-addrock="${q}">+ Add commitment</button></div>`}
    </div>`).join('')}</div>`;
}

/* ─── 08 CONSOLIDATED ───────────────────────────────────────────── */
function renderConsolidated(){
  const pr=project(S.active), Y=pr.years, b=pr.b, y0=Y[0], y5=Y[5];
  const top=S.strategies.filter(s=>(s.scenarios||[]).includes(S.active))
    .map(s=>({s, w:sum((s.levers||[]).map(l=>Math.abs(num(l.value))))*(num(s.confidence)/100)}))
    .sort((a,c)=>c.w-a.w).slice(0,5);

  return head('08 · The one-pager','Consolidated',
    `Everything above, on one page, ready to print and put on the table.`)
  + `<div class="stmt" style="margin-top:26px">${S.vision.statement?esc(S.vision.statement):`<span class="muted">Write the vision statement on tab 01 and it appears here.</span>`}</div>`

  + sech('Where you are, where you are going',`Plan ${S.active} · ${esc(S.scenarios[S.active].label)}`)
  + `<div class="mgrid">
      ${metric('Revenue',y0.rev,'money0k','Today','','k_r0')}
      ${metric('Revenue',y5.rev,'money0k','Year 5','hero','k_r5')}
      ${metric('Net profit',y0.np,'money0k','Today','','k_p0')}
      ${metric('Net profit',y5.np,'money0k','Year 5','hero','k_p5')}
    </div>
    <div class="mgrid" style="margin-top:1px">
      ${metric('Owner hours a week',y0.ownerHours,'hrs','Today','','k_h0')}
      ${metric('Owner hours a week',y5.ownerHours,'hrs','Year 5','accent','k_h5')}
      ${metric('Business value',y0.value.equity,'money0k','Today','','k_v0')}
      ${metric('Business value',y5.value.equity,'money0k','Year 5','accent','k_v5')}
    </div>`

  + sech('Every year, consolidated','Completed years replace forecast years as they land')
  + `<div class="scrollx"><table class="t"><thead><tr><th></th>${Y.map(y=>`<th>${esc(y.label)}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Revenue</td>${Y.map(y=>`<td>${money0k(y.rev)}</td>`).join('')}</tr>
      <tr><td>Gross margin</td>${Y.map(y=>`<td>${pct(y.gpPct)}</td>`).join('')}</tr>
      <tr><td>Net profit</td>${Y.map(y=>`<td>${money0k(y.np)}</td>`).join('')}</tr>
      <tr><td>EBITDA</td>${Y.map(y=>`<td>${money0k(y.ebitda)}</td>`).join('')}</tr>
      <tr><td>Team</td>${Y.map(y=>`<td>${n0(y.cap.total)}</td>`).join('')}</tr>
      <tr><td>Owner hours a week</td>${Y.map(y=>`<td>${n1(y.ownerHours)}</td>`).join('')}</tr>
      <tr><td>Freedom score</td>${Y.map(y=>`<td>${n0(y.freedom.score)}</td>`).join('')}</tr>
      <tr class="tot"><td>Business value</td>${Y.map(y=>`<td>${money0k(y.value.equity)}</td>`).join('')}</tr>
    </tbody></table></div>`

  + (S.divisionsOn ? sech('By division','Assumptions are weighted, never summed')
    + `<div class="scrollx"><table class="t"><thead><tr><th>Division</th><th>Revenue</th><th>Gross profit</th><th>GP %</th><th>Net profit</th><th>Share of revenue</th></tr></thead><tbody>
      ${b.norms.map(nz=>`<tr><td>${esc(nz.name)}</td><td>${money0k(nz.revenue)}</td><td>${money0k(nz.gp)}</td><td>${pct(nz.gpPct)}</td><td>${money0k(nz.netProfit)}</td><td>${pct(div(nz.revenue,b.revenue))}</td></tr>`).join('')}
      <tr class="tot"><td>Whole of business</td><td>${money0k(b.revenue)}</td><td>${money0k(b.gp)}</td><td>${pct(b.gpPct)}</td><td>${money0k(b.netProfit)}</td><td>100.0%</td></tr>
    </tbody></table></div>
    <div class="cap">Revenue per on-tools member consolidates to ${money(b.a.revPerHead)} — ${esc(b.a.weightBasis)}. Spans of control and pricing assumptions are weighted the same way and are never added together.</div>` : '')

  + sech('The five strategies doing the most work','Ranked by modelled impact')
  + (top.length ? `<div class="scrollx"><table class="t"><thead><tr><th>Strategy</th><th>Domain</th><th>Serves</th><th>Stage</th><th>Owner</th><th>Levers</th></tr></thead><tbody>
      ${top.map(x=>`<tr><td>${esc(x.s.name||'Untitled')}</td><td>${esc(x.s.domain)}</td><td>${esc(x.s.outcome)}</td><td>${esc(x.s.stage)}</td><td>${esc(x.s.owner||'—')}</td>
        <td style="text-align:left">${(x.s.levers||[]).map(l=>DRIVERS[l.driver]?esc(DRIVERS[l.driver].fmt(num(l.value))):'').filter(Boolean).join(' · ')||'—'}</td></tr>`).join('')}
    </tbody></table></div>` : `<div class="empty">No strategies assigned to Plan ${S.active}.</div>`)

  + sech('Signed off','')
  + `<div class="two"><div><div class="sub">Member</div><h3>${esc(S.meta.owner||'—')}</h3><div class="tiny" style="margin-top:30px;border-top:1px solid var(--rule);padding-top:8px">Signature · Date</div></div>
      <div><div class="sub">Coach</div><h3>&nbsp;</h3><div class="tiny" style="margin-top:30px;border-top:1px solid var(--rule);padding-top:8px">Signature · Date</div></div></div>`;
}

/* ─── 09 ORG CHART ──────────────────────────────────────────────── */
function renderOrg(){
  const pr=project(S.active);
  const o=orgAt(pr, UI.orgYear);
  const o0=orgAt(pr,0), o5=orgAt(pr,5);
  const yr=pr.years.find(x=>x.y===UI.orgYear)||pr.years[0];
  const reconFixed = yr.fixed!=null ? o.costFixed - yr.fixed : null;
  const reconCos   = yr.cos!=null ? o.costCos - yr.cos : null;

  return head('09 · The team that gets you out','Org Chart',
    `Generated from the capacity engine, not drawn by hand. Roles appear as spans of control are exceeded. The copper boxes are the roles <strong>you</strong> still occupy — watching them clear between today and year five is the Owner-Operator to CEO shift, made literal.`)

  + `<div class="btnrow" style="margin-top:26px">
      ${[0,1,3,5].map(y=>`<button class="btn ${UI.orgYear===y?'accent':''}" data-orgyear="${y}">${y===0?'Today':'Year '+y}</button>`).join('')}
    </div>`

  + `<div class="mgrid" style="margin-top:20px">
      ${metric('Roles you occupy', o.ownerCount,'n0', UI.orgYear===0?`${o5.ownerCount} in year 5`:`${o0.ownerCount} today`, o.ownerCount?'accent':'', 'o_own')}
      ${metric('Total team', o.cap.total,'n0','People','','o_tot')}
      ${metric('People cost', o.peopleCost,'money0k',`${money0k(o.costCos)} in cost of sales · ${money0k(o.costFixed)} in fixed costs`,'','o_cost')}
      ${metric('Hires from today', Math.max(0,(o.cap.target||0)-(o0.cap.target||0)),'n0','On tools','','o_hire')}
    </div>`

  + `<div class="org">${o.rows.filter(r=>r.boxes.length).map((r,i)=>`
      ${i?'<div class="orgstem"></div>':''}
      <div class="orgrow">${r.boxes.map(b=>`<div class="obox ${b.owner?'owner':''} ${b.name==='Vacant'?'vacant':''}">
        ${b.owner?'<span class="tag">You are doing this</span>':''}
        <div class="or">${esc(b.role)}</div><div class="on">${esc(b.name)}</div><div class="oc">${money0k(b.cost)}</div>
      </div>`).join('')}</div>`).join('')}</div>`

  + (reconFixed!=null ? `<div class="alert ${reconFixed>0?'bad':'good'}"><div><b>Reconciliation — office and leadership</b>${money0k(o.costFixed)} of salaries sit in fixed costs (you, ops managers, estimators, office) against a forecast fixed cost line of ${money0k(yr.fixed)} — leaving ${money0k(yr.fixed-o.costFixed)} for rent, vehicles, insurance, software and everything else. ${reconFixed>0?'The wage bill alone exceeds the forecast fixed costs. Either the roles are too expensive or the forecast is too thin.':'That headroom looks workable — check it against your actual overheads.'}</div></div>`:'')
  + (reconCos!=null ? `<div class="alert ${reconCos>yr.cos?'bad':'good'}"><div><b>Reconciliation — on tools</b>${money0k(o.costCos)} of on-tools and team-leader wages against forecast cost of sales of ${money0k(yr.cos)}. Cost of sales also carries materials and subcontractors, so labour should be well under it — here it is ${pct(div(o.costCos,yr.cos),0)} of the line.</div></div>`:'')

  + sech('The roles you hold','Set a handover year and the org chart clears the box')
  + `<div class="scrollx"><table class="t"><thead><tr><th>Role</th><th>You do this today</th><th>Handed over in year</th><th>Status in year 5</th></tr></thead><tbody>
      ${S.ownerRoles.map((r,i)=>`<tr><td>${esc(r.role)}</td>
        <td><label class="toggle" style="justify-content:flex-end"><input type="checkbox" data-orole="${i}|on" ${r.on?'checked':''}></label></td>
        <td><input type="number" min="0" max="5" data-orole="${i}|handover" value="${num(r.handover)}" style="width:64px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:4px 8px"></td>
        <td>${!r.on?'<span class="pill neutral">Not you</span>':(num(r.handover)>0&&num(r.handover)<=5?`<span class="pill good">Handed over Y${num(r.handover)}</span>`:'<span class="pill bad">Still yours</span>')}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="cap">Zero means no handover is planned. Any role still yours in a year where the plan has your hours falling will raise a contradiction on the Scenarios tab.</div>`;
}

/* ─── ✱ SETTINGS ────────────────────────────────────────────────── */
function renderSettings(){
  return head('✱ · Setup','Setup',
    `The money settings, the wellness baseline and the checks. Capacity benchmarks — revenue per head, spans of control, pricing rates — live with each department on the <strong>Budget &amp; Workforce</strong> tab, because they differ department by department.`)

  + sech('The business','')
  + `<div class="fgrid"><div>
      <div class="f"><div class="flab"><div class="fl">Company</div></div><input type="text" data-path="meta.company" data-kind="str" value="${esc(S.meta.company)}" style="text-align:left"></div>
      <div class="f"><div class="flab"><div class="fl">Owner</div></div><input type="text" data-path="meta.owner" data-kind="str" value="${esc(S.meta.owner)}" style="text-align:left"></div>
      ${selectField('Currency','meta.currency',['NZD','AUD','GBP','USD'])}
    </div><div>
      <div class="f"><div class="flab"><div class="fl">Baseline starts</div><div class="fh">The twelve month columns run from here.</div></div>
        <select data-path="meta.startMonth" data-kind="num">${MONTHS.map((m,i)=>`<option value="${i}"${i===num(S.meta.startMonth)?' selected':''}>${m}</option>`).join('')}</select></div>
      ${field('Baseline start year','meta.startYear',{step:1})}
      <label class="toggle" style="margin-top:16px"><input type="checkbox" id="togDivisions" ${S.divisionsOn?'checked':''}> Run divisions</label>
      <div class="fh" style="margin-top:6px">Off by default — one P&L and one funnel. Turn it on if you run separate divisions. Nothing is lost when you turn it back off.</div>
    </div></div>`

  + sech('Money and cash','Defaults are typical for a trade business — check them against your own numbers')
  + `<div class="fgrid"><div>
      ${field('Debtor days','fin.debtorDays',{help:'How long customers take to pay'})}
      ${field('Work-in-progress days','fin.wipDays',{help:'Work done but not yet invoiced'})}
      ${field('Creditor days','fin.creditorDays',{help:'How long you take to pay suppliers'})}
      ${field('Capex as % of revenue','fin.capexPct',{kind:'pct',step:'0.1',help:'Vehicles, tools, plant'})}
      ${field('Company tax rate %','fin.taxRate',{kind:'pct',step:'0.5'})}
      ${field('Debt repayments a year','fin.debtRepay')}
    </div><div>
      ${field('Your salary inside fixed costs','fin.ownerSalary',{help:'Annual. Added back for EBITDA.'})}
      ${field('Market rate to replace you','fin.marketSalary',{help:'Annual. What a manager doing your job would cost. Deducted for EBITDA.'})}
      ${field('One-off addbacks','fin.addbacks',{help:'Annual. Personal or non-recurring costs run through the business.'})}
      ${field('Surplus cash','fin.surplusCash',{help:'Added to enterprise value'})}
      ${field('Debt','fin.debt',{help:'Deducted from enterprise value'})}
      ${field('Drawings above your salary','fin.drawingsAbove',{help:'Annual'})}
      ${field('Maximum on-tools hires a quarter','fin.maxHiresPerQuarter',{help:'Trips a guardrail when a plan exceeds it'})}
    </div></div>`

  + sech('Role costs','Annual package per role — drives the org chart and its reconciliation')
  + `<div class="fgrid"><div>
      ${field('On-tools team member','fin.roleCost.onTools',{help:'Sits in cost of sales'})}
      ${field('Team leader','fin.roleCost.teamLeader',{help:'Sits in cost of sales'})}
      ${field('Operations manager','fin.roleCost.opsManager',{help:'Sits in fixed costs'})}
    </div><div>
      ${field('Estimator','fin.roleCost.estimator',{help:'Sits in fixed costs'})}
      ${field('Office / admin','fin.roleCost.office',{help:'Sits in fixed costs'})}
    </div></div>`

  + sech('Wellness — baseline and year 5 target','The Freedom Score is scored against these, not against anyone else')
  + `<div class="scrollx"><table class="t"><thead><tr><th>Measure</th><th>Today</th><th>Year 5 target</th><th>Weight</th></tr></thead><tbody>
      ${[['hours','Owner hours a week',true],['onBiz','Hours ON the business, %'],['weeksWithout','Weeks it runs without you'],
         ['holidays','Weeks of holiday taken'],['weekends','Weekends worked a month',true],['evenings','Evenings home a week'],
         ['income','Personal income drawn, annual'],['outside','Income from outside the business'],
         ['exercise','Exercise sessions a week'],['sleep','Hours of sleep a night']].map(([k,l,lower])=>{
        const c=FREEDOM_COMPONENTS.find(x=>x.k===k);
        return `<tr><td>${esc(l)}${lower?' <span class="tiny">(lower is better)</span>':''}</td>
          <td><input type="number" step="any" data-path="wellness.base.${k}" value="${num(S.wellness.base[k])}" style="width:96px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:5px 8px"></td>
          <td><input type="number" step="any" data-path="wellness.targ.${k}" value="${num(S.wellness.targ[k])}" style="width:96px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:5px 8px"></td>
          <td>${c?pct(c.w,0):'<span class="muted">—</span>'}</td></tr>`;
      }).join('')}
    </tbody></table></div>
    <div class="cap">Only the seven weighted measures feed the Freedom Score. Exercise and sleep are tracked because they matter, not because they are scored.</div>`

  + sech('This build','')
  + `<div class="mgrid">
      ${metric('Version','','n0','Boardroom Growth Plan v2.1 — Budget &amp; Workforce, per-department budgets, busy-ness seasonality')}
      ${metric('Self-tests',51,'n0','Golden cases with hand-calculated answers')}
      ${metric('Tabs',10,'n0','Plus this setup page')}
    </div>`

  + sech('Checks','')
  + `<div class="btnrow"><button class="btn" id="btnSelfTest">Run the self-test</button>
      <button class="btn" id="btnExportCsv">Export the model to CSV</button>
      <button class="btn danger" id="btnReset">Reset everything</button></div>
    <div id="selftestout"></div>`;
}
function divIdx(){ return S.divisions.findIndex(d=>d.id===UI.div); }
