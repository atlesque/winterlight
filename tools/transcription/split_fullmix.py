"""Score YourMT3's full-mix instrument labels against existing separator stems.

Label grouping follows General MIDI: piano 0-7, guitar 24-31, bass 32-39,
lead violin 40-43 or synth lead 80-87, and other remaining pitched programs.
This retains the original full-mix MIDI and makes separately named candidates.
"""
import argparse
import copy
import json
from pathlib import Path


def category(instrument):
    if instrument.is_drum:
        return "drums"
    program = int(instrument.program)
    if 0 <= program <= 7:
        return "piano"
    if 24 <= program <= 31:
        return "guitar"
    if 32 <= program <= 39:
        return "bass"
    if 40 <= program <= 43 or 80 <= program <= 87:
        return "lead"
    return "other"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("separator_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    ignored_root = Path(__file__).resolve().parents[2] / "work/transcription"
    if not args.output.resolve().is_relative_to(ignored_root.resolve()):
        parser.error("Derived outputs must stay under work/transcription")
    import pretty_midi
    from compare_models import prepare_run

    names = ("piano", "guitar", "bass", "lead", "other", "drums")
    prepare_run(args.separator_root, args.output, names)
    midi = pretty_midi.PrettyMIDI(str(args.input))
    summary = {}
    for name in names:
        subset = copy.deepcopy(midi)
        subset.instruments = [instrument for instrument in subset.instruments if category(instrument) == name]
        subset.write(str(args.output / "midi" / f"{name}.mid"))
        summary[name] = [{"program": int(i.program), "instrument": i.name,
                          "notes": len(i.notes)} for i in subset.instruments]
    (args.output / "instrument-summary.json").write_text(json.dumps(summary, indent=2) + "\n")


if __name__ == "__main__":
    main()
