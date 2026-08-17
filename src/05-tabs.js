/* ═══ §TABS ══════════════════════════════════════════════════════ */
const UI = {tab:'vision', div:'WOB', orgYear:0, editing:null, renaming:null};

function head(eyebrow, title, lead){
  return `<div class="pagehead"><div class="eyebrow">${esc(eyebrow)}</div>
    <h1 class="big">${esc(title)}</h1>${lead?`<p class="lead">${lead}</p>`:''}</div>`;
}
function sech(title, hint, no){
  return `<div class="sechead"><h2 class="sec">${no?`<span class="secno">${esc(no)}</span>`:''}${esc(title)}</h2>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}

/* ─── 01 VISION ─────────────────────────────────────────────────── */

/* Present tense, associated, sensory. The member is asked to stand in the
   five-year day and describe it, not to forecast towards it. */
const VISION_PROMPTS = [
  ['Step into it','It is <b>DATE</b>. You walk through the door on a Monday morning. What do you see happening without you?'],
  ['The handover','Who is running the part of the day you run today? Say their name out loud, or the name of the role you will hire.'],
  ['The Wednesday test','It is a Wednesday afternoon and you are not at work. Where are you, and who is with you?'],
  ['Overheard','Your team are talking about you and you are not in the room. What are they saying?'],
  ['The number','The valuation lands in your inbox. What does it say — and what is the first thing you feel when you read it?'],
  ['What you stopped','What are you no longer doing that you still do every single week today?'],
  ['The one you never let yourself plan','What have you done in these five years that you would never have let yourself plan for?']
];
const ROLE_OPTIONS = ['CEO','Leader','Investor','CEO · Leader · Investor'];

function renderVision(){
  const pr = project(), y5 = pr.years[5], y0 = pr.years[0];
  const VF = visionFigures(pr);
  const {createdDerived, created, dh, perHour, scoreToday, scoreY5} = VF;
  const scoreOr0 = v => v;
  const D = fiveYearDate();

  return head('01 · The Intent','Vision',
    `Boardroom takes an owner who works <em>in</em> their business and turns them into a CEO who owns an <em>asset</em>. Two outcomes come out of that, and they are the only two we are chasing: <strong>freedom — time and money</strong>, and <strong>an asset that is sellable or a legacy</strong>. Everything in this plan has to serve one of them.`)

  + sech('The statement', esc(D))
  + `<div class="prompts">
      <h4>Answer these out loud before you write anything</h4>
      <div class="pl">Answer them in the present tense, as if you are standing in that day already. Not "I want to" — "I am". The words you use here are the ones you will hear yourself repeat in the room.</div>
      <ol>${VISION_PROMPTS.map(([t,q])=>`<li><b>${esc(t)}.</b> ${q.replace('<b>DATE</b>','<b>'+esc(D)+'</b>')}</li>`).join('')}</ol>
    </div>
    <textarea class="full" data-path="vision.statement" data-kind="str" style="min-height:150px" placeholder="It is ${esc(D)}. My business is… I am… My week looks like…">${esc(S.vision.statement)}</textarea>
    <div class="cap">This prints on the Consolidated one-pager and on every export. Write it once, read it every cycle.</div>`

  + sech('Five years from today', esc(D))
  + `<div class="two">
      <div>
        <div class="sub">The Business</div><h3>What it becomes</h3>
        ${field('Revenue','vision.biz.revenue',{kind:'numn',money:true,help:'Annual, excluding GST'})}
        ${field('Net profit','vision.biz.profit',{kind:'numn',money:true,help:'Annual, after your salary'})}
        ${field('Business value','vision.biz.value',{kind:'numn',money:true,help:'What it is worth to a buyer'})}
        ${field('Team size','vision.biz.team',{kind:'numn',help:'Total people, including you'})}
        <label class="lbl">Your role</label>
        <div class="roles">
          <button class="rolechip gone" disabled title="Not an option in five years">Owner-Operator</button>
          <span class="rolearrow">→</span>
          ${ROLE_OPTIONS.map(r=>`<button class="rolechip ${S.vision.biz.role===r?'on':''}" data-role="${esc(r)}">${esc(r)}</button>`).join('')}
        </div>
        <div class="tiny" style="margin-top:9px">Owner-Operator is on the board and crossed out on purpose. It is where you are, not somewhere you can choose to still be.</div>
      </div>
      <div>
        <div class="sub">The Life</div><h3>What it funds</h3>
        ${field('Hours worked per week','vision.life.hours',{kind:'numn'})}
        ${field('Weeks of holiday a year','vision.life.holidays',{kind:'numn'})}
        ${field('Weekends worked a month','vision.life.weekends',{kind:'numn'})}
        ${field('Evenings home for dinner','vision.life.evenings',{kind:'numn',help:'Out of seven'})}
        ${field('Adventures completed','vision.life.adventures',{kind:'numn',help:'The trips, the events, the things that get ticked off — how many over the five years'})}
        ${field('Investments outside the business','vision.life.investments',{kind:'numn',money:true,help:'Property, shares, other businesses — what the money has built by then'})}
        ${field('Personal income drawn','vision.life.income',{kind:'numn',money:true,help:'Salary plus drawings, annual'})}
        <label class="lbl">What the money is for</label>
        <input type="text" class="full" data-path="vision.life.whatFor" data-kind="str" value="${esc(S.vision.life.whatFor)}" placeholder="The boat. The kids' school. Buying the building.">
      </div>
    </div>`

  + sech('Outcome one — Freedom', 'Time and money you can actually use')
  + `<div class="explain">
      <b>Time <u>to</u> the business.</b> The hours it takes from you each week — on the tools, on the phone, quoting at the kitchen table at nine at night. Count all of it, not the hours you are supposed to work.<br>
      <b>Time <u>outside</u> the business.</b> The hours that are actually yours. Not the hours you are at home answering the phone.<br>
      <b>Now score it.</b> Out of 100, how free are you today? <b>0</b> means the business owns every hour. <b>100</b> means you choose every hour. Score it honestly, not the way you would answer it in front of the room.
    </div>
    <div class="mgrid">
      ${metricIn('Freedom score today','vision.freedom.today', scoreToday,'n0','Out of 100 — be honest','','/ 100')}
      ${metricIn('Freedom score, year 5','vision.freedom.y5', scoreY5,'n0','Where you are heading','hero','/ 100')}
      ${metricIn('Hours a week in the business, today','vision.freedom.hoursToday', y0.ownerHours,'n1','Everything the business takes','','hrs')}
      ${metricIn('Hours a week in the business, year 5','vision.freedom.hoursY5', y5.ownerHours,'n1', dh!=null?`${n1(dh)} hours a week bought back`:'','accent','hrs')}
    </div>
    <div class="cap">Leave a box empty and it uses the figure the model works out from your baseline and your strategies. Type into it and your number wins.</div>`

  + sech('Outcome two — An asset', 'A value that exists without you')
  + `<div class="mgrid">
      ${metricIn('Business value today','vision.asset.valueToday', y0.value.equity,'money0k',`Derived from your numbers at ${n1(pr.plan.multiple)}× EBITDA`,'')}
      ${metricIn('Business value, year 5','vision.asset.valueY5', y5.value.equity,'money0k','What the plan produces','hero')}
      ${metricIn('Value created','vision.asset.valueCreated', createdDerived,'money0k','Over five years','accent')}
      ${metric('Value per hour bought back', perHour,'money','Value created ÷ the annual hours you release','','vph')}
    </div>
    <div class="cap">The multiple is an assumption you set, not a valuation. A real valuation needs an adviser.</div>`

  + `<div class="note">Every strategy in this plan has to serve one of these two outcomes. If it does not grow the asset or buy back freedom, it does not belong in the programme.</div>`;
}
/* The Thrive Index, read back on the Horizon page. Scored on Vision;
   here it sits beside the money so the two are never separated. */
function thriveReflection(){
  const X=thriveScores(), T=S.thrive;
  const lvls=['Surviving','Stable','Comfortable','Thriving','Optimal'];
  if(!X.counted && !X.capCounted && X.energising==null)
    return sech('Your Thrive Index','Not scored yet')
      + `<div class="empty">Nothing scored yet. Go to <b>Vision → The Thrive Index</b> and click the bars — it takes about two minutes, and it is the half of the plan that explains why the other half matters.</div>`;

  return sech('Your Thrive Index', X.level?`${esc(X.level)} today${X.levelD?` · heading for ${esc(X.levelD)}`:''}`:'Scored on the Vision page')
  + `<div class="mgrid">
      ${metric('Thrive Index today', X.tis,'n1', X.level||'','', 'tr_now')}
      ${metric('Thrive Index wanted', X.tisD,'n1', X.levelD||'','hero', 'tr_want')}
      ${metric('Capability', X.capTotal,'n0', X.capBand?`${esc(X.capBand)} · out of ${X.capMax}`:'Not scored','', 'tr_cap')}
      ${metric('Week that energises you', X.energising,'n0', X.energising!=null?`Target ${n0(X.targetEnergising)}% · ${n0(X.draining)}% drains you`:'Not scored','accent','tr_en')}
    </div>
    <div class="lvlbar">${lvls.map(l=>`<div class="${X.level===l?'on':(X.levelD===l?'want':'')}">${esc(l)}</div>`).join('')}</div>`

  + `<div class="chgrid" style="margin-top:20px">
      ${chartBox('Where you are against where you want to be','ch-radar2',{type:'radar',h:430,
        labels:THRIVE_LIFE.map(l=>l[1]), max:10,
        series:[{name:'Wanted',color:CH.accent,fill:'rgba(255,230,0,.30)',values:X.gaps.map(g=>g.d)},
                {name:'Today', color:CH.ink,   fill:'rgba(14,26,34,.08)', values:X.gaps.map(g=>g.c)}]},
        'The same nine categories you scored on the Vision page.')}
      ${X.biggest.length ? `<div class="chartbox"><h4>The gaps, biggest first</h4>
        <table class="t" style="font-size:13px"><tbody>
        ${X.biggest.map(g=>`<tr><td>${esc(g.label)}</td><td style="width:60px">${n0(g.c)} → ${n0(g.d)}</td>
          <td style="width:120px"><div class="bargap"><i style="width:${clamp(0,100,(g.gap/9)*100)}%"></i></div></td>
          <td class="down" style="width:44px;font-weight:700">+${n0(g.gap)}</td></tr>`).join('')}
        </tbody></table>
        <div class="cap">Nine is the widest a gap can be. Anything at four or more is a year of work, not a tweak.</div></div>`
        : `<div class="chartbox"><h4>The gaps</h4><div class="empty">No gaps recorded — score the "where you want to be" column on the Vision page.</div></div>`}
    </div>`

  + `<div class="note">Freedom is one of the two outcomes, and the Thrive Index is how it gets measured. The business numbers below are what pay for it${T.fin && T.fin[2] && T.fin[2].income ? ` — "Thriving" costs you ${money(num(T.fin[2].income))} a month, so that is what the plan has to produce` : ''}.</div>`;
}

/* ─── THE THRIVE INDEX ───────────────────────────────────────────
   Scored on Vision to cement the why, summarised again on Horizon. */
function renderThrive(){
  const T=S.thrive, X=thriveScores();
  const lvls=['Surviving','Stable','Comfortable','Thriving','Optimal'];
  return head('02 · The why','Thrive Index',
    `The rest of this plan is the business. This page is the life it is supposed to be funding — and it is the honest answer to <em>why bother</em>. Score it before you go near the numbers, and again every time you come back to the room.`)

  + sech('Where your life is right now', X.counted?`${X.counted} of ${X.of} categories scored`:'Score where you actually are')
  + `<div class="explain">
      <b>Nine categories, two scores each.</b> Where you are today, and where you want to be. That is the whole exercise, and it takes about two minutes.<br>
      <b>How to fill it in.</b> Click the bars. Left bar is <b>where you are today</b>, right bar is <b>where you want to be</b>. One to ten, gut instinct, ten seconds a row. Click the same number again to clear it.<br>
      <b>Score it honestly.</b> Not the answer you would give in the room. The gap between the two bars is the whole point — a row with no gap needs no work, and a row with a gap of six is where your five years actually go.
    </div>`

  + `<div class="mgrid" style="margin-top:18px">
      ${metric('Thrive Index today', X.tis,'n1', X.level?`${X.level} · out of 100`:'Score the nine rows below','', 'ti_now')}
      ${metric('Thrive Index wanted', X.tisD,'n1', X.levelD?`${X.levelD}`:'', 'hero', 'ti_want')}
      ${metric('The lift', X.lift,'n1', X.lift!=null?'Points between today and wanted':'', 'accent','ti_lift')}
      ${metric('To the next level', X.toNext,'n1', X.level&&X.toNext!=null?(X.toNext>0?`points to leave ${X.level}`:'Already at the top band'):'','', 'ti_next')}
    </div>
    <div class="lvlbar">${lvls.map(l=>`<div class="${X.level===l?'on':(X.levelD===l?'want':'')}">${esc(l)}</div>`).join('')}</div>
    <div class="cap">Solid copper is where you are now. The pale band is where you are heading. Bands follow the Thrive Index: under 40 Surviving, under 60 Stable, under 80 Comfortable, under 90 Thriving, then Optimal.</div>`

  + `<div class="scrollx" style="margin-top:26px"><table class="t thrive">
      <thead><tr><th>Life category</th><th style="text-align:center">Where you are today</th>
        <th style="text-align:center">Where you want to be</th><th>Gap</th></tr></thead><tbody>
      ${THRIVE_LIFE.map(([label],i)=>{
        const g=X.gaps[i];
        return `<tr><td>${esc(label)}</td>
          <td class="sc">${scale10('life|'+i+'|c', T.life[i].c, 'cur')}</td>
          <td class="sc">${scale10('life|'+i+'|d', T.life[i].d, 'des')}</td>
          <td class="gapcell ${g.gap==null?'':(g.gap>0?'down':'up')}">${g.gap==null?'—':(g.gap>0?'+'+n0(g.gap):n0(g.gap))}</td></tr>`;
      }).join('')}
      <tr class="tot"><td>Totals</td>
        <td style="text-align:center">${X.counted?n0(sum(tvals(T.life.map(x=>x.c)))):'—'} / 90</td>
        <td style="text-align:center">${tvals(T.life.map(x=>x.d)).length?n0(sum(tvals(T.life.map(x=>x.d)))):'—'} / 90</td>
        <td class="gapcell">${(X.counted&&tvals(T.life.map(x=>x.d)).length)
          ? '+'+n0(sum(tvals(T.life.map(x=>x.d)))-sum(tvals(T.life.map(x=>x.c)))) : '—'}</td></tr>
    </tbody></table></div>`

  + chartBox('The shape of your life right now','ch-radar',{type:'radar',h:440,
      labels:THRIVE_LIFE.map(l=>l[1]), max:10,
      series:[{name:'Where you want to be',color:CH.accent,fill:'rgba(255,230,0,.30)',values:X.gaps.map(g=>g.d)},
              {name:'Where you are today',color:CH.ink,fill:'rgba(14,26,34,.08)',values:X.gaps.map(g=>g.c)}]},
      'The pinched axes are the ones costing you. A balanced shape at a low score is a life that is evenly flat; a spiky shape says one part is carrying everything.')

  + (X.biggest.length ? `<div class="note">Your three biggest gaps: <b>${X.biggest.slice(0,3).map(g=>esc(g.short)+' (+'+n0(g.gap)+')').join('</b>, <b>')}</b>. If the five-year plan below does not move those three, it is the wrong plan.</div>` : '')

  + sech('Owner and director capability', X.capCounted?`${X.capCounted} of ${THRIVE_CAP.length} scored · ${esc(X.capBand||'')}`:'Rate yourself one to ten')
  + `<div class="scrollx"><table class="t thrive">
      <thead><tr><th>Capability</th><th style="text-align:center">Score</th><th>Out of 10</th></tr></thead><tbody>
      ${THRIVE_CAP.map((c,i)=>`<tr><td>${esc(c)}</td>
        <td class="sc">${scale10('cap|'+i, T.cap[i], 'cap')}</td>
        <td class="gapcell">${(T.cap[i]===''||T.cap[i]==null)?'—':n0(num(T.cap[i]))}</td></tr>`).join('')}
      <tr class="tot"><td>Total capability</td><td style="text-align:center">${X.capTotal==null?'—':n0(X.capTotal)} / ${X.capMax}</td>
        <td>${X.capBand?`<span class="pill accent">${esc(X.capBand)}</span>`:'—'}</td></tr>
    </tbody></table></div>
    <div class="cap">Bands: under 40 emerging operator, under 60 capable manager, under 80 growth leader, 80 and over director-ready. The last row — stepping back from day-to-day operations — is the one that decides whether the business is an asset or a job.</div>`

  + sech('Time and energy','Where the week actually goes')
  + `<div class="fgrid"><div>
      ${field('% of your week that energises you','thrive.energy.energising',{kind:'numn',help:'The work you would still do if you did not have to. Type this one — the rest of the week follows.'})}
      ${outrow('% of your week that drains you',
         X.draining==null?'<span class="muted">—</span>':`<b>${n0(X.draining)}%</b>`,
         'The balance of the week. Calculated, so the two always make 100%.')}
    </div><div>
      ${field('Target — energising','thrive.energy.targetEnergising',{kind:'numn',help:'The Thrive Index benchmark is 70%'})}
      ${outrow('Target — draining',
         X.targetDraining==null?'<span class="muted">—</span>':`<b>${n0(X.targetDraining)}%</b>`,
         'The benchmark is 30%.')}
    </div></div>`
  + (X.energising!=null ? `<div class="alert ${X.energyGap>=0?'good':''}"><div><b>${X.energyGap>=0?'At or above the benchmark':'Below the benchmark'}</b>${
      X.energyGap>=0
        ? `${n0(X.energising)}% of your week energises you, against a target of ${n0(num(T.energy.targetEnergising))}%. Protect it — this is what the plan is trying to buy more of.`
        : `${n0(X.energising)}% of your week energises you, against a target of ${n0(num(T.energy.targetEnergising))}%. That is ${n0(Math.abs(X.energyGap))} points short. Every ten points you move it is worth roughly five points on the Thrive Index.`
      }</div></div>` : '')

  + sech('Aim higher','The three shifts that close the gap')
  + `<div class="cards">${THRIVE_SHIFTS.map(([k,label,eg])=>`<div class="card">
      <h3 class="ch">${esc(label)}</h3>
      <div class="tiny" style="margin-bottom:10px">${esc(eg)}</div>
      <textarea class="full" style="min-height:74px;font-family:var(--sans);font-size:14px" data-path="thrive.aim.${k}" data-kind="str" placeholder="Your plan">${esc(T.aim[k]||'')}</textarea>
    </div>`).join('')}</div>`

  + sech('What each lifestyle level costs','The bridge from the life to the numbers')
  + `<div class="scrollx"><table class="t"><thead><tr><th>Lifestyle level</th><th>Monthly income needed</th><th style="text-align:left">Key shifts required</th></tr></thead><tbody>
      ${T.fin.map((r,i)=>`<tr><td>${esc(r.level)}${i===0?'<div class="tiny">What you take home today</div>':''}</td>
        <td class="want inp" style="width:170px"><div class="fmoney"><span>${esc(CURSYM)}</span>
          <input class="grp" type="text" inputmode="decimal" autocomplete="off" data-path="thrive.fin.${i}.income" data-kind="numn" data-raw="${esc(r.income==null?'':String(r.income))}" value="${UI.editing==='thrive.fin.'+i+'.income'?(r.income==null?'':r.income):grouped(r.income)}" aria-label="${esc(r.level)} monthly income"></div></td>
        <td style="text-align:left"><input type="text" class="full" style="font-size:13.5px" data-path="thrive.fin.${i}.shifts" data-kind="str" value="${esc(r.shifts||'')}" placeholder="${esc(i===1?'e.g. reduce workdays; hire help':i===2?'e.g. relocate; invest; outsource':i===3?'e.g. multiple income streams; legacy projects':'')}"></td></tr>`).join('')}
    </tbody></table></div>
    <div class="cap">This is the line between the Thrive Index and the Budget tab. Whatever "Thriving" costs you a month is what the business has to pay you — put that figure into your desired net profit and personal income, and the rest of the plan works backwards from it.</div>`;
}

function fiveYearDate(){
  const d=new Date(); d.setFullYear(d.getFullYear()+5);
  return d.toLocaleDateString('en-NZ',{day:'numeric',month:'long',year:'numeric'});
}

/* ─── 02 BASELINE ───────────────────────────────────────────────── */
/* The P&L Data rows, in the order the Boardroom Growth Planner runs them.
   avg / tot say what each summary column means for that row:
     mean  — the average of the months entered
     sum   — the total across the months entered
     ratio — derived from the period totals, never an average of monthly ratios
     last  — the closing position (the latest month entered)
     none  — not a meaningful figure for this row, shown as —          */
const GRID_ROWS = [
  {k:'rev',      l:'Revenue',                 tip:'revenue',    f:money, avg:'mean',  tot:'sum'},
  {k:'gp',       l:'Gross profit',            tip:'gp',         f:money, avg:'mean',  tot:'sum'},
  {d:'gpPct',    l:'Gross profit %',          tip:'gpPct',      f:v=>pct(v), avg:'ratio', tot:'none'},
  {k:'fixed',    l:'Fixed cost',              tip:'fixed',      f:money, avg:'mean',  tot:'sum'},
  {k:'ovh',      l:'Company overhead',        tip:'ovh',        f:money, avg:'mean',  tot:'sum', divOnly:true},
  {d:'fcPct',    l:'Fixed cost %',            tip:'fcPct',      f:v=>pct(v), avg:'ratio', tot:'none'},
  {d:'np',       l:'Net profit',              tip:'np',         f:money, avg:'mean',  tot:'sum'},
  {k:'jobs',     l:'Invoices / jobs',         tip:'jobs',       f:n0,    avg:'mean',  tot:'sum'},
  {d:'ajv',      l:'Average job value',       tip:'ajv',        f:money, avg:'ratio', tot:'none'},
  {k:'quotes',   l:'Quotes issued',           tip:'quotes',     f:n0,    avg:'mean',  tot:'sum'},
  {k:'leads',    l:'Leads received',          tip:'leads',      f:n0,    avg:'mean',  tot:'sum'},
  {k:'ownerHrs', l:'Owner hours per week',    tip:'ownerHrs',   f:n1,    avg:'mean',  tot:'none'},
  {k:'onTools',  l:'On-tools headcount',      tip:'onTools',    f:n1,    avg:'mean',  tot:'last'},
  {k:'office',   l:'Office headcount',        tip:'office',     f:n1,    avg:'mean',  tot:'last'}
];

/* The "?" beside each metric. Written for a tradie, not an accountant. */
const METRIC_TIPS = {
  revenue: 'Total invoiced this month before any costs, excluding GST. The top line.',
  gp: 'Revenue minus direct job costs — materials, subcontractors and on-tools labour. What is left to pay the fixed costs and you. It is a line on your P&L; copy it straight across.',
  gpPct: 'Gross profit \u00f7 revenue. The most leveraged number in a trade business — one point of margin on $1m of revenue is $10,000 in your pocket. The period figure is total gross profit \u00f7 total revenue, never the average of the monthly percentages.',
  fixed: 'Costs that do not move with job volume — rent, office wages, software, vehicles, your salary.',
  ovh: 'Company-wide costs carried above the departments. Only shown when divisions are on.',
  fcPct: 'Fixed cost as a share of revenue. This is where lifestyle creep shows up. Profitable Tradie benchmark: under 25%.',
  np: 'Gross profit minus fixed cost. Derived, never typed — if your accountant has a different figure, put it in Reconciliation at the bottom of this page and the variance is shown rather than hidden.',
  jobs: 'Separate jobs invoiced this month. Job count is what drives team capacity.',
  ajv: 'Revenue \u00f7 invoices. A higher job value means less admin for every dollar earned.',
  quotes: 'Quotes issued this month. Without this the tool cannot work out your conversion rate or how much pricing time the business needs.',
  leads: 'Enquiries received this month. Leave it blank and the top of the funnel is estimated from jobs instead of counted.',
  ownerHrs: 'Hours you personally worked in an average week that month. This is one half of the whole point of the plan.',
  onTools: 'People on the tools at the end of the month. Drives the hiring plan.',
  office: 'Office and admin people at the end of the month.'
};
const tipMark = k => METRIC_TIPS[k] ? `<span class="tip" title="${esc(METRIC_TIPS[k])}" aria-label="${esc(METRIC_TIPS[k])}">?</span>` : '';

function monthNameAuto(i){
  const m=(num(S.meta.startMonth)+i)%12;
  const y=num(S.meta.startYear)+Math.floor((num(S.meta.startMonth)+i)/12);
  return MONTHS[m]+' '+String(y).slice(2);
}
/* The member can type over any column heading on the Baseline tab.
   Blank means "use the name worked out from the start month in Setup". */
function monthName(i){
  const ov=(S.meta.monthNames||[])[i];
  return (ov!=null && String(ov).trim()!=='') ? String(ov).trim() : monthNameAuto(i);
}
function currentDivision(){
  return S.divisions.find(d=>d.id===UI.div) || S.divisions[0];
}
/* Consolidated months: money and volume add across the active departments,
   headcount adds, and owner hours DO NOT — the owner works the same week
   however the business is sliced. */
function consolidatedMonths(){
  const ds = activeDivisions();
  return Array.from({length:12}, (_,i)=>{
    const ms = ds.map(d=>d.months[i]);
    const any = ms.some(entered);
    const add = k => sum(ms.map(m=>num(m[k])));
    return {
      rev:add('rev'), gp:sum(ms.map(mgp)), cos:sum(ms.map(mcos)),
      fixed:add('fixed'), ovh:add('ovh'), jobs:add('jobs'),
      quotes:add('quotes'), leads:add('leads'),
      /* same rule as business(): the average of the departments that
         reported, never the sum and never dragged down by an empty one */
      ownerHrs: (()=>{ const h=ms.filter(entered).map(m=>num(m.ownerHrs)).filter(v=>v>0);
                       return h.length ? sum(h)/h.length : 0; })(),
      onTools:add('onTools'), office:add('office')
    };
  });
}

function deptTabs(){
  const on = S.divisions.filter(d=>d.id!=='WOB' && d.active);
  const t = [];
  if(S.divisionsOn){
    t.push(`<button class="dtab ${UI.div==='CONS'?'on':''}" data-divsel="CONS">Consolidated<span class="dt2">${on.length} department${on.length===1?'':'s'}</span></button>`);
    on.forEach(d=>{
      if(UI.renaming===d.id){
        t.push(`<span class="dtab on renaming"><input class="dren" data-divname="${esc(d.id)}" value="${esc(d.name)}" aria-label="Department name" autofocus></span>`);
      } else {
        t.push(`<button class="dtab ${d.id===UI.div?'on':''}" data-divsel="${esc(d.id)}">${esc(d.name)}
          <i class="dx" data-divren="${esc(d.id)}" title="Rename ${esc(d.name)}">✎</i>
          <i class="dx" data-divoff="${esc(d.id)}" title="Remove ${esc(d.name)}">×</i></button>`);
      }
    });
  } else {
    t.push(`<button class="dtab on" data-divsel="WOB">Whole of business<span class="dt2">One P&amp;L</span></button>`);
  }
  t.push(`<button class="dadd" id="btnAddDept" title="Add a department">+</button>`);
  return `<div class="dtabs">${t.join('')}</div>`;
}

function pcard(no, title, meta, body, foot){
  return `<section class="pcard">
    <header><span class="pn">${esc(no)}</span><h3>${title}</h3>${meta?`<div class="pm">${meta}</div>`:''}</header>
    <div class="pb">${body}${foot?`<div class="cap">${foot}</div>`:''}</div>
  </section>`;
}

function renderBaseline(){
  if(!S.divisionsOn) UI.div='WOB';
  else if(UI.div==='WOB') UI.div='CONS';
  else if(UI.div!=='CONS' && !(S.divisions.find(d=>d.id===UI.div)||{}).active) UI.div='CONS';

  const cons = UI.div==='CONS';
  const dv   = cons ? {id:'CONS', name:'Consolidated', months:consolidatedMonths(),
                       a:business().a, t:consolidatedTargets()}
                    : currentDivision();
  const nz   = cons ? (()=>{ const b=business();
                 return {n:Math.max(0,...activeDivisions().map(d=>normalise(d).n)),
                   revenue:b.revenue, gp:b.gp, cos:b.cos, fixedTotal:b.fixedTotal,
                   gpPct:b.gpPct, netProfit:b.netProfit, revenueM:b.revenueM, gpM:b.gpM,
                   fixedM:b.fixedM, netProfitM:b.netProfitM, jobsM:b.jobsM, quotesM:b.quotesM,
                   leadsM:b.leadsM, avgJobValue:b.avgJobValue, quoteWin:b.quoteWin,
                   leadQuote:b.leadQuote, onTools:b.onTools, leadsImplied:b.leadsImplied,
                   gpSpread:null}; })()
                    : normalise(dv);
  const f    = cons ? consolidatedTargets() : funnel(dv.t);
  const cap  = capacity(f.revenue, f.quotes, dv.a, {onTools:nz.onTools});
  const capN = capacity(nz.revenueM, nz.quotesM, dv.a, {onTools:nz.onTools});
  const ms = dv.months.filter(entered), n = ms.length;
  const rows = GRID_ROWS.filter(r=> !r.divOnly || S.divisionsOn);

  const cell = (r,i) => {
    const m=dv.months[i], any=entered(m);
    if(r.d==='gpPct') return div(mgp(m), num(m.rev));
    if(r.d==='fcPct') return div(num(m.fixed)+num(m.ovh), num(m.rev));
    if(r.d==='np')    return any ? mgp(m)-num(m.fixed)-num(m.ovh) : null;
    if(r.d==='ajv')   return div(num(m.rev), num(m.jobs));
    return null;
  };
  const summary = (r,kind) => {
    const mode = kind==='avg' ? r.avg : r.tot;
    if(!mode || mode==='none' || !n) return null;
    if(mode==='ratio'){
      if(r.d==='gpPct') return nz.gpPct;
      if(r.d==='fcPct') return div(nz.fixedTotal, nz.revenue);
      if(r.d==='ajv')   return nz.avgJobValue;
      return null;
    }
    const col = r.d ? ms.map(m=>cell(r, dv.months.indexOf(m))).filter(v=>v!=null)
                    : ms.map(m=>num(m[r.k]));
    if(!col.length) return null;
    if(mode==='mean') return sum(col)/col.length;
    if(mode==='sum')  return sum(col);
    if(mode==='last') return col[col.length-1];
    return null;
  };

  let grid = `<table class="t grid pl"><colgroup><col class="cml">`
    + '<col>'.repeat(12) + `<col class="cavg"><col class="ctot"></colgroup><thead><tr><th>Metric</th>`;
  for(let i=0;i<12;i++){
    grid += cons
      ? `<th>${esc(monthName(i))}</th>`
      : `<th><input class="mhead" type="text" data-mname="${i}" value="${esc((S.meta.monthNames||[])[i]||'')}"
          placeholder="${esc(monthNameAuto(i))}" aria-label="Name of month ${i+1}"></th>`;
  }
  grid+=`<th class="avgc">Average</th><th class="tot">Period</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    const lab = `<td class="ml">${esc(r.l)}${tipMark(r.tip)}</td>`;
    if(r.d || cons){
      grid+=`<tr class="${r.d?'der':''}">${lab}`;
      for(let i=0;i<12;i++) grid+=`<td>${r.f(r.d ? cell(r,i) : (num(dv.months[i][r.k])||null))}</td>`;
    } else {
      grid+=`<tr>${lab}`;
      for(let i=0;i<12;i++){
        const raw = num(dv.months[i][r.k])||'';
        grid+=`<td class="inp"><input type="text" inputmode="decimal" autocomplete="off" class="grp" data-grid="${esc(dv.id)}" data-m="${i}" data-k="${r.k}"
          data-raw="${esc(raw)}" value="${esc(UI.editing===dv.id+'|'+i+'|'+r.k ? raw : grouped(raw===''?null:raw))}"
          aria-label="${esc(r.l+' '+monthName(i))}"></td>`;
      }
    }
    grid+=`<td class="avgc">${r.f(summary(r,'avg'))}</td><td class="tot">${r.f(summary(r,'tot'))}</td></tr>`;
  });
  grid+=`</tbody></table>`;

  const missing=[];
  if(!cons){
    if(!n) missing.push('no months entered yet');
    if(!nz.revenue) missing.push('revenue');
    if(!nz.gp)     missing.push('gross profit');
    if(!nz.jobs && !nz.jobsM) missing.push('invoices / jobs');
    if(!nz.quotes && !nz.quotesM) missing.push('quotes — conversion and pricing capacity need this');
    if(!nz.leads && !nz.leadsM)  missing.push('leads — the top of the funnel is estimated without this');
    if(!nz.onTools) missing.push('on-tools headcount — the hiring plan needs this');
  }

  const set = v => (v!=null && Number.isFinite(v) && v!==0) ? v : null;
  const cvp = [
    {t:'Monthly revenue',  sub:'Average month against what the profit you want requires.',
     cur:nz.revenueM, prop:set(f.revenue), fmt:'money'},
    {t:'Gross profit %',   sub:'Period margin against the margin you are aiming at.',
     cur:nz.gpPct,    prop:set(f.gpPct),   fmt:'pct'},
    {t:'Monthly net profit', sub:'Average month against the profit you asked for.',
     cur:nz.netProfitM, prop:set(f.netProfit), fmt:'money'}
  ];

  const B = S.divisionsOn ? budget() : null;

  return head('04 · Where you are','Scenario Forecaster',
    `The whole quarterly sheet on one page: twelve months of what actually happened, the numbers you want instead, the team that gets you there, and the gap between the two. Every forecast in this plan is built on what you enter here. Partial data is fine — the tool uses the months you enter and tells you how many that is.`)

  + deptTabs()

  + pcard('01', cons?'Consolidated P&amp;L':'P&amp;L data',
      `<span class="mc">${n} of 12 months entered</span>`
      + (cons ? '' : `<button class="btn sm accent" id="btnPaste">Paste</button>
          <button class="btn sm" id="btnDemo">Example</button>
          <button class="btn sm ghost" id="btnResetMonths">Clear</button>`),
      `<div class="scrollx">${grid}</div>`
      + (missing.length ? `<div class="alert" style="margin-top:16px"><div><b>Still needed</b>${esc(missing.join(' · '))}</div></div>`:''),
      cons
        ? `Every money and volume line is the sum of the departments, month by month. Percentages and average job value are re-derived from those totals, never averaged. Owner hours are the average of the departments that reported them — never the sum, and never dragged down by an empty department. You work the same week however the business is sliced.`
        : `Type into the amber boxes; the dark ones work themselves out. <b>Average</b> is across the ${n||0} month${n===1?'':'s'} entered, not across twelve. <b>Period</b> is the total for those months; headcount shows the closing position instead. Cost of sales is revenue minus gross profit — you never type it twice. Rename any month by typing over its heading.`)

  + pcard('02', 'Desired numbers', cons?'<span class="mc">Read-only — set these on each department</span>':'<span class="mc">What this department has to hit</span>',
      budgetTable(cons?null:dv.id, f, nz, !cons),
      cons ? `The consolidated budget is what the departments add up to. Money and volume add; gross margin, average job value and the conversion rates are re-derived from the totals rather than averaged.`
           : `<b>Margin ideals</b> is each line as a share of the revenue this plan requires — the shape of the business you are aiming at. Everything below the first block falls out of the numbers above it.`)

  + pcard('03', 'Workforce planning', `<span class="mc">To deliver ${money(f.revenue)} a month</span>`,
      assumptionsTable(dv, cap, capN),
      cons ? `Assumptions here are revenue-weighted across the departments, never added — five departments each with a span of six is not a span of thirty.`
           : `The seven above the rule are yours; the seven below are what they produce. People round <em>up</em>: 8.6 needed is 9 hired, and the shortfall shows as utilisation rather than as two-thirds of a tradesman.`)

  + pcard('04', 'What that says about the business', cons?'<span class="mc">Whole of business</span>':`<span class="mc">${esc(dv.name)} on its own</span>`,
      `<div class="mgrid">
        ${metric('Revenue',nz.revenueM,'money','Per month','', 'b_rev')}
        ${metric('Gross margin',nz.gpPct,'pct','Total GP ÷ total revenue','', 'b_gp')}
        ${metric('Net profit',nz.netProfitM,'money','Per month, derived','', 'b_np')}
        ${metric('Average job value',nz.avgJobValue,'money','Revenue ÷ invoices','', 'b_ajv')}
        ${metric('Quote → win',nz.quoteWin,'pct','Jobs ÷ quotes','', 'b_qw')}
        ${metric('Leads a month',nz.leadsM,'n0', nz.leadsImplied?'Implied':'Counted','', 'b_ld')}
      </div>`,
      nz.gpSpread ? `Monthly gross margin ranged ${pct(nz.gpSpread.lo)} to ${pct(nz.gpSpread.hi)}, median ${pct(nz.gpSpread.mid)}. A wide spread usually means pricing or job costing is inconsistent, not that the margin is wrong.` : '')

  + pcard('05', 'Current vs proposed', '<span class="mc">Against the desired numbers above</span>',
      `<div class="cvp">${cvp.map(x=>miniBars(x.t,x.sub,x.cur,x.prop,x.fmt)).join('')}</div>
       <div class="chleg" style="justify-content:center;margin-top:6px">
        <span><i style="background:${CH.muted}"></i>Current average</span>
        <span><i style="background:${CH.accent}; box-shadow:inset 0 0 0 1px ${CH.accentEdge}"></i>Proposed target</span></div>`,
      'A bar with nothing beside it means that target has not been set yet.')

  + (cons && B ? pcard('06','Department breakdown','<span class="mc">Money and headcount add · assumptions never do</span>',
      `<div class="scrollx"><table class="t"><thead><tr><th>Department</th><th>Desired sales</th><th>Desired profit</th>
        <th>Gross margin</th><th>Jobs</th><th>Leads</th><th>On tools</th><th>Hires</th><th>Share</th></tr></thead><tbody>
      ${B.per.map(x=>`<tr><td>${esc(x.div.name)}</td><td>${money0k(x.f.revenue)}</td><td>${money0k(x.f.netProfit)}</td>
        <td>${pct(x.f.gpPct)}</td><td>${n1(x.f.jobs)}</td><td>${n1(x.f.leads)}</td>
        <td>${n0(x.cap.target)}</td><td>${n0(x.cap.hires)}</td><td>${pct(div(x.f.revenue,B.total.revenue))}</td></tr>`).join('')}
      <tr class="tot"><td>Consolidated</td><td>${money0k(B.total.revenue)}</td><td>${money0k(B.total.netProfit)}</td>
        <td>${pct(B.total.gpPct)}</td><td>${n1(B.total.jobs)}</td><td>${n1(B.total.leads)}</td>
        <td>${n0(B.capTotal.target)}</td><td>${n0(B.capTotal.hires)}</td><td>100.0%</td></tr>
    </tbody></table></div>`,
      `Add a department with <b>+</b> above. Removing one with <b>×</b> takes it out of the roll-up and keeps its numbers — bring it back with <b>+</b>.`) : '');
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

  return head('05 · The scoreboard','Key Metrics',
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
      <button class="pill ${s.on===false?'neutral':'accent'}" data-stogon="${i}" style="border:0;cursor:pointer" title="${s.on===false?'Parked — this strategy is not in the forecast':'In the plan — this strategy is in the forecast'}">${s.on===false?'Parked':'In the plan'}</button>
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
  return head('07 · The work','Strategies',
    `Seven things, repeated in cycle. Each strategy carries a <strong>mindset shift</strong> — the member has to move through the shift in order to execute the strategy, and executing the strategy is what delivers the growth. This is not a to-do list: every strategy carries a <strong>lever</strong>, and the forecast is the sum of those levers. Change one and the five-year picture moves.`)
  + sech('The strategy stack', `${planStrategies().length} in the plan · ${S.strategies.length-planStrategies().length} parked · ${invalid} with no lever set`)
  + `<div class="note" style="margin-top:0">Every strategy is either <strong>in the plan</strong> or <strong>parked</strong>. Only the ones in the plan move the forecast — click the copper chip on a card to park it, and click it again to bring it back. Parking keeps the work on the page without pretending it is happening.</div>`
  + `<div class="btnrow" style="margin-top:0">
      <button class="btn accent" id="btnAddStrat">+ Add strategy</button>
      <button class="btn" id="btnStratLib">Add from the seven</button>
    </div>`
  + (S.strategies.length ? `<div class="cards" style="margin-top:20px">${S.strategies.map(stratCard).join('')}</div>`
     : `<div class="empty" style="margin-top:20px">No strategies yet. Add one — the forecast is flat until you do.</div>`)
  + `<div class="note">Refine before you scale. A member who scales an unrefined process adds revenue and loses freedom — which fails both of the outcomes in section 01.</div>`;
}

/* ─── 02 HORIZON ────────────────────────────────────────────────
   Opens by reading the Vision page back to the member, then shows what
   the plan actually lands on and where the two disagree. */
function renderHorizon(){
  const pr=project(), Y=pr.years, X=['Today','Y1','Y2','Y3','Y4','Y5'];
  const y5=Y[5], y0=Y[0], V=S.vision, VF=visionFigures(pr), G=guardrails(pr);
  const r=(label,fmt,pick,cls)=>`<tr class="${cls||''}"><td>${esc(label)}</td>${Y.map(y=>`<td>${(FMT[fmt]||n0)(pick(y))}</td>`).join('')}</tr>`;

  /* said vs produced. lower:true means a smaller number is the win. */
  const vrow=(label,said,plan,fmt,lower,note)=>{
    const F=FMT[fmt]||n0;
    const has = said!=null && Number.isFinite(said) && said!==0;
    const gap = (has && plan!=null && Number.isFinite(plan)) ? plan-said : null;
    const ok  = gap==null ? null : (lower ? gap<=0 : gap>=0);
    return `<tr><td>${esc(label)}${note?`<div class="tiny">${esc(note)}</div>`:''}</td>
      <td class="want inp">${has?`<b>${F(said)}</b>`:'<span class="muted">not set</span>'}</td>
      <td class="calc"><b>${F(plan)}</b></td>
      <td class="${ok==null?'':(ok?'up':'down')}">${gap==null?'—':signed(gap,F)}</td>
      <td>${ok==null?'<span class="pill neutral">—</span>'
            :(ok?'<span class="pill good">Plan gets you there</span>'
                :'<span class="pill bad">Plan falls short</span>')}</td></tr>`;
  };
  const said = k => { const v=V.biz[k]; return (v===null||v===undefined||v==='')?null:num(v); };
  const saidFreedom = (V.freedom.y5===null||V.freedom.y5===undefined||V.freedom.y5==='')?null:num(V.freedom.y5);
  const saidLife = k => { const v=V.life[k]; return (v===null||v===undefined||v==='')?null:num(v); };

  const alsoSaid = [
    ['Weeks of holiday a year', saidLife('holidays'), n1],
    ['Weekends worked a month', saidLife('weekends'), n1],
    ['Evenings home for dinner', saidLife('evenings'), n1],
    ['Adventures completed', saidLife('adventures'), n0],
    ['Investments outside the business', saidLife('investments'), money0k]
  ].filter(x=>x[1]!=null);

  return head('03 · The horizon','Horizon',
    `What you wrote on the Vision page, and what the plan actually lands on. Where the two disagree is the work — either the plan changes, or the vision does.`)

  + sech('What you said you wanted','From the Vision page')
  + `<div class="stmt" style="margin-bottom:26px">${V.statement?esc(V.statement)
      :`<span class="muted">No statement written yet. Go back to Vision, answer the seven prompts, and write it — it anchors everything below.</span>`}</div>`
  + `<div class="scrollx"><table class="t bud">
      <thead><tr><th>In five years</th><th>What you said</th><th>What the plan produces</th><th>Difference</th><th></th></tr></thead><tbody>
      <tr class="grp"><td colspan="5">The business</td></tr>
      ${vrow('Revenue', said('revenue'), y5.rev, 'money0k', false, 'Annual, excluding GST')}
      ${vrow('Net profit', said('profit'), y5.np, 'money0k', false, 'Annual, after your salary')}
      ${vrow('Business value', said('value'), y5.value.equity, 'money0k', false, `${n1(pr.plan.multiple)}× normalised EBITDA`)}
      ${vrow('Team size', said('team'), y5.cap.total, 'n0', false, 'Everyone the revenue requires')}
      <tr class="grp"><td colspan="5">The life</td></tr>
      ${vrow('Hours worked per week', saidLife('hours'), y5.ownerHours, 'n1', true, `${n1(y0.ownerHours)} a week today`)}
      ${vrow('Personal income drawn', saidLife('income'), num(S.wellness.targ.income), 'money0k', false, 'Against your year-5 target in Setup')}
      ${vrow('Freedom score', saidFreedom, VF.scoreY5, 'n0', false, 'Out of 100 — yours against the one the model works out')}
    </tbody></table></div>
    <div class="cap">"What you said" is what you typed on the Vision page. "What the plan produces" is what the baseline plus your strategy stack actually delivers by year five. A red row is not a failure — it is the conversation to bring to the room.</div>`

  + (alsoSaid.length ? `<div class="scrollx" style="margin-top:22px"><table class="t"><thead><tr><th>You also said</th><th>By year five</th></tr></thead><tbody>
      ${alsoSaid.map(([l,v,f])=>`<tr><td>${esc(l)}</td><td><b>${f(v)}</b></td></tr>`).join('')}
      ${V.life.whatFor?`<tr><td>What the money is for</td><td style="text-align:left;white-space:normal">${esc(V.life.whatFor)}</td></tr>`:''}
      <tr><td>Your role</td><td><span class="pill accent">${esc(V.biz.role)}</span></td></tr>
    </tbody></table></div>
    <div class="cap">Nothing in this block is modelled — it is what you committed to. It prints on the one-pager and the room holds you to it.</div>` : '')

  + thriveReflection()

  + sech('Where the plan lands','Year 5')
  + `<div class="mgrid">
      ${metric('Revenue, year 5', y5.rev,'money0k', `from ${money0k(y0.rev)}`,'hero','f_rev')}
      ${metric('EBITDA, year 5', y5.ebitda,'money0k', `${pct(div(y5.ebitda,y5.rev),1)} of revenue`,'','f_eb')}
      ${metric('Business value', y5.value.equity,'money0k', `${n1(pr.plan.multiple)}× EBITDA`,'accent','f_val')}
      ${metric('Owner hours', y5.ownerHours,'hrs', `from ${hrs(y0.ownerHours)} a week`,'','f_hrs')}
      ${metric('Team size', y5.cap.total,'n0', `from ${n0(y0.cap.total)} people`,'','f_team')}
      ${metric('Freedom score', VF.scoreY5,'n0', `from ${n0(VF.scoreToday)}`,'','f_fs')}
    </div>
    <div class="cap">These are the model's figures — what the baseline plus your strategy stack produces. Anything you typed over on the Vision page stays yours and shows there; this strip never hands your own number back to you as if the plan had produced it.</div>`

  + chartBox('The thesis — your hours down, the asset up','ch-dual',{type:'dual',h:330,x:X,
      left:{name:'Owner hours a week',fmt:v=>n0(v)+'h',values:Y.map(y=>y.ownerHours)},
      right:{name:'Business value',fmt:money0k,values:Y.map(y=>y.value.equity)}},
      'Two lines moving in opposite directions is the whole point of Boardroom. If they move together, the plan is buying revenue with your time.')

  + chartBox('Your freedom score, year by year','ch-free',{type:'line',h:300,fmt:n0,x:X,
      series:[{name:'Freedom',color:CH.accent,values:Y.map(y=>y.freedom.score)}]},
      'Scored out of 100 against your own baseline and your own year-5 targets, not against anyone else. Owner hours are modelled from the strategy stack; the rest interpolate. Set the targets in Setup.')

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
        'Headcount the revenue requires at your own benchmarks — not a number you type in.')}
    </div>`
  + chartBox('Cash generated each year','ch-cash',{type:'bar',h:290,fmt:money0k,x:X.slice(1),
      series:[{name:'Cash after tax, capex and working capital',color:CH.steel,values:Y.slice(1).map(y=>y.cash)}]},
      'Profit is not cash. Growth absorbs working capital before it returns any.')

  + sech('The numbers','Every year, whole of business')
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
    </tbody></table></div>
    <div class="cap">As real years complete they replace forecast years and the window rolls forward.</div>`

  + sech('Guardrails','Automatic checks on whether this plan is buildable')
  + (G.length ? G.map(x=>`<div class="alert ${x.lvl==='bad'?'bad':''}"><div><b>${esc(x.t)}</b>${esc(x.m)}</div></div>`).join('')
     : `<div class="alert good"><div><b>Clear</b>Nothing in the plan trips a guardrail. Hiring rate, margin movement, cost per head and funding all sit inside their limits.</div></div>`)
  + `<div class="cap">Set the hiring limit and the money settings on the Setup tab. A guardrail is a prompt for the room, not a blocker.</div>`;
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
  const pr=project(), R=pr.rows.filter(r=>r.y===1);
  const B=budget(), F=B.total;
  const seas=S.oneYear.seasonality.map(num);
  const meanIx=seas.length?sum(seas)/12:1, ok=Math.abs(meanIx-1)<0.005;
  const A=S.oneYear.actuals;
  const idx=i=>seasonIndex(i);
  const budgetRev=i=>(F.revenue||0)*idx(i);
  const maxIx=Math.max(...seas.map((_,i)=>seasonIndex(i)),0.0001);
  const mrow=(label,fmt,pick)=>`<tr><td>${esc(label)}</td>${R.map(r=>`<td>${(FMT[fmt]||n0)(pick(r))}</td>`).join('')}<td class="tot">${(FMT[fmt]||n0)(sum(R.map(pick)))}</td></tr>`;

  return head('08 · The year in front of you','One Year',
    `Year 1 broken to twelve months. Three lines run side by side all year: the <strong>budget</strong> you set on the Budget &amp; Workforce tab, the <strong>forecast</strong> from the plan, and the <strong>actuals</strong> you enter each month. This is the tab you bring to the room every cycle.`)

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
    <div class="cap">The dark tick on each bar marks an average month. <b>Budget revenue</b> is the monthly run rate from your department budgets, shaped by these twelve numbers. <b>Forecast revenue</b> is the plan for the same month — it grows through the year because the strategy stack ramps.</div>`

  + sech('Budget, forecast and actual','The three lines the room looks at')
  + `<div class="scrollx"><table class="t grid"><thead><tr><th></th>${R.map((r,i)=>`<th>${esc(monthName(i))}</th>`).join('')}<th class="tot">Year</th></tr></thead><tbody>
      <tr class="grp"><td colspan="14">Revenue</td></tr>
      <tr class="der"><td>Budget</td>${seas.map((_,i)=>`<td>${money0k(budgetRev(i))}</td>`).join('')}<td class="tot">${money0k((F.revenue||0)*12)}</td></tr>
      <tr class="der"><td>Forecast — the plan</td>${R.map(r=>`<td>${money0k(r.rev)}</td>`).join('')}<td class="tot">${money0k(sum(R.map(r=>r.rev)))}</td></tr>
      <tr><td>Actual</td>${A.map((x,i)=>`<td><input type="number" step="any" data-act="${i}|rev" value="${x.rev==null?'':x.rev}"></td>`).join('')}<td class="tot">${A.some(x=>x.rev!=null)?money0k(sum(A.map(x=>num(x.rev)))):'—'}</td></tr>
      <tr class="der"><td>Actual vs budget</td>${A.map((x,i)=>{const v=x.rev==null?null:num(x.rev)-budgetRev(i); return `<td class="${v==null?'':v>=0?'up':'down'}">${v==null?'—':signed(v,money0k)}</td>`;}).join('')}<td class="tot"></td></tr>
      <tr class="grp"><td colspan="14">Net profit</td></tr>
      <tr class="der"><td>Budget</td>${seas.map((_,i)=>`<td>${money0k((F.netProfit||0)*idx(i))}</td>`).join('')}<td class="tot">${money0k((F.netProfit||0)*12)}</td></tr>
      <tr class="der"><td>Forecast — the plan</td>${R.map(r=>`<td>${money0k(r.np)}</td>`).join('')}<td class="tot">${money0k(sum(R.map(r=>r.np)))}</td></tr>
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

  + sech('The monthly plan','Every driver, month by month')
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
  const pr=project(), Y=pr.years, b=pr.b, y0=Y[0], y5=Y[5];
  const top=planStrategies()
    .map(s=>({s, w:sum((s.levers||[]).map(l=>Math.abs(num(l.value))))*(num(s.confidence)/100)}))
    .sort((a,c)=>c.w-a.w).slice(0,5);

  return head('09 · The one-pager','Consolidated',
    `Everything above, on one page, ready to print and put on the table.`)
  + `<div class="stmt" style="margin-top:26px">${S.vision.statement?esc(S.vision.statement):`<span class="muted">Write the vision statement on tab 01 and it appears here.</span>`}</div>`

  + sech('Where you are, where you are going',`Today against year five, at ${n1(pr.plan.multiple)}× EBITDA`)
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
    </tbody></table></div>` : `<div class="empty">No strategies in the plan yet. Add them on tab 07 — the forecast is flat until you do.</div>`)

  + sech('Signed off','')
  + `<div class="two"><div><div class="sub">Member</div><h3>${esc(S.meta.owner||'—')}</h3><div class="tiny" style="margin-top:30px;border-top:1px solid var(--rule);padding-top:8px">Signature · Date</div></div>
      <div><div class="sub">Coach</div><h3>&nbsp;</h3><div class="tiny" style="margin-top:30px;border-top:1px solid var(--rule);padding-top:8px">Signature · Date</div></div></div>`;
}

/* ─── 09 ORG CHART ──────────────────────────────────────────────── */
function renderOrg(){
  const pr=project();
  const o=orgAt(pr, UI.orgYear);
  const o0=orgAt(pr,0), o5=orgAt(pr,5);
  const yr=pr.years.find(x=>x.y===UI.orgYear)||pr.years[0];
  const reconFixed = yr.fixed!=null ? o.costFixed - yr.fixed : null;
  const reconCos   = yr.cos!=null ? o.costCos - yr.cos : null;

  return head('10 · The team that gets you out','Org Chart',
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
      <div class="f"><div class="flab"><div class="fl">The twelve months start at</div><div class="fh">The column headings on the Scenario Forecaster run from here. You can type over any of them.</div></div>
        <select data-path="meta.startMonth" data-kind="num">${MONTHS.map((m,i)=>`<option value="${i}"${i===num(S.meta.startMonth)?' selected':''}>${m}</option>`).join('')}</select></div>
      ${field('Starting year','meta.startYear',{step:1})}
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

  + sech('The plan — valuation and macro movement','One plan. These sit underneath every forecast on every tab.')
  + `<div class="fgrid"><div>
      <div class="f"><div class="flab"><div class="fl">EBITDA multiple</div><div class="fh">Sets the business value. Ask your broker or accountant what a business like yours trades on — trades typically 2.5–4×.</div></div>
        <input type="number" step="0.1" data-path="plan.multiple" value="${num(S.plan.multiple)}" style="width:90px"></div>
      <div class="fh" style="margin-top:10px">Macro movement applies at the <em>start</em> of each year, before any strategy. It is what happens to the business if you change nothing — market drift, your annual price rise, and overhead creep.</div>
    </div><div>
      <table class="t" style="font-size:13px"><thead><tr><th>Year</th><th>Market %</th><th>Price %</th><th>Overhead %</th></tr></thead><tbody>
      ${S.plan.macro.map((m,y)=>`<tr><td>Year ${y+1}</td>
        <td><input type="number" step="0.5" data-path="plan.macro.${y}.market" data-kind="pct" value="${(num(m.market)*100).toFixed(1)}" style="width:70px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:4px 7px"></td>
        <td><input type="number" step="0.5" data-path="plan.macro.${y}.price" data-kind="pct" value="${(num(m.price)*100).toFixed(1)}" style="width:70px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:4px 7px"></td>
        <td><input type="number" step="0.5" data-path="plan.macro.${y}.ovh" data-kind="pct" value="${(num(m.ovh)*100).toFixed(1)}" style="width:70px;text-align:right;border:1px solid var(--rule);border-radius:5px;padding:4px 7px"></td></tr>`).join('')}
      </tbody></table>
    </div></div>
    <div class="cap">Market moves leads, price moves the average job value, overhead moves fixed costs. Strategies then apply on top — that is the difference between drifting and planning.</div>`

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
      ${metric('Version','','n0','Boardroom Growth Plan v2.4 — Scenario Forecaster on 04, one plan, Thrive Index')}
      ${metric('Self-tests',SELFTEST_COUNT,'n0','Golden cases with hand-calculated answers')}
      ${metric('Tabs',10,'n0','Plus this setup page')}
    </div>`

  + sech('Checks','')
  + `<div class="btnrow"><button class="btn" id="btnSelfTest">Run the self-test</button>
      <button class="btn" id="btnExportCsv">Export the model to CSV</button>
      <button class="btn danger" id="btnReset">Reset everything</button></div>
    <div id="selftestout"></div>`;
}
function divIdx(){ return S.divisions.findIndex(d=>d.id===UI.div); }
