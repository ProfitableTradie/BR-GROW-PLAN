<script>
(function(){
'use strict';

/* ══════════════════════════════════════════════════════════════════
   BOARDROOM GROWTH PLAN — calculation engine
   Pure functions. No DOM access below this banner until §RENDER.
   Spec reference: CALC-SPEC.md
   ══════════════════════════════════════════════════════════════════ */

const $  = s => document.querySelector(s);
const $$ = (s,r) => Array.from((r||document).querySelectorAll(s));
const clamp = (lo,hi,v) => Math.max(lo, Math.min(hi, v));
const ceil  = v => Math.ceil(v - 1e-9);                  // 8.0000001 → 8, not 9
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* null means "cannot be computed" and renders as — . Never NaN, never Infinity. */
function div(a,b){
  if(a==null||b==null) return null;
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0) return null;
  const r=a/b; return Number.isFinite(r)?r:null;
}
function num(v){
  if(typeof v==='number') return Number.isFinite(v)?v:0;
  const n=parseFloat(String(v??'').replace(/[^0-9.\-]/g,''));
  return Number.isFinite(n)?n:0;
}
const sum = a => a.reduce((t,v)=>t+(Number.isFinite(v)?v:0),0);

/* ─── formatters ─────────────────────────────────────────────────── */
let CURSYM = '$';
function money(v){
  if(v==null||!Number.isFinite(v)) return '—';
  const n=Math.round(v), s=n<0?'-':'';
  return s+CURSYM+Math.abs(n).toLocaleString('en-NZ');
}
function money0k(v){
  if(v==null||!Number.isFinite(v)) return '—';
  if(Math.abs(v)>=1e6) return (v<0?'-':'')+CURSYM+(Math.abs(v)/1e6).toFixed(2)+'m';
  if(Math.abs(v)>=1e4) return (v<0?'-':'')+CURSYM+Math.round(Math.abs(v)/1e3)+'k';
  return money(v);
}
function pct(v,dp){
  if(v==null||!Number.isFinite(v)) return '—';
  return (v*100).toFixed(dp==null?1:dp)+'%';
}
function pp(v,dp){
  if(v==null||!Number.isFinite(v)) return '—';
  return (v>=0?'+':'')+(v*100).toFixed(dp==null?1:dp)+'pp';
}
function n0(v){ return (v==null||!Number.isFinite(v))?'—':Math.round(v).toLocaleString('en-NZ'); }
function n1(v){ return (v==null||!Number.isFinite(v))?'—':v.toFixed(1); }
function hrs(v){ return (v==null||!Number.isFinite(v))?'—':v.toFixed(1)+'h'; }
function signed(v,f){ if(v==null||!Number.isFinite(v)) return '—'; return (v>0?'+':'')+f(v); }
const FMT = {money, money0k, pct, n0, n1, hrs, pp};

/* ═══ STATE ══════════════════════════════════════════════════════ */

function blankMonth(){
  return {rev:0,gp:null,cos:0,fixed:0,ovh:0,jobs:0,quotes:0,leads:0,ownerHrs:0,onTools:0,office:0};
}
function blankDivision(id,name,active){
  return {id, name, active:!!active, months:Array.from({length:12},blankMonth),
    a:{revPerHead:25000, spanTL:6, spanOM:4, omThreshold:2, pricingCapacity:118,
       tradesPerOffice:5, pricingMinutes:60},
    t:{netProfit:0, fixedCosts:0, gpPct:0.35, avgJobValue:0, quoteWin:0.5, leadQuote:0.8}};
}
function blankMacro(){ return {market:0.05, price:0.03, wage:0.03, ovh:0.03}; }
const SELFTEST_COUNT = 128; /* every check in runSelfTest(), last verified run */
function blankPlan(){
  return {label:'The Plan', multiple:3.0, macro:Array.from({length:5},blankMacro)};
}

const DRIVERS = {
  leads:        {label:'Leads per month',            unit:'count', fmt:v=>signed(v,n0)+' leads/mo'},
  leadQuote:    {label:'Lead → Quote rate',          unit:'pp',    fmt:v=>pp(v/100)},
  quoteWin:     {label:'Quote → Win rate',           unit:'pp',    fmt:v=>pp(v/100)},
  avgJobValue:  {label:'Average job value',          unit:'money', fmt:v=>signed(v,money)},
  gpPct:        {label:'Gross margin',               unit:'pp',    fmt:v=>pp(v/100)},
  fixedCosts:   {label:'Fixed costs per month',      unit:'money', fmt:v=>signed(v,money)+'/mo'},
  revPerHead:   {label:'Revenue per on-tools member',unit:'money', fmt:v=>signed(v,money)+'/mo'},
  ownerHours:   {label:'Owner hours per week',       unit:'hours', fmt:v=>signed(v,x=>x.toFixed(1)+'h')+'/wk'}
};
const DOMAINS = ['Marketing','Sales','Workflow / Operations','Human Capital','Culture','Profitability & Financial Oversight'];
const STAGES  = ['Strategy','Planning','Execution','Community','Accountability','Refining','Scaling'];
const OUTCOMES= ['Freedom','Asset','Both'];
const OWNER_ROLES = ['On tools','Team Leader','Operations Manager','Estimator','Office / Admin'];

/* ═══ THE THRIVE INDEX ════════════════════════════════════════════
   From Thrive_Index_Professional.xlsx. Nine life categories scored
   1–10 now and 1–10 wanted, nine owner-capability dimensions, the
   energising/draining split, the three shifts and the income each
   lifestyle level needs. See CALC-SPEC for the two off-by-one
   defects in the workbook that are corrected here. */
const THRIVE_LIFE = [
  ['Financial freedom','Financial'],
  ['Time freedom / balance','Time'],
  ['Physical health & energy','Health'],
  ['Mental wellbeing','Mind'],
  ['Relationships — family, partner, friends','Relationships'],
  ['Career fulfilment / purpose','Purpose'],
  ['Environment / lifestyle design — where you live, work, play','Environment'],
  ['Growth / learning / progress','Growth'],
  ['Enjoyment / fun / experiences','Fun']
];
const THRIVE_CAP = [
  'Strategic decision-making',
  'Financial literacy & risk judgement',
  'Leadership & people development',
  'Systems thinking — can create scalable processes',
  'Commercial growth capability — sales & BD',
  'Governance & compliance awareness',
  'Emotional resilience & stress tolerance',
  'Ownership mindset — accountability, long-term vision',
  'Ability to step back from day-to-day operations'
];
const THRIVE_LEVELS = ['Current','Comfortable','Thriving','Optimal'];
const THRIVE_SHIFTS = [
  ['financial','Financial shift','e.g. +$2k a week of passive income'],
  ['time','Time shift','e.g. free 10 hours a week through delegation'],
  ['identity','Identity shift','e.g. move from operator to leader']
];

/* ─── org chart geometry and rules ─────────────────────────────────
   The logical canvas. Every coordinate the member drags is stored in this
   space and the SVG viewBox maps it to whatever width it is rendered at. */
const ORG_W = 1200, ORG_BOX_W = 180, ORG_BOX_H = 78, ORG_SNAP = 20;

/* A box exists from the year it appears onwards. */
function orgBoxVisible(b, year){ return b!=null && num(b.from||0) <= num(year); }

/* A link can only be drawn when both ends are on the page — otherwise a Y5
   reporting line would hang off a box that does not exist yet in Y1. */
function orgLinkVisible(l, boxes, year){
  if(!l) return false;
  const a=(boxes||[]).find(b=>b.id===l.a), b2=(boxes||[]).find(b=>b.id===l.b);
  return !!(a && b2 && orgBoxVisible(a,year) && orgBoxVisible(b2,year));
}

/* null on a link means "whatever the chart is set to"; a string overrides it. */
function orgLinkStyle(l, org){
  const s2 = l && l.style;
  return (s2==='straight'||s2==='angled') ? s2
       : (org && org.lineStyle==='straight') ? 'straight' : 'angled';
}

/* Deleting a box has to take its links with it. A link pointing at a box that
   no longer exists would render a line to nowhere, or throw looking for it. */
function orgDeleteBox(org, id){
  if(!org) return org;
  org.boxes = (org.boxes||[]).filter(b=>b.id!==id);
  org.links = (org.links||[]).filter(l=>l.a!==id && l.b!==id);
  return org;
}

function orgNewId(prefix, existing){
  const used = new Set((existing||[]).map(x=>x.id));
  let n=1; while(used.has(prefix+n)) n++;
  return prefix+n;
}

/* What the drawn chart costs, against what the capacity engine says it should.
   The two are allowed to disagree — that disagreement is the point. */
function orgDrawnCost(boxes, year){
  return sum((boxes||[]).filter(b=>orgBoxVisible(b,year)).map(b=>num(b.cost)||0));
}

/* Where a link attaches: out of the bottom of the parent, into the top of the
   child. Angled routes through the midpoint between them so siblings share a
   spine; straight is a single segment. */
function orgLinkPath(a, b, style){
  const x1=num(a.x)+ORG_BOX_W/2, y1=num(a.y)+ORG_BOX_H;
  const x2=num(b.x)+ORG_BOX_W/2, y2=num(b.y);
  if(style==='straight') return `M${x1},${y1} L${x2},${y2}`;
  const my = y2 > y1 ? y1 + (y2-y1)/2 : y1 + 24;
  return `M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`;
}

function orgSnap(v){ return Math.round(num(v)/ORG_SNAP)*ORG_SNAP; }

/* Tall enough for the lowest box, and never shorter than a sensible canvas. */
function orgCanvasH(boxes){
  const low = Math.max(0, ...(boxes||[]).map(b=>num(b.y)+ORG_BOX_H));
  return Math.max(520, low + 60);
}

function defaultState(){
  return {
    v: 1,
    meta:{company:'', owner:'', startMonth:0, startYear:new Date().getFullYear(), currency:'NZD',
          /* blank = the name derived from the start month. Type over any of them. */
          monthNames:Array.from({length:12},()=>'')},
    vision:{
      statement:'',
      biz:{revenue:null, profit:null, value:null, team:null, role:'CEO · Leader · Investor'},
      life:{hours:35, holidays:6, weekends:0, evenings:5, income:null,
            adventures:null, investments:null, whatFor:''},
      /* null on any of these means "use the figure the model derives".
         Type a number and it overrides; clear it and the model takes over again. */
      freedom:{today:null, y5:null, hoursToday:null, hoursY5:null},
      asset:{valueToday:null, valueY5:null, valueCreated:null}
    },
    /* The org chart is drawn by hand from v2.9. One layout, each box tagged with
       the year it appears, so the four year views filter the same chart rather
       than being four charts. Coordinates are in the canvas's logical space
       (ORG_W wide), not pixels — the SVG viewBox scales it to any width, which
       is also how it survives the 688px print column. */
    org:{
      lineStyle:'angled',
      boxes:[], links:[]
    },
    divisionsOn:false,
    divisions:[
      blankDivision('WOB','Whole of Business',true),
      blankDivision('D1','Projects',false),
      blankDivision('D2','Service',false),
      blankDivision('D3','Maintenance',false),
      blankDivision('D4','Commercial',false),
      blankDivision('D5','Residential',false),
      blankDivision('D6','Division F',false),
      blankDivision('D7','Division G',false)
    ],
    targets:{netProfit:0, fixedCosts:0, gpPct:0.35, avgJobValue:0, quoteWin:0.5, leadQuote:0.8},
    fin:{debtorDays:45, wipDays:20, creditorDays:30, capexPct:0.015, taxRate:0.28,
         ownerSalary:0, marketSalary:0, addbacks:0, surplusCash:0, debt:0,
         drawingsAbove:0, debtRepay:0, maxHiresPerQuarter:2,
         roleCost:{onTools:85000, teamLeader:100000, opsManager:110000, estimator:95000, office:70000}},
    wellness:{
      base:{hours:0, onBiz:0, weekends:0, evenings:0, holidays:0, weeksWithout:0, income:0, outside:0, exercise:0, sleep:0},
      targ:{hours:35, onBiz:60, weekends:0, evenings:5, holidays:6, weeksWithout:4, income:0, outside:0, exercise:4, sleep:7.5}
    },
    thrive:{
      life: THRIVE_LIFE.map(()=>({c:null,d:null})),
      cap:  THRIVE_CAP.map(()=>null),
      energy:{energising:null, draining:null, targetEnergising:70, targetDraining:30},
      aim:{financial:'', time:'', identity:''},
      fin: THRIVE_LEVELS.map(l=>({level:l, income:null, shifts:''}))
    },
    ownerRoles:[{role:'On tools',on:false,handover:0},{role:'Team Leader',on:false,handover:0},
                {role:'Operations Manager',on:true,handover:0},{role:'Estimator',on:true,handover:0},
                {role:'Office / Admin',on:false,handover:0}],
    strategies:[],
    plan:blankPlan(),
    oneYear:{ seasonality:Array.from({length:12},()=>1), actuals:Array.from({length:12},()=>({rev:null,gp:null,jobs:null,leads:null,np:null})), rocks:[[],[],[],[]] }
  };
}
let S = defaultState();

/* ═══ §1 BASELINE NORMALISATION ══════════════════════════════════
   Period ratios, never averages of ratios. (Defect #10) */

const entered = m => (num(m.rev)>0 || num(m.gp)>0 || num(m.jobs)>0 || num(m.leads)>0 || num(m.quotes)>0);

/* The member enters GROSS PROFIT, because that is the line printed on a
   Xero / MYOB / QuickBooks P&L. Cost of sales is derived from it.
   Plans saved before v2.3 stored cost of sales instead — those months have
   no gp, so fall back to revenue − cost of sales and nothing is lost. */
const mgp  = m => (m.gp===null||m.gp===undefined||m.gp==='') ? (num(m.rev)-num(m.cos)) : num(m.gp);
const mcos = m => num(m.rev) - mgp(m);

function normalise(dv){
  const ms = dv.months.filter(entered);
  const n  = ms.length;
  const t = {
    rev:sum(ms.map(m=>num(m.rev))), cos:sum(ms.map(mcos)),
    fixed:sum(ms.map(m=>num(m.fixed))), ovh:sum(ms.map(m=>num(m.ovh))),
    jobs:sum(ms.map(m=>num(m.jobs))), quotes:sum(ms.map(m=>num(m.quotes))),
    leads:sum(ms.map(m=>num(m.leads)))
  };
  const gp = t.rev - t.cos;
  const fixedAll = t.fixed + t.ovh;
  const last = ms.length ? ms[ms.length-1] : null;
  const r = {
    n, id:dv.id, name:dv.name, months:ms,
    revenue:t.rev, cos:t.cos, gp, fixedTotal:fixedAll,
    gpPct: div0(gp, t.rev),
    netProfit: gp - fixedAll,
    jobs:t.jobs, quotes:t.quotes, leads:t.leads,
    avgJobValue: div(t.rev, t.jobs),
    quoteWin: div(t.jobs, t.quotes),
    leadQuote: div(t.quotes, t.leads),
    ownerHours: n? sum(ms.map(m=>num(m.ownerHrs)))/n : null,
    onTools: last? num(last.onTools) : 0,
    office:  last? num(last.office)  : 0,
    // monthly run rates
    revenueM: div(t.rev,n), gpM: div(gp,n), fixedM: div(fixedAll,n),
    netProfitM: div(gp-fixedAll,n), jobsM: div(t.jobs,n),
    quotesM: div(t.quotes,n), leadsM: div(t.leads,n), cosM: div(t.cos,n),
    a: dv.a
  };
  // monthly spread on GP% so volatility is visible
  const gps = ms.map(m=> div(mgp(m), num(m.rev))).filter(v=>v!=null).sort((x,y)=>x-y);
  r.gpSpread = gps.length ? {lo:gps[0], mid:gps[Math.floor(gps.length/2)], hi:gps[gps.length-1]} : null;
  return r;
}
function div0(a,b){ return div(a,b); }

function activeDivisions(){
  return S.divisionsOn ? S.divisions.filter(d=>d.active && d.id!=='WOB')
                       : [S.divisions.find(d=>d.id==='WOB')];
}

/* Weighted assumptions — NEVER summed. (Defect #1) */
function weightedAssumptions(norms){
  const keys=['revPerHead','spanTL','spanOM','omThreshold','pricingCapacity','tradesPerOffice','pricingMinutes'];
  const out={}; const wTotal = sum(norms.map(x=>x.revenue));
  keys.forEach(k=>{
    if(wTotal>0) out[k] = sum(norms.map(x=>num(x.a[k])*x.revenue))/wTotal;
    else out[k] = norms.length ? sum(norms.map(x=>num(x.a[k])))/norms.length : 0;
  });
  out.weightBasis = wTotal>0 ? 'weighted by division revenue' : 'simple average — no revenue entered';
  return out;
}

/* Whole-of-business roll-up. Iterates every ACTIVE division, always. (Defect #3) */
function business(){
  const norms = activeDivisions().map(normalise);
  const t = k => sum(norms.map(x=>num(x[k])));
  const n = Math.max(...norms.map(x=>x.n), 0);
  const rev=t('revenue'), cos=t('cos'), gp=rev-cos, fx=t('fixedTotal');
  const jobs=t('jobs'), quotes=t('quotes'), leads=t('leads');
  const b = {
    norms, n, divisions:norms.length,
    revenue:rev, cos, gp, fixedTotal:fx, netProfit:gp-fx,
    gpPct:div(gp,rev), jobs, quotes, leads,
    avgJobValue:div(rev,jobs), quoteWin:div(jobs,quotes), leadQuote:div(quotes,leads),
    onTools:t('onTools'), office:t('office'),
    /* Owner hours belong to the OWNER, not to a department. Average across
       the departments that actually reported them — an empty department must
       not halve the owner's week, because that week feeds the Freedom Score,
       the thesis chart and the guardrails. */
    ownerHours: (()=>{ const h=norms.map(x=>x.ownerHours).filter(v=>v!=null&&Number.isFinite(v));
                       return h.length ? sum(h)/h.length : null; })(),
    revenueM:div(rev,n), cosM:div(cos,n), gpM:div(gp,n), fixedM:div(fx,n),
    netProfitM:div(gp-fx,n), jobsM:div(jobs,n), quotesM:div(quotes,n), leadsM:div(leads,n),
    a: weightedAssumptions(norms)
  };
  // Back-fill: a member who does not count leads still has an implied lead flow.
  b.leadsImplied = false;
  if(!b.leadsM && b.jobsM){
    const wob=S.divisions.find(x=>x.id==='WOB');
    const dt=(activeDivisions()[0]||wob||{t:{}}).t||{};
    const qw=b.quoteWin||num(dt.quoteWin)||1, lq=b.leadQuote||num(dt.leadQuote)||1;
    b.leadsM = div(div(b.jobsM,qw), lq); b.leadsImplied = true;
    b.quotesM = b.quotesM || div(b.jobsM,qw);
    b.quoteWin = b.quoteWin || qw; b.leadQuote = b.leadQuote || lq;
  }
  return b;
}

/* ═══ §2 THE TARGET FUNNEL (backwards from desired profit) ═══════ */
function funnel(t){
  const requiredGP = num(t.netProfit) + num(t.fixedCosts);
  const revenue = div(requiredGP, t.gpPct);
  const jobs    = div(revenue, t.avgJobValue);
  const quotes  = div(jobs, t.quoteWin);
  const leads   = div(quotes, t.leadQuote);
  return {requiredGP, revenue, jobs, quotes, leads,
          netProfit:num(t.netProfit), fixedCosts:num(t.fixedCosts), gpPct:num(t.gpPct),
          avgJobValue:num(t.avgJobValue)||null,
          quoteWin:num(t.quoteWin)||null,
          leadQuote:num(t.leadQuote)||null};
}

/* ═══ §2b CONSOLIDATED VIEW ON BUDGET ════════════════════════════
   Money and volume ADD across divisions. Ratios are re-derived from the
   totals. Assumptions are weighted. Workforce headcount adds. This is the
   distinction the original workbook got wrong. */
function budget(){
  const divs = activeDivisions();
  const per = divs.map(d=>{
    const nz = normalise(d);
    const f  = funnel(d.t);
    const cap= capacity(f.revenue, f.quotes, d.a, {onTools:nz.onTools});
    const capNow = capacity(nz.revenueM, nz.quotesM, d.a, {onTools:nz.onTools});
    return {div:d, nz, f, cap, capNow};
  });
  const T = k => sum(per.map(x=>num(x.f[k])));
  const revenue=T('revenue'), requiredGP=T('requiredGP'), jobs=T('jobs'),
        quotes=T('quotes'), leads=T('leads'),
        netProfit=T('netProfit'), fixedCosts=T('fixedCosts');
  const total = {
    netProfit, fixedCosts, requiredGP, revenue, jobs, quotes, leads,
    gpPct: div(requiredGP, revenue),
    avgJobValue: div(revenue, jobs),
    quoteWin: div(jobs, quotes),
    leadQuote: div(quotes, leads)
  };
  const capKeys=['target','hires','teamLeaders','opsManagers','estimators','office','pricingHours','total'];
  const capTotal={}; capKeys.forEach(k=>capTotal[k]=sum(per.map(x=>num(x.cap[k]))));
  capTotal.needed = sum(per.map(x=>num(x.cap.needed)));
  capTotal.current= sum(per.map(x=>num(x.cap.current)));
  capTotal.util   = div(capTotal.needed, capTotal.target);
  const capNowTotal={}; capKeys.forEach(k=>capNowTotal[k]=sum(per.map(x=>num(x.capNow[k]))));
  return {per, total, capTotal, capNowTotal, b:business()};
}
/* the whole-of-business target, derived from the divisions — replaces S.targets */
function consolidatedTargets(){ return budget().total; }

/* ═══ §3 CAPACITY & HUMAN CAPITAL ════════════════════════════════ */
function capacity(revenueM, quotesM, a, current){
  const needed = div(revenueM, a.revPerHead);
  const target = needed==null ? null : ceil(needed);
  const cur    = num(current&&current.onTools);
  const hires  = target==null ? null : Math.max(0, target - cur);        // Defects #4, #5
  const util   = (needed!=null && target) ? needed/target : null;
  const tl     = target==null ? null : ceil(div(target, a.spanTL)||0);
  const om     = tl==null ? null : (tl < num(a.omThreshold) ? 0 : ceil(div(tl, a.spanOM)||0));
  const ph     = quotesM==null ? null : quotesM * num(a.pricingMinutes)/60;   // quotes, not leads (#13)
  const est    = ph==null ? null : ceil(div(ph, a.pricingCapacity)||0);
  const estUtil= (ph!=null && est) ? ph/(est*num(a.pricingCapacity)) : null;
  const off    = target==null ? null : ceil(div(target, a.tradesPerOffice)||0);
  return {needed, target, current:cur, hires, util, teamLeaders:tl, opsManagers:om,
          pricingHours:ph, estimators:est, estimatorUtil:estUtil, office:off,
          total:(target||0)+(tl||0)+(om||0)+(est||0)+(off||0)};
}

/* ═══ §4 STRATEGY RAMP ═══════════════════════════════════════════ */
function ramp(s, month){
  const a=num(s.startMonth)||1, b=num(s.fullMonth)||a;
  if(month < a) return 0;
  if(month >= b) return 1;
  const t = (month-a)/Math.max(1,(b-a));
  return s.ramp==='s' ? 0.5 - 0.5*Math.cos(Math.PI*t) : t;
}
/* One plan. A strategy is either in it or parked. */
const planStrategies = () => S.strategies.filter(s => s.on !== false);

/* ═══ §5 FORWARD PROJECTION — 60 months, drivers first ═══════════
   Revenue is never projected directly. Drivers are projected and
   revenue falls out of them. That is what makes this deterministic. */

function seasonIndex(i){
  const w = S.oneYear.seasonality.map(num);
  const tot = sum(w);
  if(tot<=0) return 1;
  return (w[i]/tot)*12;
}

function projectMonthly(){
  const b = business(), a = b.a, sc = S.plan;
  const CT = consolidatedTargets();
  const base = {
    leads:  b.leadsM || 0,
    leadQuote: b.leadQuote!=null ? b.leadQuote : num(CT.leadQuote),
    quoteWin:  b.quoteWin !=null ? b.quoteWin  : num(CT.quoteWin),
    ajv:    b.avgJobValue || num(CT.avgJobValue),
    gpPct:  b.gpPct!=null ? b.gpPct : num(CT.gpPct),
    fixed:  b.fixedM || 0,
    revPerHead: num(a.revPerHead)||25000,
    ownerHours: b.ownerHours!=null ? b.ownerHours : num(S.wellness.base.hours)
  };
  const strats = planStrategies();
  const rows = [];
  for(let m=1; m<=60; m++){
    const y = Math.ceil(m/12);
    let mkt=1, price=1, ovh=1;
    for(let k=1; k<=y; k++){
      const mm = sc.macro[k-1] || blankMacro();
      mkt   *= 1+num(mm.market);
      price *= 1+num(mm.price);
      ovh   *= 1+num(mm.ovh);
    }
    let d = {
      leads: base.leads*mkt, leadQuote: base.leadQuote, quoteWin: base.quoteWin,
      ajv: base.ajv*price, gpPct: base.gpPct, fixed: base.fixed*ovh,
      revPerHead: base.revPerHead*price, ownerHours: base.ownerHours
    };
    let stratCost = 0;
    for(const s of strats){
      const r = ramp(s,m); if(r<=0) continue;
      const w = r * (num(s.confidence)/100);
      stratCost += num(s.cost);
      for(const lv of (s.levers||[])){
        const v = num(lv.value)*w;
        switch(lv.driver){
          case 'leads':       d.leads += v; break;
          case 'leadQuote':   d.leadQuote += v/100; break;
          case 'quoteWin':    d.quoteWin += v/100; break;
          case 'avgJobValue': d.ajv += v; break;
          case 'gpPct':       d.gpPct += v/100; break;
          case 'fixedCosts':  d.fixed += v; break;
          case 'revPerHead':  d.revPerHead += v; break;
          case 'ownerHours':  d.ownerHours += v; break;
        }
      }
    }
    d.gpPct     = clamp(0, 0.90, d.gpPct);
    d.leadQuote = clamp(0, 1, d.leadQuote);
    d.quoteWin  = clamp(0, 1, d.quoteWin);
    d.leads     = Math.max(0, d.leads);
    d.ajv       = Math.max(0, d.ajv);
    d.ownerHours= Math.max(0, d.ownerHours);
    d.revPerHead= Math.max(1, d.revPerHead);

    const si     = seasonIndex((m-1)%12);
    const leadsM = d.leads*si;
    const quotes = leadsM*d.leadQuote;
    const jobs   = quotes*d.quoteWin;
    const rev    = jobs*d.ajv;
    const gp     = rev*d.gpPct;
    const fixed  = d.fixed + stratCost;
    rows.push({m, y, si, d:Object.assign({},d), leads:leadsM, quotes, jobs,
               rev, gp, cos:rev-gp, fixed, np:gp-fixed, stratCost});
  }
  return {rows, base, b, a};
}

/* ═══ §6 ANNUAL AGGREGATION, CASH, VALUE, FREEDOM ════════════════ */
function project(){
  const p = projectMonthly();
  const b = p.b, sc = S.plan, f = S.fin;
  const years = [];
  // Year 0 = the baseline, annualised.
  const y0 = {
    y:0, label:'Today', rev:(b.revenueM||0)*12, gp:(b.gpM||0)*12, cos:(b.cosM||0)*12,
    fixed:(b.fixedM||0)*12, np:(b.netProfitM||0)*12,
    gpPct:b.gpPct, jobs:(b.jobsM||0)*12, quotes:(b.quotesM||0)*12, leads:(b.leadsM||0)*12,
    ajv:b.avgJobValue, quoteWin:b.quoteWin, leadQuote:b.leadQuote,
    ownerHours:b.ownerHours, revenueM:b.revenueM||0, quotesM:b.quotesM||0
  };
  y0.cap = capacity(y0.revenueM, y0.quotesM, b.a, {onTools:b.onTools});
  y0.ebitda = ebitdaOf(y0.np);
  y0.value  = valueOf(y0.ebitda, sc.multiple);
  y0.cash   = null;
  y0.freedom= freedomAt(0, y0.ownerHours);
  years.push(y0);

  for(let y=1; y<=5; y++){
    const R = p.rows.filter(r=>r.y===y);
    const last = R[R.length-1];
    const rev=sum(R.map(r=>r.rev)), gp=sum(R.map(r=>r.gp)), cos=sum(R.map(r=>r.cos));
    const fixed=sum(R.map(r=>r.fixed)), np=gp-fixed;
    const o = {
      y, label:'Year '+y, rev, gp, cos, fixed, np,
      gpPct:div(gp,rev), jobs:sum(R.map(r=>r.jobs)), quotes:sum(R.map(r=>r.quotes)),
      leads:sum(R.map(r=>r.leads)),
      ajv:last.d.ajv, quoteWin:last.d.quoteWin, leadQuote:last.d.leadQuote,
      ownerHours:last.d.ownerHours,
      revenueM:(last.si>0.01? last.rev/last.si : rev/12), quotesM:(last.si>0.01? last.quotes/last.si : sum(R.map(r=>r.quotes))/12),
      months:R
    };
    const ay = Object.assign({}, b.a, {revPerHead:last.d.revPerHead});
    o.cap = capacity(o.revenueM, o.quotesM, ay, {onTools: years[y-1].cap.target || b.onTools});
    o.ebitda = ebitdaOf(np);
    o.value  = valueOf(o.ebitda, sc.multiple);
    // cash
    const prev = years[y-1];
    const dRev = rev - prev.rev, dCos = cos - prev.cos;
    o.dwc   = (dRev/365)*(num(f.debtorDays)+num(f.wipDays)) - (dCos/365)*num(f.creditorDays);
    o.tax   = Math.max(0, np)*num(f.taxRate);
    o.capex = rev*num(f.capexPct);
    o.cash  = o.ebitda - o.tax - o.capex - o.dwc - num(f.debtRepay) - num(f.drawingsAbove);
    o.freedom = freedomAt(y, o.ownerHours);
    years.push(o);
  }
  let cum=0; years.forEach(y=>{ if(y.y>0){ cum+=y.cash; y.cumCash=cum; } else y.cumCash=0; });
  return {years, rows:p.rows, b, plan:sc};
}

function ebitdaOf(netProfitAnnual){
  const f=S.fin;
  return netProfitAnnual + num(f.ownerSalary) - num(f.marketSalary) + num(f.addbacks);
}
function valueOf(ebitda, multiple){
  const f=S.fin;
  const ev = ebitda * num(multiple);
  return {ebitda, multiple:num(multiple), ev, equity: ev + num(f.surplusCash) - num(f.debt)};
}

/* Freedom Score — components normalised against the member's own baseline and target.
   Handles both directions; guards target === baseline. */
const FREEDOM_COMPONENTS = [
  {k:'hours',       w:.25, label:'Owner hours per week',        lower:true},
  {k:'weeksWithout',w:.20, label:'Weeks business runs without you'},
  {k:'income',      w:.15, label:'Personal income drawn'},
  {k:'onBiz',       w:.10, label:'Hours ON the business (%)'},
  {k:'holidays',    w:.10, label:'Weeks of holiday taken'},
  {k:'weekends',    w:.10, label:'Weekends worked per month',   lower:true},
  {k:'evenings',    w:.10, label:'Evenings home per week'}
];
function comp(actual, worst, target){
  if(actual==null) return null;
  if(target===worst) return 100;
  return clamp(0, 100, 100*(actual-worst)/(target-worst));
}
function freedomAt(y, projectedHours){
  const B=S.wellness.base, T=S.wellness.targ, parts=[];
  let score=0, wUsed=0;
  FREEDOM_COMPONENTS.forEach(c=>{
    const b=num(B[c.k]), t=num(T[c.k]);
    let actual;
    if(c.k==='hours' && projectedHours!=null) actual = projectedHours;      // modelled, not interpolated
    else actual = b + (t-b)*(y/5);                                          // interpolated Y0→Y5
    const v = comp(actual,b,t);
    parts.push({label:c.label, weight:c.w, actual, value:v, lower:!!c.lower, base:b, target:t});
    if(v!=null){ score += v*c.w; wUsed += c.w; }
  });
  return {score: wUsed>0 ? score/wUsed : null, parts};
}

/* ═══ §6b THE VISION FIGURES ═════════════════════════════════════
   Every headline on the Vision tab is derived from the model but can be
   typed over. One place decides which wins, so the Vision tab and the
   Horizon tab can never disagree with each other. */
function visionFigures(pr){
  const V = S.vision, y0 = pr.years[0], y5 = pr.years[5];
  const ovr = (v,d) => (v===null||v===undefined||v==='') ? d : num(v);
  const wellnessSet = Object.keys(S.wellness.base).some(k=>num(S.wellness.base[k])>0);
  const s0 = v => (!wellnessSet || v==null || !Number.isFinite(v)) ? 0 : v;

  const fToday = ovr(V.freedom.today, s0(y0.freedom.score));
  const fY5    = ovr(V.freedom.y5,    s0(y5.freedom.score));
  const hToday = ovr(V.freedom.hoursToday, y0.ownerHours);
  const hY5    = ovr(V.freedom.hoursY5,    y5.ownerHours);
  const vToday = ovr(V.asset.valueToday, y0.value.equity);
  const vY5    = ovr(V.asset.valueY5,    y5.value.equity);
  const createdDerived = (vY5!=null && vToday!=null) ? vY5-vToday : null;
  const created = ovr(V.asset.valueCreated, createdDerived);
  const dh = (hToday!=null && hY5!=null) ? hToday-hY5 : null;
  const perHour = (created!=null && dh) ? created/(dh*48) : null;

  return {ovr, wellnessSet, s0, y0, y5,
          fToday, fY5, hToday, hY5, vToday, vY5, createdDerived, created, dh, perHour,
          scoreToday:s0(y0.freedom.score), scoreY5:s0(y5.freedom.score)};
}

/* ═══ §6c THRIVE INDEX SCORING ═══════════════════════════════════
   TIS = sum of the nine "current" scores ÷ 90, as a percentage, exactly
   as the workbook computed it. Two things the workbook got wrong are
   fixed here:
     · Calculations!G3 read Owner_Capability!B1 — the column HEADER —
       so every capability score was shifted a row, the text header was
       summed as a value, and the ninth dimension was never read at all.
     · Calculations!K2 read Time_Energy!B1, the header, for the same
       reason.
   And a blank sheet scored 0.0% / "Surviving" because SUM() of empty
   cells returns 0, never "", so the IF guard could not fire. Nothing
   is scored here until something is entered. */
const tvals = a => a.filter(v=>v!==null&&v!==undefined&&v!=='').map(num);

function thriveScores(){
  const T = S.thrive, MAX = THRIVE_LIFE.length*10;   // 90
  const cur = tvals(T.life.map(x=>x.c));
  const des = tvals(T.life.map(x=>x.d));
  const tis  = cur.length ? sum(cur)/MAX*100 : null;
  const tisD = des.length ? sum(des)/MAX*100 : null;
  const level = v => v==null ? null
    : v<40?'Surviving' : v<60?'Stable' : v<80?'Comfortable' : v<90?'Thriving' : 'Optimal';
  const toNext = v => v==null ? null
    : v<40?40-v : v<60?60-v : v<80?80-v : v<90?90-v : 0;

  const capV = tvals(T.cap);
  const capTotal = capV.length ? sum(capV) : null;
  const capBand = capTotal==null ? null
    : capTotal<40?'Emerging operator' : capTotal<60?'Capable manager'
    : capTotal<80?'Growth leader' : 'Director-ready';

  const gaps = THRIVE_LIFE.map((L,i)=>{
    const c=T.life[i].c, d=T.life[i].d;
    const has = c!==null&&c!==''&&d!==null&&d!=='';
    return {i, label:L[0], short:L[1], c:(c===''||c==null)?null:num(c),
            d:(d===''||d==null)?null:num(d), gap: has ? num(d)-num(c) : null};
  });
  const en = T.energy.energising;
  const energising = (en===''||en==null)?null:clamp(0,100,num(en));
  /* The two halves of a week make one week. Draining is never typed — it is
     whatever energising leaves behind, so the pair can never fail to add up. */
  const draining   = energising==null ? null : 100-energising;
  const targetEnergising = (T.energy.targetEnergising===''||T.energy.targetEnergising==null)
                           ? null : clamp(0,100,num(T.energy.targetEnergising));
  const targetDraining   = targetEnergising==null ? null : 100-targetEnergising;

  return {
    tis, tisD, level:level(tis), levelD:level(tisD), toNext:toNext(tis),
    lift: (tis!=null&&tisD!=null) ? tisD-tis : null,
    counted:cur.length, of:THRIVE_LIFE.length,
    capTotal, capBand, capCounted:capV.length, capMax:THRIVE_CAP.length*10,
    gaps, biggest:[...gaps].filter(g=>g.gap!=null&&g.gap>0).sort((a,b)=>b.gap-a.gap),
    energising, draining, targetEnergising, targetDraining,
    energyGap: (energising==null||targetEnergising==null) ? null : energising-targetEnergising
  };
}

/* ═══ §7 GUARDRAILS & CONTRADICTIONS ═════════════════════════════ */
function guardrails(pr){
  const out=[], f=S.fin;
  const maxH = num(f.maxHiresPerQuarter)*4;
  pr.years.forEach((y,i)=>{
    if(!y.y) return;
    const prev=pr.years[i-1];
    const hires=(y.cap.target||0)-(prev.cap.target||0);
    if(maxH>0 && hires>maxH) out.push({lvl:'warn',t:'Hiring rate',
      m:`Year ${y.y} adds ${hires} on-tools people — above your limit of ${maxH} a year (${f.maxHiresPerQuarter} a quarter).`});
    if(y.gpPct!=null && prev.gpPct!=null && (y.gpPct-prev.gpPct)>0.03) out.push({lvl:'warn',t:'Margin jump',
      m:`Gross margin improves ${pp(y.gpPct-prev.gpPct)} in Year ${y.y}. More than 3pp in one year is rare — check the strategy behind it.`});
    const fphNow=div(y.fixed,y.cap.total), fphPrev=div(prev.fixed,prev.cap.total);
    if(fphNow!=null && fphPrev!=null && fphNow<fphPrev*0.97) out.push({lvl:'warn',t:'Fixed cost per head falls',
      m:`Year ${y.y} fixed cost per person drops from ${money(fphPrev)} to ${money(fphNow)}. Usually an input error.`});
    if(y.cumCash<0) out.push({lvl:'bad',t:'Unfunded growth',
      m:`This plan needs ${money(Math.abs(y.cumCash))} of funding by Year ${y.y}. Growth that cannot be funded is not a plan.`});
  });
  // the contradiction that matters most
  const y3 = pr.years[3], b = pr.b;
  const held = S.ownerRoles.filter(r=>r.on && (num(r.handover)===0 || num(r.handover)>3));
  if(y3 && b.ownerHours && y3.ownerHours < b.ownerHours*0.85 && held.length){
    const est = held.find(r=>r.role==='Estimator');
    const ph = y3.cap.pricingHours;
    out.push({lvl:'bad', t:'The plan and the life contradict each other',
      m: est && ph
        ? `The plan has you at ${n1(y3.ownerHours)} hours a week in Year 3, but you're still the estimator and ${n0(ph)} pricing hours a month have nowhere else to go. Either hire, or the hours don't fall.`
        : `The plan has you at ${n1(y3.ownerHours)} hours a week in Year 3, but you still hold ${held.map(r=>r.role).join(', ')} with no handover planned. Either hand it over, or the hours don't fall.`});
  }
  return out;
}

/* ═══ §8 ORG CHART ═══════════════════════════════════════════════ */
function orgAt(pr, y){
  const yr = pr.years.find(x=>x.y===y) || pr.years[0];
  const c = yr.cap, f=S.fin, RC=f.roleCost||{};
  const ownerHas = role => {
    const r = S.ownerRoles.find(x=>x.role===role);
    return !!(r && r.on && (num(r.handover)===0 || num(r.handover)>y));
  };
  const mk=(n,role,cost,bucket)=>Array.from({length:n||0},(_,i)=>
    ({role, name:'Vacant', cost:num(cost), bucket, owner:ownerHas(role)&&i===0}));
  const rows = [
    {tier:'Owner', boxes:[{role:(y>=3?'CEO':'Owner / CEO'), name:S.meta.owner||'You', cost:num(f.ownerSalary), bucket:'fixed', owner:false}]},
    {tier:'Leadership', boxes:[
      ...mk(c.opsManagers,'Operations Manager',RC.opsManager,'fixed'),
      ...mk(c.estimators,'Estimator',RC.estimator,'fixed'),
      ...mk(c.office,'Office / Admin',RC.office,'fixed')
    ]},
    {tier:'Team Leaders', boxes:mk(c.teamLeaders,'Team Leader',RC.teamLeader,'cos')},
    {tier:'On tools', boxes:[{role:'On-tools team', name:(c.target||0)+' people',
      cost:(c.target||0)*num(RC.onTools), bucket:'cos', owner:ownerHas('On tools'), group:true}]}
  ];
  const all = rows.flatMap(r=>r.boxes);
  const ownerCount = all.filter(b=>b.owner).length;
  const peopleCost = all.reduce((t,b)=>t+num(b.cost),0);
  const costFixed  = all.filter(b=>b.bucket==='fixed').reduce((t,b)=>t+num(b.cost),0);
  const costCos    = all.filter(b=>b.bucket==='cos').reduce((t,b)=>t+num(b.cost),0);
  return {rows, ownerCount, peopleCost, costFixed, costCos, year:y, cap:c};
}
