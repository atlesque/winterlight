import {estimate,ALL,GROUP_LIST,ZONES,DEFAULTS} from '../costs/estimate.js';
import {PRICES as P,CHECKED} from '../costs/catalog.js';
import {HOUSE,PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
// The coro templates made by tools/templates/make.mjs (outputs/templates/).
export const TEMPLATES=[
 {file:'christmas-circle',title:'Christmas circle',cut:2},{file:'peace-sign',title:'Peace sign',cut:1},
 {file:'candy-cane',title:'Candy cane',cut:8},{file:'tree-star',title:'Tree star',cut:1},
];

// The build runbook (runbook.html): chapters of to-dos from buying the parts
// to the first test run. Quantities come from the cost model for the full show
// (src/costs/estimate.js), so the shopping list follows any change there.
// Prices are euro incl. VAT; each purchase has a default expense (private or
// business) that the page lets you switch.
export const SHOW_DATE='2026-12-01';
export {CHECKED};
const WAVE1='2026-11-06',WAVE2='2026-11-13';

const FULL=estimate(ALL,DEFAULTS);
const lines=[...FULL.groups.flatMap(g=>[...g.props.flatMap(p=>p.lines),...g.extras]),...FULL.infra];
const modelQty=item=>lines.filter(l=>l.item===item).reduce((s,l)=>s+l.qty,0);
const g0=id=>FULL.groups.find(g=>g.id===id).count;
const zones=Object.values(FULL.zones),zoneSum=k=>zones.reduce((s,z)=>s+z[k],0);
const group=id=>FULL.groups.find(g=>g.id===id);

// Shops, with a rough delivery time in days from ordering to the door.
export const SHOPS={
 ledshows:{name:'LEDshows.nl',days:[5,10],tip:'Controllers, mounting strip and X-con splitters in one basket. LEDshows sells to private buyers only, and its pixels were sold out in November.'},
 pixelimperium:{name:'Pixel-Imperium',days:[3,7],tip:'Ships from Germany; Belgian VAT is charged in the basket. Same stock as Xmas-Land.'},
 aliexpress:{name:'AliExpress',days:[9,16],tip:'Under €150, so VAT is paid at checkout and nothing is due on delivery.'},
 local:{name:'Local DIY store',days:[0,1]},
 bambu:{name:'Bambu Lab store',days:[3,7],tip:'Bought as a business. 6 rolls get 35% off in the Black Friday bulk deal.'},
 kunststofshop:{name:'kunststofshop.nl',days:[5,8],tip:'Sheets ship in 3 to 5 working days; shipping to Belgium shows at checkout.'},
 audiophonics:{name:'Audiophonics',days:[4,7]},
 vekto:{name:'Vekto',days:[3,5]},
 kiwi:{name:'Kiwi Electronics',days:[1,3]},
 propixeler:{name:'ProPixeler',days:[3,7]},
 bol:{name:'bol.com',days:[1,3]},
 elektramat:{name:'Elektramat.nl',days:[1,3],tip:'Electrical wholesaler; check shipping to Belgium at checkout.'},
};
const STRINGS=Math.ceil(FULL.pixels*(1+DEFAULTS.spare/100)/50),STANDARD_STRINGS=Math.min(24,STRINGS);
const search=q=>`https://www.bol.com/be/nl/s/?searchtext=${encodeURIComponent(q)}`;

// Everything to buy for the full show. qty is in the shop's own units.
const ROWS=[
 // Wave 1: parts with the longest delivery or needed first on the bench.
 // Pixel-Imperium had 24 standard strings; the regulated strings make up the rest.
 {id:'pixels',name:'12 V WS2811 bullet pixels, strings of 50',qty:STANDARD_STRINGS,unit:'strings',price:P.pixels50.price,url:P.pixels50.url,shop:'pixelimperium',expense:'private',wave:1,
  tip:`${FULL.pixels.toLocaleString('en')} pixels in the props plus ${DEFAULTS.spare}% spare make ${STRINGS} strings of 50. Only ${STANDARD_STRINGS} standard strings were in stock. Ordered 6 Nov with the regulated strings: €820.47 including shipping.`},
 {id:'pixelsRegulated',name:'Regulated 12 V WS2811 bullet pixels, strings of 50',qty:STRINGS-STANDARD_STRINGS,unit:'strings',price:P.pixels50reg.price,url:P.pixels50reg.url,shop:'pixelimperium',expense:'private',wave:1,
  tip:'The same pixels with a constant-current driver, so they stay evenly bright along a run. Same xConnect plugs and 10 cm pitch. Ordered 6 Nov with the standard strings.'},
 {id:'pixelShipping',name:'Pixel-Imperium shipping to Belgium',qty:1,unit:'×',price:63.9,url:P.pixels50.url,shop:'pixelimperium',expense:'private',wave:1,tip:'Paid with the pixel order on 6 Nov: €820.47 in all for 24 standard and 27 regulated strings plus shipping. Delivery in 3 to 7 days.'},
 {id:'controller',name:'Baldrick 8 pixel controller',qty:zoneSum('controllers'),unit:'×',price:P.controller.price,url:P.controller.url,shop:'ledshows',expense:'private',wave:1,tip:'One for the facade box, one for the garden box. Private: LEDshows doesn\'t sell to businesses. Ordered 6 Nov with the rest of the LEDshows basket: €391 in all.'},
 {id:'ledshowsShipping',name:'LEDshows shipping to Belgium',qty:1,unit:'×',price:9,url:P.controller.url,shop:'ledshows',expense:'private',wave:1,tip:'Paid with the LEDshows basket on 6 Nov: €391 in all for the controllers, T-splitters, wire, mounting strip, cable ties and sound card.'},
 {id:'pigtail',name:'xConnect pigtail pairs, 50 cm, packs of 10',qty:Math.ceil(modelQty('pigtail')/10),unit:'packs',price:Math.round(P.pigtail.price*10*100)/100,url:P.pigtail.url,shop:'aliexpress',expense:'private',wave:1,tip:`One pair per prop, ${modelQty('pigtail')} in all. LEDshows and Pixel-Imperium had none in stock. Ordered 6 Nov with the extension cables: €407.46 for both.`},
 {id:'tSplitter',name:'X-con T-splitters for power injection',qty:modelQty('tSplitter'),unit:'×',price:P.tSplitter.price,url:P.tSplitter.url,shop:'ledshows',expense:'private',wave:1,tip:`One every ${150} pixels along a run.`},
 {id:'cable',name:'xConnect 18 AWG extension cables, packs of 10 (1, 2, 3, 4 and 10 m)',qty:8,unit:'packs',price:38.34,url:'https://www.aliexpress.com/w/wholesale-ray-wu-xconnect-extension.html',shop:'aliexpress',expense:'private',wave:1,tip:'Ordered 6 Nov from Ray Wu: 3 × 1 m, 2 × 2 m, 1 × 3 m, 1 × 4 m, 1 × 10 m packs for the 56 hops from the garage (the three longest runs join 10 m and 2 m). €407.46 paid together with the pigtails.'},
 {id:'injectWire',name:'4 mm² installation wire, red and black',qty:modelQty('injectWire'),unit:'m',price:P.injectWire.price,url:P.injectWire.url,shop:'ledshows',expense:'private',wave:1},
 {id:'mountStrip',name:'Pixel mounting strip, 50 m roll',qty:Math.ceil(modelQty('mountStrip')/50),unit:'rolls',price:P.mountStrip.price*50,url:P.mountStrip.url,shop:'ledshows',expense:'private',wave:1,tip:`${Math.ceil(modelQty('mountStrip'))} m for the house strips, window outlines, ground strip and tree strands.`},
 {id:'zipTies',name:'Cable ties, 100 pieces',qty:Math.ceil(modelQty('zipTies')),unit:'packs',price:P.zipTies.price,url:P.zipTies.url,shop:'ledshows',expense:'private',wave:1},
 {id:'psu',name:'Mean Well LRS-350-12 power supply',qty:zoneSum('psus'),unit:'×',price:140.96/4,url:P.psu.url,shop:'audiophonics',expense:'business',wave:1,tip:'Two per box, each at no more than 80% load. Ordered 6 Nov as a business purchase: €140.96 for all four with shipping, excluding VAT.'},
 {id:'enclosure',name:'IP65 enclosure 280 × 210 × 130 mm',qty:zoneSum('boxes'),unit:'×',price:P.enclosure.price,url:P.enclosure.url,shop:'vekto',expense:'private',optional:true,wave:1,tip:'Not needed: the boxes go in the garage. '+'Two per zone: one for the controller and a power supply, one for the second power supply. In the garage, a cheaper indoor box or a board on the wall will do.'},
 {id:'letters',name:'ProPixeler coro letters, 30 cm',qty:g0('letters'),unit:'×',price:P.letter30.price,url:P.letter30.url,shop:'propixeler',expense:'private',wave:1,tip:'H, A, P, P, Y, H, O, L, I, D, A, Y, S. Bare coro, pre-drilled for pixels; ask them to confirm the holes take 12 mm bullets. Ordered 6 Nov: €103 with shipping.'},
 {id:'letterShipping',name:'ProPixeler shipping to Belgium',qty:1,unit:'×',price:12,url:P.letter30.url,shop:'propixeler',expense:'private',wave:1,tip:'Paid with the letters on 6 Nov: €103 in all.'},
 {id:'coro',name:'Coro sheet 140 × 100 cm, 3 mm, blank white',qty:Math.ceil(modelQty('coro')*1.4/1.4),unit:'sheets',price:12.5,url:P.coro.url,shop:'kunststofshop',expense:'private',wave:1,
  tip:`${Math.ceil(modelQty('coro'))} m² for the circles, peace sign, candy canes and tree star, plus 40% for offcuts. No piece is bigger than about 65 × 65 cm, so these sheets ship as a normal parcel.`},
 {id:'gelbox',name:'WAGO Gelbox 207-1332 (IPX8, takes 221 Wagos), pack of 4',qty:1,unit:'pack',price:16.5,url:search('wago gelbox 207-1332'),shop:'bol',expense:'private',wave:1,tip:'Waterproofs the Wago joint between each T-splitter pigtail and the 4 mm² run. Bol caps it at one pack, so the other six come from Elektramat.'},
 {id:'gelboxMore',name:'WAGO Gelbox 207-1332 (IPX8, takes 221 Wagos), plus shipping',qty:6,unit:'×',price:33.58/6,url:'https://www.elektramat.nl/',shop:'elektramat',expense:'business',wave:1,tip:'The other six of the ten injection joints. Ordered 6 Nov as a business purchase: €33.58 with shipping, excluding VAT.'},
 {id:'cutting',name:'Stanley 1992 trapezoid blades and spray adhesive',qty:1,unit:'set',price:15,url:search('stanley 1992 trapezium mesjes'),shop:'bol',expense:'private',wave:1,estimate:true,tip:'Fresh blades for the FatMax utility knife (trapezoid, not snap-off), and repositionable spray adhesive to hold the paper templates on the sheets.'},
 {id:'player',name:'Raspberry Pi 5, 4 GB',qty:1,unit:'×',price:P.player.price,url:P.player.url,shop:'kiwi',expense:'business',optional:true,wave:1,tip:'Optional: skip it if a spare Raspberry Pi 4 or a mini PC can run Falcon Player.'},
 {id:'playerKit',name:'Pi 5 power supply, case and 32 GB card',qty:1,unit:'set',price:P.playerKit.price,url:P.player.url,shop:'kiwi',expense:'business',optional:true,wave:1,estimate:true},
 {id:'fittings',name:'Cable glands, terminal blocks and fuses',qty:zoneSum('boxes'),unit:'sets',price:P.fittings.price,url:search('kabelwartel IP68'),shop:'bol',expense:'private',optional:true,wave:1,estimate:true,tip:'Not needed in the garage: fuses and terminal blocks on a wall board will do. One set per enclosure outside.'},
 {id:'minitreeFrame',name:'Bambu Lab PETG Basic, black, 1 kg',qty:6,unit:'×',price:62.24/6,url:'https://eu.store.bambulab.com/',shop:'bambu',expense:'business',wave:1,
  tip:`Printed base and top for ${modelQty('minitreeFrame')} mini trees; the six spokes are mounting strip. Ordered 6 Nov as a business purchase: €62.24 for six rolls with spool, excluding VAT, free shipping.`},
 {id:'treeFrame',name:'Tree centre pole (about 3 m), top ring and guy lines',qty:1,unit:'set',price:P.treeFrame.price,url:'https://www.gamma.be/',shop:'local',tip:'Bought locally: the tree is 2.5 m tall and the pole goes about 40 cm into the ground.',expense:'private',wave:1,estimate:true},
 // Wave 2: only needed when hanging and placing.
 {id:'stake',name:'Ground stakes and wall clips',qty:modelQty('stake'),unit:'×',price:P.stake.price,url:search('grondpennen kunststof'),shop:'bol',expense:'private',wave:2,estimate:true},
 {id:'mains',name:'Outdoor 230 V cable, plug and socket per box',qty:zones.length,unit:'sets',price:P.mains.price,url:search('verlengkabel buiten IP44'),shop:'bol',expense:'private',optional:true,wave:2,estimate:true,tip:'Not needed: the boxes go in the garage, on an indoor power strip.'},
 {id:'network',name:'Outdoor Cat5e cable to each box',qty:zones.length,unit:'×',price:P.network.price,url:P.network.url,shop:'ledshows',expense:'business',optional:true,wave:1,estimate:true,tip:'Optional: with the boxes in the garage, ordinary patch cables you already have will do. Outside, LEDshows makes outdoor ones to length; measure the run from the switch to each box first.'},
 {id:'switch',name:'5-port network switch',qty:1,unit:'×',price:P.switch.price,url:search('5 poort switch gigabit'),shop:'bol',expense:'business',optional:true,wave:2,estimate:true,tip:'Optional: skip it if a spare switch is at hand.'},
 {id:'soundCard',name:'USB sound card',qty:1,unit:'×',price:P.soundCard.price,url:P.soundCard.url,shop:'ledshows',expense:'private',wave:1,tip:'Private: LEDshows doesn\'t sell to businesses.'},
 {id:'fm',name:'FM transmitter',qty:1,unit:'×',price:P.fm.price,url:search('fm transmitter 3.5 mm'),shop:'bol',expense:'private',wave:2,estimate:true},
];
export const PURCHASES=ROWS.map(r=>({...r,cost:Math.round(r.qty*r.price*100)/100,orderBy:r.wave===1?WAVE1:WAVE2}));

const addDays=(date,n)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const buy=wave=>PURCHASES.filter(p=>p.wave===wave).map(p=>({id:`buy-${p.id}`,buy:p.id}));
// One delivery check per shop and order wave, expected by the shop's slowest delivery.
const deliveries=[1,2].flatMap(wave=>Object.entries(SHOPS).map(([id,s])=>{const items=PURCHASES.filter(p=>p.shop===id&&p.wave===wave);if(!items.length)return null;
 return {id:`arrive-${id}-${wave}`,text:`${s.name} ${wave===2?'installation parts ':''}delivered and checked`,due:addDays(items[0].orderBy,s.days[1]),tip:items.map(p=>`${p.qty} ${p.unit==='×'?'×':p.unit} ${p.name}`).join(' · ')};}).filter(Boolean)).sort((a,b)=>a.due.localeCompare(b.due));
const g=Object.fromEntries(GROUP_LIST.map(x=>[x.id,{...x,pixels:group(x.id).pixels}]));
const each=id=>Math.round(g[id].pixels/g[id].props.length);

// What the measuring steps need, read off the house model. Its frontage,
// opening widths and window positions come from the 2021 plan (src/house.js);
// the plan has no heights and doesn't dimension the forecourt, so those are
// the model's guesses and need a tape measure. Each line is either 'plan' (the
// plan answers it) or 'tape' (measure it; the model's guess is shown).
const cm=v=>`${Math.round(v*100)} cm`,m=v=>`${(Math.round(v*100)/100).toFixed(2)} m`;
const run=f=>f.slice(1).reduce((t,p,i)=>t+Math.hypot(...p.map((v,j)=>v-f[i][j])),0);
const vertical=f=>f.slice(1).reduce((t,p,i)=>t+(p[0]===f[i][0]?Math.abs(p[1]-f[i][1]):0),0);
const outlines=OWN_CHANNELS.find(c=>c.id==='windows').frames,fence=L.fence.path;
const [left,right,kitchen,small]=HOUSE.windows;
const OPENINGS=[['small window',small],['front door',HOUSE.door],['kitchen window',kitchen],['garage door',HOUSE.garage]];
const outlineRun=outlines.reduce((t,f)=>t+run(f),0),outlineUp=outlines.reduce((t,f)=>t+vertical(f),0);
const caneGap=L.canes.xs[1]-L.canes.xs[0],treeTop=L.tree.height+L.tree.star.gap+L.tree.star.radius*1.81;
// Garage boxes: the lead to the garden goes up the wall inside the garage,
// over the front door at the facade route's 2.55 m and down into the garden,
// so the farthest first prop of a garden chain sets the longest data cable.
const ROUTE_Y=2.55,GARAGE_BOX=[HOUSE.garageWidth-.1,1,0],gardenX=HOUSE.entry.maxX+.1;
const gardenLead=Math.max(...GROUP_LIST.filter(x=>x.zone==='garden').map(x=>{const [px,y,z]=x.props[0].start;
 return ROUTE_Y-GARAGE_BOX[1]+(gardenX-GARAGE_BOX[0])+ROUTE_Y+Math.abs(px-gardenX)+z+y;}));
export const MEASURES={
 facade:[
  {from:'plan',what:'Upper floor strip',value:m(L.upper.to-L.upper.from),how:`From 9 cm left of the left upstairs window to 9 cm right of the right one. Both are ${cm(left.width)} wide, ${m(right.x-left.x)} apart centre to centre.`},
  {from:'plan',what:'Garage eave strip',value:m(L.eaves.garage.to-L.eaves.garage.from),how:`The garage is ${m(HOUSE.garageWidth)} wide; the strip runs 5 cm past each side.`},
  {from:'plan',what:'Opening widths',value:OPENINGS.map(([,o])=>cm(o.width)).join(', '),how:`${OPENINGS.map(([n],i)=>i?n:n[0].toUpperCase()+n.slice(1)).join(', ')}. Each outline sits 12 cm outside the opening.`},
  {from:'tape',what:'Opening heights',value:OPENINGS.map(([,o])=>cm(o.height)).join(', '),how:`Same order. The plan has no heights, so these are guesses, and they make up ${m(outlineUp)} of the ${m(outlineRun)} of outline: every 10 cm more is one more pixel on each side.`},
  {from:'tape',what:'Mounting heights',value:`${m(L.upper.y)} and ${m(L.eaves.garage.y)}`,how:'Upper strip and garage eave, guessed. They don\'t change the pixel count, but they set the ladder you need and the length of the lead up from the box.'},
  {from:'tape',what:'Letter band',value:cm(left.y-left.height/2-HOUSE.door.height),how:`Between the top of the front door and the sill of the upstairs windows, for the 30 cm letters. The ${m(L.letters.to-L.letters.from)} width comes from the plan; the height is a guess.`},
 ],
 garden:[
  {from:'plan',what:'Garden width',value:m(fence[2][0]-fence[1][0]),how:'From the entrance path to the boundary on the right: the front run of the ground strip.'},
  {from:'plan',what:'Cane line',value:m(L.canes.xs.at(-1)-L.canes.xs[0]),how:`${L.canes.xs.length} canes along the street edge, ${cm(caneGap)} apart.`},
  {from:'tape',what:'Garden depth',value:m(fence[1][2]-fence[0][2]),how:'From the facade to the street edge, along the entrance path: the side run of the ground strip. The plan doesn\'t dimension the forecourt.'},
  {from:'tape',what:'Tree spot',value:`${cm(2*L.tree.radius)} across`,how:`Between the planting tiles, about ${m(HOUSE.width-L.tree.x)} from the right boundary and ${m(L.tree.z)} out from the facade, ${m(treeTop)} high with the star. The tiles' positions come from the street photo.`},
  {from:'tape',what:'Bush tops',value:`${cm(HOUSE.planters.bush)} cubes`,how:`The mini trees stand three across each bush (two on the back right one), so each top needs about 60 cm of flat width. Bush sizes are guessed from the photo.`},
 ],
 boxes:[
  {from:'plan',what:'Longest garden lead from the garage',value:`about ${Math.ceil(gardenLead)} m`,how:`Up inside the garage, over the front door at ${m(ROUTE_Y)} and down into the garden to the farthest first prop of a chain (the candy canes and the tree). Under 15 m, so no null pixel is needed; the heights on the way are guesses, so check it once the boxes have a spot.`},
 ],
 network:[
  {from:'tape',what:'Switch to each box',value:'not on the plan',how:'The plan doesn\'t show where the switch is. With both boxes in the garage this is one run to the garage, and patch cables will do.'},
 ],
};

const FPP='https://github.com/FalconChristmas/fpp/releases',XLIGHTS='https://xlights.org/releases/',BALDRICK='https://www.baldrickboard.com/en/boards/baldrick8/manual';

export const CHAPTERS=[
 {id:'plan',title:'Plan and measure',icon:'i-lucide-ruler',due:'2026-11-05',steps:[
  {id:'measure-facade',text:'Measure the upper floor, garage eave and window frames',tip:'The plan gives every length along the facade; measure the heights. If a run is longer than below, the pixel and strip quantities go up (the 5% spare covers about 120 pixels).',measures:MEASURES.facade},
  {id:'measure-garden',text:'Measure the tree spot, mini-tree row, cane line and ground strip',tip:'The plan gives the garden\'s width; its depth, the planting tiles and the bushes need a tape.',measures:MEASURES.garden},
  {id:'box-spots',text:'Decide where the boxes go: in the garage (chosen), or outside on the facade and in the garden',tip:'Chosen: the garage. There the boxes stay dry, so they need no IP65 enclosures, outdoor mains or outdoor network cables. The pixel cables to the garden props get longer: measure the longest run from the garage; past about 15 m of data cable, add a null pixel or a differential receiver.',measures:MEASURES.boxes},
  {id:'rcd',text:'Check the outdoor sockets are on a 30 mA RCD',tip:'Aardlekschakelaar. Ask an electrician if a new outdoor socket is needed.'},
  {id:'accountant',text:'Confirm the business purchases with the accountant',tip:'The business tags below are a suggestion: show hardware and network gear. Business orders go on a separate invoice in the company name with its VAT number.'},
  {id:'network-runs',text:'Measure the network cable runs from the switch to each box',measures:MEASURES.network},
  {id:'spare-gear',text:'Check for a spare Raspberry Pi or mini PC, a switch and patch cables',tip:'Skip the items marked optional that you already have.'},
  {id:'tools',text:'Get the tools ready: multimeter, wire stripper, crimp pliers, step drill bit, drill'},
  {id:'ip-plan',text:'Reserve IP addresses for the Pi and both controllers'},
 ]},
 {id:'order-1',title:'Order the parts',icon:'i-lucide-shopping-cart',due:WAVE1,tip:'Order private and business items as separate orders, so each invoice goes to the right name.',steps:buy(1)},
 {id:'order-2',title:'Order the installation parts',icon:'i-lucide-package-plus',due:WAVE2,steps:buy(2)},
 {id:'deliveries',title:'Deliveries',icon:'i-lucide-truck',due:deliveries.map(d=>d.due).sort().at(-1),steps:[
  ...deliveries,
  {id:'count-pixels',text:'Count the pixel strings and look for damaged plugs'},
 ]},
 {id:'bench',title:'Bench test',icon:'i-lucide-cpu',due:'2026-11-17',steps:[
  {id:'flash-fpp',text:'Flash Falcon Player onto the Pi\'s card',link:{href:FPP,label:'FPP releases'}},
  {id:'bench-wire',text:'Wire one power supply and one controller on the table',tip:'Mains on the power supply terminals only with the plug out. Fuse each output.'},
  {id:'bench-ip',text:'Give both controllers their static IP',link:{href:BALDRICK,label:'Baldrick 8 manual'}},
  {id:'bench-strings',text:'Light every pixel string with the controller\'s test pattern',tip:'Mark and set aside strings with dead or wrong-coloured pixels. Note the colour order (RGB or GRB).'},
 ]},
 {id:'build',title:'Build the props',icon:'i-lucide-hammer',due:'2026-11-24',steps:[
  {id:'build-boxes',text:`Build the ${zoneSum('boxes')} boxes: power supplies, controllers, fuses and cable glands`,tip:'Glands at the bottom, with a drip loop on every cable going in.'},
  {id:'build-templates',text:'Print the prop templates 1:1 and stick them on the coro',links:TEMPLATES.map(t=>({href:`/outputs/templates/${t.file}.pdf`,label:`${t.title} (cut ${t.cut})`})),tip:'Tile them on A4 at home or print them as one A1/A0 sheet at a copy shop. Lay them with the flutes running vertically, so rain drains out and the props stay stiff.'},
  {id:'build-wreaths',text:'Cut and drill the two Christmas circles',tip:'On a scrap board: straight edges with a snap-off knife along a steel ruler, in two or three light passes. Curves with the knife in short cuts, or a jigsaw with a fine blade. Holes with the 12 mm step drill through the template marks, then pull the template off.'},
  {id:'build-peace',text:'Cut and drill the peace sign'},
  {id:'build-canes',text:`Cut and drill the ${g.canes.props.length} candy canes`},
  {id:'build-letters',text:`Check the ${g.letters.props.length} letters: ${g.letters.pixels} holes, all taking a 12 mm pixel`},
  {id:'build-push',text:'Push the pixels into the letters and coro props and tie the spare wire behind',tip:'Start each prop at the corner nearest its box, so the data runs the same way as in the model.'},
  {id:'build-strips',text:`Fix the house strips to mounting strip: upper ${g.upper.pixels}, lower ${g.lower.pixels} pixels with icicle drops`},
  {id:'build-windows',text:`Fix the window outlines to mounting strip: ${g.windows.pixels} pixels at 10 cm`},
  {id:'build-minitrees',text:`Print the frames and string the ${g.minitrees.props.length} mini trees, ${each('minitrees')} pixels each`},
  {id:'build-tree',text:`Build the wireframe tree: pole, ring, 16 strands and star, ${g.tree.pixels} pixels`},
  {id:'build-fence',text:`Fix the ground strip to its staked rail: ${g.fence.pixels} pixels`},
  {id:'build-pigtails',text:'Fit a pigtail to every prop and a T-splitter every 150 pixels'},
  {id:'build-labels',text:'Label every prop with its name and the end the data goes in'},
  {id:'build-test',text:'Light each finished prop at full white for 10 minutes',tip:'The last pixel should still be white, not yellowish. If not, inject power closer to it.'},
 ]},
 {id:'place',title:'Hang and place',icon:'i-lucide-map-pin',due:'2026-11-27',steps:[
  {id:'place-boxes',text:'Mount the facade box and the garden box'},
  {id:'place-strips',text:'Hang the upper floor strip and the strip under the garage eave'},
  {id:'place-windows',text:'Fix the outlines round the small window, door, kitchen window and garage door'},
  {id:'place-letters',text:'Hang HAPPY HOLIDAYS between the door and the upper windows'},
  {id:'place-wreaths',text:'Hang the circles in the upper window panes and the peace sign on the front door'},
  {id:'place-tree',text:'Stand the tree between the planting tiles, guy it down and add the star'},
  {id:'place-garden',text:'Place the mini trees, the candy canes along the street edge and the ground strip'},
  {id:'place-cables',text:'Run the extension cables to the boxes and connect the props',tip:'Keep the drive and the path to the door clear of cables. Drip loop before every plug.'},
  {id:'place-network',text:'Run the network cables and plug both boxes into mains'},
 ]},
 {id:'software',title:'Configure the software',icon:'i-lucide-monitor-cog',due:'2026-11-28',steps:[
  {id:'sw-fpp',text:'Set up Falcon Player: static IP, time zone, the USB sound card as audio out'},
  {id:'sw-controllers',text:'Set each controller port\'s pixel count and colour order',link:{href:BALDRICK,label:'Baldrick 8 manual'}},
  {id:'sw-xlights',text:'Install xLights on the laptop',link:{href:XLIGHTS,label:'xLights downloads'}},
  {id:'sw-layout',text:`Build the layout in xLights: ${FULL.groups.reduce((n,x)=>n+x.count,0)} props on two controllers`,tip:'One model per channel on the show page, with the same pixel counts.'},
  {id:'sw-sequence',text:'Turn the detected show into an xLights sequence',link:{href:'/outputs/original-house-cues.json',label:'Cue file'},tip:'The cue file has one brightness per channel per video frame. There is no exporter yet; the sequence is made from it in xLights or with a small script.'},
  {id:'sw-upload',text:'Upload the sequence and the music to Falcon Player and make a playlist'},
  {id:'sw-schedule',text:'Schedule the playlist for the evenings'},
  {id:'sw-fm',text:'Tune the FM transmitter to a free frequency'},
 ]},
 {id:'test',title:'Test run',icon:'i-lucide-play',due:'2026-11-30',steps:[
  {id:'test-pattern',text:'Run Falcon Player\'s test pattern across every prop',tip:'Each prop lights on its own channel in the right colour.'},
  {id:'test-show',text:'Play the full show after dark and watch from the street'},
  {id:'test-sync',text:'Check the music in the car is in time with the lights'},
  {id:'test-heat',text:'After an hour, check the boxes and power supplies for heat and moisture'},
  {id:'test-schedule',text:'Let the schedule run one evening on its own'},
 ]},
];
// Every to-do id, in order.
export const STEP_IDS=CHAPTERS.flatMap(c=>c.steps.map(s=>s.id));
