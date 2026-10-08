# Winterlight

A practical ground-level Christmas pixel light show project for a Belgian brick house, inspired by Trans-Siberian Orchestra's *Wizards in Winter*.

The design uses 1,050 RGB pixels in four arches, four short bars, two stars and a small matrix. All props are freestanding, with no roof access, wall mounting, door garland or Christmas trees. Three independent 350-pixel power banks support xLights sequencing and wired FPP playback.

## Project files

- [Complete project guide](outputs/christmas-show-project.md)
- [Printable HTML guide](outputs/christmas-show-project.html) — download/clone and open locally with its SVG files beside it
- [Ground-level layout](outputs/layout.svg)
- [Power and wiring diagram](outputs/wiring.svg)
- [Pixel/channel map](outputs/pixel-map.csv)
- [Music cue worksheet](outputs/cue-worksheet.csv)
- [EU supplier research](outputs/eu-sourcing-research.md)
- [Technical and Belgian regulatory research](outputs/technical-research.md)

Prices and research were checked on 8 October 2026. Exact music cue timings remain to be measured. The documentation distinguishes observed video details from proposed adaptations. Confirm site measurements, component specifications, electrical protection and applicable music permissions before purchasing or installation.

## Rebuild the documents

Run `python3 work/package.py` from the repository root. The script uses the Python standard library to regenerate the HTML guide, SVG diagrams and CSV worksheets from the project material, and checks the channel totals and bank allocations.

This repository contains planning documentation and its packaging script; no tested controller firmware or ready-to-play show sequence is included.
