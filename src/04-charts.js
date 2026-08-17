/* ═══ §CHARTS — hand-built SVG, no library ══════════════════════ */

/* Chart palette, matched to the v2.0 tokens.
   `accent` is the brand gold and is only ever used as a FILL — every gold
   fill is drawn with an ink hairline so it holds its shape on white paper.
   `accentLine` is the deep gold used for strokes, which pure #FFE600 is far
   too light to do legibly. */
const CH = {ink:'#16213C', accent:'#FFE600', accentLine:'#8A6508', accentEdge:'#16213C',
            steel:'#46587A', muted:'#7C8299', rule:'#C9CBD4',
            good:'#146341', bad:'#96271F', soft:'#FBF7DE'};

/* #FFE600 is a fill, not a stroke. A 2px gold line on white paper sits at
   about 1.2:1 — invisible. Every stroke and every text label therefore goes
   through strokeOf(), which swaps the brand gold for the deep gold. Fills
   keep the brand gold and get an ink hairline instead. Doing it here means a
   call site cannot forget. */
const strokeOf = c => c===CH.accent ? CH.accentLine : c;
const edgeOf   = c => c===CH.accent ? ` stroke="${CH.accentEdge}" stroke-width="1"` : '';

function niceMax(v){
  if(v<=0) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v/e;
  const s = f<=1?1 : f<=1.5?1.5 : f<=2?2 : f<=2.5?2.5 : f<=3?3 : f<=4?4 : f<=5?5 : f<=7.5?7.5 : 10;
  return s*e;
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
const pathOf = pts => pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');

function axisFrame(W,H,padL,padR,padT,padB,min,max,fmt,xLabels){
  const iw=W-padL-padR, ih=H-padT-padB;
  let g='';
  for(let i=0;i<=4;i++){
    const v = min + (max-min)*i/4;
    const y = padT + ih - (ih*i/4);
    g += `<line class="gl" x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL+iw).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    g += `<text class="ax" x="${padL-10}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${esc(fmt(v))}</text>`;
  }
  const n=xLabels.length;
  xLabels.forEach((l,i)=>{
    const x = padL + (n<=1?iw/2:i*iw/(n-1));
    g += `<text class="ax" x="${x.toFixed(1)}" y="${H-padB+18}" text-anchor="middle">${esc(l)}</text>`;
  });
  return g;
}

function lineChart(W, sp){
  const H=sp.h||300, padL=sp.padL||70, padR=sp.padR||88, padT=14, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const vals = sp.series.flatMap(s=>s.values).filter(v=>v!=null&&Number.isFinite(v));
  if(!vals.length) return `<div class="empty">No data yet</div>`;
  let max=niceMax(Math.max(0,...vals)), min=Math.min(0,...vals);
  if(min<0) min=-niceMax(-min); if(max===min) max=min+1;
  const n=sp.x.length;
  const X=i=>padL+(n<=1?iw/2:i*iw/(n-1));
  const Y=v=>padT+ih-((v-min)/(max-min))*ih;
  let g=axisFrame(W,H,padL,padR,padT,padB,min,max,sp.fmt,sp.x);
  sp.series.forEach(s=>{
    const pts=s.values.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);
    if(!pts.length) return;
    g+=`<path d="${pathOf(pts)}" fill="none" stroke="${strokeOf(s.color)}" stroke-width="${s.w||2.25}" stroke-linejoin="round" stroke-linecap="round"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;
    pts.forEach(p=>{ g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#fff" stroke="${strokeOf(s.color)}" stroke-width="2"/>`; });
    const last=pts[pts.length-1];
    g+=`<text class="dl" x="${(last[0]+9).toFixed(1)}" y="${(last[1]+4).toFixed(1)}" fill="${strokeOf(s.color)}">${esc(s.name)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sp.aria||'chart')}">${g}</svg>`;
}

function barChart(W, sp){
  const H=sp.h||300, padL=sp.padL||70, padR=sp.padR||24, padT=14, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const vals=sp.series.flatMap(s=>s.values).filter(v=>v!=null&&Number.isFinite(v));
  if(!vals.length) return `<div class="empty">No data yet</div>`;
  let max=niceMax(Math.max(0,...vals)), min=Math.min(0,...vals);
  if(min<0) min=-niceMax(-min); if(max===min) max=min+1;
  const n=sp.x.length, k=sp.series.length;
  const slot=iw/n, bw=Math.min(46,(slot*0.66)/k);
  const Y=v=>padT+ih-((v-min)/(max-min))*ih;
  let g='';
  for(let i=0;i<=4;i++){
    const v=min+(max-min)*i/4, y=padT+ih-(ih*i/4);
    g+=`<line class="gl" x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL+iw).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    g+=`<text class="ax" x="${padL-10}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${esc(sp.fmt(v))}</text>`;
  }
  sp.x.forEach((l,i)=>{
    g+=`<text class="ax" x="${(padL+slot*i+slot/2).toFixed(1)}" y="${H-padB+18}" text-anchor="middle">${esc(l)}</text>`;
  });
  const zero=Y(0);
  sp.series.forEach((s,j)=>{
    s.values.forEach((v,i)=>{
      if(v==null||!Number.isFinite(v)) return;
      const cx=padL+slot*i+slot/2, x=cx-(k*bw)/2+j*bw;
      const y=Math.min(Y(v),zero), h=Math.abs(Y(v)-zero);
      g+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw-3).toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" fill="${s.color}"${edgeOf(s.color)} rx="2"><title>${esc(s.name)} ${esc(sp.x[i])}: ${esc(sp.fmt(v))}</title></rect>`;
    });
    if(s.name) g+=`<text class="dl" x="${padL}" y="${(padT-2+j*14).toFixed(1)}" fill="${strokeOf(s.color)}">${esc(s.name)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sp.aria||'chart')}">${g}</svg>`;
}

function stackChart(W, sp){
  const H=sp.h||300, padL=sp.padL||60, padR=24, padT=22, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const totals=sp.x.map((_,i)=>sum(sp.series.map(s=>num(s.values[i]))));
  let max=niceMax(Math.max(1,...totals));
  const n=sp.x.length, slot=iw/n, bw=Math.min(64,slot*0.6);
  const Y=v=>padT+ih-(v/max)*ih;
  let g='';
  for(let i=0;i<=4;i++){
    const v=max*i/4, y=padT+ih-(ih*i/4);
    g+=`<line class="gl" x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL+iw).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    g+=`<text class="ax" x="${padL-10}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${esc(sp.fmt(v))}</text>`;
  }
  sp.x.forEach((l,i)=>{
    g+=`<text class="ax" x="${(padL+slot*i+slot/2).toFixed(1)}" y="${H-padB+18}" text-anchor="middle">${esc(l)}</text>`;
    let acc=0;
    sp.series.forEach(s=>{
      const v=num(s.values[i]); if(v<=0) return;
      const y0=Y(acc), y1=Y(acc+v);
      g+=`<rect x="${(padL+slot*i+slot/2-bw/2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1,y0-y1).toFixed(1)}" fill="${s.color}"${edgeOf(s.color)}><title>${esc(s.name)}: ${esc(sp.fmt(v))}</title></rect>`;
      acc+=v;
    });
    g+=`<text class="dl" x="${(padL+slot*i+slot/2).toFixed(1)}" y="${(Y(totals[i])-7).toFixed(1)}" text-anchor="middle" fill="${CH.ink}">${esc(sp.fmt(totals[i]))}</text>`;
  });
  sp.series.forEach((s,j)=>{
    g+=`<rect x="${(padL+j*104).toFixed(1)}" y="2" width="9" height="9" fill="${s.color}"${edgeOf(s.color)} rx="2"/>`;
    g+=`<text class="ax" x="${(padL+13+j*104).toFixed(1)}" y="10">${esc(s.name)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sp.aria||'chart')}">${g}</svg>`;
}

/* The thesis chart: owner hours falling against business value rising. */
function dualChart(W, sp){
  const H=sp.h||320, padL=76, padR=86, padT=18, padB=30;
  const iw=W-padL-padR, ih=H-padT-padB;
  const L=sp.left, R=sp.right;
  const lmax=niceMax(Math.max(1,...L.values.filter(Number.isFinite)));
  const rmax=niceMax(Math.max(1,...R.values.filter(Number.isFinite)));
  const n=sp.x.length;
  const X=i=>padL+(n<=1?iw/2:i*iw/(n-1));
  const YL=v=>padT+ih-(v/lmax)*ih, YR=v=>padT+ih-(v/rmax)*ih;
  let g='';
  for(let i=0;i<=4;i++){
    const y=padT+ih-(ih*i/4);
    g+=`<line class="gl" x1="${padL}" y1="${y.toFixed(1)}" x2="${(padL+iw).toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    g+=`<text class="ax" x="${padL-10}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${esc(L.fmt(lmax*i/4))}</text>`;
    g+=`<text class="ax" x="${padL+iw+10}" y="${(y+3.5).toFixed(1)}" text-anchor="start">${esc(R.fmt(rmax*i/4))}</text>`;
  }
  sp.x.forEach((l,i)=>{ g+=`<text class="ax" x="${X(i).toFixed(1)}" y="${H-padB+18}" text-anchor="middle">${esc(l)}</text>`; });
  const area=R.values.map((v,i)=>[X(i),YR(num(v))]);
  g+=`<path d="${pathOf(area)} L ${X(n-1).toFixed(1)} ${(padT+ih).toFixed(1)} L ${X(0).toFixed(1)} ${(padT+ih).toFixed(1)} Z" fill="${CH.soft}" opacity=".75"/>`;
  g+=`<path d="${pathOf(area)}" fill="none" stroke="${CH.accentLine}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const lp=L.values.map((v,i)=>[X(i),YL(num(v))]);
  g+=`<path d="${pathOf(lp)}" fill="none" stroke="${CH.steel}" stroke-width="2.5" stroke-linejoin="round"/>`;
  lp.forEach(p=>g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${CH.steel}" stroke-width="2"/>`);
  area.forEach(p=>g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${CH.accentLine}" stroke-width="2"/>`);
  g+=`<text class="dl" x="${padL}" y="${(padT-4).toFixed(1)}" fill="${CH.steel}">${esc(L.name)}</text>`;
  g+=`<text class="dl" x="${(padL+iw).toFixed(1)}" y="${(padT-4).toFixed(1)}" text-anchor="end" fill="${CH.accentLine}">${esc(R.name)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sp.aria||'chart')}">${g}</svg>`;
}

function gauge(W, score, label){
  const H=170, cx=W/2, cy=140, r=104;
  const s = (score==null||!Number.isFinite(score)) ? null : clamp(0,100,score);
  const a0=Math.PI, a1=0;
  const pt=(a,rr)=>[cx+Math.cos(a)*rr, cy-Math.sin(a)*rr];
  const arc=(from,to,rr)=>{ const p0=pt(from,rr), p1=pt(to,rr);
    return `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${rr} ${rr} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`; };
  let g=`<path d="${arc(a0,a1,r)}" fill="none" stroke="${CH.rule}" stroke-width="13" stroke-linecap="round"/>`;
  if(s!=null){
    const ae = a0 - (a0-a1)*(s/100);
    g+=`<path d="${arc(a0,ae,r)}" fill="none" stroke="${CH.accentLine}" stroke-width="13" stroke-linecap="round"/>`;
  }
  g+=`<text x="${cx}" y="${cy-14}" text-anchor="middle" style="font-family:var(--serif);font-size:52px;fill:${CH.ink}">${s==null?'—':Math.round(s)}</text>`;
  g+=`<text x="${cx}" y="${cy+12}" text-anchor="middle" class="ax" style="letter-spacing:.16em;text-transform:uppercase;font-weight:700">${esc(label||'Freedom score')}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Freedom score ${s==null?'not set':Math.round(s)} out of 100">${g}</svg>`;
}

/* Radar of the nine life categories: where you are against where you want
   to be. The shape of the gap is the point — a spider that is pinched on
   one axis says more than a table of numbers. */
function radarChart(W, sp){
  const H = sp.h||430;
  const cx = W/2, cy = H/2 + 4;
  const r  = Math.min(W/2, H/2) - 74;
  const n  = sp.labels.length, MAX = sp.max||10;
  const ang = i => -Math.PI/2 + i*2*Math.PI/n;
  const pt  = (i,v) => [cx + Math.cos(ang(i))*r*(v/MAX), cy + Math.sin(ang(i))*r*(v/MAX)];
  let g='';
  for(let k=1;k<=4;k++){
    const rr=r*k/4;
    const pts=Array.from({length:n},(_,i)=>[cx+Math.cos(ang(i))*rr, cy+Math.sin(ang(i))*rr]);
    g+=`<polygon points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${CH.rule}" stroke-width="1"/>`;
  }
  for(let i=0;i<n;i++){
    const p=[cx+Math.cos(ang(i))*r, cy+Math.sin(ang(i))*r];
    g+=`<line x1="${cx}" y1="${cy}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="${CH.rule}" stroke-width="1"/>`;
  }
  sp.series.forEach(se=>{
    const vals=se.values.map(v=>(v==null||!Number.isFinite(v))?0:clamp(0,MAX,v));
    if(!vals.some(v=>v>0)) return;
    const pts=vals.map((v,i)=>pt(i,v));
    g+=`<polygon points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${se.fill||'none'}" stroke="${strokeOf(se.color)}" stroke-width="2.2" stroke-linejoin="round"/>`;
    pts.forEach((p,i)=>{ if(vals[i]>0) g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#fff" stroke="${se.color}" stroke-width="2"/>`; });
  });
  sp.labels.forEach((l,i)=>{
    const a=ang(i), p=[cx+Math.cos(a)*(r+22), cy+Math.sin(a)*(r+22)];
    const anchor = Math.abs(Math.cos(a))<0.25 ? 'middle' : (Math.cos(a)>0?'start':'end');
    g+=`<text class="ax" x="${p[0].toFixed(1)}" y="${(p[1]+4).toFixed(1)}" text-anchor="${anchor}" style="font-weight:700">${esc(l)}</text>`;
  });
  sp.series.forEach((se,j)=>{
    g+=`<rect x="${(14+j*126)}" y="4" width="10" height="10" fill="${se.color}"${edgeOf(se.color)} rx="2"/>`;
    g+=`<text class="ax" x="${(29+j*126)}" y="13">${esc(se.name)}</text>`;
  });
  g+=`<text class="ax" x="${cx}" y="${(cy+r+52).toFixed(1)}" text-anchor="middle">Each axis runs 1 to 10</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sp.aria||'life categories, now against wanted')}">${g}</svg>`;
}

/* A 1–10 rating bar. Clicking is far quicker than typing, and clicking the
   value you already chose clears it. */
function scale10(key, value, kind){
  const v = (value===''||value==null) ? null : num(value);
  return `<div class="scale ${kind||''}" role="group">${
    Array.from({length:10},(_,i)=>i+1).map(nn=>
      `<button type="button" data-tscale="${esc(key)}|${nn}" class="${v!=null&&nn<=v?'on':''}" aria-label="${nn} out of 10"${v===nn?' aria-pressed="true"':''}>${nn}</button>`
    ).join('')}</div>`;
}

/* deferred chart rendering — measure the container, then draw at real pixels */
let PENDING = {};

/* ─── Current vs Proposed mini bars ───────────────────────────────
   Two bars, current against proposed, with the gap called out.
   Either side may be null — a target that has not been set yet draws
   nothing rather than drawing a zero. */
function miniBars(title, sub, cur, prop, fmt){
  const F = fmt==='pct' ? (v=>pct(v)) : money0k;
  const has = v => v!=null && Number.isFinite(v);
  const top = niceMax(Math.max(has(cur)?cur:0, has(prop)?prop:0, 0)) || 1;
  const W=250, H=132, PAD=26, BW=56, GAP=44;
  const x0 = (W-(BW*2+GAP))/2;
  const bar = (v,x,color,label,edge)=>{
    if(!has(v)) return `<text x="${x+BW/2}" y="${H-PAD-6}" text-anchor="middle" font-size="11" fill="${CH.muted}">not set</text>
      <text x="${x+BW/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="${CH.muted}">${esc(label)}</text>`;
    const h = Math.max(1, (Math.max(0,v)/top)*(H-PAD-26));
    return `<rect x="${x}" y="${H-PAD-h}" width="${BW}" height="${h}" fill="${color}" rx="2"${edge?` stroke="${CH.accentEdge}" stroke-width="1"`:''}></rect>
      <text x="${x+BW/2}" y="${H-PAD-h-7}" text-anchor="middle" font-size="11.5" font-weight="600" fill="${CH.ink}">${esc(F(v))}</text>
      <text x="${x+BW/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="${CH.muted}">${esc(label)}</text>`;
  };
  let gapHtml='';
  if(has(cur) && has(prop)){
    const g = prop-cur;
    const cls = Math.abs(g)<(fmt==='pct'?0.0005:0.5) ? 'flat' : (g>0?'down':'up');
    gapHtml = `<span class="gappill ${cls}">Gap: ${esc(signed(g,F))}</span>`;
  }
  return `<div class="mini">
    <div class="mt">${esc(title)}</div><div class="msb">${esc(sub)}</div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(title)}">
      <line x1="8" y1="${H-PAD}" x2="${W-8}" y2="${H-PAD}" stroke="${CH.rule}"></line>
      ${bar(cur, x0, CH.muted, 'Current')}
      ${bar(prop, x0+BW+GAP, CH.accent, 'Proposed', true)}
    </svg>
    ${gapHtml}</div>`;
}
function chartBox(title, id, spec, capText){
  PENDING[id]=spec;
  return `<div class="chartbox"><h4>${esc(title)}</h4><div id="${id}"></div>${capText?`<div class="cap">${esc(capText)}</div>`:''}</div>`;
}
function drawCharts(){
  Object.keys(PENDING).forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    const W=Math.max(320, el.clientWidth||el.parentElement.clientWidth-48);
    const sp=PENDING[id];
    let html='';
    try{
      if(sp.type==='line')  html=lineChart(W,sp);
      else if(sp.type==='bar')   html=barChart(W,sp);
      else if(sp.type==='stack') html=stackChart(W,sp);
      else if(sp.type==='dual')  html=dualChart(W,sp);
      else if(sp.type==='gauge') html=gauge(W,sp.score,sp.label);
      else if(sp.type==='radar') html=radarChart(W,sp);
    }catch(e){ html=`<div class="empty">Chart unavailable</div>`; }
    el.innerHTML=html;
  });
  PENDING={};
}

/* ═══ §RENDER HELPERS ════════════════════════════════════════════ */
let TW = {};
function tv(key, value, fmt){          /* tweened value span */
  const f = FMT[fmt]||n0;
  return `<span data-tw="${esc(key)}" data-v="${value==null||!Number.isFinite(value)?'':value}" data-fmt="${fmt}">${f(value)}</span>`;
}
function runTweens(root){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-tw]',root).forEach(el=>{
    const k=el.dataset.tw, raw=el.dataset.v, f=FMT[el.dataset.fmt]||n0;
    const to = raw==='' ? null : parseFloat(raw);
    const from = TW[k];
    TW[k]= to;
    if(reduce || to==null || from==null || from===to || !Number.isFinite(from)) return;
    const t0=performance.now();
    const step=t=>{ const p=Math.min(1,(t-t0)/420), e=1-Math.pow(1-p,3);
      el.textContent=f(from+(to-from)*e); if(p<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

function metric(label, value, fmt, sub, cls, key){
  return `<div class="m ${cls||''}"><div class="ml">${esc(label)}</div>
    <div class="mv">${key?tv(key,value,fmt):(FMT[fmt]||n0)(value)}</div>
    ${sub?`<div class="ms">${sub}</div>`:''}</div>`;
}
/* An editable metric: keeps the big serif figure but you type into it.
   Empty means "use the number the model derived" — the derived figure shows
   as the placeholder, so it is always obvious what the model thinks. */
function metricIn(label, path, derived, fmt, sub, cls, suffix){
  const F = FMT[fmt]||n0;
  const raw = getPath(path);
  const over = !(raw===null||raw===undefined||raw==='');
  const editing = UI.editing===path;
  const rawStr = v => (v==null||!Number.isFinite(v)) ? '' : String(Math.round(v*100)/100);
  const rawVal = over ? rawStr(num(raw)) : rawStr(derived);
  const value  = editing ? rawVal : (over ? F(num(raw)) : (derived==null?'':F(derived)));
  return `<div class="m ${cls||''}">
    <div class="ml">${esc(label)}</div>
    <div class="mrow">
      <input class="minput" type="text" inputmode="decimal" autocomplete="off"
        data-path="${esc(path)}" data-kind="numn" data-raw="${esc(rawVal)}" value="${esc(value)}"
        placeholder="${esc(derived==null?'—':F(derived))}" aria-label="${esc(label)}">
      ${suffix?`<span class="msuf">${esc(suffix)}</span>`:''}
    </div>
    <div class="ms">${sub||''}${over&&derived!=null?
      ` · <button class="mreset" data-clear="${esc(path)}">use the calculated ${esc(F(derived))}</button>`:''}</div>
  </div>`;
}

/* Thousand separators so a seven-figure number is readable at a glance.
   Grouped at rest, raw digits while the field has focus — commas that
   reflow under the caret while you type are worse than none. */
function grouped(v){
  if(v==null||v===''||!Number.isFinite(num(v))) return '';
  return num(v).toLocaleString('en-NZ',{maximumFractionDigits:2});
}
function field(label, path, opts){
  const o=opts||{};
  const v=getPath(path);
  // 0.28*100 is 28.000000000000004 in binary floating point — never show that.
  let shown = o.kind==='pct' ? (v==null?'':Math.round(v*1e6)/1e4) : v;
  if(o.money) shown = (UI.editing===path) ? (v==null?'':v) : grouped(v);
  return `<div class="f"><div class="flab"><div class="fl">${esc(label)}</div>${o.help?`<div class="fh">${esc(o.help)}</div>`:''}</div>
    ${o.money
      ? `<div class="fmoney"><span>${esc(CURSYM)}</span><input class="grp" type="text" inputmode="decimal" autocomplete="off" data-path="${esc(path)}" data-kind="${o.kind||'num'}" data-raw="${esc(v==null?'':String(v))}" value="${shown===''||shown==null?'':shown}" placeholder="${esc(o.ph||'')}" aria-label="${esc(label)}"></div>`
      : `<input type="text" inputmode="decimal" autocomplete="off" data-path="${esc(path)}" data-kind="${o.kind||'num'}" value="${shown===''||shown==null?'':shown}" placeholder="${esc(o.ph||'')}" aria-label="${esc(label)}">`}
  </div>`;
}
function outrow(label, valueHtml, help, cls){
  return `<div class="f derived ${cls||''}"><div class="flab"><div class="fl">${esc(label)}</div>${help?`<div class="fh">${esc(help)}</div>`:''}</div>
    <div class="out">${valueHtml}</div></div>`;
}
function selectField(label, path, options, help){
  const v=getPath(path);
  return `<div class="f"><div class="flab"><div class="fl">${esc(label)}</div>${help?`<div class="fh">${esc(help)}</div>`:''}</div>
    <select data-path="${esc(path)}" data-kind="str" aria-label="${esc(label)}">${options.map(o=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
}
function getPath(p){ return p.split('.').reduce((o,k)=> o==null?undefined : o[/^\d+$/.test(k)?+k:k], S); }
function setPath(p,val){
  const ks=p.split('.'); const last=ks.pop();
  const o=ks.reduce((o,k)=> o[/^\d+$/.test(k)?+k:k], S);
  o[/^\d+$/.test(last)?+last:last]=val;
}
function gapPill(delta, goodWhenPositive){
  if(delta==null||!Number.isFinite(delta)) return '<span class="pill neutral">—</span>';
  if(Math.abs(delta)<1e-9) return '<span class="pill good">On target</span>';
  const good = goodWhenPositive===false ? delta<0 : delta>0;
  return `<span class="pill ${good?'good':'bad'}">${good?'ahead':'gap'}</span>`;
}
