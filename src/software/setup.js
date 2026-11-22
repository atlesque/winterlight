import {CONTROLLERS,portRows,propRows} from './plan.js';

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

// The guide itself: one step on screen at a time, a checkbox per task (the
// StepGuide component). Task ids are what this browser saves, so keep them
// stable when rewording a task.
const ip=v=>`<code>${v}</code>`;
export const STEPS=[
 {id:'flash',title:'Flash Falcon Player',tasks:[
  {id:'download',html:`Download the latest stable Raspberry Pi image from the <a href="${FPP_RELEASES}" target="_blank" rel="noopener">FPP releases page</a>.`,note:'A zipped .img for the Pi.'},
  {id:'write',html:'Write it to one of the 64 GB cards with Raspberry Pi Imager ("Use custom") or balenaEtcher.',note:'Skip Imager\'s OS customisation: FPP sets itself up.'},
  {id:'boot',html:'Put the card in the Pi in its FLIRC case, plug the network cable into the switch, then the USB-C supply.',note:'The first boot expands the card and reboots once; give it about 5 minutes.'},
  {id:'open',html:`On the laptop, on the same network, open ${ip('http://fpp.local')}.`,note:`If it doesn't load, find the Pi in the router's client list, or join the "FPP" Wi-Fi hotspot the Pi starts when it has no network and open ${ip('http://192.168.8.1')}.`},
  {id:'wizard',html:'Work through the first-run wizard if it appears.',note:'It asks for the same things as the next step.'},
 ]},
 {id:'pi',title:'Pi settings',intro:'Under Status/Control, then Settings or Network. Menu names shift a little between FPP versions.',tasks:[
  {id:'network',html:`<b>Network (eth0):</b> static, IP ${ip(IPS.pi)}, netmask 255.255.255.0, gateway and DNS the router's address.`,note:'Save, reboot, and reconnect at the new address.'},
  {id:'time',html:'<b>Time:</b> time zone Europe/Brussels, NTP on.',note:'The Pi has no clock battery: without internet time the schedule starts at the wrong time. Check the Status page shows the right local time.'},
  {id:'audio',html:'<b>Audio:</b> plug the USB sound card in before booting, then choose it as the audio output device.',note:'Volume about 80%; fine-tune it at the FM transmitter.'},
  {id:'mode',html:'<b>Mode:</b> leave FPP in Player mode, the default.'},
 ]},
 {id:'baldrick',title:'Set up each Baldrick 8',intro:`On the bench, one controller at a time, powered from its 12 V supply and patched into the switch. The <a href="${BALDRICK_MANUAL}" target="_blank" rel="noopener">Baldrick 8 manual</a> gives its factory address and the exact page names.`,tasks:[
  {id:'facade-ip',html:`<b>Facade controller:</b> open its web page and give it the static IP ${ip(IPS.facade)}.`,note:'At its factory address, or find it in the router\'s client list. Label the board with its IP.'},
  {id:'facade-ports',html:'<b>Facade controller:</b> input DDP, and set ports 1 to 6 from the table below.',note:'Every port: WS2811, colour order from the bench test (RGB or GRB), reverse off, null pixels 0, gamma 1.0, brightness 100%. Leave ports 7 and 8 off.'},
  {id:'garden-ip',html:`<b>Garden controller:</b> the same, with the static IP ${ip(IPS.garden)}.`},
  {id:'garden-ports',html:'<b>Garden controller:</b> input DDP, and set ports 1 to 4 from the table below.',note:'Same port settings as the facade. Leave ports 5 to 8 off.'},
  {id:'test',html:'Save, reboot each controller, and light every string with its own test pattern.',note:'Each string should light to its end.'},
 ]},
 {id:'outputs',title:'Falcon Player\'s DDP outputs',intro:'Input/Output Setup, then Channel Outputs, then the E1.31 / ArtNet / DDP / KiNet tab.',tasks:[
  {id:'rows',html:'Tick "Enable Output" and add the two rows below, both "DDP - One Based".',note:'Or post co-universes.json with the command below, which fills the tab for you.'},
  {id:'restart',html:'Save, and restart FPPD when FPP asks.'},
  {id:'check',html:'Check both rows are ticked and show the right IPs.'},
 ]},
 {id:'show',title:'Upload, playlist and schedule',tasks:[
  {id:'upload',html:'Content Setup, File Manager: upload <code>show.fseq</code> on the Sequences tab and <code>show.mp3</code> on the Audio tab.',note:'Both are in the files list above this guide.'},
  {id:'playlist',html:'Content Setup, Playlists: a new playlist "Winterlight" with one "Sequence and Media" entry, show.fseq with show.mp3.'},
  {id:'play',html:'Play it once from the Status page.'},
  {id:'schedule',html:'Content Setup, Scheduler: the Winterlight playlist on the show evenings, repeating, for example 17:00 to 22:00 from Sat 12 Dec.',note:'Check the Status page shows the next run.'},
  {id:'fm',html:'Tune the FM transmitter to a free frequency and listen from a parked car.',note:'The music and the lights should match.'},
  {id:'backup',html:'Shut the Pi down from FPP\'s menu and clone its card to the second 64 GB card.',note:'If the first card dies on a show night, swap and reboot. Always shut down from the menu, never by pulling the plug.'},
 ]},
 {id:'test',title:'Test run',intro:'Status/Control, Display Testing: run "RGB Cycle" over one prop\'s channels at a time, from the ranges below. Only that prop should light, from its first pixel to its last.',tasks:[
  {id:'facade',html:'Every facade prop lights on its own range: strips, windows, the 13 letters, both circles and the peace sign.'},
  {id:'garden',html:'Every garden prop lights on its own range: 8 canes, 11 mini trees, the ground strip, the 16 tree strands and the star.'},
  {id:'colours',html:'Colours are right on every port.',note:'Red showing green: switch that port between RGB and GRB on its controller.'},
  {id:'full',html:'Play the whole show once from the Status page, with the music on the car radio.'},
  {id:'brightness',html:'Brightness looks right in fades and at full white.',note:'Fades too dark: re-export with <code>--gamma 1.8</code>. Too bright, or the supplies run warm: <code>--brightness 70</code>. Then upload the new show.fseq.'},
 ]},
];

// Every tick id the guide saves, `<storageKey>/<stepId>/<taskId>`, for the
// site's Worker, which only stores ids it knows.
export const SETUP_GUIDE_KEY='setup';
export const SETUP_TICK_IDS=STEPS.flatMap(s=>s.tasks.map(t=>`${SETUP_GUIDE_KEY}/${s.id}/${t.id}`));
