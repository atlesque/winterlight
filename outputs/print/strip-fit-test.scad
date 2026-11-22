// Fit test for the strip pockets: three short channels, exactly as on the mini
// trees and the tree's hub and ring, but with the strip standing 0.1, 0.3 and
// 0.5 mm proud (1, 2 and 3 notches on the plate in front). Push a piece of
// strip into each, pull a cable tie round the groove and pick the one that
// clamps best; set `proud` in lib.scad to match. Print flat, no supports.
include <lib.scad>
h = 24;          // channel height (32 on the real parts)
gap = 8;
variants = [0.1, 0.3, 0.5];
base = 3;

module test_channel(pt) {
  d = pt + wall;
  z0 = h*0.55;
  difference() {
    translate([-d, -ch_width/2, 0]) cube([d, ch_width, h]);
    translate([-pt, -pocket_w/2, base]) cube([pt + 1, pocket_w, h]);
    difference() {
      translate([-d - 1, -ch_width/2 - 1, z0]) cube([d + 2, ch_width + 2, 5]);
      translate([-d + 1, -ch_width/2 + 1, z0 - 1]) cube([d + 2, ch_width - 2, 7]);
    }
  }
}

step = ch_width + gap;
for (i = [0 : len(variants) - 1]) translate([0, i*step, 0]) {
  test_channel(strip_t - variants[i]);
  // Foot plate in front of the pocket, with i+1 notches to tell them apart.
  difference() {
    translate([-wall - strip_t, -ch_width/2, 0]) cube([wall + strip_t + 14, ch_width, base]);
    for (n = [0 : i]) translate([8, -ch_width/2 + 6 + n*6, base - 1]) cube([3, 3, 2]);
  }
}
