/* ═══ §APP — routing, events, persistence ═══════════════════════ */

const RENDERERS = {vision:renderVision, thrive:renderThrive, horizon:renderHorizon,
  baseline:renderBaseline, metrics:renderMetrics, budget:renderBudget,
  strategies:renderStrategies, oneyear:renderOneYear,
  consolidated:renderConsolidated, org:renderOrg, settings:renderSettings};

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

/* Replacing a tab's innerHTML destroys whatever input has focus, and the
   browser fires focusout SYNCHRONOUSLY while that assignment is still in
   flight. The focusout handler re-renders, so render() used to re-enter
   itself: the inner pass drew the charts and cleared the pending queue, then
   the outer pass overwrote the DOM with its own string and found nothing left
   to draw. The chart vanished, the page got shorter, and the member was
   thrown up the page mid-keystroke. One flag closes it. */
let RENDERING = false;
function render(all){
  if(RENDERING) return;
  RENDERING = true;
  try{ renderNow(all); } finally { RENDERING = false; }
}
function renderNow(all){
  CURSYM = {NZD:'$',AUD:'$',GBP:'£',USD:'$'}[S.meta.currency]||'$';
  const ids = all ? Object.keys(RENDERERS) : [UI.tab];
  ids.forEach(k=>{
    const el=document.getElementById('tab-'+k); if(!el) return;
    try{ el.innerHTML = RENDERERS[k](); }
    catch(e){ el.innerHTML=`<div class="alert bad" style="margin-top:40px"><div><b>This tab could not be drawn</b>${esc(e.message)}</div></div>`; console.error(k,e); }
  });
  $$('.tab').forEach(t=>t.classList.toggle('on', t.id==='tab-'+UI.tab));
  $$('#rail a').forEach(a=>a.classList.toggle('on', a.dataset.tab===UI.tab));
  drawCharts();
  runTweens(document);
}
function go(tab){ UI.tab=tab; render(); window.scrollTo({top:0,behavior:'smooth'}); }

/* ─── input handling ───────────────────────────────────────────── */
function readValue(el){
  const kind=el.dataset.kind||'num';
  if(kind==='str') return el.value;
  if(kind==='pct') return num(el.value)/100;
  if(kind==='numn') return el.value.trim()==='' ? null : num(el.value);
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
    if(d){
      const m=d.months[+el.dataset.m], k=el.dataset.k;
      m[k] = (k==='gp' && el.value.trim()==='') ? null : num(el.value);
      // cost of sales is never typed — keep the stored figure consistent with
      // what was, so a saved file can never hold a revenue/GP/CoS that disagree
      if(k==='gp' || k==='rev') m.cos = num(m.rev) - mgp(m);
      touched=true;
    }
  }
  else if(el.dataset.path==='thrive.energy.energising' || el.dataset.path==='thrive.energy.targetEnergising'){
    const k = el.dataset.path==='thrive.energy.energising' ? 'energising' : 'targetEnergising';
    const other = k==='energising' ? 'draining' : 'targetDraining';
    const v = el.value.trim()==='' ? null : clamp(0,100,num(el.value));
    S.thrive.energy[k] = v;
    S.thrive.energy[other] = v==null ? null : 100-v;      // the two always make a week
    touched=true;
  }
  else if(el.dataset.mname!=null){
    (S.meta.monthNames = S.meta.monthNames || Array.from({length:12},()=>''))[+el.dataset.mname]=el.value;
    touched=true;
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
/* An editable metric shows a formatted figure at rest and the raw number
   while you are in it. No re-render on focus — that would rip the field out
   from under the caret. */
/* Baseline grid cells have no data-path — they are addressed by
   division | month | metric. Same formatted-at-rest behaviour either way. */
function editKey(el){
  const d=el.dataset;
  if(d.path!=null) return d.path;
  if(d.grid!=null) return d.grid+'|'+d.m+'|'+d.k;
  return null;
}
document.addEventListener('focusin', e=>{
  if(RENDERING) return;
  const el=e.target, k=el.classList&&(el.classList.contains('minput')||el.classList.contains('grp'))?editKey(el):null;
  if(k){
    UI.editing = k;
    el.value = el.dataset.raw || '';
    try{ el.select(); }catch(_){}
  }
});
/* Down / Up / Enter walk straight down a column of a table, the way a
   spreadsheet does, instead of leaving the member to reach for the mouse.
   Left and right are untouched — they move the caret inside the number. */
function cellNav(el, dir){
  const td = el.closest('td'); if(!td) return false;
  const tr = td.parentElement;
  const ci = Array.prototype.indexOf.call(tr.children, td);
  let row = dir>0 ? tr.nextElementSibling : tr.previousElementSibling;
  while(row){
    const cell = row.children[ci];
    const inp = cell && cell.querySelector('input:not([type=hidden]):not([disabled]), textarea');
    if(inp){ inp.focus({preventScroll:true}); try{ inp.select(); }catch(_){} return true; }
    row = dir>0 ? row.nextElementSibling : row.previousElementSibling;
  }
  return false;
}
document.addEventListener('keydown', e=>{
  const el=e.target;
  if(el.classList && el.classList.contains('dren')){
    if(e.key==='Enter'){ e.preventDefault(); el.blur(); }
    if(e.key==='Escape'){ UI.renaming=null; render(); }
    return;
  }
  if((el.tagName==='INPUT' && el.type!=='checkbox' && el.type!=='radio')
     && (e.key==='ArrowDown' || e.key==='ArrowUp' || e.key==='Enter')){
    const dir = e.key==='ArrowUp' ? -1 : 1;
    if(cellNav(el, dir)) e.preventDefault();
  }
});
document.addEventListener('focusout', e=>{
  if(RENDERING) return;   // this blur is our own DOM swap, not the member leaving a field
  if(e.target.classList && e.target.classList.contains('dren')){
    const d=S.divisions.find(x=>x.id===e.target.dataset.divname);
    if(d && e.target.value.trim()) d.name=e.target.value.trim();
    UI.renaming=null; markDirty(); render(true); return;
  }
  const el=e.target, k=el.classList&&(el.classList.contains('minput')||el.classList.contains('grp'))?editKey(el):null;
  if(k && UI.editing===k){
    UI.editing = null; clearTimeout(liveTimer);
    // Tab moves on before this fires. Re-rendering destroys the field the
    // caret was heading for, so carry its identity across the render.
    const next = e.relatedTarget && e.relatedTarget.dataset ? Object.assign({}, e.relatedTarget.dataset) : null;
    keepPlace(next, null, null, false);
  }
});
/* "use the calculated figure" sits inside the card, so a click would blur the
   input and re-render the button away before the click landed. Take it on
   mousedown and stop the blur. */
document.addEventListener('mousedown', e=>{
  const b = e.target.closest && e.target.closest('[data-clear]');
  if(!b) return;
  e.preventDefault();
  setPath(b.dataset.clear, null);
  UI.editing = null; markDirty(); render();
});

/* live recalc without stealing focus: re-render everything except the field being typed in */
let liveTimer=null;
/* Re-render without moving the page. .focus() scrolls its target into view,
   which is what threw the member back up the page every time they typed a
   number — so focus is restored with preventScroll and the scroll position
   is put back exactly where it was. */
function keepPlace(id, sel, selEnd, all){
  const x = window.scrollX, y = window.scrollY;
  render(all);
  const back = id ? findSame(id) : null;
  if(back){
    back.focus({preventScroll:true});
    if(sel!=null){ try{ back.setSelectionRange(sel,selEnd); }catch(_){} }
  }
  window.scrollTo(x, y);
}
function scheduleLiveRender(el){
  clearTimeout(liveTimer);
  const id = Object.assign({}, el.dataset);
  const sel = el.selectionStart, selEnd = el.selectionEnd;
  liveTimer=setTimeout(()=>keepPlace(id, sel, selEnd), 260);
}
function findSame(d){
  if(!d) return null;
  for(const k of ['path','spath','seas','divname','mname']) if(d[k]!=null) return document.querySelector(`[data-${k}="${CSS.escape(d[k])}"]`);
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
            ' switched on — turn others on from the Scenario Forecaster or the Budget tab.', 5000);
    }
    markDirty(); render(true); return; }
  if(el.dataset.path!=null || el.dataset.spath!=null){ clearTimeout(liveTimer); render(); }
});

/* ─── clicks ───────────────────────────────────────────────────── */
document.addEventListener('click', e=>{
  const t=e.target.closest('[data-tab],[data-divsel],[data-orgyear],[data-delstrat],[data-addlever],[data-dellever],[data-stogon],[data-addrock],[data-delrock],[data-clear],[data-role],[data-tscale],[data-divren],[data-divoff],button');
  if(t && t.disabled) return;
  if(!t) return;
  const d=t.dataset;
  if(d.tab){ go(d.tab); return; }
  if(d.divren){ UI.renaming=d.divren; render();
    setTimeout(()=>{ const i=$('.dren'); if(i){ i.focus(); i.select(); } },30); return; }
  if(d.divoff!=null){ removeDepartment(d.divoff); return; }
  if(d.divsel){ UI.div=d.divsel; UI.renaming=null; render(); return; }
  if(d.orgyear!=null){ UI.orgYear=+d.orgyear; render(); return; }
  if(d.delstrat!=null){ S.strategies.splice(+d.delstrat,1); markDirty(); render(); return; }
  if(d.addlever!=null){ const s=S.strategies[+d.addlever]; (s.levers=s.levers||[]).push({driver:'gpPct',value:1}); markDirty(); render(); return; }
  if(d.dellever!=null){ const [i,j]=d.dellever.split('|'); S.strategies[+i].levers.splice(+j,1); markDirty(); render(); return; }
  if(d.stogon!=null){ const s=S.strategies[+d.stogon];
    s.on = (s.on===false); markDirty(); render(); return; }
  if(d.tscale){ applyScale(d.tscale); markDirty(); render(); return; }
  if(d.clear){ setPath(d.clear, null); markDirty(); render(); return; }
  if(d.role){ S.vision.biz.role = d.role; markDirty(); render(); return; }
  if(d.seaspreset){
    if(d.seaspreset==='baseline') seasonalityFromBaseline();
    else { S.oneYear.seasonality=rotateToStart(SEASON_PRESETS[d.seaspreset].slice()); markDirty(); render();
           toast(d.seaspreset==='flat'?'Every month set to an equal 8.3%.':'Seasonal shape applied — adjust any month to match your own year.'); }
    return; }
  if(d.addrock!=null){ S.oneYear.rocks[+d.addrock].push({text:'',owner:'',done:false}); markDirty(); render(); return; }
  if(d.delrock!=null){ const [q,j]=d.delrock.split('|'); S.oneYear.rocks[+q].splice(+j,1); markDirty(); render(); return; }

  switch(t.id){
    case 'btnAddDept': addDepartment(); break;
    case 'btnAddStrat': addStrategy(); break;
    case 'btnStratLib': openLibrary(); break;
    case 'btnDemo': loadDemo(); break;
    case 'btnResetMonths': {
      const d=currentDivision();
      if(confirm(`Clear all twelve months of numbers for ${d.name}? Assumptions and desired numbers are kept.`)){
        d.months=Array.from({length:12},blankMonth); markDirty(); render(true);
        toast(`${d.name} cleared. Assumptions and desired numbers are untouched.`);
      }
      break; }
    case 'btnPaste': openPaste(); break;
    case 'btnSeasNorm': {
      const t=sum(S.oneYear.seasonality.map(num));
      if(t>0){ S.oneYear.seasonality=S.oneYear.seasonality.map(v=>num(v)/t*12); markDirty(); render();
               toast('Rebalanced so the twelve months average 1.00× — the shape is unchanged.'); }
      break; }
    case 'btnSave': doSave(); break;
    case 'btnSaveAs': doSaveAs(); break;
    case 'btnLoad': $('#fileIn').click(); break;
    case 'btnShare': exportShareable(); break;
    case 'btnPrint': printPack(); break;
    case 'btnSelfTest': runSelfTest(); break;
    case 'btnExportCsv': exportCsv(); break;
    case 'btnReset': if(confirm('Reset everything back to an empty plan?')){ S=defaultState(); markDirty(); render(true); } break;
  }
});

/* A 1–10 bar click. Key is life|<row>|<c or d>|<value> or cap|<row>|<value>.
   Clicking the value already set clears it, so a misclick is one click to undo. */
function applyScale(key){
  const p=key.split('|');
  if(p[0]==='life'){
    const row=+p[1], col=p[2], v=+p[3];
    const cell=S.thrive.life[row]; if(!cell) return;
    cell[col] = (num(cell[col])===v && cell[col]!==null && cell[col]!=='') ? null : v;
  } else if(p[0]==='cap'){
    const row=+p[1], v=+p[2];
    S.thrive.cap[row] = (num(S.thrive.cap[row])===v && S.thrive.cap[row]!==null && S.thrive.cap[row]!=='') ? null : v;
  }
}

/* ─── departments ──────────────────────────────────────────────────
   The first "+" on a single-P&L plan does not throw the existing twelve
   months away — it becomes Department 1 and a second, empty department is
   added beside it, which is what splitting a business actually means. */
/* The data half of "+", kept pure so it can be tested.
   Returns the outcome so the caller knows what to say. */
function turnOnDepartments(){
  if(S.divisionsOn) return 'already-on';
  const depts   = S.divisions.filter(d=>d.id!=='WOB');
  const withData= depts.filter(d=>d.months.some(entered));
  const wob     = S.divisions.find(d=>d.id==='WOB');
  const wobHas  = wob.months.some(entered);

  S.divisionsOn = true;

  // Departments already carry numbers — use them. Copying the single P&L in
  // on top would double-count every dollar, which is exactly the bug the old
  // workbook had. The single P&L is set aside, not deleted.
  if(withData.length){
    withData.forEach(d=>{ d.active = true; });
    return wobHas ? 'kept-departments-wob-set-aside' : 'kept-departments';
  }

  // Nothing in any department: the twelve months become Department 1 and an
  // empty Department 2 appears beside it. Nothing is lost, nothing is doubled.
  const first = depts[0];
  first.active = true;
  if(wobHas){
    first.months = JSON.parse(JSON.stringify(wob.months));
    first.a      = JSON.parse(JSON.stringify(wob.a));
    first.t      = JSON.parse(JSON.stringify(wob.t));
    first.name   = 'Department 1';
    const second = depts.find(d=>!d.active);
    if(second){ second.active = true; second.name = 'Department 2'; }
    return 'split';
  }
  return 'empty';
}

function addDepartment(){
  if(!S.divisionsOn){
    const how = turnOnDepartments();
    UI.div = 'CONS';
    markDirty(); render(true);
    toast({
      'split':'Your twelve months are now Department 1, and Department 2 is empty beside it. Split the numbers between them — Consolidated adds them back up.',
      'kept-departments':'Departments are on. Consolidated adds them up.',
      'kept-departments-wob-set-aside':'Your departments already had numbers, so those are what the plan uses. The single P&L is set aside — it comes back if you remove every department.',
      'empty':'Departments are on. Consolidated adds them up.'
    }[how] || 'Departments are on.', 8000);
    return;
  }
  const next = S.divisions.find(d=>d.id!=='WOB' && !d.active);
  if(!next){ toast('All seven departments are already on.'); return; }
  next.active = true; UI.div = next.id; UI.renaming = next.id;
  markDirty(); render(true);
  setTimeout(()=>{ const i=$('.dren'); if(i){ i.focus(); i.select(); } },40);
}
function removeDepartment(id){
  const d = S.divisions.find(x=>x.id===id); if(!d) return;
  const on = S.divisions.filter(x=>x.id!=='WOB' && x.active);
  if(!confirm(`Take ${d.name} out of the plan? Its twelve months and its assumptions are kept — bring it back with +.`)) return;
  d.active = false;
  if(on.length<=1){
    S.divisionsOn = false; UI.div = 'WOB';
    toast(`${d.name} removed. Back to one P&L — its numbers are kept and come back with +.`, 6000);
  } else {
    UI.div = 'CONS';
    toast(`${d.name} taken out of the roll-up. Its numbers are kept.`, 5000);
  }
  markDirty(); render(true);
}

/* ─── strategies ───────────────────────────────────────────────── */
function addStrategy(preset){
  S.strategies.push(Object.assign({
    name:'', domain:'Marketing', outcome:'Both', stage:'Strategy', shift:'', owner:S.meta.owner||'',
    startMonth:1, fullMonth:12, ramp:'linear', confidence:70, cost:0, refined:false,
    on:true, levers:[]
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
    <div class="tiny" style="margin-bottom:12px">Paste rows in this order, twelve columns each, tabs or commas between them. Blank lines are skipped.<br><b>Order: revenue, gross profit, fixed cost, company overhead, invoices / jobs, quotes, leads, owner hours per week, on-tools headcount, office headcount.</b><br>Gross profit, not cost of sales — it is the line on your P&amp;L. Cost of sales is worked out from it.</div>
    <textarea id="pasteBox" class="full" style="min-height:180px;font-family:ui-monospace,monospace;font-size:12px" placeholder="180000&#9;192000&#9;…"></textarea>
    <div class="btnrow"><button class="btn accent" id="pasteGo">Bring it in</button></div>`,
    root=>{ root.querySelector('#pasteGo').onclick=()=>{
      const txt=root.querySelector('#pasteBox').value;
      const keys=['rev','gp','fixed','ovh','jobs','quotes','leads','ownerHrs','onTools','office'];
      const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const dv=currentDivision(); let n=0;
      lines.forEach((line,i)=>{
        if(i>=keys.length) return;
        const cells=line.split(/[\t,;]+/).map(c=>num(c));
        for(let m=0;m<12 && m<cells.length;m++){ dv.months[m][keys[i]]=cells[m]; }
        n++;
      });
      dv.months.forEach(m=>{ m.cos = num(m.rev) - mgp(m); });
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
    m.rev=r; m.gp=Math.round(r*(1-(0.655+((i%3)-1)*0.012))); m.cos=r-m.gp;
    m.fixed=41000+ (i>5?2500:0); m.ovh=9500;
    m.jobs=Math.round(r/8400); m.quotes=Math.round(r/8400/0.46);
    m.leads=Math.round(r/8400/0.46/0.78);
    m.ownerHrs=63-i*0.3; m.onTools=7+(i>7?1:0); m.office=2;
  });
  // split the same business across two departments so divisions mode has real data
  const d1=S.divisions.find(x=>x.id==='D1'), d2=S.divisions.find(x=>x.id==='D2');
  [[d1,0.62],[d2,0.38]].forEach(([dd,sh])=>{
    dv.months.forEach((m,i)=>{
      Object.keys(m).forEach(k=>{ dd.months[i][k] = (k==='ownerHrs') ? num(m[k])
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
  S.vision.life={hours:35, holidays:6, weekends:0, evenings:5, income:280000,
    adventures:12, investments:750000,
    whatFor:'Six weeks in the islands every year, and the building bought outright.'};
  S.thrive.life = [[4,9],[2,8],[4,8],[5,8],[5,9],[6,9],[5,8],[4,8],[3,9]]
    .map(([c,d])=>({c,d}));
  S.thrive.cap = [6,5,5,4,7,4,6,7,3];
  S.thrive.energy = {energising:35, draining:65, targetEnergising:70, targetDraining:30};
  S.thrive.aim = {
    financial:'Get the business paying me $18k a month without me quoting a single job.',
    time:'Hand estimating to a full-time estimator and get ten hours a week back by Q3.',
    identity:'Stop being the best tradesman in the business and start being the person who builds the team.'};
  S.thrive.fin = [
    {level:'Current',     income:11500, shifts:''},
    {level:'Comfortable', income:15000, shifts:'Four days on the tools, hire a leading hand'},
    {level:'Thriving',    income:22000, shifts:'Off the tools entirely, estimator and ops manager in place'},
    {level:'Optimal',     income:32000, shifts:'Rental income and a second branch; business runs without me'}];
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
    on:true}, JSON.parse(JSON.stringify(preset))));
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
  // files written before v2.2 carried three scenarios (Plan A/B/C) and an active one.
  // The plan the member was looking at becomes THE plan; strategies assigned to it stay
  // in the plan and the rest are parked, so nothing is deleted and nothing is invented.
  if(loaded && loaded.scenarios && !loaded.plan){
    const key = loaded.active && loaded.scenarios[loaded.active] ? loaded.active
              : Object.keys(loaded.scenarios)[0];
    const old = loaded.scenarios[key] || {};
    out.plan = {label:'The Plan',
      multiple: (old.multiple!=null ? old.multiple : 3.0),
      macro: Array.isArray(old.macro) && old.macro.length===5
             ? JSON.parse(JSON.stringify(old.macro)) : Array.from({length:5},blankMacro)};
    (out.strategies||[]).forEach(st=>{
      if(st.on==null) st.on = Array.isArray(st.scenarios) ? st.scenarios.includes(key) : true;
      delete st.scenarios;
    });
  }
  delete out.scenarios; delete out.active;
  (out.strategies||[]).forEach(st=>{ if(st.on==null) st.on=true; delete st.scenarios; });

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

/* ─── send someone a filled-in copy ─────────────────────────────
   The app and the member's numbers are normally two files. That is fine
   for the member and useless for anyone they send it to, who would open
   a blank calculator. This bakes the current plan into a copy of the app
   so the recipient opens ONE attachment and sees the numbers. */
function exportShareable(){
  const clone = document.documentElement.cloneNode(true);
  clone.querySelectorAll('.tab').forEach(t=>{ t.innerHTML=''; t.className='tab'; });
  const first = clone.querySelector('#tab-vision'); if(first) first.className='tab on';
  const t=clone.querySelector('#toast'); if(t){ t.textContent=''; t.className=''; }
  const o=clone.querySelector('#ovl'); if(o) o.remove();
  clone.querySelectorAll('script[data-embedded]').forEach(n=>n.remove());
  const ss=clone.querySelector('#savestat'); if(ss){ ss.textContent=''; ss.className='savestat'; }

  const sc=document.createElement('script');
  sc.setAttribute('data-embedded','1');
  /* escape < so a statement containing a closing script tag cannot break out */
  sc.textContent='window.__BRGP__='+JSON.stringify(S).replace(/</g,'\\u003c')+';';
  (clone.querySelector('head')||clone).appendChild(sc);

  const stamp = new Date().toISOString().slice(0,10);
  const co = (S.meta.company||'boardroom').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  download(`${co}-growth-plan-${stamp}.html`, '<!DOCTYPE html>\n'+clone.outerHTML, 'text/html');
  toast('Downloaded a copy with your numbers baked in. Attach that file — whoever opens it sees the plan filled in, not an empty calculator.', 8000);
}

/* ─── CSV export ───────────────────────────────────────────────── */
function exportCsv(){
  const pr=project(), Y=pr.years;
  const rows=[['Boardroom Growth Plan', S.meta.company||'', 'The plan', n1(pr.plan.multiple)+'x EBITDA']];
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

  // 6 — a plan with no strategies moves only by macro
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,()=>({rev:100000,cos:65000,fixed:25000,jobs:12,quotes:24,leads:30,ownerHrs:60,onTools:4,office:1}));
  S.plan.macro=S.plan.macro.map(()=>({market:0.10,price:0,wage:0,ovh:0}));
  let pr=project();
  T('6 · no strategies → year 1 = baseline × market growth', pr.years[1].rev, 1200000*1.10, 500);
  T('6 · year 2 compounds', pr.years[2].rev, 1200000*1.21, 900);

  // 7 — two strategies on the same driver add up
  S.strategies=[
    {name:'a',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:1,fullMonth:1,ramp:'linear',confidence:100,cost:0,on:true,levers:[{driver:'gpPct',value:2}]},
    {name:'b',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:1,fullMonth:1,ramp:'linear',confidence:100,cost:0,on:true,levers:[{driver:'gpPct',value:3}]}
  ];
  pr=project();
  T('7 · overlapping levers sum in percentage points', pr.years[1].gpPct, 0.35+0.05, 1e-6);
  S.strategies[1].confidence=50;
  pr=project();
  T('7 · confidence weights the lever', pr.years[1].gpPct, 0.35+0.02+0.015, 1e-6);
  S.strategies=[{name:'c',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:7,fullMonth:7,ramp:'linear',confidence:100,cost:0,on:true,levers:[{driver:'gpPct',value:6}]}];
  pr=project();
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

  // 8c — the Thrive Index, and the two defects carried over from the workbook
  S=defaultState();
  S.thrive.life=[[4,9],[2,8],[4,8],[5,8],[5,9],[6,9],[5,8],[4,8],[3,9]].map(([c,d])=>({c,d}));
  S.thrive.cap=[6,5,5,4,7,4,6,7,3];
  S.thrive.energy={energising:35,draining:65,targetEnergising:70,targetDraining:30};
  let TX=thriveScores();
  T('8c · TIS is the sum of current over 90', TX.tis, 38/90*100, 1e-9);
  T('8c · TIS lands in the right band', TX.level, 'Stable');
  T('8c · desired TIS scored the same way', TX.tisD, 76/90*100, 1e-9);
  T('8c · desired band', TX.levelD, 'Thriving');
  T('8c · points to the next level', TX.toNext, 60-38/90*100, 1e-9);
  T('8c · biggest gap is found', TX.biggest[0].gap, 6);
  T('8c · all nine capability rows are counted', TX.capCounted, 9);
  T('8c · capability total includes the ninth row', TX.capTotal, 47);
  T('8c · the workbook dropped the ninth row and summed the header', TX.capTotal!==44, true);
  T('8c · capability band', TX.capBand, 'Capable manager');
  T('8c · energy is read from the value, not the header', TX.energising, 35);
  T('8c · energy gap against the 70% benchmark', TX.energyGap, -35);
  S.thrive.life[0].c=null;
  TX=thriveScores();
  T('8c · a cleared score drops out of the count', TX.counted, 8);
  T('8c · TIS re-scores on what is left', TX.tis, 34/90*100, 1e-9);
  S=defaultState();
  TX=thriveScores();
  T('8c · a blank scorecard scores nothing, not zero', TX.tis, null);
  T('8c · and has no band', TX.level, null);
  T('8c · blank capability too', TX.capTotal, null);

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
    const p2=project();
    JSON.stringify(p2.years, (k,v)=>{ if(typeof v==='number' && !Number.isFinite(v)) bad++; return v; });
    const f2=funnel(S.targets);
    Object.values(f2).forEach(v=>{ if(typeof v==='number' && !Number.isFinite(v)) bad++; });
  }catch(err){ bad=-1; out.push('<span class="f">FAIL</span>  10 · fuzz threw: '+err.message); }
  T('10 · fuzzed inputs produce no NaN or Infinity', bad, 0);

  // 10b — baseline entry is GROSS PROFIT; cost of sales is derived
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,()=>({rev:100000, gp:35000, fixed:20000, ovh:5000, jobs:10, quotes:20, leads:25, ownerHrs:60, onTools:4, office:1}));
  let nz=normalise(d);
  T('10b · gross profit is read from what was entered', nz.gp, 420000);
  T('10b · cost of sales is derived, never typed', nz.cos, 780000);
  T('10b · margin is total GP over total revenue', nz.gpPct, 0.35, 1e-9);
  T('10b · net profit nets off fixed costs and overhead', nz.netProfit, 420000-300000);

  // an older file that stored cost of sales still reads correctly
  d=S.divisions.find(x=>x.id==='WOB');
  d.months.forEach(m=>{ m.gp=null; m.cos=65000; });
  nz=normalise(d);
  T('10b · a pre-v2.3 file falls back to cost of sales', nz.gp, (100000-65000)*12);
  T('10b · and its margin still lands', nz.gpPct, 0.35, 1e-9);

  // a blank gross profit on a month with revenue is not silently a full margin
  d.months.forEach(m=>{ m.gp=0; m.cos=0; });
  nz=normalise(d);
  T('10b · gross profit typed as zero is honoured as zero', nz.gp, 0);

  // months entered, not months on screen — a 3-month average is a 3-month average
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,3,()=>({rev:90000, gp:36000, fixed:20000, jobs:9, quotes:18, leads:22}));
  nz=normalise(d);
  T('10b · monthly revenue averages over months ENTERED', nz.revenueM, 90000);
  T('10b · not over twelve', nz.revenueM===270000/12 ? 0 : 1, 1);
  T('10b · margin on a partial year', nz.gpPct, 0.40, 1e-9);

  // month headings
  S=defaultState(); S.meta.startMonth=0; S.meta.startYear=2026;
  T('10b · a heading is derived when it is left blank', monthName(0)==='Jan 26' ? 1 : 0, 1);
  S.meta.monthNames[0]='Opening';
  T('10b · and taken from the member when they type one', monthName(0)==='Opening' ? 1 : 0, 1);
  S.meta.monthNames[0]='   ';
  T('10b · whitespace is not a heading', monthName(0)==='Jan 26' ? 1 : 0, 1);

  // 10c — turning departments on must never lose money and never double it
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,()=>({rev:100000, gp:35000, fixed:25000, jobs:10, quotes:20, leads:25, ownerHrs:60, onTools:4}));
  let before = business().revenueM;
  T('10c · single P&L monthly revenue', before, 100000);
  T('10c · the split reports what it did', turnOnDepartments()==='split' ? 1 : 0, 1);
  T('10c · consolidated revenue is unchanged by the split', business().revenueM, before);
  T('10c · two departments exist afterwards', activeDivisions().length, 2);
  T('10c · the twelve months landed in the first', normalise(activeDivisions()[0]).revenueM, 100000);
  T('10c · the second is empty, not a copy', normalise(activeDivisions()[1]).revenueM==null?0:normalise(activeDivisions()[1]).revenueM, 0);
  T('10c · an empty department does not halve the owner week', business().ownerHours, 60);

  // departments that already carry numbers are used as they are
  S=defaultState();
  const wob=S.divisions.find(x=>x.id==='WOB'), dA=S.divisions[1], dB=S.divisions[2];
  fill(wob,12,()=>({rev:100000, gp:35000, fixed:25000, jobs:10, quotes:20, leads:25, ownerHrs:60, onTools:4}));
  fill(dA,12,()=>({rev:60000, gp:21000, fixed:15000, jobs:6, quotes:12, leads:15, ownerHrs:60, onTools:2}));
  fill(dB,12,()=>({rev:40000, gp:14000, fixed:10000, jobs:4, quotes:8, leads:10, ownerHrs:60, onTools:2}));
  T('10c · existing departments are kept, the single P&L set aside',
    turnOnDepartments()==='kept-departments-wob-set-aside' ? 1 : 0, 1);
  T('10c · and the single P&L is NOT copied on top', business().revenueM, 100000);
  T('10c · which is the departments, not the departments plus the P&L', business().revenueM===200000?0:1, 1);

  // consolidated months add money and volume but never owner hours
  const cm = consolidatedMonths();
  T('10c · consolidated month revenue adds', num(cm[0].rev), 100000);
  T('10c · consolidated month gross profit adds', num(cm[0].gp), 35000);
  T('10c · consolidated month headcount adds', num(cm[0].onTools), 4);
  T('10c · consolidated month owner hours do NOT add', num(cm[0].ownerHrs), 60);
  T('10c · the consolidated grid agrees with the roll-up on owner hours',
    sum(cm.filter(entered).map(m=>num(m.ownerHrs)))/cm.filter(entered).length, business().ownerHours, 1e-9);

  // 10d — the week always adds to 100, and the pair cannot drift apart
  S=defaultState();
  S.thrive.energy.energising=30;
  let X=thriveScores();
  T('10d · draining is the balance of the week', X.draining, 70);
  T('10d · the two make one week', X.energising+X.draining, 100);
  S.thrive.energy.energising=0;  X=thriveScores();
  T('10d · zero energising is honoured, not treated as blank', X.draining, 100);
  S.thrive.energy.energising=140; X=thriveScores();
  T('10d · over 100 clamps', X.energising, 100);
  T('10d · and its balance is zero, never negative', X.draining, 0);
  S.thrive.energy.energising=null; X=thriveScores();
  T('10d · nothing entered stays nothing, not zero', X.draining==null?1:0, 1);
  S.thrive.energy.energising=45; S.thrive.energy.targetEnergising=70; X=thriveScores();
  T('10d · the target pair balances too', X.targetDraining, 30);
  T('10d · the gap is measured against the target', X.energyGap, -25);
  S.thrive.energy={energising:30, draining:20, targetEnergising:70, targetDraining:10};
  X=thriveScores();
  T('10d · a stored draining that disagrees is ignored, not shown', X.draining, 70);
  T('10d · same for the stored target', X.targetDraining, 30);

  // 10e — a re-render must never leave a chart container empty. This is what
  // the re-entrancy bug looked like from the outside: the page silently got
  // shorter mid-keystroke and threw the member up the page.
  S=JSON.parse(snap);
  const emptyCharts = () => $$('.chartbox > div[id]').filter(d=>!d.innerHTML.trim()).length;
  UI.tab='thrive'; render(true);
  T('10e · every chart is drawn after a full render', emptyCharts(), 0);
  render();
  T('10e · and after a partial one', emptyCharts(), 0);
  UI.tab='horizon'; render(); render(); render();
  T('10e · and after three in a row', emptyCharts(), 0);
  // the guard itself: a nested call is refused, not queued
  let nested = 'not-called';
  RENDERING = true;
  try{ render(true); nested = 'ran'; }catch(err){ nested = 'threw'; }
  RENDERING = false;
  T('10e · render refuses to re-enter itself', nested==='ran' ? 1 : 0, 1);
  T('10e · and the guard resets', RENDERING ? 1 : 0, 0);
  UI.tab='settings';

  // 11 — one plan: parking a strategy takes it out of the forecast entirely
  S=defaultState(); d=S.divisions.find(x=>x.id==='WOB');
  fill(d,12,()=>({rev:100000,cos:65000,fixed:25000,jobs:12,quotes:24,leads:30,ownerHrs:60,onTools:4,office:1}));
  S.plan.macro=S.plan.macro.map(()=>({market:0,price:0,wage:0,ovh:0}));
  S.strategies=[{name:'p',domain:'Sales',outcome:'Both',stage:'Execution',startMonth:1,fullMonth:1,
                 ramp:'linear',confidence:100,cost:0,on:true,levers:[{driver:'gpPct',value:4}]}];
  T('11 · a strategy in the plan moves the forecast', project().years[1].gpPct, 0.39, 1e-6);
  S.strategies[0].on=false;
  T('11 · a parked strategy moves nothing', project().years[1].gpPct, 0.35, 1e-6);
  T('11 · parked strategies are excluded from the stack', planStrategies().length, 0);
  S.strategies[0].on=true;
  T('11 · unparking puts it straight back', planStrategies().length, 1);

  // 12 — a v2.1 file (Plan A/B/C) still opens, and opens as one plan
  const legacy = {
    plan:undefined, active:'B',
    scenarios:{A:{name:'A',label:'Base',multiple:3.0,macro:Array.from({length:5},()=>({market:0.05,price:0.03,wage:0.03,ovh:0.03}))},
               B:{name:'B',label:'Stretch',multiple:3.7,macro:Array.from({length:5},()=>({market:0.09,price:0.03,wage:0.03,ovh:0.03}))},
               C:{name:'C',label:'Conservative',multiple:2.5,macro:Array.from({length:5},()=>({market:0.01,price:0.03,wage:0.03,ovh:0.03}))}},
    strategies:[{name:'in B',scenarios:['B'],levers:[{driver:'gpPct',value:2}],confidence:100},
                {name:'in A only',scenarios:['A'],levers:[{driver:'gpPct',value:9}],confidence:100},
                {name:'in all',scenarios:['A','B','C'],levers:[{driver:'gpPct',value:1}],confidence:100}]
  };
  delete legacy.plan;
  const mig = mergeState(JSON.parse(JSON.stringify(legacy)));
  T('12 · the plan the member was on becomes the plan', mig.plan.multiple, 3.7);
  T('12 · its macro comes with it', mig.plan.macro[0].market, 0.09, 1e-9);
  T('12 · the old scenario block is gone', mig.scenarios===undefined ? 1 : 0, 1);
  T('12 · the active-plan pointer is gone', mig.active===undefined ? 1 : 0, 1);
  T('12 · strategies that were in that plan stay in the plan', mig.strategies.filter(x=>x.on!==false).length, 2);
  T('12 · strategies that were not are parked, not deleted', mig.strategies.length, 3);
  T('12 · no strategy still carries a scenario list', mig.strategies.filter(x=>x.scenarios!==undefined).length, 0);

  // 13 — the nine Vision categories. VISION_DREAM drives the rendering and
  // S.vision.dream holds the answers; if a key is misspelt in one of them the
  // textarea writes somewhere nothing ever reads and the member silently loses
  // what they typed. Nothing else in the app would notice, so pin them here.
  const dreamKeys = VISION_DREAM.map(d=>d[0]).join(',');
  const stateKeys = Object.keys(defaultState().vision.dream).join(',');
  T('13 · Vision category keys match the state they write to', dreamKeys, stateKeys);
  T('13b · nine categories, each with a distinct key', new Set(VISION_DREAM.map(d=>d[0])).size, 9);

  // the Setup card publishes SELFTEST_COUNT. If a case is added and that
  // constant is not moved with it, the card would quietly lie — so check it.
  if(pass+fail !== SELFTEST_COUNT){
    fail++; out.push(`<span class="f">FAIL</span>  0 · SELFTEST_COUNT says ${SELFTEST_COUNT}, ${pass+fail} checks actually ran — update it in 03-core.js`);
  }
  S=JSON.parse(snap);
  render(true);
  const el=$('#selftestout');
  if(el) el.innerHTML=`<div class="selftest">${pass} passed · ${fail} failed\n\n${out.join('\n')}</div>`;
  toast(fail? `${fail} test${fail===1?'':'s'} failed — see the panel.` : `All ${pass} checks passed.`, 4200);
}

/* ─── init ─────────────────────────────────────────────────────── */
/* a copy that was emailed carries its numbers with it */
if(window.__BRGP__){
  try{ S = mergeState(window.__BRGP__); }
  catch(err){ console.error('embedded plan could not be read', err); }
}
render(true);
paintSave();
if(/[?&]selftest=1/.test(location.search)) { go('settings'); setTimeout(runSelfTest, 200); }
window.addEventListener('resize', ()=>{ clearTimeout(window._rz); window._rz=setTimeout(()=>render(), 220); });

})();
</script>
</body>
</html>
