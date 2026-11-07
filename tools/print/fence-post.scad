// Ground strip, upper half of a post: slides over the spike's tenon (bolt or
// tie it through the two holes) and holds the strip in a slot at the top, its
// centre at the model's 30 cm. The strip's face points towards the open side
// (+X: the street, or the path on the left run). Printed lying on its side.
include <lib.scad>
strip_y = 300;     // strip centre above the ground
shoulder = 70;     // where the spike's shoulder is
tenon = 40;
w = 22;
t = 16;
tenon_w = 10;
front = 3;         // wall in front of the strip
top = strip_y + slot_w/2;

difference() {
  linear_extrude(t) translate([-w/2, shoulder]) square([w, top - shoulder]);
  // Mortise for the spike's tenon.
  translate([-tenon_w/2 - clr, shoulder - 1, -1]) cube([tenon_w + 2*clr, tenon + 1 + clr, t + 2]);
  for (y = [shoulder + 10, shoulder + 30]) translate([0, y, t/2]) rotate([0, 90, 0]) cylinder(d = tie_d, h = w + 2, center = true);
  // Slot for the strip, open at the top, running through along the fence.
  translate([w/2 - front - slot_t, top - slot_w, -1]) cube([slot_t, slot_w + 1, t + 2]);
}
