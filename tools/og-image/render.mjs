// Renders public/og-image.jpg (1200x630) from the site's own 3D scene.
// Usage: npm run build && npx vite preview --port 4173 &  then  node tools/og-image/render.mjs
// Needs Playwright with Chromium (PLAYWRIGHT_BROWSERS_PATH or a local install).
import {chromium} from 'playwright';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const site=process.env.SITE_URL??'http://127.0.0.1:4173/';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
// Size the stage near 1.9:1 so the house fills the card, then freeze a colourful moment of the demo show.
const scene=await browser.newPage({viewport:{width:2200,height:1157}});
await scene.goto(site,{waitUntil:'networkidle'});
await scene.waitForTimeout(2500);
await scene.addStyleTag({content:'.scene-heading,.scene-controls,.scene-footer{display:none!important}'});
await scene.evaluate(()=>{const r=document.getElementById('timeline');r.value=140;r.dispatchEvent(new Event('input',{bubbles:true}));});
await scene.waitForTimeout(1000);
await scene.locator('#viewport').screenshot({path:join(here,'scene.png')});
const card=await browser.newPage({viewport:{width:1200,height:630}});
await card.goto(pathToFileURL(join(here,'card.html')).href,{waitUntil:'networkidle'});
await card.evaluate(()=>document.fonts.ready);
await card.screenshot({path:join(here,'../../public/og-image.jpg'),type:'jpeg',quality:88});
await browser.close();
