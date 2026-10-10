import {startPlayer} from './player.js';
import {createScene} from './scene.js';
import {createOriginalScene} from './original/scene.js';

// One page, both houses: the original filmed house and ours run the same
// channels, the same detected cue file and the same video clock. The toggle
// shows one of them or both stacked; src/props.js places each prop on ours.
const TITLE='Winterlight · 3D Christmas light show synced to Wizards in Winter';
const ORIGINAL_CUES="Each prop's brightness is detected from the statically filmed original video, one value per video frame so the fades come through, and played against that same video (or its soundtrack when the video isn't loaded).";
startPlayer({
 houses:{
  original:{createScene:createOriginalScene,page:{label:'3D model of the original filmed house',eyebrow:'THE ORIGINAL HOUSE',heading:'h2',title:'Frame by frame.',subtitle:'Every prop switched exactly as it was filmed.',
   overlayNote:'Lights from the model over the original video, lined up frame by frame. Difference turns matching light dark.'}},
  ours:{createScene,page:{label:"3D model of our house with the original show's props",eyebrow:'OUR HOUSE',heading:'h1',title:'A little winter magic.',subtitle:'The original show, prop for prop, on our own facade.'}},
 },
 modes:{
  ours:{title:TITLE,videoView:'Street view',asideTitle:'The original show,<br>on our house.',scaleTag:'Concept dimensions · facade and garden props',
   cueNote:"Every prop on our house matches one in the original and runs on its timing: brightness detected from the filmed video, one value per frame, played against that same video (or its soundtrack when the video isn't loaded).",
   allOnHint:'Every prop lit at full brightness'},
  original:{title:'Winterlight · The original Wizards in Winter house in 3D',videoView:'Video view',asideTitle:'Reverse-engineered,<br>one frame at a time.',scaleTag:'Layout traced from the filmed show · dimensions estimated',
   cueNote:ORIGINAL_CUES,allOnHint:'Reference: compare with the final frame of the video'},
  split:{title:TITLE,videoView:'Front view',asideTitle:'Two houses,<br>one show.',scaleTag:'Original on top · our house below',
   cueNote:`${ORIGINAL_CUES} Our house runs the very same values, prop for prop.`,allOnHint:'Every prop lit at full brightness on both houses'},
 },
});
