// Wireframe tree, ground peg: one per strand, on the 42 cm circle round the
// pole. The strand's end slides into the pocket, leaning in towards the hub;
// drill the strip through the side hole and tie it so the strand can be pulled
// tight. Printed lying on its side (as laid out here), no supports.
// Print X = outwards from the pole, print Y = up, print Z = round the tree.
include <lib.scad>
r_base = 420;
r_hub = 88;
height = 2500;
tilt = atan((r_base - r_hub)/height);
spike = 150;     // into the ground
head_h = 45;
head_w = slot_t + 2*6;
pocket = 32;
spike_t = 12;

difference() {
  union() {
    linear_extrude(ch_width) rotate(tilt) translate([-head_w/2, 0]) square([head_w, head_h]);
    linear_extrude(spike_t) polygon([[-9, 2], [9, 2], [1.5, -spike], [-1.5, -spike]]);
    // Fillet the head onto the spike.
    linear_extrude(ch_width) polygon([[-head_w/2, 0], [head_w/2, 0], [3, -18], [-3, -18]]);
  }
  // Pocket for the strip, open at the top of the head.
  translate([0, 0, wall]) linear_extrude(slot_w) rotate(tilt) translate([-slot_t/2, head_h - pocket]) square([slot_t, pocket + 1]);
  // Tie hole across the pocket, outwards.
  rotate([0, 0, tilt]) translate([0, head_h - pocket/2, ch_width/2]) rotate([0, 90, 0]) cylinder(d = tie_d, h = head_w + 2, center = true);
}
