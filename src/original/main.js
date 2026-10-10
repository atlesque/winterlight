import {startPlayer} from '../player.js';
import {createOriginalScene} from './scene.js';

startPlayer({createScene:createOriginalScene,debugName:'winterlightOriginal',page:{
 videoView:'Video view',
 scaleTag:'Layout traced from the filmed show · dimensions estimated',
 overlayNote:'Lights from the model over the original video, lined up frame by frame. Difference turns matching light dark.',
 cueNote:"Each prop's brightness is detected from the statically filmed original video, one value per video frame so the fades come through, and played against that same video (or its soundtrack when the video isn't loaded).",
 allOnHint:'Reference: compare with the final frame of the video',
}});
