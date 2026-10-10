import '../style.css';
import './costs.css';
import {GROUP_LIST,ZONES,DEFAULTS,ALL,estimate} from './estimate.js';
import {PRICES,CHECKED,WATTS_PER_PIXEL,WATTS_SOURCE,PSU_LOAD,PORT_PIXELS,INJECT_EVERY} from './catalog.js';

// The interactive LED cost page: tick props or groups off and every total,
// the infrastructure they need and the breakdown follow.
const $=id=>document.getElementById(id);
const euro=v=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:v>=1000?0:2,minimumFractionDigits:v>=1000?0:2}).format(v);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const qty=l=>l.item==='pixels'||l.item==='spares'?`${l.qty} px`:['mountStrip','cable','injectWire'].includes(l.item)?`${l.qty} m`:l.item==='coro'?`${l.qty} m²`:l.item==='zipTies'?`${Math.round(l.qty*100)} ties`:`${l.qty} ×`;
const selected=new Set(ALL),options={...DEFAULTS},open=new Set();
const FULL=estimate(ALL,DEFAULTS).total;

$('checked').textContent=new Date(CHECKED).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

function lineRows(lines){
 return lines.map(l=>`<tr class="line"><td>${esc(l.name)}${PRICES[l.item]?.estimate?' <span class="badge">estimate</span>':''}</td><td class="num">${qty(l)}</td><td class="num">${euro(l.cost)}</td></tr>`).join('');
}
function renderGroups(e){
 $('groups').innerHTML=GROUP_LIST.map(g=>{
  const r=e.groups.find(x=>x.id===g.id),on=r.count>0,priced=new Map(r.props.map(p=>[p.id,p]));
  const state=r.count===r.of?'all':r.count?'some':'none';
  return `<article class="group ${on?'':'off'}" data-group="${g.id}">
   <div class="group-head">
    <label class="check"><input type="checkbox" data-toggle-group="${g.id}" ${state==='all'?'checked':''} ${state==='some'?'data-mixed':''}><span><strong>${esc(g.name)}</strong><small>${r.count} of ${r.of} ${r.of===1?'prop':'props'} · ${r.pixels.toLocaleString('en')} pixels · ${ZONES[g.zone].name.toLowerCase()}</small></span></label>
    <div class="group-total">${euro(r.total)}</div>
   </div>
   <p class="led"><b>${esc(g.led)}.</b> ${esc(g.why)}</p>
   <button class="text-button expand" data-expand="${g.id}" aria-expanded="${open.has(g.id)}">${open.has(g.id)?'Hide':'Show'} ${r.of===1?'parts':`the ${r.of} props and parts`}</button>
   <div class="props" ${open.has(g.id)?'':'hidden'}>
    <table><thead><tr><th>Prop</th><th class="num">Pixels</th><th class="num">Cost</th></tr></thead><tbody>
    ${g.props.map(p=>{const q=priced.get(p.id);return `<tr class="prop ${q?'':'off'}"><td><label class="check"><input type="checkbox" data-toggle-prop="${p.id}" ${q?'checked':''}><span>${esc(p.name)}${q?`<small>${q.run} m of cable from the ${q===r.props[0]?'box':'previous prop'}</small>`:''}</span></label></td><td class="num">${p.pixels}</td><td class="num">${q?euro(q.total):'–'}</td></tr>${q&&r.of===1?lineRows(q.lines):''}`;}).join('')}
    ${r.extras.length?`<tr class="sub"><td colspan="3">Group parts</td></tr>${lineRows(r.extras)}`:''}
    </tbody></table>
    ${r.of>1&&r.props.length?`<details><summary>Parts per prop</summary>${r.props.map(p=>`<table class="parts"><caption>${esc(p.name)}</caption><tbody>${lineRows(p.lines)}</tbody></table>`).join('')}</details>`:''}
   </div>
  </article>`;}).join('');
 for(const box of document.querySelectorAll('[data-mixed]'))box.indeterminate=true;
}
function renderSummary(e){
 $('total').textContent=euro(e.total);
 const d=Math.round((e.total-FULL)*100)/100;
 $('delta').textContent=d===0?'The full show, every prop included.':`${d<0?'−':'+'}${euro(Math.abs(d))} compared with the full show (${euro(FULL)}).`;
 const z=Object.values(e.zones);
 $('kpis').innerHTML=[[e.pixels.toLocaleString('en'),'pixels'],[z.reduce((s,x)=>s+x.controllers,0),'controllers'],[z.reduce((s,x)=>s+x.psus,0),'power supplies'],[`${e.watts} W`,'at full white']].map(([v,k])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
 const max=Math.max(...e.categories.map(c=>c.cost),1);
 $('breakdown').innerHTML=e.categories.map(c=>`<div class="bar-row" role="row" title="${esc(c.name)}: ${euro(c.cost)}${e.total?` (${Math.round(c.cost/e.total*100)}%)`:''}"><span role="cell">${esc(c.name)}</span><span class="bar" role="presentation"><i style="width:${c.cost/max*100}%"></i></span><b role="cell">${euro(c.cost)}</b></div>`).join('');
 $('infra').innerHTML=e.infra.length?`<table><tbody>${lineRows(e.infra)}</tbody><tfoot><tr><td>Infrastructure</td><td></td><td class="num">${euro(e.infraTotal)}</td></tr><tr><td>Props (all groups)</td><td></td><td class="num">${euro(e.direct)}</td></tr><tr><td>Contingency (${options.contingency}%)</td><td></td><td class="num">${euro(e.contingency)}</td></tr><tr class="grand"><td>Total</td><td></td><td class="num">${euro(e.total)}</td></tr></tfoot></table>`:'<p class="note">No props selected.</p>';
}
function renderOptions(){
 $('pixel-price').value=options.pixelPrice;$('pixel-price-value').textContent=`${euro(options.pixelPrice)} (${euro(options.pixelPrice/50)} each)`;
 $('spare').value=options.spare;$('spare-value').textContent=`${options.spare}%`;
 $('contingency').value=options.contingency;$('contingency-value').textContent=`${options.contingency}%`;
 $('audio').checked=options.audio;
}
// Re-rendering replaces the group cards, so keyboard focus returns to the control that was used.
function update(){
 const a=document.activeElement,key=a&&['toggleGroup','toggleProp','expand'].find(k=>a.dataset?.[k]),value=key&&a.dataset[key];
 const e=estimate(selected,options);renderGroups(e);renderSummary(e);renderOptions();
 if(key)document.querySelector(`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${value}"]`)?.focus();
}

$('groups').addEventListener('change',event=>{
 const t=event.target;
 if(t.dataset.toggleGroup){const g=GROUP_LIST.find(x=>x.id===t.dataset.toggleGroup);for(const p of g.props)t.checked?selected.add(p.id):selected.delete(p.id);}
 if(t.dataset.toggleProp)t.checked?selected.add(t.dataset.toggleProp):selected.delete(t.dataset.toggleProp);
 update();
});
$('groups').addEventListener('click',event=>{
 const id=event.target.closest('[data-expand]')?.dataset.expand;if(!id)return;
 open.has(id)?open.delete(id):open.add(id);update();
});
for(const [id,key] of [['pixel-price','pixelPrice'],['spare','spare'],['contingency','contingency']])$(id).addEventListener('input',e=>{options[key]=+e.target.value;update();});
$('audio').addEventListener('change',e=>{options.audio=e.target.checked;update();});
$('reset').addEventListener('click',()=>{for(const id of ALL)selected.add(id);Object.assign(options,DEFAULTS);update();});

// Why these LEDs: the reasoning behind the picks, from the same numbers.
const full=estimate(ALL,DEFAULTS),groups=full.groups.filter(g=>g.pixels);
$('analysis').innerHTML=`<h2>Why these LEDs</h2>
<div class="cards">
 <div><h3>Pixels, not coloured strings</h3><p>The show runs 56 channels, fades included, and four of them (the upper, lower, window and ground strips) switch yellow and blue independently. With ordinary coloured strings that is 60 dimmable outputs and two strings on every multicolour run. Addressable WS2811 pixels take one data line per run: each bulb can be yellow, blue, red or green at any brightness, so the same detected timing drives every prop, and each prop can later do more than the original did.</p></div>
 <div><h3>12 V, 12 mm bullets</h3><p>12 mm bullet pixels look like the original's C-style bulbs from the street and are sealed to IP68. 12 V loses less voltage over the ${Math.max(...full.groups.flatMap(g=>g.props.map(p=>p.run)))} m runs and long chains than 5 V; a run still gets power injected every ${INJECT_EVERY} pixels. They come in strings of 50 at a 10 cm pitch; where a prop packs them tighter (the letters at 4.5 cm, the house strips at 5 cm), the spare wire hides behind the board or the run.</p></div>
 <div><h3>Two boxes, one player</h3><p>A ${esc(ZONES.facade.name.toLowerCase())} ${esc(ZONES.facade.where)} feeds the facade props, and a ${esc(ZONES.garden.name.toLowerCase())} ${esc(ZONES.garden.where)} feeds the garden props. Each holds a Baldrick 8 controller (8 ports of up to 750 pixels; we load at most ${PORT_PIXELS} per port) and Mean Well 12 V supplies at no more than ${Math.round(PSU_LOAD*100)}% load. A Raspberry Pi with Falcon Player plays the sequence and the music and sends it to both boxes over the network. xLights and Falcon Player are free.</p></div>
 <div><h3>Power and running cost</h3><p>At about ${WATTS_PER_PIXEL} W per pixel (<a href="${WATTS_SOURCE}">OpenELAB spec</a>) all ${full.pixels.toLocaleString('en')} pixels at full white would draw ${full.watts} W. The show is mostly yellow, red and dark, so it averages far less: at a third of that for 5 hours a night through December, about ${Math.round(full.watts/3*5*31/1000)} kWh, or roughly ${euro(Math.round(full.watts/3*5*31/1000*.35))} of electricity at €0.35 per kWh.</p></div>
</div>
<h3 class="per-group-title">Pixels per group</h3>
<div class="mini-bars">${groups.map(g=>`<div class="bar-row" title="${esc(g.name)}: ${g.pixels} pixels"><span>${esc(g.name)}</span><span class="bar"><i style="width:${g.pixels/Math.max(...groups.map(x=>x.pixels))*100}%"></i></span><b>${g.pixels}</b></div>`).join('')}</div>
<p class="note">Not included: tools (drill, crimper, multimeter), shipping, labour and the time to sequence. Pixel counts come straight from the 3D model of our house; build the props denser or sparser and the pixel cost follows.</p>`;

$('sources').innerHTML=`<table><thead><tr><th>Part</th><th>Shop</th><th class="num">Price</th></tr></thead><tbody>${Object.values(PRICES).map(p=>`<tr><td>${esc(p.name)}${p.estimate?' <span class="badge">estimate</span>':''}</td><td>${p.url?`<a href="${p.url}" rel="noopener">${esc(p.shop)}</a>`:'–'}</td><td class="num">${euro(p.price)}</td></tr>`).join('')}</tbody></table>
<p class="note">Cheaper pixels: the same 12 V strings sell for less from importers (Alitove on Amazon.nl, AliExpress), which the pixel price slider lets you try. A QuinLED Dig-Octa (<a href="https://quinled.shop/product/dig-octa-system/">from about $65</a>) is an alternative 8-port controller.</p>`;

update();
