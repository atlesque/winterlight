// Candy cane base: a tray for two paving bricks with a rib between them. The
// bottom of the cane's coro stem drops into the slot in the rib; drill the coro
// through the two holes and tie it. About 8 kg of brick keeps the cane up in
// the wind. Print as is, no supports.
include <lib.scad>
coro_t = 3;
rib = 16;
rib_l = 60;        // the slot block; a low divider runs the rest of the way
rib_h = brick_h + 35;
bar_t = 2;       // the 15 × 2 mm aluminium stiffener behind the stem
slot = coro_t + bar_t + 0.6;
slot_depth = 50;
in = tray_inner(2, rib);
out = [in[0] + 2*tray_wall, in[1] + 2*tray_wall];

difference() {
  union() {
    tray(2, rib);
    translate([0, out[1]/2 - rib/2, 0]) cube([out[0], rib, tray_h]);
    translate([out[0]/2 - rib_l/2, out[1]/2 - rib/2, 0]) cube([rib_l, rib, rib_h]);
  }
  translate([-1, out[1]/2 - slot/2, rib_h - slot_depth]) cube([out[0] + 2, slot, slot_depth + 1]);
  for (x = [out[0]/2 - 14, out[0]/2 + 14]) translate([x, out[1]/2, rib_h - slot_depth/2]) rotate([90, 0, 0]) cylinder(d = tie_d, h = rib + 2, center = true);
}
