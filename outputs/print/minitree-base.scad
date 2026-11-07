// Mini tree, base ring. Six strip spokes stand in its channels and lean in to
// the top cap; an 8 mm rod through the centre stiffens the tree and pushes
// into the clipped bush it stands on. Print as is, flat side down, no supports.
include <lib.scad>
spokes = 6;
r_base = 80;     // spoke radius at the base (the model's 8 cm)
r_top = 34;      // spoke radius at the top cap (they can't meet at a point)
height = 550;    // base to tip, as in the model
rod_d = 8;       // centre rod
ch_h = 32;
tilt = atan((r_base - r_top)/height);
plate = 4;

difference() {
  union() {
    spoked_ring(r_base + 1, r_base - ch_depth - 8, plate, spokes, rod_d + 12);
    cylinder(d = rod_d + 12, h = 20);
    channel_ring(spokes, r_base, tilt, ch_h);
  }
  translate([0, 0, -1]) cylinder(d = rod_d + 2*clr, h = 30);
}
