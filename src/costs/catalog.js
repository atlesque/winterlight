// Parts and prices behind the LED cost page (costs.html). Prices are euro,
// VAT included, from European shops checked on 6 November 2026; a part marked
// `estimate` has no single shop price behind it and is a rounded guess.
export const CHECKED='2026-11-06';
const LEDSHOWS='https://shop.ledshows.nl/';
export const PRICES={
 // LEDshows sold out of pixels in November; Pixel-Imperium had 24 standard
 // strings in stock and makes up the rest with its regulated strings.
 pixels50:{name:'12 V WS2811 12 mm bullet pixels, string of 50 (10 cm pitch, xConnect plugs)',price:12.19,url:'https://pixel-imperium.de/ws2811-pixel-string-12mm-12v-ip68-50px-xconnect-black',shop:'Pixel-Imperium'},
 pixels50reg:{name:'Regulated 12 V WS2811 12 mm bullet pixels, string of 50 (10 cm pitch, xConnect plugs)',price:17.18,url:'https://pixel-imperium.de/regulated-ws2811-pixel-string-12mm-12v-ip68-50px-xconnect-black',shop:'Pixel-Imperium'},
 controller:{name:'Baldrick 8 pixel controller (8 ports, 750 pixels per port at 40 fps, E1.31/DDP)',price:70,url:'https://shop.ledshows.nl/product/baldrick-8/',shop:'LEDshows.nl'},
 psu:{name:'Mean Well LRS-350-12 power supply (12 V, 29 A, 348 W)',price:39.9,url:'https://www.audiophonics.fr/en/smps-power-supply/mean-well-lrs-350-12-switch-power-supply-12v-29a-348w-p-17203.html',shop:'Audiophonics'},
 enclosure:{name:'IP65 enclosure about 400 × 300 × 170 mm with mounting plate and M20 cable glands',price:95,estimate:true},
 player:{name:'Raspberry Pi 5 4 GB running Falcon Player (FPP)',price:120.99,url:'https://www.kiwi-electronics.com/nl/raspberry-pi-boards-behuizingen-uitbreidingen-en-accessoires-59/raspberry-pi-boards-363',shop:'Kiwi Electronics (€99.99 excl. VAT)'},
 mountStrip:{name:'Pixel mounting strip, per metre (50 m roll €60)',price:1.2,url:'https://shop.ledshows.nl/shop/pixel-mounting-strip-50-meter/',shop:'LEDshows.nl'},
 pigtail:{name:'xConnect pigtail pair (male + female), 50 cm',price:1.679,url:'https://www.aliexpress.com/item/1005006295131153.html',shop:'AliExpress (Shenzhen Rita Lighting, €16.79 per 10 pairs)'},
 tSplitter:{name:'X-con T-splitter with pigtail (power injection)',price:3,url:'https://shop.ledshows.nl/shop/t-splitter-3-2-3-pigtail-xcon/',shop:'LEDshows.nl'},
 injectWire:{name:'4 mm² wire for power injection, per metre of conductor (red or black, or half a metre of 2 × 4 mm² outdoor cable)',price:2,url:'https://shop.ledshows.nl/shop/4mm%c2%b2-installatiedraad-zwart-per-meter/',shop:'LEDshows.nl'},
 zipTies:{name:'Cable ties 2.5 × 100 mm, 100 pieces',price:2.5,url:'https://shop.ledshows.nl/shop/tyrips-25x100-100stuks/',shop:'LEDshows.nl'},
 soundCard:{name:'USB sound card, 3.5 mm',price:4.5,url:'https://shop.ledshows.nl/shop/usb-geluidskaart-35-mm/',shop:'LEDshows.nl'},
 letter30:{name:'ProPixeler coro letter, 30 cm, bare (pixels separate)',price:7,url:'https://www.propixeler.nl/product/letters-30-cm-wit',shop:'ProPixeler'},
 // Blank white 3 mm sheets of 140 × 100 cm at €12.50, not a print shop's cut-to-size price.
 coro:{name:'Corrugated polypropylene sheet (coro), 3 mm, blank white, per m²',price:8.93,url:'https://kunststofshop.nl/',shop:'kunststofshop.nl'},
 cable:{name:'3-core pixel extension cable (18 AWG), per metre',price:.8,estimate:true},
 stake:{name:'Wall clip, or a printed foot and paving brick',price:.6,estimate:true},
 minitreeFrame:{name:'Mini-tree frame: printed base and top, six spokes',price:5,estimate:true},
 treeFrame:{name:'Tree centre pole and parasol base (crown hub and base ring printed)',price:52,estimate:true},
 fittings:{name:'Wall board, terminal blocks and fuses per box',price:15,estimate:true},
 mains:{name:'Outdoor 230 V feed: 15 m of H07RN-F 3G2.5 with a rubber plug',price:45,estimate:true},
 network:{name:'Outdoor Cat5e patch cable, 15 m',price:15,estimate:true},
 switch:{name:'5-port network switch',price:20,estimate:true},
 playerKit:{name:'Pi 5 power supply, case and 32 GB card',price:35,estimate:true},
 fm:{name:'FM transmitter so visitors hear the music in their car',price:35,estimate:true},
};
// A 12 V 12 mm pixel draws about 0.3 W at full white (OpenELAB's spec table).
export const WATTS_PER_PIXEL=.3,WATTS_SOURCE='https://openelab.io/it/products/openelab-lighting-ws2811-pixel-led';
// Power supplies run at 80% at most; a port carries 600 of its 750 pixels, so
// there is headroom; a run gets power injected every 150 pixels.
export const PSU_LOAD=.8,PSU_WATTS=348,PORT_PIXELS=600,PORTS_PER_CONTROLLER=8,INJECT_EVERY=150;
