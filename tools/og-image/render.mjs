// Renders each page's 1200x630 share image into public/ from the site's own 3D scenes.
// Usage: npm run build && npx vite preview --port 4173 &  then  node tools/og-image/render.mjs
// Needs Playwright with Chromium (PLAYWRIGHT_BROWSERS_PATH or a local install).
import {chromium} from 'playwright';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const site=process.env.SITE_URL??'http://127.0.0.1:4173/';
// Each page freezes a colourful moment of its show (seconds on its timeline).
const pages=[
  {path:'',house:'ours',at:147.5,out:'og-image.jpg'},
  {path:'?house=original',house:'original',at:180,out:'og-image-original.jpg',eyebrow:'THE ORIGINAL HOUSE',title:'Frame by frame.',subtitle:'The Wizards in Winter house,<br>rebuilt in 3D from the video.'},
];
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const page of pages){
  // Size the stage near 1.9:1 so the house fills the card.
  const scene=await browser.newPage({viewport:{width:2200,height:1157}});
  await scene.goto(site+page.path,{waitUntil:'networkidle'});
  await scene.waitForTimeout(2500);
  await scene.addStyleTag({content:'.scene-heading,.scene-controls,.scene-footer{display:none!important}'});
  await scene.evaluate(t=>{const r=document.getElementById('timeline');r.value=t;r.dispatchEvent(new Event('input',{bubbles:true}));},page.at);
  await scene.waitForTimeout(1500);
  const shot=join(here,`scene-${page.out.replace('.jpg','.png')}`);
  await scene.locator(`#viewport-${page.house}`).screenshot({path:shot});
  const q=new URLSearchParams({scene:pathToFileURL(shot).href});
  for(const k of ['eyebrow','title','subtitle'])if(page[k])q.set(k,page[k]);
  const card=await browser.newPage({viewport:{width:1200,height:630}});
  await card.goto(pathToFileURL(join(here,'card.html')).href+'?'+q,{waitUntil:'networkidle'});
  await card.evaluate(()=>document.fonts.ready);
  await card.waitForTimeout(300);
  await card.screenshot({path:join(here,'../../public',page.out),type:'jpeg',quality:88});
}
await browser.close();
