import {startPlayer} from './player.js';
import {createScene} from './scene.js';

// Our house runs the same player as /original.html: the same channels, the
// same detected cue file and the same video clock, drawn on our own house with
// each prop placed by src/props.js.
startPlayer({createScene,debugName:'winterlight',page:{
 videoView:'Street view',
 scaleTag:'Concept dimensions · facade and garden props',
 overlayNote:'Our lights over the original video. Our props sit where they are on our house, so they will not line up with the filmed ones.',
 cueNote:"Every prop on our house matches one in the original and runs on its timing: brightness detected from the filmed video, one value per frame, played against that same video (or its soundtrack when the video isn't loaded).",
 allOnHint:'Every prop lit at full brightness',
}});
