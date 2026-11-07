// Wireframe tree, base ring: 16 segments that puzzle together into the
// 84 cm ring round the pole, each holding the foot of one strand. Four of
// them (weighted = true) carry a tray for a paving brick, which holds the ring
// and the tree down on the stone. Print flat side down, no supports.
include <lib.scad>
strands = 16;
r_base = 420;
r_hub = 88;
height = 2500;
weighted = false;
tilt = atan((r_base - r_hub)/height);
band = 32;
ring_h = 8;
ch_h = 32;
half = 180/strands;
knob = 13;
neck = 8;
joint_clr = 0.3;

module knob2d(grow = 0) {
  // Points along the tangent at the segment's end, as a puzzle tab.
  translate([-neck/2 - grow, -1]) square([neck + 2*grow, 7 + grow]);
  translate([0, 6 + knob/2 - 1]) circle(d = knob + 2*grow);
}
module sector2d() {
  r0 = r_base - band/2 - 4;
  r1 = r_base + band/2 - 4;
  polygon(concat([for (a = [-half : half/8 : half]) r0*[cos(a), sin(a)]], [for (a = [half : -half/8 : -half]) r1*[cos(a), sin(a)]]));
}
module segment2d() {
  rm = r_base - 4;
  difference() {
    union() { sector2d(); rotate(half) translate([rm, 0]) knob2d(); }
    rotate(-half) translate([rm, 0]) knob2d(joint_clr);
  }
}

union() {
  linear_extrude(ring_h) segment2d();
  intersection() {
    translate([r_base, 0, ring_h - 3]) rotate([0, -tilt, 0]) channel(ch_h);
    translate([-1000, -1000, ring_h - 3]) cube([2000, 2000, 1000]);
  }
  if (weighted) {
    in = tray_inner(1);
    // The brick lies along the ring, just outside it.
    translate([r_base + band/2 - 6, -(in[0] + 2*tray_wall)/2, 0]) rotate([0, 0, 90]) translate([0, -(in[1] + 2*tray_wall), 0]) tray(1);
  }
}
