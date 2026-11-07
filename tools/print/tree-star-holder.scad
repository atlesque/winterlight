// Wireframe tree, star holder. Slides over the top of the pole above the crown
// hub; the coro star's bottom point sits in the slot, held by two cable ties
// through holes drilled in the coro. Print as is, sleeve down, no supports.
include <lib.scad>
pole_d = 32;
coro_t = 3;        // coro sheet thickness
sleeve = 50;
slot = coro_t + 0.6;
block_t = slot + 8;
block_w = 90;
slot_depth = 40;
flare = 24;

difference() {
  union() {
    cylinder(d = pole_d + 10, h = sleeve);
    hull() {
      translate([0, 0, sleeve - 1]) cylinder(d = pole_d + 10, h = 1);
      translate([-block_w/2, -block_t/2, sleeve + flare]) cube([block_w, block_t, 1]);
    }
    translate([-block_w/2, -block_t/2, sleeve + flare]) cube([block_w, block_t, slot_depth + 6]);
  }
  translate([0, 0, -1]) cylinder(d = pole_d + 2*clr + 0.4, h = sleeve - 3);
  translate([-block_w/2 - 1, -slot/2, sleeve + flare + 6]) cube([block_w + 2, slot, slot_depth + 1]);
  for (x = [-30, 30]) translate([x, 0, sleeve + flare + 6 + slot_depth/2]) rotate([90, 0, 0]) cylinder(d = tie_d, h = block_t + 2, center = true);
  translate([0, 0, sleeve - 15]) rotate([0, 90, 0]) cylinder(d = 5.5, h = pole_d + 20, center = true);
}
