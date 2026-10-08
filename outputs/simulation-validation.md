# Simulator validation — 8 October 2026

Tested in the Codex in-app browser at `http://127.0.0.1:5173/`.

- Three.js scene renders without application console errors. Garden, street and plan views work; the narrow-screen camera fits the house and garden without horizontal page overflow.
- All 1,050 pixels preserve the existing 3,150-channel map and constraints: no pixels in the garage/entrance path, on the facade or above 1.2 m.
- Eleven data routes and 21 independent 50-node feed endpoints appear in the wiring overlay. Source boxes are conceptual service positions requiring a real dry/weatherproof installation design.
- Full-white test at 100% displays 252 W per bank and 756 W total. The figure is an RGB-duty estimate, not measured electrical consumption.
- Original 3:05 demo playback, pause, seek, restart and phrase transitions were exercised. A generated local 15-second WAV decoded into 600 analysed frames; local playback and seeking worked.
- Downloaded local-audio export validated at 600 × 3,150 RGB bytes. Downloaded full-demo export validated at 7,400 × 3,150 RGB bytes (23.31 MB payload), plus its JSON metadata. These files use the documented custom WLS1 format and omit audio.
- The official YouTube video refused embedded playback with code150. The app displays the restriction and disables the unavailable playback action; local audio and the demo are supported alternatives. Actual Wizards in Winter synchronization remains unverified pending a lawful local recording. Phrase cues are approximations even when using real audio accents.
- Five automated tests passed: geometry/channel/bank constraints, full-white loading, complete deterministic185-second choreography, seeking independence, and detection of audio onsets/silence. Production build succeeds; Three.js core produces a bundle-size advisory.

Run `npm test` and `npm run build` to repeat automated validation. This is a visual/control preview; no real controllers, pixel wiring, fault protection, thermal behavior or public playback rights were tested.
