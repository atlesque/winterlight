// Ground strip, lower half of a post: the spike that goes into the ground,
// with a tenon on top for the post. Printed lying on its side, no supports.
// Print Y = up in use, 0 = ground level.
include <lib.scad>
spike = 140;
shoulder = 70;     // above the ground
tenon = 40;
w = 22;
t = 16;
tenon_w = 10;

difference() {
  linear_extrude(t) union() {
    translate([-w/2, 0]) square([w, shoulder]);
    translate([-tenon_w/2, shoulder - 1]) square([tenon_w, tenon + 1]);
    polygon([[-w/2, 0.5], [w/2, 0.5], [1.5, -spike], [-1.5, -spike]]);
  }
  for (y = [shoulder + 10, shoulder + 30]) translate([0, y, t/2]) rotate([0, 90, 0]) cylinder(d = tie_d, h = w + 2, center = true);
}
