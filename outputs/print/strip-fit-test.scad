// Fit test for the strip pockets: one short channel exactly as on the mini
// trees and the tree's hub and ring, with its two pairs of tie holes. Push a
// piece of strip in, drill through the holes into the strip, and tie it.
// Print flat, no supports.
include <lib.scad>
base = 3;
channel(32, base);
translate([-ch_depth, -ch_width/2, 0]) cube([ch_depth + 16, ch_width, base]);
