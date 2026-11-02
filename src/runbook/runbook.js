import {estimate,ALL,GROUP_LIST,ZONES,DEFAULTS} from '../costs/estimate.js';
import {PRICES as P,CHECKED} from '../costs/catalog.js';

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
const zones=Object.values(FULL.zones),zoneSum=k=>zones.reduce((s,z)=>s+z[k],0);
const group=id=>FULL.groups.find(g=>g.id===id);

// Shops, with a rough delivery time in days from ordering to the door.
export const SHOPS={
 ledshows:{name:'LEDshows.nl',days:[5,10],tip:'Pixels, controllers and X-con cables in one basket. Large pixel orders can take longer when strings need restocking; ask when ordering.'},
 audiophonics:{name:'Audiophonics',days:[4,7]},
 vekto:{name:'Vekto',days:[3,5]},
 kiwi:{name:'Kiwi Electronics',days:[1,3]},
 bol:{name:'bol.com',days:[1,3]},
};
const search=q=>`https://www.bol.com/be/nl/s/?searchtext=${encodeURIComponent(q)}`;

// Everything to buy for the full show. qty is in the shop's own units.
const ROWS=[
 // Wave 1: parts with the longest delivery or needed first on the bench.
 {id:'pixels',name:'12 V WS2811 bullet pixels, strings of 50',qty:Math.ceil(FULL.pixels*(1+DEFAULTS.spare/100)/50),unit:'strings',price:P.pixels50.price,url:P.pixels50.url,shop:'ledshows',expense:'private',wave:1,
  tip:`${FULL.pixels.toLocaleString('en')} pixels in the props plus ${DEFAULTS.spare}% spare, rounded up to whole strings.`},
 {id:'controller',name:'Baldrick 8 pixel controller',qty:zoneSum('controllers'),unit:'×',price:P.controller.price,url:P.controller.url,shop:'ledshows',expense:'business',wave:1,tip:'One for the facade box, one for the garden box.'},
 {id:'pigtail',name:'X-con pigtails, 50 cm',qty:modelQty('pigtail'),unit:'×',price:P.pigtail.price,url:P.pigtail.url,shop:'ledshows',expense:'private',wave:1,tip:'One per prop.'},
 {id:'tSplitter',name:'X-con T-splitters for power injection',qty:modelQty('tSplitter'),unit:'×',price:P.tSplitter.price,url:P.tSplitter.url,shop:'ledshows',expense:'private',wave:1,tip:`One every ${150} pixels along a run.`},
 {id:'cable',name:'3-core pixel extension cable',qty:Math.ceil(modelQty('cable')),unit:'m',price:P.cable.price,url:'https://shop.ledshows.nl/product-categorie/kabels/',shop:'ledshows',expense:'private',wave:1,estimate:true,tip:'From each box to the first prop and prop to prop. Buy as ready-made X-con extensions in the nearest lengths.'},
 {id:'injectWire',name:'4 mm² installation wire, red and black',qty:modelQty('injectWire'),unit:'m',price:P.injectWire.price,url:P.injectWire.url,shop:'ledshows',expense:'private',wave:1},
 {id:'mountStrip',name:'Pixel mounting strip, 50 m roll',qty:Math.ceil(modelQty('mountStrip')/50),unit:'rolls',price:P.mountStrip.price*50,url:P.mountStrip.url,shop:'ledshows',expense:'private',wave:1,tip:`${Math.ceil(modelQty('mountStrip'))} m for the house strips, window outlines, ground strip and tree strands.`},
 {id:'zipTies',name:'Cable ties, 100 pieces',qty:Math.ceil(modelQty('zipTies')),unit:'packs',price:P.zipTies.price,url:P.zipTies.url,shop:'ledshows',expense:'private',wave:1},
 {id:'psu',name:'Mean Well LRS-350-12 power supply',qty:zoneSum('psus'),unit:'×',price:P.psu.price,url:P.psu.url,shop:'audiophonics',expense:'private',wave:1,tip:'Two per box, each at no more than 80% load.'},
 {id:'enclosure',name:'IP65 enclosure 280 × 210 × 130 mm',qty:zoneSum('boxes'),unit:'×',price:P.enclosure.price,url:P.enclosure.url,shop:'vekto',expense:'private',wave:1,tip:'Two per zone: one for the controller and a power supply, one for the second power supply.'},
 {id:'coro',name:'Coro sheet 100 × 200 cm, 3–3.5 mm, blank',qty:Math.ceil(modelQty('coro')*1.4/2),unit:'sheets',price:P.coro.price*2,url:P.coro.url,shop:'bol',expense:'private',wave:1,estimate:true,
  tip:`${Math.ceil(modelQty('coro'))} m² for the letters, circles, peace sign, candy canes and tree star, plus 40% for offcuts. Any blank white or black sheet works; hardware stores and plastics shops sell them.`},
 {id:'cutting',name:'Snap-off knife blades and spray adhesive',qty:1,unit:'set',price:15,url:search('afbreekmesjes 18mm'),shop:'bol',expense:'private',wave:1,estimate:true,tip:'Fresh blades for the coro, and repositionable spray adhesive to hold the paper templates on the sheets.'},
 {id:'player',name:'Raspberry Pi 5, 4 GB',qty:1,unit:'×',price:P.player.price,url:P.player.url,shop:'kiwi',expense:'business',wave:1},
 {id:'playerKit',name:'Pi 5 power supply, case and 32 GB card',qty:1,unit:'set',price:P.playerKit.price,url:P.player.url,shop:'kiwi',expense:'business',wave:1,estimate:true},
 {id:'fittings',name:'Cable glands, terminal blocks and fuses',qty:zoneSum('boxes'),unit:'sets',price:P.fittings.price,url:search('kabelwartel IP68'),shop:'bol',expense:'private',wave:1,estimate:true,tip:'One set per enclosure.'},
 {id:'minitreeFrame',name:'Filament for the mini-tree frames',qty:1,unit:'×',price:Math.round(modelQty('minitreeFrame')*P.minitreeFrame.price),url:search('PETG filament 1kg'),shop:'bol',expense:'private',wave:1,estimate:true,
  tip:`Printed base and top for ${modelQty('minitreeFrame')} mini trees; the six spokes are mounting strip.`},
 {id:'treeFrame',name:'Tree centre pole, top ring and guy lines',qty:1,unit:'set',price:P.treeFrame.price,url:search('aluminium buis 2 meter'),shop:'bol',expense:'private',wave:1,estimate:true},
 // Wave 2: only needed when hanging and placing.
 {id:'stake',name:'Ground stakes and wall clips',qty:modelQty('stake'),unit:'×',price:P.stake.price,url:search('grondpennen kunststof'),shop:'bol',expense:'private',wave:2,estimate:true},
 {id:'mains',name:'Outdoor 230 V cable, plug and socket per box',qty:zones.length,unit:'sets',price:P.mains.price,url:search('verlengkabel buiten IP44'),shop:'bol',expense:'private',wave:2,estimate:true},
 {id:'network',name:'Outdoor Cat5e cable to each box',qty:zones.length,unit:'×',price:P.network.price,url:P.network.url,shop:'ledshows',expense:'business',wave:1,estimate:true,tip:'LEDshows makes them to length, so they go in the first basket; measure the run from the switch to each box first.'},
 {id:'switch',name:'5-port network switch',qty:1,unit:'×',price:P.switch.price,url:search('5 poort switch gigabit'),shop:'bol',expense:'business',wave:2,estimate:true},
 {id:'soundCard',name:'USB sound card',qty:1,unit:'×',price:P.soundCard.price,url:P.soundCard.url,shop:'ledshows',expense:'business',wave:1},
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

const FPP='https://github.com/FalconChristmas/fpp/releases',XLIGHTS='https://xlights.org/releases/',BALDRICK='https://www.baldrickboard.com/en/boards/baldrick8/manual';

export const CHAPTERS=[
 {id:'plan',title:'Plan and measure',icon:'i-lucide-ruler',due:'2026-11-05',steps:[
  {id:'measure-facade',text:'Measure the upper floor, garage eave and window frames',tip:'Compare with the model: if a run is longer, the pixel and strip quantities go up.'},
  {id:'measure-garden',text:'Measure the tree spot, mini-tree row, cane line and ground strip'},
  {id:'box-spots',text:`Pick the box spots: ${ZONES.facade.where}, and ${ZONES.garden.where}`,tip:'Each box needs an outdoor socket within reach and a network cable route.'},
  {id:'rcd',text:'Check the outdoor sockets are on a 30 mA RCD',tip:'Aardlekschakelaar. Ask an electrician if a new outdoor socket is needed.'},
  {id:'accountant',text:'Confirm the business purchases with the accountant',tip:'The business tags below are a suggestion: show hardware and network gear. Business orders go on a separate invoice in the company name with its VAT number.'},
  {id:'network-runs',text:'Measure the network cable runs from the switch to each box'},
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
  {id:'build-templates',text:'Print the prop templates 1:1 and stick them on the coro',tip:'Tile them on A4 at home or print them as one A1/A0 sheet at a copy shop. Lay them with the flutes running vertically, so rain drains out and the props stay stiff.'},
  {id:'build-letters',text:`Cut the ${g.letters.props.length} HAPPY HOLIDAYS letters from coro and drill them`,tip:'On a scrap board: straight edges with a snap-off knife along a steel ruler, in two or three light passes. Curves with the knife in short cuts, or a jigsaw with a fine blade. Holes 4.5 cm apart with the 12 mm step drill, then pull the template off.'},
  {id:'build-wreaths',text:'Cut and drill the two Christmas circles'},
  {id:'build-peace',text:'Cut and drill the peace sign'},
  {id:'build-canes',text:`Cut and drill the ${g.canes.props.length} candy canes`},
  {id:'build-push',text:'Push the pixels into the coro props and tie the spare wire behind',tip:'Start each prop at the corner nearest its box, so the data runs the same way as in the model.'},
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
