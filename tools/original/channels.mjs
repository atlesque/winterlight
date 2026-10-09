// Prints the original-house layout as JSON for tools/original/detect.py, so the
// detector and the 3D model read the same prop coordinates.
import {REFERENCE,CHANNELS,PROPS,MULTI} from '../../src/original/layout.js';
process.stdout.write(JSON.stringify({reference:REFERENCE,props:PROPS,multi:MULTI,channels:CHANNELS}));
