/* ═══ §APP — routing, events, persistence ═══════════════════════ */

const RENDERERS = {vision:renderVision, baseline:renderBaseline, metrics:renderMetrics,
  budget:renderBudget, strategies:renderStrategies, scenarios:renderScenarios,
  fiveyear:renderFiveYear, oneyear:renderOneYear, consolidated:renderConsolidated,
  org:renderOrg, settings:renderSettings};

let dirty=false, fileHandle=null;

function toast(msg, ms){
  const t=$('#toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'), ms||3200);
}
function markDirty(){ dirty=true; paintSave(); }
function paintSave(){
  const el=$('#savestat');
  if(dirty){ el.textContent='Unsaved changes'; el.className='savestat dirty'; }
  else { el.textContent = fileHandle ? 'Saved' : 'Not linked'; el.className='savestat'; }
}

function render(all){
  CURSYM = {NZD:'$',AUD:'$',GBP:'£',USD:'$'}[S.meta.currency]||'$';
  const ids = all ? Object.keys(RENDERERS) : [UI.tab];
  ids.forEach(k=>{
    const el=document.getElementById('tab-'+k); if(!el) return;
    try{ el.innerHTML = RENDERERS[k](); }
    catch(e){ el.innerHTML=`<div class="alert bad" style="margin-top:40px"><div><b>This tab could not be drawn</b>${esc(e.message)}</div></div>`; console.error(k,e); }
  });
  $$('.tab').forEach(t=>t.classList.toggle('on', t.id==='tab-'+UI.tab));
  $$('#rail a').forEach(a=>a.classList.toggle('on', a.dataset.tab===UI.tab));
  $$('#scenseg button').forEach(b=>b.classList.toggle('on', b.dataset.scen===S.active));
  drawCharts();
  runTweens(document);
}
function go(tab){ UI.tab=tab; render(); window.scrollTo({top:0,behavior:'smooth'}); }

/* ─── input handling ───────────────────────────────────────────── */
function readValue(el){
  const kind=el.dataset.kind||'num';
  if(kind==='str') return el.value;
  if(kind==='pct') return num(el.value)/100;
  return num(el.value);
}
function setSPath(p,val){
  const ks=p.split('.'); const i=+ks.shift(); const last=ks.pop();
  const o=ks.reduce((o,k)=> o[/^\d+$/.test(k)?+k:k], S.strategies[i]);
  o[/^\d+$/.test(last)?+last:last]=val;
}
document.addEventListener('input', e=>{
  const el=e.target; let touched=false;
  if(el.dataset.path!=null){ setPath(el.dataset.path, readValue(el)); touched=true; }
  else if(el.dataset.spath!=null){
    const isNum = /\.(value|confidence|startMonth|fullMonth|cost)$/.test(el.dataset.spath);
    setSPath(el.dataset.spath, isNum?num(el.value):el.value); touched=true;
  }
  else if(el.dataset.grid!=null){
    const d=S.divisions.find(x=>x.id===el.dataset.grid);
    if(d){ d.months[+el.dataset.m][el.dataset.k]=num(el.value); touched=true; }
  }
  else if(el.dataset.seas!=null){ S.oneYear.seasonality[+el.dataset.seas]=num(el.value); touched=true; }
  else if(el.dataset.act!=null){
    const [i,k]=el.dataset.act.split('|');
    S.oneYear.actuals[+i][k]= el.value===''?null:num(el.value); touched=true;
  }
  else if(el.dataset.rock!=null){
    const [q,j,k]=el.dataset.rock.split('|');
    S.oneYear.rocks[+q][+j][k]=el.value; touched=true;
  }
  else if(el.dataset.orole!=null){
    const [i,k]=el.dataset.orole.split('|');
    S.ownerRoles[+i][k]= k==='on'?el.checked:num(el.value); touched=true;
  }
  else if(el.dataset.divname!=null){
    const d=S.divisions.find(x=>x.id===el.dataset.divname); if(d){ d.name=el.value; touched=true; }
  }
  if(!touched) return;
  markDirty();
  scheduleLiveRender(el);
});
/* live recalc without stealing focus: re-render everything except the field being typed in */
let liveTimer=null;
function scheduleLiveRender(el){
  clearTimeout(liveTimer);
  liveTimer=setTimeout(()=>{
    const key = el.dataset.path||el.dataset.spath||el.dataset.grid||el.dataset.seas||el.dataset.act||el.dataset.rock||el.dataset.orole||el.dataset.divname;
    const sel = el.selectionStart, selEnd = el.selectionEnd, id=el.dataset;
    render();
    const back = findSame(id);
    if(back){ back.focus(); try{ back.setSelectionRange(sel,selEnd); }catch(_){} }
  }, 260);
}
function findSame(d){
  for(const k of ['path','spath','seas','divname']) if(d[k]!=null) return document.querySelector(`[data-${k}="${CSS.escape(d[k])}"]`);
  if(d.grid!=null) return document.querySelector(`[data-grid="${CSS.escape(d.grid)}"][data-m="${d.m}"][data-k="${d.k}"]`);
  for(const k of ['act','rock','orole']) if(d[k]!=null) return document.querySelector(`[data-${k}="${CSS.escape(d[k])}"]`);
  return null;
}
document.addEventListener('change', e=>{
  const el=e.target;
  if(el.dataset.divactive!=null){
    const d=S.divisions.find(x=>x.id===el.dataset.divactive); if(d) d.active=el.checked;
    markDirty(); render(); return;
  }
  if(el.dataset.srefined!=null){
    const s=S.strategies[+el.dataset.srefined]; s.refined=el.checked;
    if(!s.refined && s.stage==='Scaling') s.stage='Refining';
    markDirty(); render(); return;
  }
  if(el.dataset.stage!=null){
    const s=S.strategies[+el.dataset.stage];
    if(el.value==='Scaling' && !s.refined){
      s.stage='Refining';
      toast('Refine before you scale. Scaling an unrefined process adds revenue and loses freedom — it fails both outcomes.', 6000);
      markDirty(); render(); return;
    }
  }
  if(el.id==='togDivisions'){
    S.divisionsOn=el.checked;
    if(S.divisionsOn && !S.divisions.some(d=>d.active && d.id!=='WOB')){
      const withData=S.divisions.filter(d=>d.id!=='WOB' && d.months.some(entered));
      if(withData.length) withData.forEach(d=>d.active=true);
      else { const d=S.divisions.find(x=>x.id==='D1'); if(d) d.active=true; }
      toast('Divisions on. '+S.divisions.filter(d=>d.active&&d.id!=='WOB').length+
            ' switched on — turn others on from the Budget or Baseline tab.', 5000);
    }
    markDirty(); render(true); return; }
  if(el.dataset.path!=null || el.dataset.spath!=null){ clearTimeout(liveTimer); render(); }
});

/* ─── clicks ───────────────────────────────────────────────────── */
document.addEventListener('click', e=>{
  const t=e.target.closest('[data-tab],[data-scen],[data-divsel],[data-orgyear],[data-delstrat],[data-addlever],[data-dellever],[data-stogscen],[data-addrock],[data-delrock],button');
  if(!t) return;
  const d=t.dataset;
  if(d.tab){ go(d.tab); return; }
  if(d.scen){ S.active=d.scen; render(true); return; }
  if(d.divsel){ UI.div=d.divsel; render(); return; }
  if(d.orgyear!=null){ UI.orgYear=+d.orgyear; render(); return; }
  if(d.delstrat!=null){ S.strategies.splice(+d.delstrat,1); markDirty(); render(); return; }
  if(d.addlever!=null){ const s=S.strategies[+d.addlever]; (s.levers=s.levers||[]).push({driver:'gpPct',value:1}); markDirty(); render(); return; }
  if(d.dellever!=null){ const [i,j]=d.dellever.split('|'); S.strategies[+i].levers.splice(+j,1); markDirty(); render(); return; }
  if(d.stogscen){ const [i,k]=d.stogscen.split('|'); const s=S.strategies[+i];
    s.scenarios=s.scenarios||[]; const at=s.scenarios.indexOf(k);
    if(at>=0) s.scenarios.splice(at,1); else s.scenarios.push(k);
    markDirty(); render(); return; }
  if(d.seaspreset){
    if(d.seaspreset==='baseline') seasonalityFromBaseline();
    else { S.oneYear.seasonality=rotateToStart(SEASON_PRESETS[d.seaspreset].slice()); markDirty(); render();
           toast(d.seaspreset==='flat'?'Every month set to an equal 8.3%.':'Seasonal shape applied — adjust any month to match your own year.'); }
    return; }
  if(d.addrock!=null){ S.oneYear.rocks[+d.addrock].push({text:'',owner:'',done:false}); markDirty(); render(); return; }
  if(d.delrock!=null){ const [q,j]=d.delrock.split('|'); S.oneYear.rocks[+q].splice(+j,1); markDirty(); render(); return; }

  switch(t.id){
    case 'btnAddStrat': addStrategy(); break;
    case 'btnStratLib': openLibrary(); break;
    case 'btnDemo': loadDemo(); break;
    case 'btnPaste': openPaste(); break;
    case 'btnSeasNorm': {
      const t=sum(S.oneYear.seasonality.map(num));
      if(t>0){ S.oneYear.seasonality=S.oneYear.seasonality.map(v=>num(v)/t*12); markDirty(); render();
               toast('Rebalanced so the twelve months average 1.00× — the shape is unchanged.'); }
      break; }
    case 'btnSave': doSave(); break;
    case 'btnSaveAs': doSaveAs(); break;
    case 'btnLoad': $('#fileIn').click(); break;
    case 'btnPrint': printPack(); break;
    case 'btnSelfTest': runSelfTest(); break;
    case 'btnExportCsv': exportCsv(); break;
    case 'btnReset': if(confirm('Reset everything back to an empty plan?')){ S=defaultState(); markDirty(); render(true); } break;
  }
});

/* ─── strategies ───────────────────────────────────────────────── */
function addStrategy(preset){
  S.strategies.push(Object.assign({
    name:'', domain:'Marketing', outcome:'Both', stage:'Strategy', shift:'', owner:S.meta.owner||'',
    startMonth:1, fullMonth:12, ramp:'linear', confidence:70, cost:0, refined:false,
    scenarios:[S.active], levers:[]
  }, preset||{}));
  markDirty(); render();
  setTimeout(()=>{ const c=$$('.card[data-si]').pop(); if(c) c.querySelector('input').focus(); },40);
}
const LIBRARY = [
  {name:'Price for margin — job costing on every job', domain:'Profitability & Financial Oversight', outcome:'Both',
   shift:'Owner-Operator → CEO: I price from the numbers, not from what I think they will pay.',
   levers:[{driver:'gpPct',value:2}], cost:400},
  {name:'A sales process behind every quote', domain:'Sales', outcome:'Asset',
   shift:'Owner-Operator → Leader: the follow-up is a system, not my memory.',
   levers:[{driver:'quoteWin',value:8}], cost:600},
  {name:'Marketing engine — double the lead flow', domain:'Marketing', outcome:'Asset',
   shift:'Owner-Operator → CEO: leads are bought deliberately, not hoped for.',
   levers:[{driver:'leads',value:25}], cost:4000},
  {name:'Raise the average job value', domain:'Sales', outcome:'Both',
   shift:'Owner-Operator → Investor: I sell the outcome, not the hour.',
   levers:[{driver:'avgJobValue',value:600}], cost:0},
  {name:'Second crew, led by a team leader', domain:'Human Capital', outcome:'Asset',
   shift:'Owner-Operator → Leader: I build the person who runs the crew.',
   levers:[{driver:'revPerHead',value:2000},{driver:'fixedCosts',value:6000}], cost:0},
  {name:'Get out of the estimating seat', domain:'Workflow / Operations', outcome:'Freedom',
   shift:'Owner-Operator → CEO: someone else prices, to my standard.',
   levers:[{driver:'ownerHours',value:-8},{driver:'fixedCosts',value:7500}], cost:0},
  {name:'Build the leadership layer', domain:'Culture', outcome:'Freedom',
   shift:'Owner-Operator → Leader: I grow people, set standards, and hold the line on them.',
   levers:[{driver:'ownerHours',value:-6},{driver:'fixedCosts',value:9000}], cost:0}
];
function openLibrary(){
  overlay(`<h3 style="font-family:var(--serif);font-size:24px;margin:0 0 4px">The seven</h3>
    <div class="tiny" style="margin-bottom:16px">Starting points drawn from the Boardroom work. Add one, then set the lever to your own numbers.</div>
    ${LIBRARY.map((l,i)=>`<div class="lever" style="border-top:1px solid var(--rule);padding:11px 0">
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${esc(l.name)}</div>
      <div class="tiny">${esc(l.domain)} · ${esc(l.outcome)} · ${l.levers.map(x=>esc(DRIVERS[x.driver].fmt(x.value))).join(' · ')}</div></div>
      <button class="btn sm accent" data-lib="${i}">Add</button></div>`).join('')}`,
    root=>{ $$('[data-lib]',root).forEach(b=>b.onclick=()=>{ addStrategy(JSON.parse(JSON.stringify(LIBRARY[+b.dataset.lib]))); closeOverlay(); }); });
}

/* ─── overlay ──────────────────────────────────────────────────── */
function overlay(html, after){
  closeOverlay();
  const o=document.createElement('div');
  o.id='ovl';
  o.style.cssText='position:fixed;inset:0;background:rgba(14,26,34,.42);z-index:150;display:flex;align-items:center;justify-content:center;padding:24px';
  o.innerHTML=`<div style="background:var(--paper-2);border-radius:14px;padding:26px 28px;max-width:640px;width:100%;max-height:84vh;overflow:auto;box-shadow:0 20px 60px rgba(14,26,34,.3)">${html}
    <div class="btnrow" style="justify-content:flex-end"><button class="btn" id="ovlClose">Close</button></div></div>`;
  document.body.appendChild(o);
  o.addEventListener('click',ev=>{ if(ev.target===o||ev.target.id==='ovlClose') closeOverlay(); });
  if(after) after(o);
}
function closeOverlay(){ const o=$('#ovl'); if(o) o.remove(); }
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeOverlay();
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); doSave(); }
});

/* ─── paste from spreadsheet ───────────────────────────────────── */
function openPaste(){
  overlay(`<h3 style="font-family:var(--serif);font-size:24px;margin:0 0 4px">Paste from a spreadsheet</h3>
    <div class="tiny" style="margin-bottom:12px">Paste rows in this order, twelve columns each, tabs or commas between them. Blank lines are skipped. Order: revenue, cost of sales, fixed costs, overhead, jobs, quotes, leads, owner hours, on-tools, office.</div>
    <textarea id="pasteBox" class="full" style="min-height:180px;font-family:ui-monospace,monospace;font-size:12px" placeholder="180000&#9;192000&#9;…"></textarea>
    <div class="btnrow"><button class="btn accent" id="pasteGo">Bring it in</button></div>`,
    root=>{ root.querySelector('#pasteGo').onclick=()=>{
      const txt=root.querySelector('#pasteBox').value;
      const keys=['rev','cos','fixed','ovh','jobs','quotes','leads','ownerHrs','onTools','office'];
      const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const dv=currentDivision(); let n=0;
      lines.forEach((line,i)=>{
        if(i>=keys.length) return;
        const cells=line.split(/[\t,;]+/).map(c=>num(c));
        for(let m=0;m<12 && m<cells.length;m++){ dv.months[m][keys[i]]=cells[m]; }
        n++;
      });
      closeOverlay(); markDirty(); render();
      toast(n?`Brought in ${n} row${n===1?'':'s'}.`:'Nothing recognised in that paste.');
    };});
}
function seasonalityFromBaseline(quiet){
  const dv=business().norms;
  const tot=Array.from({length:12},(_,i)=>sum(dv.map(d=>{
    const src=S.divisions.find(x=>x.id===d.id); return src?num(src.months[i].rev):0;
  })));
  const t=sum(tot);
  if(t<=0){ if(!quiet) toast('No monthly revenue in the baseline yet.'); return; }
  S.oneYear.seasonality=tot.map(v=>v/t*12);
  if(quiet) return;
  markDirty(); render();
  toast('Seasonality taken from your baseline revenue — the shape of your actual year.');
}

/* ─── demo data ────────────────────────────────────────────────── */
function loadDemo(){
  const dv=currentDivision();
  const rev=[176000,168000,201000,214000,232000,241000,198000,186000,223000,239000,246000,209000];
  rev.forEach((r,i)=>{
    const m=dv.months[i];
    m.rev=r; m.cos=Math.round(r*(0.655+((i%3)-1)*0.012));
    m.fixed=41000+ (i>5?2500:0); m.ovh=9500;
    m.jobs=Math.round(r/8400); m.quotes=Math.round(r/8400/0.46);
    m.leads=Math.round(r/8400/0.46/0.78);
    m.ownerHrs=63-i*0.3; m.onTools=7+(i>7?1:0); m.office=2;
  });
  // split the same business across two departments so divisions mode has real data
  const d1=S.divisions.find(x=>x.id==='D1'), d2=S.divisions.find(x=>x.id==='D2');
  [[d1,0.62],[d2,0.38]].forEach(([dd,sh])=>{
    dv.months.forEach((m,i)=>{
      Object.keys(m).forEach(k=>{ dd.months[i][k] = (k==='ownerHrs') ? num(m[k])*(sh>0.5?0.6:0.4)
        : Math.round(num(m[k])*sh*100)/100; });
    });
  });
  d1.active=true; d2.active=true;
  d1.a.pricingMinutes=300; d1.a.revPerHead=27000;
  d2.a.pricingMinutes=60;  d2.a.revPerHead=22000;
  d1.t={netProfit:24000, fixedCosts:32000, gpPct:0.36, avgJobValue:16000, quoteWin:0.42, leadQuote:0.85};
  d2.t={netProfit:14000, fixedCosts:20000, gpPct:0.41, avgJobValue:4200,  quoteWin:0.68, leadQuote:0.85};
  const b=business();
  dv.t={netProfit:38000, fixedCosts:52000, gpPct:0.38, avgJobValue:9500, quoteWin:0.55, leadQuote:0.85};
  S.targets={netProfit:38000, fixedCosts:52000, gpPct:0.38, avgJobValue:9500, quoteWin:0.55, leadQuote:0.85};
  S.fin.ownerSalary=140000; S.fin.marketSalary=120000; S.fin.debt=180000; S.fin.surplusCash=60000;
  S.wellness.base={hours:63, onBiz:15, weekends:3, evenings:2, holidays:1, weeksWithout:1, income:140000, outside:0, exercise:1, sleep:6};
  S.wellness.targ={hours:35, onBiz:70, weekends:0, evenings:5, holidays:6, weeksWithout:6, income:280000, outside:60000, exercise:4, sleep:7.5};
  S.meta.company=S.meta.company||'Example Plumbing Ltd'; S.meta.owner=S.meta.owner||'Sam';
  S.vision.statement=S.vision.statement||'In five years I own a business turning over four million with a leadership team running it, I work three days a week, I take six weeks off with the family, and it is worth enough to sell or hand to the kids.';
  S.vision.biz={revenue:5200000, profit:1000000, value:3000000, team:24, role:'CEO · Leader · Investor'};
  S.vision.life={hours:35, holidays:6, weekends:0, evenings:5, income:280000, whatFor:'Six weeks in the islands every year, and the building bought outright.'};
  S.ownerRoles=[{role:'On tools',on:false,handover:0},{role:'Team Leader',on:false,handover:0},
                {role:'Operations Manager',on:true,handover:0},{role:'Estimator',on:true,handover:2},
                {role:'Office / Admin',on:false,handover:0}];
  if(!S.strategies.length) LIBRARY.forEach((l,i)=>addStrategyQuiet(l,i));
  seasonalityFromBaseline(true);
  markDirty(); render(true);
  toast('Example business loaded — including two departments you can switch on in Setup. Every number is editable.', 5200);
}
function addStrategyQuiet(preset,i){
  S.strategies.push(Object.assign({name:'',domain:'Marketing',outcome:'Both',stage:i<2?'Refining':'Execution',
    shift:'',owner:'',startMonth:1+i*3,fullMonth:12+i*3,ramp:'s',confidence:70,cost:0,refined:i<2,
    scenarios:['A','B']}, JSON.parse(JSON.stringify(preset))));
}

/* ─── save / load ──────────────────────────────────────────────── */
function serialise(){ return JSON.stringify(S,null,2); }
function fileName(){
  const c=(S.meta.company||'boardroom').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return c+'-growth-plan.json';
}
async function doSave(){
  if(!fileHandle) return doSaveAs();
  try{
    if(fileHandle.queryPermission){
      let p=await fileHandle.queryPermission({mode:'readwrite'});
      if(p!=='granted') p=await fileHandle.requestPermission({mode:'readwrite'});
      if(p!=='granted') throw new Error('denied');
    }
    const w=await fileHandle.createWritable(); await w.write(serialise()); await w.close();
    dirty=false; paintSave(); toast('Saved to '+fileHandle.name);
  }catch(err){ fileHandle=null; doSaveAs(); }
}
async function doSaveAs(){
  if(window.showSaveFilePicker){
    try{
      fileHandle=await window.showSaveFilePicker({suggestedName:fileName(),
        types:[{description:'Boardroom Growth Plan',accept:{'application/json':['.json']}}]});
      const w=await fileHandle.createWritable(); await w.write(serialise()); await w.close();
      dirty=false; paintSave(); toast('Saved to '+fileHandle.name); return;
    }catch(err){ if(err && err.name==='AbortError') return; }
  }
  download(fileName(), serialise(), 'application/json');
  dirty=false; paintSave();
  toast('Downloaded '+fileName()+' — this browser cannot write files in place. Chrome or Edge can.', 6000);
}
function download(name, text, mime){
  const b=new Blob([text],{type:(mime||'text/plain')+';charset=utf-8'}), u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),4000);
}
function mergeState(loaded){
  const base=defaultState();
  const deep=(t,s2)=>{ Object.keys(s2||{}).forEach(k=>{
    if(s2[k] && typeof s2[k]==='object' && !Array.isArray(s2[k]) && t[k] && typeof t[k]==='object' && !Array.isArray(t[k])) deep(t[k],s2[k]);
    else t[k]=s2[k]; }); return t; };
  const out = deep(base, loaded);
  // seasonality used to be stored as % shares adding to 100; it is now an index averaging 1.00
  const sTot = (out.oneYear.seasonality||[]).reduce((t,v)=>t+(Number(v)||0),0);
  if(sTot>24) out.oneYear.seasonality = out.oneYear.seasonality.map(v=>(Number(v)||0)/sTot*12);
  out.divisions.forEach(d=>{
    if(!d.t) d.t={netProfit:0,fixedCosts:0,gpPct:0.35,avgJobValue:0,quoteWin:0.5,leadQuote:0.8};
  });
  // files written before the per-department budget carried one global target block
  if(loaded && loaded.targets && (!loaded.divisions || !loaded.divisions[0] || !loaded.divisions[0].t)){
    const w=out.divisions.find(d=>d.id==='WOB');
    if(w) Object.assign(w.t, loaded.targets);
  }
  return out;
}
$('#fileIn').addEventListener('change', async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{ S=mergeState(JSON.parse(await f.text())); dirty=false; fileHandle=null; paintSave(); render(true); toast('Opened '+f.name); }
  catch(err){ toast('That file could not be read as a growth plan.'); }
  e.target.value='';
});
document.addEventListener('dragover',e=>{ e.preventDefault(); });
document.addEventListener('drop', async e=>{
  e.preventDefault(); const f=e.dataTransfer.files[0]; if(!f||!/\.json$/i.test(f.name)) return;
  try{ S=mergeState(JSON.parse(await f.text())); dirty=false; paintSave(); render(true); toast('Opened '+f.name); }
  catch(err){ toast('That file could not be read as a growth plan.'); }
});
window.addEventListener('beforeunload', e=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } });

function printPack(){
  document.body.classList.add('printall');
  const done=()=>{ document.body.classList.remove('printall'); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done);
  render(true);
  setTimeout(()=>window.print(), 120);
}

/* ─── CSV export ───────────────────────────────────────────────── */
function exportCsv(){
  const pr=project(S.active), Y=pr.years;
  const rows=[['Boardroom Growth Plan', S.meta.company||'', 'Plan '+S.active, S.scenarios[S.active].label]];
  rows.push([]);
  const line=(l,pick,f)=>rows.push([l].concat(Y.map(y=>{ const v=pick(y); return (v==null||!Number.isFinite(v))?'':(f?f(v):Math.round(v*100)/100); })));
  rows.push(['Metric'].concat(Y.map(y=>y.label)));
  line('Revenue',y=>y.rev); line('Cost of sales',y=>y.cos); line('Gross profit',y=>y.gp);
  line('Gross margin %',y=>y.gpPct==null?null:y.gpPct*100);
  line('Fixed costs',y=>y.fixed); line('Net profit',y=>y.np); line('Normalised EBITDA',y=>y.ebitda);
  line('Leads',y=>y.leads); line('Quotes',y=>y.quotes); line('Jobs',y=>y.jobs); line('Average job value',y=>y.ajv);
  line('On tools',y=>y.cap.target); line('Team leaders',y=>y.cap.teamLeaders); line('Ops managers',y=>y.cap.opsManagers);
  line('Estimators',y=>y.cap.estimators); line('Office',y=>y.cap.office); line('Total team',y=>y.cap.total);
  line('Working capital movement',y=>y.dwc); line('Tax',y=>y.tax); line('Capex',y=>y.capex);
  line('Cash generated',y=>y.cash); line('Cumulative cash',y=>y.cumCash);
  line('Owner hours per week',y=>y.ownerHours); line('Freedom score',y=>y.freedom.score);
  line('Business value',y=>y.value.equity);
  const csv=rows.map(r=>r.map(c=>{ const s2=String(c==null?'':c); return /[",\n]/.test(s2)?'"'+s2.replace(/"/g,'""')+'"':s2; }).join(',')).join('\n');
  download((S.meta.company||'boardroom').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-5-year-model.csv', csv, 'text/csv');
  toast('CSV exported.');
}

/* ═══ §SELF-TEST — golden cases with hand-calculated answers ════ */
function runSelfTest(){
  const snap=JSON.stringify(S);
  const out=[]; let pass=0, fail=0;
  const T=(name, got, want, tol)=>{
    const ok = (want==null) ? (got==null)
      : (typeof want==='number' ? (got!=null && Math.abs(got-want)<=(tol==null?0.01:tol)) : got===want);
    ok?pass++:fail++;
    out.push(`${ok?'<span class="p">PASS</span>':'<span class="f">FAIL</span>'}  ${name}${ok?'':`\n        expected ${want}, got ${got}`}`);
  };
  const fresh=()=>{ S=defaultState(); return S.divisions.find(d=>d.id==='WOB'); };
  const fill=(d,n,o)=>{ for(let i=0;i<n;i++) Object.assign(d.months[i], o(i)); };

  // 1 — clean 12-month baseline: period ratio, not average of ratios
  let d=fresh();
  fill(d,12,i=>({rev:100000+i*10000, cos:60000+i*7000, fixed:20000, ovh:5000, jobs:10, quotes:20, leads:25, ownerHrs:60, onTools:5, office:2}));
  let b=business();
  const totRev=sum(Array.from({length:12},(_,i)=>100000+i*10000));
  const totCos=sum(Array.from({length:12},(_,i)=>60000+i*7000));
  T('1 · 12 months recognised', b.n, 12);
  T('1 · revenue total', b.revenue, totRev);
  T('1 · GP% is total GP ÷ total revenue', b.gpPct, (totRev-totCos)/totRev, 1e-9);
  T('1 · net profit is derived, not entered', b.netProfit, (totRev-totCos)-12*25000, 0.5);
  T('1 · average job value', b.avgJobValue, totRev/120, 1e-6);

  // 2 — partial baseline: only entered months count
  d=fresh(); fill(d,4,()=>({rev:100000,cos:65000,fixed:25000,jobs:10,quotes:20,leads:25,ownerHrs:60,onTools:5}));
  b=business();
  T('2 · partial baseline months', b.n, 4);
  T('2 · monthly revenue uses 4 months', b.revenueM, 100000, 1e-6);
  T('2 · empty months excluded from totals', b.revenue, 400000);

  // 3 — zero revenue: no NaN, no Infinity, no error
  d=fresh(); fill(d,3,()=>({rev:0,cos:0,fixed:8000,jobs:0,quotes:0,leads:5}));
  b=business();
  T('3 · zero revenue → GP% is null not NaN', b.gpPct, null);
  T('3 · zero revenue → no Infinity', Number.isFinite(b.gpPct)===false, true);

  // 4 — zero jobs
  d=fresh(); fill(d,3,()=>({rev:90000,cos:50000,jobs:0,quotes:10,leads:12}));
  b=business();
  T('4 · zero jobs → average job value null', b.avgJobValue, null);

  // 5 — 100% conversion: leads = quotes = jobs
  S=defaultState(); S.targets={netProfit:30000,fixedCosts:45000,gpPct:0.35,avgJobValue:8500,quoteWin:1,leadQuote:1};
  let F=funnel(S.targets);
  T('5 · required GP', F.requiredGP, 75000);
  T('5 · required revenue', F.revenue, 75000/0.35, 1e-6);
  T('5 · 100% conversion → leads = jobs', F.leads, F.jobs, 1e-9);
  T('5 · funnel back-checks to the profit asked for', F.revenue*0.35-45000, 30000, 1e-6);

  // capacity rounding and the hiring rule (defects #4 and #5)
  const cap=capacity(214285.71, 56, {revPerHead:25000,spanTL:6,spanOM:4,omThreshold:2,pricingMinutes:60,pricingCapacity:118,tradesPerOffice:5}, {onTools:6});
  T('5 · on-tools exact requirement', cap.needed, 8.5714, 0.001);
  T('5 · rounded up to whole people', cap.target, 9);
  T('5 · hires = target − current, never a MOD test', cap.hires, 3);
  T('5 · utilisation shown separately', cap.util, 8.5714/9, 0.001);
  T('5 · team leaders at span 6', cap.teamLeaders, 2);
  T('5 · ops manager threshold respected', cap.opsManagers, 1);
  T('5 · pricing hours come from quotes', cap.pricingHours, 56);
  T('5 · estimators', cap.estimators, 1);

  // 6 — scenario with no strategies moves only by macro
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,()=>({rev:100000,cos:65000,fixed:25000,jobs:12,quotes:24,leads:30,ownerHrs:60,onTools:4,office:1}));
  S.scenarios.A.macro=S.scenarios.A.macro.map(()=>({market:0.10,price:0,wage:0,ovh:0}));
  let pr=project('A');
  T('6 · no strategies → year 1 = baseline × market growth', pr.years[1].rev, 1200000*1.10, 500);
  T('6 · year 2 compounds', pr.years[2].rev, 1200000*1.21, 900);

  // 7 — two strategies on the same driver add up
  S.strategies=[
    {name:'a',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:1,fullMonth:1,ramp:'linear',confidence:100,cost:0,scenarios:['A'],levers:[{driver:'gpPct',value:2}]},
    {name:'b',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:1,fullMonth:1,ramp:'linear',confidence:100,cost:0,scenarios:['A'],levers:[{driver:'gpPct',value:3}]}
  ];
  pr=project('A');
  T('7 · overlapping levers sum in percentage points', pr.years[1].gpPct, 0.35+0.05, 1e-6);
  S.strategies[1].confidence=50;
  pr=project('A');
  T('7 · confidence weights the lever', pr.years[1].gpPct, 0.35+0.02+0.015, 1e-6);
  S.strategies=[{name:'c',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:7,fullMonth:7,ramp:'linear',confidence:100,cost:0,scenarios:['A'],levers:[{driver:'gpPct',value:6}]}];
  pr=project('A');
  T('7 · a lever starting in month 7 affects only half of year 1', pr.years[1].gpPct, 0.38, 0.0005);

  // 8 — divisions: only ACTIVE divisions roll up; assumptions are weighted, never summed
  S=defaultState(); S.divisionsOn=true;
  const d1=S.divisions.find(x=>x.id==='D1'), d2=S.divisions.find(x=>x.id==='D2');
  d1.active=true; d2.active=true;
  fill(d1,12,()=>({rev:100000,cos:60000,fixed:20000,jobs:10,quotes:20,leads:24,onTools:4,ownerHrs:60}));
  fill(d2,12,()=>({rev:50000,cos:32500,fixed:9000,jobs:20,quotes:40,leads:50,onTools:2,ownerHrs:60}));
  d1.a.spanTL=6; d2.a.spanTL=6;
  d1.a.revPerHead=25000; d2.a.revPerHead=20000;
  b=business();
  T('8 · only active divisions roll up', b.divisions, 2);
  T('8 · revenue sums across active divisions', b.revenue, 1800000);
  T('8 · span of control is NOT summed', b.a.spanTL, 6, 1e-9);
  T('8 · revenue per head is revenue-weighted', b.a.revPerHead, (25000*1200000+20000*600000)/1800000, 1);
  S.divisions.filter(x=>['D3','D4','D5','D6','D7'].includes(x.id)).forEach(x=>{ fill(x,12,()=>({rev:999999,cos:1,jobs:1})); });
  b=business();
  T('8 · inactive divisions contribute nothing', b.revenue, 1800000);

  // 8b — the consolidated view on budget
  S=defaultState(); S.divisionsOn=true;
  const b1=S.divisions.find(x=>x.id==='D1'), b2=S.divisions.find(x=>x.id==='D2');
  b1.active=true; b2.active=true;
  fill(b1,12,()=>({rev:100000,cos:64000,fixed:20000,jobs:10,quotes:20,leads:24,onTools:4,ownerHrs:60}));
  fill(b2,12,()=>({rev:50000,cos:29500,fixed:9000,jobs:20,quotes:40,leads:50,onTools:2,ownerHrs:60}));
  b1.t={netProfit:20000,fixedCosts:30000,gpPct:0.40,avgJobValue:12500,quoteWin:0.50,leadQuote:0.80};
  b2.t={netProfit:10000,fixedCosts:15000,gpPct:0.50,avgJobValue:4000, quoteWin:0.80,leadQuote:1.00};
  b1.a.pricingMinutes=300; b2.a.pricingMinutes=60;
  const BG=budget();
  // hand-calculated: D1 required revenue = (20000+30000)/0.40 = 125000
  //                  D2 required revenue = (10000+15000)/0.50 =  50000
  T('8b · desired sales add across departments', BG.total.revenue, 175000, 0.5);
  T('8b · desired profit adds', BG.total.netProfit, 30000);
  T('8b · consolidated margin is re-derived, not averaged', BG.total.gpPct, 75000/175000, 1e-9);
  T('8b · consolidated margin is NOT the mean of 40% and 50%', Math.abs(BG.total.gpPct-0.45)>0.005, true);
  // D1 jobs = 125000/12500 = 10 ; D2 jobs = 50000/4000 = 12.5
  T('8b · jobs add across departments', BG.total.jobs, 22.5, 1e-6);
  T('8b · consolidated average job value re-derived', BG.total.avgJobValue, 175000/22.5, 1e-6);
  // D1 quotes = 10/0.5 = 20 ; D2 quotes = 12.5/0.8 = 15.625
  T('8b · quotes add', BG.total.quotes, 35.625, 1e-6);
  T('8b · consolidated win rate re-derived', BG.total.quoteWin, 22.5/35.625, 1e-9);
  T('8b · pricing minutes weighted, not summed', BG.b.a.pricingMinutes,
      (300*1200000+60*600000)/1800000, 0.01);
  T('8b · pricing minutes are not 360', Math.abs(BG.b.a.pricingMinutes-360)>1, true);
  // capacity: D1 125000/25000 = 5 exact ; D2 50000/25000 = 2 exact
  T('8b · workforce headcount DOES add up', BG.capTotal.target, 7);
  T('8b · hires add up', BG.capTotal.hires, 1);   // D1 5-4=1, D2 2-2=0
  b2.active=false;
  const BG2=budget();
  T('8b · switching a department off removes it from the budget', BG2.total.revenue, 125000, 0.5);

  // freedom score in both directions, and the degenerate guard
  S=defaultState();
  S.wellness.base={hours:70,onBiz:10,weekends:4,evenings:1,holidays:1,weeksWithout:0,income:100000,outside:0,exercise:0,sleep:6};
  S.wellness.targ={hours:35,onBiz:70,weekends:0,evenings:5,holidays:6,weeksWithout:6,income:250000,outside:0,exercise:4,sleep:8};
  T('9 · lower-is-better scores upward', comp(50,70,35), 57.14, 0.01);
  T('9 · higher-is-better scores upward', comp(3,1,6), 40, 0.01);
  T('9 · target equal to baseline does not divide by zero', comp(5,5,5), 100);
  T('9 · out-of-range clamps to 100', comp(20,70,35), 100);

  // no NaN / Infinity anywhere on a fuzzed state
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,i=>({rev:i%2?0:1e12, cos:-5000, fixed:0, jobs:0, quotes:0, leads:0, ownerHrs:0, onTools:0}));
  S.targets={netProfit:-1,fixedCosts:0,gpPct:0,avgJobValue:0,quoteWin:0,leadQuote:0};
  let bad=0;
  try{
    const p2=project('A');
    JSON.stringify(p2.years, (k,v)=>{ if(typeof v==='number' && !Number.isFinite(v)) bad++; return v; });
    const f2=funnel(S.targets);
    Object.values(f2).forEach(v=>{ if(typeof v==='number' && !Number.isFinite(v)) bad++; });
  }catch(err){ bad=-1; out.push('<span class="f">FAIL</span>  10 · fuzz threw: '+err.message); }
  T('10 · fuzzed inputs produce no NaN or Infinity', bad, 0);

  S=JSON.parse(snap);
  render(true);
  const el=$('#selftestout');
  if(el) el.innerHTML=`<div class="selftest">${pass} passed · ${fail} failed\n\n${out.join('\n')}</div>`;
  toast(fail? `${fail} test${fail===1?'':'s'} failed — see the panel.` : `All ${pass} checks passed.`, 4200);
}

/* ─── init ─────────────────────────────────────────────────────── */
render(true);
paintSave();
if(/[?&]selftest=1/.test(location.search)) { go('settings'); setTimeout(runSelfTest, 200); }
window.addEventListener('resize', ()=>{ clearTimeout(window._rz); window._rz=setTimeout(()=>render(), 220); });

})();
</script>
</body>
</html>
