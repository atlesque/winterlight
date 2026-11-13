import {estimate,ALL,GROUP_LIST,ZONES,DEFAULTS,INDOOR} from '../costs/estimate.js';
import {PRICES as P,CHECKED} from '../costs/catalog.js';
import {HOUSE,PROP_LAYOUT as L} from '../house.js';
import {OWN_CHANNELS} from '../props.js';
import {MEASUREMENTS} from '../measures/measures.js';
import {PARTS as PRINT_PARTS,BRICK,BRICKS,PARASOL} from '../print/parts.js';
import PRINT_MANIFEST from '../../outputs/print/manifest.json' with {type:'json'};
// The 3D prints page (print.html): how many parts, how much PETG, and a link to a prop's section.
const PRINT_COUNT=PRINT_PARTS.reduce((s,p)=>s+p.qty,0),PRINT_GRAMS=PRINT_PARTS.reduce((s,p)=>s+p.qty*(PRINT_MANIFEST[p.id]?.grams??0),0);
const PRINT_LINK=id=>({href:`/print.html#${id}`,label:'3D prints'});
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
const WAVE1='2026-11-06',WAVE2='2026-11-13',ORDERED='2026-11-06';

const FULL=estimate(ALL,DEFAULTS);
const lines=[...FULL.groups.flatMap(g=>[...g.props.flatMap(p=>p.lines),...g.extras]),...FULL.infra];
const modelQty=item=>lines.filter(l=>l.item===item).reduce((s,l)=>s+l.qty,0);
// The facade's share of a part: the garden's stakes are printed (src/print/parts.js).
const FACADE=new Set(GROUP_LIST.filter(x=>x.zone==='facade').map(x=>x.id));
const facadeQty=item=>FULL.groups.filter(x=>FACADE.has(x.id)).flatMap(x=>[...x.props.flatMap(p=>p.lines),...x.extras]).filter(l=>l.item===item).reduce((s,l)=>s+l.qty,0);
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
 propixeler:{name:'ProPixeler',days:[3,7]},
 bol:{name:'bol.com',days:[1,3]},
 zelektro:{name:'Zelektro.be',days:[1,3],tip:'Belgian electrical webshop; free shipping from €100.'},
 elektramat:{name:'Elektramat',days:[1,3],tip:'Electrical wholesaler; check shipping to Belgium at checkout.'},
};
const STRINGS=Math.ceil(FULL.pixels*(1+DEFAULTS.spare/100)/50),STANDARD_STRINGS=Math.min(24,STRINGS);
const search=q=>`https://www.bol.com/be/nl/s/?searchtext=${encodeURIComponent(q)}`;

// What was bought on 6 Nov, fixed so the shopping list keeps what was paid.
const INJECT_BOUGHT=40,STRIP_ROLLS_BOUGHT=2;
// The facade's injection runs, nearest first: the 4 mm² wire bought covers the
// nearest (red and black, so twice the run); the rest get 2 × 4 mm² outdoor cable.
const INJECT=(()=>{const runs=FULL.groups.filter(x=>FACADE.has(x.id)).flatMap(x=>(x.injectRuns||[]).map(r=>({...r,group:x.id}))).sort((a,b)=>a.m-b.m);
 const near=[];let used=0;for(const r of runs){if(used+2*r.m>INJECT_BOUGHT)break;near.push(r);used+=2*r.m;}
 const far=runs.slice(near.length);return {near,nearMetres:used,far,farMetres:Math.ceil(far.reduce((t,r)=>t+r.m,0)*1.1)};})();
// Screw eyes and clips into the facade's mortar joints: one per 50 cm of strip and outline, two per letter, two for the peace sign.
const WALL_FIXINGS=['upper','lower','windows'].reduce((n,id)=>n+FULL.groups.find(x=>x.id===id).props.flatMap(p=>p.lines).filter(l=>l.item==='stake').reduce((t,l)=>t+l.qty,0),0)+2*[...'HAPPYHOLIDAYS'].length+2;
// Everything to buy for the full show. qty is in the shop's own units.
const ROWS=[
 // Wave 1: parts with the longest delivery or needed first on the bench.
 // Pixel-Imperium had 24 standard strings; the regulated strings make up the rest.
 {id:'pixels',name:'12 V WS2811 bullet pixels, strings of 50',qty:STANDARD_STRINGS,unit:'strings',price:P.pixels50.price,url:P.pixels50.url,shop:'pixelimperium',expense:'private',wave:1,pixelsEach:50,
  tip:`${FULL.pixels.toLocaleString('en')} pixels in the props plus ${DEFAULTS.spare}% spare make ${STRINGS} strings of 50. Only ${STANDARD_STRINGS} standard strings were in stock. Ordered 6 Nov with the regulated strings: €820.47 including shipping.`},
 {id:'pixelsRegulated',name:'Regulated 12 V WS2811 bullet pixels, strings of 50',qty:STRINGS-STANDARD_STRINGS,unit:'strings',price:P.pixels50reg.price,url:P.pixels50reg.url,shop:'pixelimperium',expense:'private',wave:1,pixelsEach:50,
  tip:'The same pixels with a constant-current driver, so they stay evenly bright along a run. Same xConnect plugs and 10 cm pitch. Ordered 6 Nov with the standard strings.'},
 {id:'pixelShipping',name:'Pixel-Imperium shipping to Belgium',qty:1,unit:'×',price:64.05,url:P.pixels50.url,shop:'pixelimperium',expense:'private',wave:1,shipping:true,tip:'Paid with the pixel order on 6 Nov: €820.47 in all for 24 standard and 27 regulated strings plus shipping. Delivery in 3 to 7 days.'},
 {id:'controller',name:'Baldrick 8 pixel controller',qty:zoneSum('controllers'),unit:'×',price:P.controller.price,url:P.controller.url,shop:'ledshows',expense:'private',wave:1,tip:'One for the facade box, one for the garden box. Private: LEDshows doesn\'t sell to businesses. Ordered 6 Nov with the rest of the LEDshows basket: €391 in all.'},
 {id:'ledshowsShipping',name:'LEDshows shipping to Belgium',qty:1,unit:'×',price:9,url:P.controller.url,shop:'ledshows',expense:'private',wave:1,tip:'Paid with the LEDshows basket on 6 Nov: €391 in all for the controllers, T-splitters, wire, mounting strip, cable ties and sound card.'},
 {id:'pigtail',name:'xConnect pigtail pairs, 50 cm, packs of 10',qty:Math.ceil(modelQty('pigtail')/10),unit:'packs',price:Math.round(P.pigtail.price*10*100)/100,url:P.pigtail.url,shop:'aliexpress',expense:'private',wave:1,tip:`One pair per prop, ${modelQty('pigtail')} in all. LEDshows and Pixel-Imperium had none in stock. Ordered 6 Nov with the extension cables: €407.46 for both.`},
 {id:'tSplitter',name:'X-con T-splitters for power injection',qty:modelQty('tSplitter'),unit:'×',price:P.tSplitter.price,url:P.tSplitter.url,shop:'ledshows',expense:'private',wave:1,tip:`One every ${150} pixels along a run. Ordered 6 Nov in the LEDshows basket.`},
 {id:'cable',name:'xConnect 18 AWG extension cables, packs of 10 (1, 2, 3, 4 and 10 m)',qty:8,unit:'packs',price:38.34,url:'https://www.aliexpress.com/item/1005007011365275.html',shop:'aliexpress',expense:'private',wave:1,tip:'Ordered 6 Nov from Ray Wu: 3 × 1 m, 2 × 2 m, 1 × 3 m, 1 × 4 m, 1 × 10 m packs for the 56 hops from the garage (the three longest runs join 10 m and 2 m). €407.46 paid together with the pigtails.'},
 {id:'injectWire',name:'4 mm² installation wire, red and black',qty:INJECT_BOUGHT,unit:'m',price:P.injectWire.price,url:P.injectWire.url,shop:'ledshows',expense:'private',wave:1,tip:`Ordered 6 Nov in the LEDshows basket. Single-core, so it is kept to the facade, clipped along the wall: it covers the ${INJECT.near.length} nearest facade injection runs (${INJECT.near.map(r=>r.prop).join(', ')}), ${INJECT.nearMetres} m as red and black. The rest is indoors, from the fuses to the hole.`},
 {id:'mountStrip',name:'Pixel mounting strip, 50 m roll',qty:STRIP_ROLLS_BOUGHT,unit:'rolls',price:P.mountStrip.price*50,url:P.mountStrip.url,shop:'ledshows',expense:'private',wave:1,tip:'Ordered 6 Nov in the LEDshows basket, before the mini-tree spokes were counted; one more roll is below.'},
 {id:'zipTies',name:'Cable ties, 100 pieces',qty:Math.ceil(modelQty('zipTies')),unit:'packs',price:P.zipTies.price,url:P.zipTies.url,shop:'ledshows',expense:'private',wave:1,tip:'Ordered 6 Nov in the LEDshows basket.'},
 {id:'psu',name:'Mean Well LRS-350-12 power supply',qty:zoneSum('psus'),unit:'×',price:140.96/4,url:P.psu.url,shop:'audiophonics',expense:'business',wave:1,tip:'Two per box, each at no more than 80% load. Ordered 6 Nov as a business purchase, order 597051: four at €33.25, €140.96 with shipping, excluding VAT. All four arrived on 13 Nov.'},
 {id:'letters',name:'ProPixeler coro letters, 30 cm',qty:g0('letters'),unit:'×',price:P.letter30.price,url:P.letter30.url,shop:'propixeler',expense:'private',wave:1,tip:'H, A, P, P, Y, H, O, L, I, D, A, Y, S. Bare coro, pre-drilled for pixels; ask them to confirm the holes take 12 mm bullets. Ordered 6 Nov: €103 with shipping.'},
 {id:'letterShipping',name:'ProPixeler shipping to Belgium',qty:1,unit:'×',price:12,url:P.letter30.url,shop:'propixeler',expense:'private',wave:1,tip:'Paid with the letters on 6 Nov: €103 in all.'},
 {id:'coro',name:'Coro sheet 140 × 100 cm, 3 mm, blank white',qty:5,unit:'sheets',price:12.5,url:'https://kunststofshop.nl/polypropeen/polypropeen-kanaalplaten/semi-transparant-wit-of-zwart/polypropeen-kanaalplaat-wit-1400x1000x3mm/a-3753-20000050',shop:'kunststofshop',expense:'private',wave:1,
  tip:`${Math.ceil(modelQty('coro'))} m² for the circles, peace sign, candy canes and tree star, plus 40% for offcuts. No piece is bigger than about 65 × 65 cm. Three sheets cover that; two more are spare for miscuts and next year, since shipping is a flat €49.95. Ordered 6 Nov: €112.45 with shipping.`},
 {id:'coroShipping',name:'Kunststofshop.nl shipping to Belgium (oversized parcel)',qty:1,unit:'×',price:49.95,url:'https://kunststofshop.nl/polypropeen/polypropeen-kanaalplaten/semi-transparant-wit-of-zwart/polypropeen-kanaalplaat-wit-1400x1000x3mm/a-3753-20000050',shop:'kunststofshop',expense:'private',wave:1,tip:'Paid with the five coro sheets on 6 Nov.'},
 {id:'gelbox',name:'WAGO Gelbox 207-1332 (IPX8, takes 221 Wagos), pack of 4',qty:1,unit:'pack',price:16.5,url:search('wago gelbox 207-1332'),shop:'bol',expense:'private',wave:1,returned:'2026-11-10',tip:'Waterproofs the Wago joint between each T-splitter pigtail and the 4 mm² run. Bol caps it at one pack, so the other six come from Elektramat. Ordered 6 Nov in the €61.94 bol.com order. Only one of the four arrived on 10 Nov, so this part of the order went back to bol.com for a refund; the four are reordered from Elektramat below.'},
 {id:'gelboxMore',name:'WAGO Gelbox 207-1332 (IPX8, takes 221 Wagos), plus shipping',qty:6,unit:'×',price:33.58/6,url:'https://www.elektramat.nl/wago-kabelaftak-gelbox-max-4mm-grijs-207-1332/',shop:'elektramat',expense:'business',wave:1,tip:'The other six of the ten injection joints. Ordered 6 Nov as a business purchase: €33.58 with shipping, excluding VAT.'},
 {id:'gelboxReorder',name:'WAGO Gelbox 207-1332, the four bol.com fell short on',qty:4,unit:'×',price:23.9/4,url:'https://www.elektramat.nl/wago-kabelaftak-gelbox-max-4mm-grijs-207-1332/',shop:'elektramat',expense:'business',wave:1,orderBy:'2026-11-10',ordered:'2026-11-10',delivery:'reorder',tip:'Replaces the bol.com pack that came one short and went back on 10 Nov. Same shop and article as the other six. Ordered 10 Nov as a business purchase: €23.90 for all four. With the garden box outdoors only the facade\'s five injection joints need a gel box. Arrived 13 Nov, so there are ten in all: one per joint and five spare.'},
 {id:'cutting',name:'Stanley 1992 trapezoid blades and spray adhesive',qty:1,unit:'set',price:19.9,url:search('stanley 1992 trapezium mesjes'),shop:'bol',expense:'private',wave:1,tip:'Five fresh blades for the FatMax utility knife (trapezoid, not snap-off, €4.90), and Bison spray adhesive to hold the paper templates on the sheets (€15). Ordered 6 Nov in the bol.com order.'},
 {id:'fittings',name:'Wall board, terminal blocks and fuses',qty:zones.length,unit:'sets',price:P.fittings.price,url:'https://www.bol.com/be/nl/p/dparts-zekeringhouder-met-2-50mm-draad-geschikt-voor-12v-en-24v-auto-en-boot-voor-mini-en-normale-steekzekeringen-met-ip56-stof-en-waterbescherming-autozekering-houder/9300000151487698/',more:[{label:'Wago 221 terminals',url:'https://www.bol.com/be/nl/p/wago-lasklemmen-assortiment-serie-221-2-3-en-5-voudig-tornitrex/9300000121897605/'}],shop:'bol',expense:'private',wave:2,estimate:true,tip:'One per box in the garage: a board on the wall with a fuse on every power supply output and terminal blocks for the 4 mm² runs. A DIY store has the same.'},
 {id:'psuMains',name:'Mains leads for the power supplies: 4 m of 3G1.5 flexible cable, two pin-earth plugs and a ferrule kit',qty:1,unit:'set',price:Math.round((4*4.99+2*3.69+27.99)*100)/100,url:'https://www.gamma.be/nl/assortiment/vtmb-kabel-grijs-3g1-5-mm2-per-meter/p/B443179',at:'Gamma',more:[{label:'pin-earth plugs',url:'https://www.gamma.be/nl/assortiment/profile-stekker-2-polig-16-a-zwart-3x1-5-mm2/p/B266520'},{label:'ferrules and crimper',url:'https://www.gamma.be/nl/assortiment/adereindhulzen-assortimentsdoos-1200-stuks-met-krimptang/p/B284838'}],shop:'local',expense:'private',wave:2,tip:'The LRS-350-12 has screw terminals (L, N and earth) and no lead of its own, so each supply needs a 230 V lead. Gamma has no ready-made 3G1.5 lead, so make them from 4 m of VTMB 3G1.5 flexible cable (€4.99 a metre; not the stiff solid-core XVB): two leads of about 1.5 m with a Profile 16 A pin-earth plug (€3.69 each) for the facade board, plugged into the power strip behind the RCD, and two 0.5 m tails in the garden box, where the 3G2.5 feed ends on three Wago 221s (L, N, earth). Crimp a ferrule on every stranded end with the kit\'s crimper (1,200 ferrules and the tool, €27.99), always connect the earth (the case is metal), and keep the mains terminals covered before the plug goes in. The power strip then takes five plugs: the two facade supplies, the garden feed, the Pi and the switch.'},
 {id:'minitreeFrame',name:'Bambu Lab PETG Basic, black, 1 kg',qty:6,unit:'×',price:62.24/6,url:'https://eu.store.bambulab.com/products/petg-basic',shop:'bambu',expense:'business',wave:1,
  tip:`For the parts on the 3D prints page: base and top for ${modelQty('minitreeFrame')} mini trees (the six spokes are mounting strip), the tree's crown hub, base ring and star holder, the cane bases and the ground strip's posts and feet, about ${(Math.round(PRINT_GRAMS/100)/10)} kg in all. Ordered 6 Nov as a business purchase: €62.24 for six rolls with spool, excluding VAT, free shipping.`},
 {id:'treeFrame',name:'3 m tree pole, 25–50 mm across',qty:1,unit:'×',price:42.29,url:'https://www.hubo.be/nl/p/saninstal-gelaste-stalen-buis-verzinkt-4-4-3m/118231/',at:'Hubo',shop:'local',tip:'Buy locally, no need to order: 1-inch galvanised steel pipe, 3 m, 7.3 kg, €42.29 at Hubo (checked 13 Nov; nothing cheaper and stiff enough at Gamma or Brico). It stands in the parasol base, so cut it to about 2.6 m: the crown hub sits at 2.5 m and the star holder on the top. The hub and the holder are drawn for a 32 mm pole; 1-inch pipe is 33.7 mm across, so measure it and change pole_d in their OpenSCAD files before printing them.',expense:'private',wave:2},
 // Wave 2: only needed when hanging and placing.
 {id:'prcd',name:'Plug-in 30 mA RCD adapter (PRCD), 16 A, IP54, pin-earth plug',qty:1,unit:'×',price:29.25,url:'https://www.zelektro.be/stopcontact-met-differentieel-30ma-ip54.html',shop:'zelektro',expense:'private',wave:2,tip:'Needed for safety: the garage socket has no working 30 mA RCD (see the RCD step), so the power strip plugs into this, and this into socket S. Brennenstuhl BDI-A 30 IP54, ref. 1290631, is the Belgian/French version. Check the plug has a hole for the earth pin: a Schuko-only plug (side clips, no hole) does not fit a Belgian socket. Zelektro.be has that exact article (EAN 3281852906314) for €29.25; the DIY stores don\'t list it online. Press its test button before each show night.'},
 {id:'stake',name:`${WALL_FIXINGS} screw eyes with 5 mm nylon plugs, and black cable ties`,qty:1,unit:'set',price:Math.round((Math.ceil(WALL_FIXINGS/5)*1.79+11.3+2.99)*100)/100,url:'https://www.brico.be/nl/ijzerwaren/technische-bevestigingsmaterialen/duimen-haken-ogen/schroefduimen-schroefhaken/suki-schroefoog-metaal-grijs-25x12x3-8x18mm-5-stuks/10697774',at:'Brico',more:[{label:'5 mm plugs (Brico)',url:'https://www.brico.be/nl/ijzerwaren/technische-bevestigingsmaterialen/pluggen-ankers/universele-pluggen/suki-universele-plug-nylon-diam-5-mm-400-stuks/10072996'},{label:'black cable ties (Gamma)',url:'https://www.gamma.be/nl/assortiment/handson-kabelbinder-nylon-200x4-8-mm-zwart-100-stuks/p/B356737'}],shop:'local',expense:'private',wave:2,tip:`Into the mortar joints of the brick facade, never into the PVC window frames: they hide steel and drainage channels, and a screw lets water in. One every 50 cm along the upper strip, the outlines and the eave strip, and 4 per letter batten. ${Math.ceil(WALL_FIXINGS/5)} packs of 5 Suki zinc-plated screw eyes (25 × 12 mm eye, 3.8 mm thread 18 mm long) at €1.79 a pack, order and collect at Brico; stainless ones cost €1.10–1.15 each, three times as much, and zinc lasts a season. Their short thread suits 5 mm plugs (Suki, 400 for €11.30) better than 6 mm ones. Drill with a 5 mm masonry bit, plug, screw in the eye; tie the strip to the eyes with UV-resistant black cable ties (Gamma, 100 for €2.99). Fill the holes after the season. The circles hang indoors, so they need none.`},
 {id:'bricks',name:BRICK.name,qty:BRICKS,unit:'×',price:.69,url:'https://www.brico.be/nl/tuin-terras-buitenleven/sierbestrating-terras-kunstgras/tuintegels/betontegels/coeck-betonklinker-zwart-facet-benor-22x11x7-cm/2059892',at:'Brico',shop:'local',expense:'private',wave:2,optional:true,tip:`Ballast in the printed feet, about ${BRICK.kg} kg each: two per candy cane, one per ground strip post and four for the tree's ring. Most likely borrowed from friends, so it stays out of the total until ticked. If not, Brico sells the Coeck 22 × 11 × 7 cm brick (3.75 kg) singly at €0.69, order and collect; Gamma's 22 × 11 × 8 cm brick only comes in lots of 352. A 7 cm brick fits the trays; the rib just stands 1 cm proud. For other sizes set brick_l, brick_w and brick_h in lib.scad before printing the feet.`},
 {id:'parasolBase',name:PARASOL.name,qty:1,unit:'×',price:81.8,url:'https://www.bol.com/be/nl/p/vidaxl-parasolvoet-rond-30-kg-graniet-zwart/9300000008120383/',shop:'bol',expense:'private',wave:2,optional:true,tip:'For the wireframe tree\'s pole, on the paving between the planting tiles. Most likely borrowed from friends, so it stays out of the total until ticked. If not, this vidaXL round granite base (30 kg) on bol.com is the only one found in stock on 13 Nov, delivered in about 6 days: Gamma\'s bases were all unavailable online and at Oostkamp, and Hubo and Brico had none. Its tube takes 38 or 48 mm poles, so wrap the 33.7 mm pole in a few turns of rubber or tape until it sits tight. A borrowed base needs a clamp or tube that takes about 34 mm.'},
 // Added 10 Nov after checking the materials against the plan.
 {id:'mountStripMore',name:'Pixel mounting strip, one more 50 m roll',qty:Math.max(1,Math.ceil(modelQty('mountStrip')/50)-STRIP_ROLLS_BOUGHT),unit:'roll',price:P.mountStrip.price*50,url:P.mountStrip.url,shop:'ledshows',expense:'private',wave:2,tip:`The props need ${Math.ceil(modelQty('mountStrip'))} m: the house strips, outlines and ground strip, the 16 tree strands and ${g0('minitrees')*6} mini-tree spokes. The two rolls ordered on 6 Nov left the spokes out.`},
 {id:'injectCable',name:'Neopreen kabel H07RN-F 2 × 4 mm², per metre',qty:INJECT.farMetres,unit:'m',price:3.11,url:'https://www.elektramat.be/neopreen-kabel-h07rnf-2x4-per-meter/',shop:'elektramat',expense:'business',wave:2,tip:`Elektramat article 401170572, about €2.57 a metre excluding VAT. For the ${INJECT.far.length} facade injection runs the 4 mm² wire doesn\'t cover (${INJECT.far.map(r=>`${r.prop}, ${r.m} m`).join('; ')}). Outdoor rubber cable with two cores in one jacket (brown and blue: use brown for +12 V); drops under 0.5 V at full white.`},
 {id:'cableMore',name:'xConnect 18 AWG extension cables, pack of 10 × 3 m',qty:1,unit:'pack',price:36.19,url:'https://www.aliexpress.com/item/1005007011365275.html',shop:'aliexpress',expense:'private',wave:2,tip:'For the short leads and power injections from the garden box. The 10 m cables the garden no longer needs cover the indoor run to the circles. On the page pick 3m, 3P, insert type xConnect Style, black wire (it opens on 1 m, 2-pin). On 13 Nov it showed delivery 21 to 28 Nov; LEDshows\' X-con extension cables (1.5, 4.5 and 7.5 m) arrive faster if that is too late.'},
 {id:'pigtailMore',name:'xConnect pigtail pairs, 50 cm, pack of 10',qty:1,unit:'pack',price:16.99,url:P.pigtail.url,shop:'aliexpress',expense:'private',wave:2,tip:'The plugs don\'t fit through a cable gland, so the garden box\'s 4 data leads and 5 injection leads go in as pigtail tails and plug in outside. On the page pick 50cm each, 3P and an xConnect colour (it opens on 20 cm, 2-pin). On 13 Nov it showed delivery 21 to 28 Nov.'},
 {id:'gardenBox',name:P.enclosure.name,qty:1,unit:'×',price:P.enclosure.price,url:P.enclosure.url,more:[{label:'M20 glands (sold separately)',url:'https://www.elektramat.be/obo-wartel-m20-met-trekontlasting-doorlaat-6-13mm-ip68-zwart-v-tec-vm20-sw/'},{label:'same box at RS Belgium',url:'https://benl.rs-online.com/web/p/wall-boxes/2023900'}],shop:'elektramat',expense:'business',wave:2,tip:'The garden controller, its two power supplies and their fuses, outdoors behind the front-left bush. Rittal rates it IP66 and UL Type 3R and 4 (rain and hose-proof outdoors); powder-coated steel, so UV is no problem. Cheapest delivered to Belgium on 13 Nov: €70.31 excluding VAT at Elektramat.nl, in stock (RS Belgium €104.72, TME €101.70 plus delivery; Contorion does not deliver to Belgium). Elektramat lists it on its .nl shop only; it ships to Belgium at the same rate, free above €150, so order it with the other Elektramat parts. The cable glands are not included (€0.54 each at Elektramat): drill them into the gland plate in the base. Stand it on two bricks with the glands underneath, and touch up any bare steel you drill or scratch so it does not rust. The supplies run at about half load in winter air, so a sealed box stays cool enough.'},
 {id:'gardenMains',name:P.mains.name,qty:1,unit:'set',price:Math.round((15*2.78+2.4)*100)/100,url:'https://www.elektramat.be/neopreen-kabel-h07rnf-3x2-5-per-meter/',more:[{label:'rubber plug (ABL)',url:'https://www.elektramat.nl/abl-connectivity-schuko-rubberen-stekker-ip44-zwart-100000039/'}],shop:'elektramat',expense:'business',wave:2,tip:'From the power strip in the garage, behind the plug-in 30 mA RCD, over the front door and down beside it to the garden box. No plug or coupler on the ground. 15 m of H07RN-F 3G2.5 (Elektramat article 401168654, €2.30 a metre excluding VAT, about 11.4 mm across) and an ABL rubber plug with a hole for the earth pin, IP44, for cable 6–12 mm across and up to 2.5 mm² (€1.98 excluding VAT, Elektramat.nl).'},
 {id:'gardenNetwork',name:'Network cable, 15 m (already at hand)',qty:1,unit:'×',price:0,url:'https://www.elektramat.be/emhub-cat6-netwerkkabel-15-meter-zwart-4080065/',shop:'elektramat',expense:'business',wave:2,owned:true,tip:'Already at hand, so nothing to buy. From the switch to the garden controller, alongside the mains cable; tape the plugs. If it turns out too short, the linked EMhub Cat6 15 m cable is €7.01 at Elektramat (indoor PVC, fine for a few weeks).'},
 {id:'wallHole',name:'25 mm masonry bit (already at hand)',qty:1,unit:'×',price:0,url:'https://www.bol.com/be/nl/p/fischer-hamerboor-sds-plus-ii-pointer-boor-voor-beton-25x400-450-mm/9300000256734185/',shop:'local',expense:'private',wave:2,owned:true,tip:'Already in the equipment box: a bit that goes through brick and concrete, so nothing to buy. Two 25 mm holes in the brick jamb right of the garage door, sloping down to the outside, for the facade leads, the injection runs and the garden box feed. No sleeve: a 25 mm tube leaves only about 21 mm inside, too tight for the plugs once a couple of cables are through. Plugs go through one at a time; seal round the cables after.'},
 {id:'wallSeal',name:'Sealant for the wall holes',qty:1,unit:'×',price:13.39,url:'https://www.gamma.be/nl/assortiment/tec7-montage-en-afdichtingskit-grijs-310-ml/p/B151718',at:'Gamma',shop:'local',expense:'private',wave:2,tip:'Round the cables in the two jamb holes, from outside, once everything is through. Tec7 is outdoor-proof but very hard to remove after the season; a neutral silicone is easier to undo.'},
 {id:'guyLines',name:'Guy rope and four ground anchors',qty:1,unit:'set',price:Math.round((4.89+4*7.49+4.95)*100)/100,url:'https://www.gamma.be/nl/assortiment/ledent-touw-polypropyleen-6-mm-20-m/p/B338916',at:'Gamma',more:[{label:'ground anchors (Brico)',url:'https://www.brico.be/nl/ijzerwaren/touwen-kettingen-kabels-spanbanden/accessoires-voor-koorden-kabels-kettingen/dekbeslag/seilflechter-grondanker-verchroomd-staal-spiraalvormig-42cm/10117098'}],shop:'local',expense:'private',wave:2,tip:'From the tree\'s crown hub to anchors in the soil of the four planting tiles, which sit on the diagonals about 1.1 m from the pole. Without them the tree could tip in a gust of about 60 km/h. Each line is about 3.3 m with knots, so the 20 m of 6 mm rope (€4.89) is plenty. The anchors are 42 cm spiral ones with an eye for a rope, €7.49 each at Brico plus €4.95 delivery in 1 to 2 days.'},
 {id:'minitreeRods',name:'Bamboo canes 10–12 mm, 120 cm, packs of 5',qty:Math.ceil((g0('minitrees')+1)/5),unit:'packs',price:2.79,url:'https://www.gamma.be/nl/assortiment/bamboestok-10-12-mm-120-cm-5-stuks/p/B580013',at:'Gamma',shop:'local',expense:'private',wave:2,tip:`One through each mini tree and down through its bush into the soil, so the tree doesn't rock on the springy top: ${g0('minitrees')+1} canes with a spare. The printed base and top cap take a rod up to 12 mm across.`},
 {id:'caneStiffeners',name:'Aluminium flat bar 15 × 2 mm, 1 m (one 60 cm stiffener each)',qty:g0('canes'),unit:'×',price:3.89,url:'https://www.gamma.be/nl/assortiment/profiel-plat-aluminium-zilver-15x2x1000mm/p/B175349',at:'Gamma',shop:'local',expense:'private',wave:2,tip:'Cut to about 60 cm, zip-tied behind each cane\'s coro stem and down into the slot of its base, so the stem doesn\'t fold in a gust. The slot in the printed base takes the 3 mm coro and the 2 mm bar together.'},
 {id:'connectorCare',name:'Dielectric grease, heat shrink and solder',qty:1,unit:'set',price:Math.round((5.99+6.09+12.49)*100)/100,url:'https://www.hubo.be/nl/p/griffon-siliconenvet-15g/156834/',at:'Hubo',more:[{label:'heat shrink (Gamma)',url:'https://www.gamma.be/nl/assortiment/krimpkous-assortiment-3-2-17-mm-15st/p/B527450'},{label:'solder (Gamma)',url:'https://www.gamma.be/nl/assortiment/griffon-electro-draadsoldeer-tin-koper-1-5-mm/p/B607127'}],shop:'local',expense:'private',wave:2,tip:'A dab of grease in every xConnect joint before it is plugged (Griffon silicone grease, €5.99 at Hubo); heat shrink and solder for the splices inside the props. The Gamma heat shrink kit has only 15 pieces (€6.09), so get a bigger kit if there are many splices; the solder (€12.49) is 1.5 mm, thick for pixel pads, so 0.8–1 mm is easier if there is one at hand.'},
 {id:'ladder',name:'Ladder, one day\'s rent',qty:1,unit:'day',price:34.94,url:'https://www.boels.com/nl-be/huren/reform-opsteekladder-6-m/p/11995',at:'Boels',shop:'local',expense:'private',wave:2,tip:'The upper strip hangs at 5.28 m; the ladder at home reaches about 3 m, which covers the letters, the eave strip and the outlines. Boels\' Reform 6 m extension ladder reaches 5.8 m, a working height of 6.65 m, and folds to 2.55 m so it fits a car: €28.88 a day excluding VAT, or €72.20 for a week.'},
 {id:'soundCard',name:'USB sound card',qty:1,unit:'×',price:P.soundCard.price,url:P.soundCard.url,shop:'ledshows',expense:'private',wave:1,tip:'Audio out of the Pi for the FM transmitter. Ordered 6 Nov in the LEDshows basket.'},
 {id:'fm',name:'DrPhone FM7 car FM transmitter and 12 V socket lead',qty:1,unit:'set',price:25.54,url:search('fm transmitter 3.5 mm'),shop:'bol',expense:'private',wave:1,tip:'Transmitter €14.95 plus a 12 V socket lead €10.59, so it runs from one of the Mean Well power supplies. Place it on the street side of the garage, not in a metal box, and test from a parked car. Ordered 6 Nov in the bol.com order; the last part of it to arrive, on 12 Nov.'},
];
// Placed on 6 Nov 2026: €2,133.10 over nine shops. These start ticked.
const BOUGHT=new Set(['pixels','pixelsRegulated','pixelShipping','controller','ledshowsShipping','pigtail','tSplitter','cable','injectWire','mountStrip','zipTies','psu','letters','letterShipping','coro','coroShipping','gelbox','gelboxMore','cutting','minitreeFrame','soundCard','fm']);
export const PURCHASES=ROWS.map(r=>({...r,cost:Math.round(r.qty*r.price*100)/100,orderBy:r.orderBy||(r.wave===1?WAVE1:WAVE2),...(BOUGHT.has(r.id)&&{ordered:ORDERED})}));
// Price paid per pixel, for each order with pixel strings in it (one shop, one wave).
// A string row gets its own price per pixel, and again with its share of the
// order's shipping (split by pixel); the order's shipping row gets the whole
// order's cost per pixel, shipping included.
export const PER_PIXEL={};
for(const o of new Set(PURCHASES.filter(p=>p.pixelsEach).map(p=>`${p.shop}-${p.wave}`))){
 const rows=PURCHASES.filter(p=>`${p.shop}-${p.wave}`===o),strings=rows.filter(p=>p.pixelsEach);
 const pixels=strings.reduce((n,p)=>n+p.qty*p.pixelsEach,0),shipping=rows.filter(p=>p.shipping).reduce((t,p)=>t+p.cost,0);
 for(const p of strings){const each=p.cost/(p.qty*p.pixelsEach);PER_PIXEL[p.id]={each,withShipping:each+shipping/pixels};}
 const total=rows.reduce((t,p)=>t+p.cost,0);
 for(const p of rows.filter(p=>p.shipping))PER_PIXEL[p.id]={pixels,total,each:total/pixels};
}

const addDays=(date,n)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const buy=wave=>PURCHASES.filter(p=>p.wave===wave).map(p=>({id:`buy-${p.id}`,buy:p.id}));
// Deliveries already at the door, by delivery step id. These start ticked.
const ARRIVED={'arrive-ledshows-1':'2026-11-09','arrive-elektramat-1':'2026-11-09','arrive-bambu-1':'2026-11-12','arrive-bol-1':'2026-11-12','arrive-elektramat-reorder':'2026-11-13','arrive-propixeler-1':'2026-11-13','arrive-audiophonics-1':'2026-11-13'};
// Deliveries that came in part: the date, and what is still missing. These stay unticked.
// bol.com came in part on 10 Nov (the gel boxes went back) and the FM transmitter, its last part, on 12 Nov.
const PARTLY={};
// One delivery check per shop and order wave, expected by the shop's slowest delivery.
// buys lists the order steps it holds: it shows as expected only once they are all ticked.
// A row with its own delivery (a reorder) gets a delivery check of its own.
const deliveries=[1,2,'reorder'].flatMap(wave=>Object.entries(SHOPS).map(([id,s])=>{const items=PURCHASES.filter(p=>p.shop===id&&(p.delivery||p.wave)===wave&&!p.returned);if(!items.length||id==='local')return null;
 const key=`arrive-${id}-${wave}`,status=PARTLY[key];
 return {id:key,text:`${s.name} ${wave===2?'installation parts ':wave==='reorder'?'reorder ':''}delivered and checked`,due:addDays(items[0].orderBy,s.days[1]),buys:items.map(p=>`buy-${p.id}`),tip:[status?.note,items.map(p=>`${p.qty} ${p.unit==='×'?'×':p.unit} ${p.name}`).join(' · ')].filter(Boolean).join(' '),...(ARRIVED[key]&&{arrived:ARRIVED[key]}),...(status&&{partly:status.date})};}).filter(Boolean)).sort((a,b)=>a.due.localeCompare(b.due));
const g=Object.fromEntries(GROUP_LIST.map(x=>[x.id,{...x,pixels:group(x.id).pixels}]));
// Strings the regulated ports take: each port starts on a fresh string, so each rounds up on its own.
const REGULATED_PORTS=['upper','lower','windows','letters'],REGULATED_USED=REGULATED_PORTS.reduce((n,id)=>n+Math.ceil(g[id].pixels/50),0);
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
// The garden box's feed: a mains and a network cable from the garage, over the
// front door at the facade route's 2.55 m and down to the box behind the bush.
const feedLength=Math.ceil(ZONES.garden.feed.slice(1).reduce((t,p,i)=>t+Math.hypot(...p.map((v,j)=>v-ZONES.garden.feed[i][j])),0)+INDOOR);
const longestLead=Math.max(...FULL.groups.map(x=>x.props[0]?.run??0));
const GUESS=Object.fromEntries(MEASUREMENTS.map(x=>[x.id,x.guess]));
export const fmtMeasure=(v,unit)=>unit==='cm'?cm(v):m(v);
const tape=rows=>rows.map(r=>r.ids?{...r,value:r.ids.map(id=>fmtMeasure(GUESS[id],r.unit)).join(', ')}:r);
export const MEASURES={
 facade:tape([
  {from:'plan',what:'Upper floor strip',value:m(L.upper.to-L.upper.from),how:`From 9 cm left of the left upstairs window to 9 cm right of the right one. Both are ${cm(left.width)} wide, ${m(right.x-left.x)} apart centre to centre.`},
  {from:'plan',what:'Garage eave strip',value:m(L.eaves.garage.to-L.eaves.garage.from),how:`The garage is ${m(HOUSE.garageWidth)} wide; the strip runs 5 cm past each side.`},
  {from:'plan',what:'Opening widths',value:OPENINGS.map(([,o])=>cm(o.width)).join(', '),how:`${OPENINGS.map(([n],i)=>i?n:n[0].toUpperCase()+n.slice(1)).join(', ')}. Each outline sits 12 cm outside the opening.`},
  {from:'tape',what:'Opening heights',ids:['smallWindowHeight','doorHeight','kitchenWindowHeight','garageDoorHeight'],unit:'cm',how:`Same order. The plan has no heights, so these are guesses, and they make up ${m(outlineUp)} of the ${m(outlineRun)} of outline: every 10 cm more is one more pixel on each side.`},
  {from:'tape',what:'Upstairs windows and garage eave',ids:['upstairsWindowTop','garageEaveHeight'],unit:'m',how:'Ground to the top of the upstairs windows (the upper strip hangs 27 cm above, so its icicles clear the shutter boxes) and to the underside of the garage eave, guessed. They don\'t change the pixel count, but they set the ladder you need and the length of the lead up from the box.'},
  {from:'tape',what:'Letter band',ids:['letterBand'],unit:'cm',how:`Between the top of the front door and the sill of the upstairs windows, for the 30 cm letters. The ${m(L.letters.to-L.letters.from)} width comes from the plan; the height is a guess.`},
 ]),
 garden:tape([
  {from:'plan',what:'Garden width',value:m(fence[2][0]-fence[1][0]),how:'From the entrance path to the boundary on the right: the front run of the ground strip.'},
  {from:'plan',what:'Cane line',value:m(L.canes.xs.at(-1)-L.canes.xs[0]),how:`${L.canes.xs.length} canes along the street edge, ${cm(caneGap)} apart.`},
  {from:'tape',what:'Garden depth',ids:['gardenDepth'],unit:'m',how:'From the facade to the street edge, along the entrance path; the ground strip\'s side run is this less 55 cm. The plan doesn\'t dimension the forecourt.'},
  {from:'tape',what:'Tree spot',ids:['tileGapWidth','tileGapDepth'],unit:'cm',how:`The gaps between the four planting tiles, left to right and front to back. The tree stands in the middle, ${cm(2*L.tree.radius)} across at the base and ${m(treeTop)} high with the star. The tiles' positions come from the street photo.`},
  {from:'tape',what:'Bush tops',ids:['bushWidth'],unit:'cm',how:'The mini trees stand three across each bush (two on the back right one), so each top needs about 60 cm of flat width. Bush sizes are guessed from the photo.'},
 ]),
 more:tape([
  {from:'tape',what:'Kitchen window top',ids:['kitchenWindowTop'],unit:'m',how:'Ground to the top of the kitchen window frame. The model has it level with the top of the front door; it sets how close the kitchen outline comes to the letters.'},
  {from:'tape',what:'House to the front tiles',ids:['tileSetback'],unit:'cm',how:'From the facade to the near edge of the planting tiles closest to the house. With the gaps it places the tiles, the tree and the mini trees, and shows whether the back tiles end before the canes.'},
 ]),
 boxes:[
  {from:'plan',what:'Longest data lead from a box',value:`about ${longestLead} m`,how:`From either box to the first prop of its farthest chain, with the metre inside the garage. Well under 15 m, so no null pixel is needed.`},
  {from:'plan',what:'Garden box feed from the garage',value:`about ${feedLength} m`,how:`One mains and one network cable: up inside the garage, out through the jamb, over the front door at 2.55 m and down beside it to the box. Buy 15 m of each.`},
 ],
};

const FPP='https://github.com/FalconChristmas/fpp/releases',XLIGHTS='https://xlights.org/releases/',BALDRICK='https://www.baldrickboard.com/en/boards/baldrick8/manual';

export const CHAPTERS=[
 {id:'plan',title:'Plan and measure',icon:'i-lucide-ruler',due:'2026-11-05',steps:[
  {id:'measure-facade',text:'Measure the upper floor, garage eave and window frames',link:{href:'/measure.html',label:'Measure on the 3D model'},tip:'The plan gives every length along the facade; measure the heights. If a run is longer than below, the pixel and strip quantities go up (the 5% spare covers about 120 pixels).',measures:MEASURES.facade},
  {id:'measure-garden',text:'Measure the tree spot, mini-tree row, cane line and ground strip',link:{href:'/measure.html',label:'Measure on the 3D model'},tip:'The plan gives the garden\'s width; its depth, the planting tiles and the bushes need a tape.',measures:MEASURES.garden},
  {id:'measure-more',text:'Measure the kitchen window top and the house to the front tiles',link:{href:'/measure.html',label:'Measure on the 3D model'},tip:'Two values the model still assumes: the kitchen window\'s top level with the front door, and where the planting tiles sit. Once both are in, the 3D model can be set to match.',measures:MEASURES.more},
  {id:'box-spots',text:'Decide where the boxes go: the facade box in the garage, the garden box outdoors',tip:'Decided 10 Nov: the facade board stays on the garage wall, about a metre in from the hole, with the show computer and switch. The garden controller and its supplies go outdoors in an IP66 box behind the front-left bush, fed by one mains and one network cable from the garage. That keeps every garden data lead and injection run to a few metres, instead of 10 to 13 m from the garage.',measures:MEASURES.boxes},
  {id:'rcd',text:'Check the garage socket is on a 30 mA RCD',tip:'Checked 8 Nov: not safe as it is. The garage socket is circuit S (Poort garage) on the top row, which is only certainly behind the 300 mA main RCD (2023 charging point inspection); 300 mA guards against fire, not shock. The only 30 mA RCD, the old Merlin Gerin at the start of the bottom row (A to G), failed its test: held on T it did not trip, its test circuit burnt out and the 40 A main breaker under the meter tripped. So the boxes go on S through a plug-in 30 mA RCD (PRCD, on the shopping list), never straight into the socket. Both boxes run from one power strip in the garage, about 1 kW at full white.'},
  {id:'rcd-electrician',text:'Have an electrician replace the faulty 30 mA RCD and put S on its own 30 mA',tip:'Replace the Merlin Gerin with a Schneider Resi9 4P 40 A 30 mA type A (R9R01440, 4 modules, about €80 to €120), and swap the Teco C20 on S (and on R, Stopkont. living) for a Resi9 RCBO 1P+N C20 30 mA type A, which fits the same space. Ask which circuits end up behind each 30 mA. Until then: don\'t press T again, check the Merlin for heat after heavy loads, and switch it off if it smells or warms up.'},
  {id:'accountant',text:'Confirm the business purchases with the accountant',tip:'The business tags below are a suggestion: show hardware and network gear. Business orders go on a separate invoice in the company name with its VAT number.'},
  {id:'spare-gear',text:'Check for a spare Raspberry Pi, a switch, patch cables and a power strip',tip:'All four are at hand, so none of them is on the shopping list.'},
  {id:'tools',text:'Get the tools ready: multimeter, wire stripper, crimp pliers, step drill bit, drill'},
  {id:'ip-plan',text:'Reserve IP addresses for the Pi and both controllers'},
 ]},
 {id:'order-1',title:'Order the parts',icon:'i-lucide-shopping-cart',due:WAVE1,tip:'All placed on 6 Nov: €2,133.10 over nine shops. Private and business items went as separate orders, so each invoice goes to the right name. Bol.com sent one of the four Wago gel boxes, so that pack went back on 10 Nov and four are reordered from Elektramat.',steps:buy(1)},
 {id:'order-2',title:'Buy the installation parts',icon:'i-lucide-package-plus',due:WAVE2,tip:'Parts for hanging and placing, from a DIY store, Elektramat and LEDshows. Checked against the plan on 10 Nov: the garden box outdoors, an extra roll of mounting strip, outdoor cable for the two far facade injections, wall fixings for brick, guy lines for the tree and rods for the mini trees.',steps:buy(2)},
 {id:'deliveries',title:'Deliveries',icon:'i-lucide-truck',due:deliveries.map(d=>d.due).sort().at(-1),steps:[
  ...deliveries,
  {id:'count-pixels',text:'Count the pixel strings and look for damaged plugs'},
 ]},
 {id:'bench',title:'Bench test',icon:'i-lucide-cpu',due:'2026-11-17',steps:[
  {id:'flash-fpp',text:'Flash Falcon Player onto the Pi\'s card',link:{href:FPP,label:'FPP releases'}},
  {id:'bench-wire',text:'Wire one power supply and one controller on the table',tip:'Mains on the power supply terminals only with the plug out. Fuse each output.'},
  {id:'bench-ip',text:'Give both controllers their static IP',link:{href:BALDRICK,label:'Baldrick 8 manual'}},
  {id:'bench-strings',text:'Light every pixel string with the controller\'s test pattern',tip:`Mark and set aside strings with dead or wrong-coloured pixels. Note the colour order (RGB or GRB). Keep the 27 regulated strings for the facade\'s upper strip, eave strip, outlines and letters (${REGULATED_USED} strings, as each port starts on a fresh string): they hold their brightness on the facade\'s data leads before the first injection, at full brightness.`},
 ]},
 {id:'build',title:'Build the props',icon:'i-lucide-hammer',due:'2026-11-24',steps:[
  {id:'build-boxes',text:'Build the facade board for the garage wall and the garden box: a controller, two power supplies and fuses in each',tip:'Fuse every power supply output and keep the mains side covered. In the garden box, mount the parts on its plate with room round the supplies, bring every cable in from below through a gland, and the data and injection leads in as pigtail tails.'},
  {id:'build-fm',text:'Wire the FM transmitter\'s 12 V socket lead to a power supply',tip:'Fused, off the facade board. The transmitter goes on the street side of the garage, out of any metal box, with the USB sound card\'s output in its 3.5 mm input.'},
  {id:'build-print',text:`Print the ${PRINT_COUNT} PETG parts on the A1: mini-tree frames, the tree's hub, ring and star holder, cane bases and ground strip posts`,link:{href:'/print.html',label:'3D prints'},tip:'Print one mini-tree base and one post foot first to check the mounting strip and a brick fit; the sizes can be changed before the rest.'},
  {id:'build-templates',text:'Print the prop templates 1:1 and stick them on the coro',links:TEMPLATES.map(t=>({href:`/outputs/templates/${t.file}.pdf`,label:`${t.title} (cut ${t.cut})`})),tip:'Tile them on A4 at home or print them as one A1/A0 sheet at a copy shop. Lay them with the flutes running vertically, so rain drains out and the props stay stiff.'},
  {id:'build-wreaths',text:'Cut and drill the two Christmas circles',tip:'On a scrap board: straight edges with a snap-off knife along a steel ruler, in two or three light passes. Curves with the knife in short cuts, or a jigsaw with a fine blade. Holes with the 12 mm step drill through the template marks, then pull the template off.'},
  {id:'build-peace',text:'Cut and drill the peace sign'},
  {id:'build-canes',text:`Cut and drill the ${g.canes.props.length} candy canes`},
  {id:'build-star',text:'Cut and drill the tree star',link:PRINT_LINK('tree'),tip:'One star from the template: cut the outer and inner edges of the grey band, drill the 30 pixel holes with the 12 mm step drill, then two 5 mm holes just above the bottom notch to tie it into the star holder\'s slot.'},
  {id:'build-letters',text:`Check the ${g.letters.props.length} letters: ${g.letters.pixels} holes, all taking a 12 mm pixel`},
  {id:'build-push',text:'Push the pixels into the letters and coro props and tie the spare wire behind',tip:'Start each prop at the corner nearest its box, so the data runs the same way as in the model. Where two pixels sit further apart than the string\'s 10 cm (between the circles\' rings, the peace sign\'s strokes, some letters\' strokes), cut and solder in a short piece of 3-core wire.'},
  {id:'build-strips',text:`Fix the house strips to mounting strip: upper ${g.upper.pixels}, lower ${g.lower.pixels} pixels with icicle drops`,tip:'With 10 cm between pixels the string can\'t drop and come straight back up: make each drop a loop, pixels going down and coming back up, and wire the eave strip from its right end, nearest the garage hole.'},
  {id:'build-windows',text:`Fix the window outlines to mounting strip: ${g.windows.pixels} pixels at 10 cm`,tip:'In data order: the garage door first (starting at its left foot), then the small window, the front door and the kitchen window. A 2 m extension bridges each opening to the next. The outlines sit on the brick 12 cm outside each opening, so the built-in shutters still close; fix nothing to the shutter boxes or guides.'},
  {id:'build-minitrees',text:`String the ${g.minitrees.props.length} mini trees on their printed frames, ${each('minitrees')} pixels each`,link:PRINT_LINK('minitrees'),tip:'Up one spoke and down the next, so the string never has to jump from the top back to the base.'},
  {id:'build-tree',text:`Build the wireframe tree: pole, crown hub, base ring, 16 strands and star, ${g.tree.pixels} pixels`,link:PRINT_LINK('tree'),tip:'Wire the strands up one and down the next, so a 1 m extension joins them at the ring or at the hub. A strand\'s 21 pixels span 2.0 m at the string\'s 10 cm, so leave the bottom 45 cm of each strand bare.'},
  {id:'build-fence',text:`Fix the ground strip to its printed posts: ${g.fence.pixels} pixels`,link:PRINT_LINK('fence')},
  {id:'build-pigtails',text:'Fit a pigtail to every prop and a T-splitter every 150 pixels'},
  {id:'build-labels',text:'Label every prop with its name and the end the data goes in'},
  {id:'build-test',text:'Light each finished prop at full white for 10 minutes',tip:'The last pixel should still be white, not yellowish. If not, inject power closer to it.'},
 ]},
 {id:'place',title:'Hang and place',icon:'i-lucide-map-pin',due:'2026-11-27',steps:[
  {id:'place-boxes',text:'Mount the facade board in the garage and set the garden box on two bricks behind the front-left bush',tip:'Drill the two 25 mm holes in the jamb first. Run the garden box\'s mains and network cables over the front door and down beside it; the mains plugs into the power strip only once the box is closed.'},
  {id:'place-strips',text:'Hang the upper floor strip and the strip under the garage eave',tip:'From the rented ladder or tower: a screw eye every 50 cm in the mortar joint about 27 cm above the upstairs windows, never in the PVC frames or the shutter boxes. Let the shutters down once afterwards: the icicles must hang clear of them. Under the garage eave, small screw hooks into the fascia.'},
  {id:'place-windows',text:'Fix the outlines round the small window, door, kitchen window and garage door'},
  {id:'place-letters',text:'Hang HAPPY HOLIDAYS between the door and the upper windows',tip:'Lay the letters out on the ground first to check the spacing. Then fix each letter straight to the wall with 2 screw eyes in the mortar joints, zip-tied through the coro, with a chalk line or laser to keep them level. If they sag or catch the wind, a batten per word can be added later.'},
  {id:'place-wreaths',text:'Hang the circles indoors behind the upper window panes, and the peace sign on the front door',tip:'The circles\' chain runs indoors from the garage to the upstairs windows, on a spare 10 m and a 4 m extension, rather than up the facade. Keep the upstairs shutters up during show hours, or the circles can\'t be seen. The peace sign\'s cable goes down the hinge side of the door with a loop, its plug on the wall side; open and close the door ten times to check.'},
  {id:'place-tree',text:'Stand the pole in the parasol base between the planting tiles, lay the base ring round it with a brick in each of its four trays, then stand the strands and the star',link:PRINT_LINK('tree'),tip:'Pull each strand just taut between the ring and the hub. Then tie four guy lines from the hub to anchors in the soil of the four planting tiles: the base and bricks alone hold it to about 60 km/h.'},
  {id:'place-garden',text:'Place the mini trees on the bushes, the candy canes along the street edge and the ground strip, with their bricks',link:PRINT_LINK('canes'),tip:'Push each mini tree\'s 1.2 m rod down through its bush into the soil and tie the base ring to a couple of branches. Two bricks in every cane base and one in every post foot; a stiffener behind each cane\'s stem, and each cane tied to the ground-strip post next to it.'},
  {id:'place-cables',text:'Run the extension cables from the boxes and connect the props',tip:'Keep the drive and the path to the door clear of cables. In the garden, tie the cables along the ground strip\'s posts, off the paving. A dab of dielectric grease in every plug, a drip loop before it, every joint lifted off the ground, and the open end of each chain capped. Seal each facade injection joint in a gel box; the garden\'s injections plug straight into their T-splitters.'},
  {id:'place-network',text:'Patch the facade controller and the Pi into the switch, run the outdoor cable to the garden controller, and plug both into the power strip behind the RCD'},
 ]},
 {id:'software',title:'Configure the software',icon:'i-lucide-monitor-cog',due:'2026-11-28',steps:[
  {id:'sw-fpp',text:'Set up Falcon Player: static IP, time zone, the USB sound card as audio out'},
  {id:'sw-controllers',text:'Set each controller port\'s pixel count and colour order',link:{href:BALDRICK,label:'Baldrick 8 manual'},tip:'Full brightness. Reverse every other tree strand and mini-tree spoke, and the eave strip, to match how they are wired.'},
  {id:'sw-xlights',text:'Install xLights on the laptop',link:{href:XLIGHTS,label:'xLights downloads'}},
  {id:'sw-layout',text:`Build the layout in xLights: ${FULL.groups.reduce((n,x)=>n+x.count,0)} props on two controllers`,tip:'One model per channel on the show page, with the same pixel counts.'},
  {id:'sw-sequence',text:'Turn the detected show into an xLights sequence',link:{href:'/software.html',label:'Show software'},tip:'The cue file has one brightness per channel per video frame. There is no exporter yet; the proposal on the show software page is a small script that writes Falcon Player\'s .fseq straight from it, with xLights optional.'},
  {id:'sw-upload',text:'Upload the sequence and the music to Falcon Player and make a playlist'},
  {id:'sw-schedule',text:'Schedule the playlist for the evenings'},
  {id:'sw-fm',text:'Tune the FM transmitter to a free frequency'},
 ]},
 {id:'test',title:'Test run',icon:'i-lucide-play',due:'2026-11-30',steps:[
  {id:'test-pattern',text:'Run Falcon Player\'s test pattern across every prop',tip:'Each prop lights on its own channel in the right colour.'},
  {id:'test-show',text:'Play the full show after dark and watch from the street'},
  {id:'test-sync',text:'Check the music in the car is in time with the lights'},
  {id:'test-heat',text:'After an hour, check the power supplies and fuses for heat, and the outdoor joints for moisture'},
  {id:'test-schedule',text:'Let the schedule run one evening on its own'},
 ]},
];
// Every to-do id, in order.
export const STEP_IDS=CHAPTERS.flatMap(c=>c.steps.map(s=>s.id));
// To-dos that start ticked: every order already placed, every delivery
// already arrived, and the decisions already made. The shared state (worker/index.js) only stores changes to these.
export const PRESET=[...PURCHASES.filter(p=>p.ordered||p.owned).map(p=>`buy-${p.id}`),...Object.keys(ARRIVED),'box-spots','spare-gear'];
