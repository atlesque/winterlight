// Mini tree, top cap. Printed upside down: the flat top on the plate and the
// six channels pointing up (down in use, where the spokes come in from below).
// The centre hole takes the top of the 8 mm rod. No supports.
include <lib.scad>
spokes = 6;
r_base = 80;
r_top = 34;
height = 550;
rod_d = 12;      // centre rod: 10–12 mm bamboo cane
ch_h = 32;
tilt = atan((r_base - r_top)/height);
plate = 4;

difference() {
  union() {
    cylinder(r = r_top + 1, h = plate);
    cylinder(d = rod_d + 12, h = 30);
    // In print the channels lean outwards: in use they lean in towards the tip.
    channel_ring(spokes, r_top, -tilt, ch_h);
  }
  translate([0, 0, 3]) cylinder(d = rod_d + 2*clr, h = 30);
}
