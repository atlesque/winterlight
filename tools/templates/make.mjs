// Full-size cutting templates for the coro props (circles, peace sign, candy
// cane, tree star), drawn from the same bulbs and frames as the 3D model.
// Usage: node tools/templates/make.mjs  → outputs/templates/<prop>.svg and .pdf
// The grey band is the piece to cut out; each ring marks a 12 mm pixel hole.
// PDFs need Playwright with Chromium; SVGs are written without it.
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {OWN_CHANNELS} from '../../src/props.js';

const out=fileURLToPath(new URL('../../outputs/templates/',import.meta.url));
mkdirSync(out,{recursive:true});
// Which channel stands for each template, how many to cut, and which frames are coro
// (the star's second frame is its stem down to the tree, not part of the board).
// Bridges (degrees) tie the circle's inner ring to the outer one so it stays in one piece.
export const TEMPLATES=[
 {file:'christmas-circle',id:'wreath-left',title:'Christmas circle',cut:2,bridges:[45,135,225,315]},
 {file:'peace-sign',id:'peace',title:'Peace sign',cut:1},
 {file:'candy-cane',id:'cane-1',title:'Candy cane',cut:8,note:'Flip the template for the four canes whose hook points the other way.'},
 {file:'tree-star',id:'tree-star',title:'Tree star',cut:1,frames:1},
];
const BAND=50,HOLE=12,MARGIN=20,HEADER=32;

export function template(t){
 const c=OWN_CHANNELS.find(x=>x.id===t.id),frames=c.frames.slice(0,t.frames??c.frames.length);
 if(t.bridges){
  const cx=c.bulbs.reduce((s,b)=>s+b.pos[0],0)/c.bulbs.length,cy=frames[0].reduce((s,p)=>s+p[1],0)/frames[0].length;
  const radii=frames.map(f=>Math.hypot(f[0][0]-cx,f[0][1]-cy)),r0=Math.min(...radii),r1=Math.max(...radii),z=frames[0][0][2];
  for(const d of t.bridges){const a=d*Math.PI/180;frames.push([r0,r1].map(r=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z]));}
 }
 const pts=[...c.bulbs.map(b=>b.pos),...frames.flat()];
 const x0=Math.min(...pts.map(p=>p[0])),x1=Math.max(...pts.map(p=>p[0])),y0=Math.min(...pts.map(p=>p[1])),y1=Math.max(...pts.map(p=>p[1]));
 const pad=BAND/2+MARGIN,w=Math.max(300,Math.ceil((x1-x0)*1000+2*pad)),h=Math.ceil((y1-y0)*1000+2*pad)+HEADER+30;
 // Model metres to template millimetres, y pointing down.
 const X=p=>((p[0]-x0)*1000+pad).toFixed(1),Y=p=>((y1-p[1])*1000+pad+HEADER).toFixed(1);
 const band=[...frames.map(f=>`<polyline points="${f.map(p=>`${X(p)},${Y(p)}`).join(' ')}"/>`),
  ...c.bulbs.map(b=>`<circle cx="${X(b.pos)}" cy="${Y(b.pos)}" r="${BAND/2}" stroke="none" fill="#d9d9d9"/>`)].join('');
 // Where the model puts two pixels within 2 cm (the peace sign's stroke ends) one hole does.
 const spots=c.bulbs.map(b=>b.pos).filter((p,i,all)=>!all.slice(0,i).some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.02));
 const holes=spots.map(p=>{const x=+X(p),y=+Y(p);return `<circle cx="${x}" cy="${y}" r="${HOLE/2}"/><path d="M${x-3} ${y}h6M${x} ${y-3}v6"/>`;}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" font-family="sans-serif">
<rect width="${w}" height="${h}" fill="#fff"/>
<text x="${MARGIN}" y="14" font-size="9" font-weight="bold">${t.title} · cut ${t.cut} · ${spots.length} holes of ${HOLE} mm</text>
<text x="${MARGIN}" y="21" font-size="5">Cut along the edge of the grey band. Print at 100% (actual size).</text>
<text x="${MARGIN}" y="27" font-size="5">${t.note??'The bar at the bottom must measure 100 mm.'}</text>
<g fill="none" stroke="#d9d9d9" stroke-width="${BAND}" stroke-linecap="round" stroke-linejoin="round">${band}</g>
<g fill="none" stroke="#000" stroke-width=".6">${holes}</g>
<g><rect x="${MARGIN}" y="${h-16}" width="100" height="4" fill="#000"/><text x="${MARGIN+104}" y="${h-12}" font-size="5">100 mm</text></g>
</svg>`;
 return {svg,w,h,holes:spots.length};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const made=TEMPLATES.map(t=>{const r=template(t);writeFileSync(`${out}${t.file}.svg`,r.svg);return {...t,...r};});
 try{
  const {chromium}=await import('playwright').catch(()=>createRequire(import.meta.url)('playwright'));const browser=await chromium.launch();const page=await browser.newPage();
  for(const t of made){
   await page.setContent(`<style>@page{size:${t.w}mm ${t.h}mm;margin:0}html,body{margin:0}</style>${t.svg}`);
   await page.pdf({path:`${out}${t.file}.pdf`,width:`${t.w}mm`,height:`${t.h}mm`,printBackground:true});
  }
  await browser.close();
 }catch(e){console.warn(`PDFs skipped: ${e.message}`);}
 for(const t of made)console.log(`${t.file}: ${t.w} × ${t.h} mm, ${t.holes} holes, cut ${t.cut}`);
}
