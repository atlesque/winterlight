# Source timing status — 9 October 2026

The approved 19-prop facade layout is active. The canonical artifact has **5,569 native source frames and 2,862 channels/frame**, with unchanged original PTS, video end and full audio tail. The channel-map and RGB hashes are revised; all bank partitions have been regenerated.

Spatial reassignment copies existing camera RGB triplets into window/door outlines and ten pole columns. Arches/stars retain their samples. No temporal resampling, generated beat effects or colour averaging is used. Camera colours and prop geometry remain adaptations, not original controller commands.

Current automated checks cover native-frame boundaries, audio-tail/end blackout, payload integrity, current map identity and all-frame recombination of the three unequal bank partitions (1,104 / 1,020 / 738 channels). The exact original MP4 is available for independent ffprobe verification; the report identifies the actual result. Browser runtime evidence is separately recorded in source-playback-audit.json, with artifact hash and playback mode.

The former source-video audit belongs to the old layout and is historical; its counters are not reused as evidence for the revised sequence. WLT2 is not FSEQ. Physical installation, controller output and acoustic/optical latency have not been commissioned.
