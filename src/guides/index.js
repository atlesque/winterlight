// Every step-by-step guide on the site (StepGuide.vue). Their ticks are kept
// with the runbook's (worker/index.js, kind 'done'), so the Worker only takes
// ids listed here: '<storageKey>/<stepId>/<taskId>', one prefix per guide.
import {CUTTING_TICK_IDS} from './cutting.js';
import {SETUP_TICK_IDS} from '../software/setup.js';
import {PRINT_TICK_IDS} from '../print/parts.js';

export const GUIDE_STEP_IDS=[...CUTTING_TICK_IDS,...SETUP_TICK_IDS,...PRINT_TICK_IDS];
