// Full-size cutting templates for the coro props (circles, peace sign, candy
// cane, tree star), drawn from the same bulbs and frames as the 3D model.
// Usage: node tools/templates/make.mjs  → outputs/templates/<prop>.svg and .pdf,
// plus <prop>-a4.pdf, the same template tiled on A4 pages for a home printer.
// The grey band is the piece to cut out; each ring marks a 12 mm pixel hole.
// PDFs need Playwright with Chromium; SVGs are written without it.
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {CORO_TEMPLATES,coroShape,BAND,HOLE} from '../../src/coro.js';

const out=fileURLToPath(new URL('../../outputs/templates/',import.meta.url));
export const TEMPLATES=CORO_TEMPLATES;
const MARGIN=20,HEADER=32;
// A4 tiles: the printable area of each page and how much the pages overlap (mm).
export const A4={w:190,h:277,overlap:10};

export function template(t){
 const {bulbs,frames,spots,x0,x1,y0,y1}=coroShape(t);
 const pad=BAND/2+MARGIN,w=Math.max(300,Math.ceil((x1-x0)*1000+2*pad)),h=Math.ceil((y1-y0)*1000+2*pad)+HEADER+30;
 // Model metres to template millimetres, y pointing down.
 const X=p=>((p[0]-x0)*1000+pad).toFixed(1),Y=p=>((y1-p[1])*1000+pad+HEADER).toFixed(1);
 const band=[...frames.map(f=>`<polyline points="${f.map(p=>`${X(p)},${Y(p)}`).join(' ')}"/>`),
  ...bulbs.map(p=>`<circle cx="${X(p)}" cy="${Y(p)}" r="${BAND/2}" stroke="none" fill="#d9d9d9"/>`)].join('');
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

// The template cut into A4 pages: each page overlaps the next by A4.overlap mm,
// marked with a red dashed line to lay the neighbouring page's edge on.
export function tiles(t,{svg,w,h}){
 const inner=svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
 const sw=A4.w-A4.overlap,sh=A4.h-A4.overlap,cols=Math.ceil((w-A4.overlap)/sw),rows=Math.ceil((h-A4.overlap)/sh),pages=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const x=c*sw,y=r*sh,row=String.fromCharCode(65+r),name=`${row}${c+1}`;
  pages.push(`<div class="p"><svg style="position:absolute;left:10mm;top:10mm" width="${A4.w}mm" height="${A4.h}mm" viewBox="${x} ${y} ${A4.w} ${A4.h}" font-family="sans-serif">${inner}
<g stroke="#e33" stroke-width=".3" stroke-dasharray="2 2" fill="none">${c?`<line x1="${x+A4.overlap}" y1="${y}" x2="${x+A4.overlap}" y2="${y+A4.h}"/>`:''}${r?`<line x1="${x}" y1="${y+A4.overlap}" x2="${x+A4.w}" y2="${y+A4.overlap}"/>`:''}</g>
<rect x="${x}" y="${y}" width="${A4.w}" height="${A4.h}" fill="none" stroke="#999" stroke-width=".3"/></svg>
<div class="l">${t.title} · page ${name} of ${String.fromCharCode(64+rows)}${cols} (row ${row}, column ${c+1}) · print at 100% · trim on the grey frame and lay the edge on the next page's red dashed line</div></div>`);
 }
 return {html:`<style>@page{size:210mm 297mm;margin:0}html,body{margin:0}.p{width:210mm;height:297mm;position:relative;page-break-after:always;overflow:hidden}.l{position:absolute;left:10mm;top:3mm;font:7pt sans-serif}</style>${pages.join('')}`,pages:pages.length};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 mkdirSync(out,{recursive:true});
 const made=TEMPLATES.map(t=>{const r=template(t);writeFileSync(`${out}${t.file}.svg`,r.svg);return {...t,...r,tiled:tiles(t,r)};});
 try{
  const {chromium}=await import('playwright').catch(()=>createRequire(import.meta.url)('playwright'));const browser=await chromium.launch();const page=await browser.newPage();
  for(const t of made){
   await page.setContent(`<style>@page{size:${t.w}mm ${t.h}mm;margin:0}html,body{margin:0}</style>${t.svg}`);
   await page.pdf({path:`${out}${t.file}.pdf`,width:`${t.w}mm`,height:`${t.h}mm`,printBackground:true});
   await page.setContent(t.tiled.html);
   await page.pdf({path:`${out}${t.file}-a4.pdf`,width:'210mm',height:'297mm',printBackground:true});
  }
  await browser.close();
 }catch(e){console.warn(`PDFs skipped: ${e.message}`);}
 for(const t of made)console.log(`${t.file}: ${t.w} × ${t.h} mm, ${t.holes} holes, cut ${t.cut}, ${t.tiled.pages} A4 pages`);
}
