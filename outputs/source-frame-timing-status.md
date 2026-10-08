# Source-frame timing work — incomplete

The active request requires the supplied video with audio, frame-perfect extracted light timings, one reusable timing file, and simulation playback of that file synchronized to the same recording.

The requested new video is not present in the repository and is not exposed as an attachment by the chat reader. A local file path has been requested. The old three-minute demo and embedded YouTube reference cannot establish completion. No source-specific timing file or source-specific RGB extraction has been produced yet.

## Shared artifact implemented

`src/timing.js` implements the WLT2 `.wltiming` container: a JSON header, one original presentation timestamp per source frame in microseconds, and one immutable RGB output frame per timestamp. Source-video and channel-map SHA-256 identities prevent accidentally binding a different edit or wiring map. Strict timestamp ordering, exact frame coverage and exact payload length are required. Playback does not stretch cues, detect beats, or regenerate colours in this mode. Dimming and full-white overrides are disabled to preserve stored bytes.

The native source time-base and PTS ticks are also retained by `tools/pack-source-frames.mjs`; microseconds are the browser lookup representation. No nominal-FPS resampling is performed. The packing tool accepts already reviewed frame-major RGB bytes, extracts every presentation timestamp with ffprobe, verifies the one-frame-per-source-frame payload, and produces the artifact. It does not infer the original light states. Those still require source-video inspection/extraction and validation of the prop mapping.

## Simulation integration implemented

Load video and timing file through the new source-frame controls. The recording stays local. Video supplies both picture and music; the browser's per-video-frame callback selects stored RGB using the presented media PTS. Pause, seek and restart use that media element. Wrong source files, incomplete timing packages and changed channel maps are rejected.

The audit reports missed source frames, unmatched timestamps and late callbacks. [Browser documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback) explicitly gives no strict compositor synchronization guarantee; a callback can arrive a display refresh late. A zero-error timestamp lookup does not prove simultaneous photon output from the displayed video, Three.js canvas and real lights. Actual full-source runtime coverage and display alignment remain verification gates, not claims made by this work.

## Hardware reuse

WLT2 is the authoritative source schedule and RGB data. An eventual hardware player must consume these same frames and timestamps without silently converting to the old 40 fps approximate show. FSEQ conversion may quantize noninteger/VFR frame intervals and therefore requires a measured error report rather than an assertion of exact timing. Controller scan latency and real audio/output alignment need commissioning measurements. No hardware commands have been sent.

## Remaining work

1. Obtain the actual supplied recording and inspect its media streams, native PTS, audio alignment and every frame.
2. Establish and review the mapping of the original visible light groups to the constrained Belgian layout. Recover the state changes from the images, not merely musical energy.
3. Generate the complete source-specific RGB data and WLT2 file; verify all native source frames, state transitions and timestamp coverage.
4. Run that exact artifact with that exact video, audit the full duration, seeks and pauses, and investigate every missing/mismatched frame.
5. Verify the physical-project export/player path consumes the same artifact, with any unavoidable display/controller quantization explicitly measured. Preserve source provenance and avoid publishing the recording to the public repository without explicit authorization.

The goal remains active. Core format tests and a successful build establish implementation progress, not achievement of the source-specific objective.

## Diagnostic verification — 8 October 2026

A locally generated three-second H.264/AAC diagnostic recording at 30000/1001 fps was paired with 90 deliberately distinct RGB frames. Full browser playback covered all 90 source frames, with zero skipped source frames and zero unmatched timestamps. One late callback was reported, so this test does not establish strict compositor alignment. Seeking to 0.050 seconds selected the source frame at 0.033367 seconds, as expected, without regenerating RGB data. The end blackout retains the completed audit. Browser error logs were empty.

Eleven automated tests pass, including variable timestamp boundaries, byte-preserving round trips, deterministic seeks, incomplete artifact rejection, wrong-source rejection, dropped-frame auditing and end-of-video coverage retention. The production build passes. These diagnostic media files are generated test data outside the repository, not the requested recording.

## Integrity verification added

The browser now verifies the RGB payload SHA-256 before enabling source playback. Switching timing files suspends playback while verification runs; a superseded asynchronous load cannot apply stale data. Missing checksums and corrupt payloads are rejected.

`tools/verify-source-frames.mjs source.mp4 show.wltiming [report.json]` independently reads the source with ffprobe and checks the source hash, channel-map hash, RGB hash, native time base, media origin, every native PTS, every stored playback timestamp, frame count and final-frame duration. It emits a report explicitly limited to artifact integrity. It cannot establish that extracted light colours match the source images or that physical outputs align with audio.

On the 90-frame diagnostic recording, repacking and full verification passed. A one-byte RGB mutation and a one-microsecond PTS mutation were both rejected. Browser testing confirmed corrupt RGB data produces an error and disables Play, then a valid file restores playback. Twelve automated tests pass and the production build passes. The actual source recording remains unavailable.
