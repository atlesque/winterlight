import {CONTROLLERS} from './plan.js';
import {portRows,propRows} from './fseq.js';

// The setup page (setup.html): how to set up the Raspberry Pi 4 with Falcon
// Player and the two Baldrick 8 controllers, step by step. The port and output
// tables come from the wiring plan through the same functions the export uses,
// so the page always matches outputs/fpp.

// The addresses the committed outputs/fpp/co-universes.json was written with.
// tools/fseq/export.mjs uses them as its defaults.
export const IPS={pi:'192.168.1.200',facade:'192.168.1.201',garden:'192.168.1.202'};

export const FPP_RELEASES='https://github.com/FalconChristmas/fpp/releases';
export const BALDRICK_MANUAL='https://www.baldrickboard.com/en/boards/baldrick8/manual';

// One table per controller: what to type on its port page.
export const PORT_TABLES=CONTROLLERS.map(c=>({id:c.id,name:c.name,ip:IPS[c.id],pixels:c.pixels,
 ports:portRows().filter(r=>r.controller===c.name).map(r=>({port:r.port,chain:r.chain,pixels:r.pixels,start:r.localStart,startPixel:(r.localStart+2)/3}))}));

// Falcon Player's channel outputs, one DDP row per controller.
export const OUTPUTS=CONTROLLERS.map(c=>({name:c.name,start:c.start,size:c.channels,ip:IPS[c.id]}));

// Props per controller with their show channels, for the test pattern.
export const PROP_RANGES=CONTROLLERS.map(c=>({id:c.id,name:c.name,props:propRows().filter(r=>r.controller===c.name)}));

// The files the Pi gets, served from /outputs/fpp.
export const FILES=[
 {file:'show.fseq',what:'Every pixel\'s colour, 40 frames a second. Upload on the Sequences tab.'},
 {file:'show.mp3',what:'The soundtrack, in sync with frame 0. Upload on the Audio tab.'},
 {file:'co-universes.json',what:'Falcon Player\'s two DDP outputs, to post instead of typing them.'},
 {file:'controller-ports.csv',what:'The port tables below, as a spreadsheet.'},
 {file:'props.csv',what:'Which channels each prop owns, for the test pattern.'},
];
