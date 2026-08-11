/* ═══ §CHARTS — hand-built SVG, no library ══════════════════════ */

const CH = {ink:'#0E1A22', accent:'#C2703A', steel:'#3D5A6C', muted:'#5E6B74',
            rule:'#DCD6CC', good:'#2E7D5B', bad:'#A4433B', soft:'#F0E2D6'};

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
    g+=`<path d="${pathOf(pts)}" fill="none" stroke="${s.color}" stroke-width="${s.w||2.25}" stroke-linejoin="round" stroke-linecap="round"${s.dash?` stroke-dasharray="${s.dash}"`:''}/>`;
    pts.forEach(p=>{ g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#fff" stroke="${s.color}" stroke-width="2"/>`; });
    const last=pts[pts.length-1];
    g+=`<text class="dl" x="${(last[0]+9).toFixed(1)}" y="${(last[1]+4).toFixed(1)}" fill="${s.color}">${esc(s.name)}</text>`;
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
      g+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw-3).toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" fill="${s.color}" rx="2"><title>${esc(s.name)} ${esc(sp.x[i])}: ${esc(sp.fmt(v))}</title></rect>`;
    });
    if(s.name) g+=`<text class="dl" x="${padL}" y="${(padT-2+j*14).toFixed(1)}" fill="${s.color}">${esc(s.name)}</text>`;
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
      g+=`<rect x="${(padL+slot*i+slot/2-bw/2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1,y0-y1).toFixed(1)}" fill="${s.color}"><title>${esc(s.name)}: ${esc(sp.fmt(v))}</title></rect>`;
      acc+=v;
    });
    g+=`<text class="dl" x="${(padL+slot*i+slot/2).toFixed(1)}" y="${(Y(totals[i])-7).toFixed(1)}" text-anchor="middle" fill="${CH.ink}">${esc(sp.fmt(totals[i]))}</text>`;
  });
  sp.series.forEach((s,j)=>{
    g+=`<rect x="${(padL+j*104).toFixed(1)}" y="2" width="9" height="9" fill="${s.color}" rx="2"/>`;
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
  g+=`<path d="${pathOf(area)}" fill="none" stroke="${CH.accent}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const lp=L.values.map((v,i)=>[X(i),YL(num(v))]);
  g+=`<path d="${pathOf(lp)}" fill="none" stroke="${CH.steel}" stroke-width="2.5" stroke-linejoin="round"/>`;
  lp.forEach(p=>g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${CH.steel}" stroke-width="2"/>`);
  area.forEach(p=>g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="#fff" stroke="${CH.accent}" stroke-width="2"/>`);
  g+=`<text class="dl" x="${padL}" y="${(padT-4).toFixed(1)}" fill="${CH.steel}">${esc(L.name)}</text>`;
  g+=`<text class="dl" x="${(padL+iw).toFixed(1)}" y="${(padT-4).toFixed(1)}" text-anchor="end" fill="${CH.accent}">${esc(R.name)}</text>`;
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
    g+=`<path d="${arc(a0,ae,r)}" fill="none" stroke="${CH.accent}" stroke-width="13" stroke-linecap="round"/>`;
  }
  g+=`<text x="${cx}" y="${cy-14}" text-anchor="middle" style="font-family:var(--serif);font-size:52px;fill:${CH.ink}">${s==null?'—':Math.round(s)}</text>`;
  g+=`<text x="${cx}" y="${cy+12}" text-anchor="middle" class="ax" style="letter-spacing:.16em;text-transform:uppercase;font-weight:700">${esc(label||'Freedom score')}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Freedom score ${s==null?'not set':Math.round(s)} out of 100">${g}</svg>`;
}

/* deferred chart rendering — measure the container, then draw at real pixels */
let PENDING = {};
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
function field(label, path, opts){
  const o=opts||{};
  const v=getPath(path);
  const shown = o.kind==='pct' ? (v==null?'':(v*100)) : v;
  return `<div class="f"><div class="flab"><div class="fl">${esc(label)}</div>${o.help?`<div class="fh">${esc(o.help)}</div>`:''}</div>
    <input type="number" step="${o.step||'any'}" data-path="${esc(path)}" data-kind="${o.kind||'num'}" value="${shown===''||shown==null?'':shown}" aria-label="${esc(label)}"></div>`;
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
