// Candy cane stake: one per cane. The bottom of the cane's coro stem drops
// into the slot; drill the coro through the two holes and tie it. Printed
// lying on its side, no supports. Print Y = up in use.
include <lib.scad>
coro_t = 3;
slot = coro_t + 0.6;
width = 36;        // along the cane's stem (the stem band is 50 mm wide)
spike = 160;
head_h = 55;
slot_depth = 45;
head_w = slot + 2*4;
spike_t = 12;

difference() {
  union() {
    linear_extrude(width) translate([-head_w/2, 0]) square([head_w, head_h]);
    linear_extrude(spike_t) polygon([[-head_w/2, 2], [head_w/2, 2], [1.5, -spike], [-1.5, -spike]]);
    linear_extrude(width) polygon([[-head_w/2, 0], [head_w/2, 0], [2, -20], [-2, -20]]);
  }
  translate([-slot/2, head_h - slot_depth, -1]) cube([slot, slot_depth + 1, width + 2]);
  for (z = [width*0.28, width*0.72]) translate([0, head_h - slot_depth/2, z]) rotate([0, 90, 0]) cylinder(d = tie_d, h = head_w + 2, center = true);
}
