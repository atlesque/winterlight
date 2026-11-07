// Wireframe tree, star holder. Slides over the top of the pole above the crown
// hub. The coro star's bottom notch sits in the slot, whose floor follows the
// notch's V; tie it through two 5 mm holes drilled in the coro. Print as is,
// sleeve down, no supports.
include <lib.scad>
pole_d = 32;
coro_t = 3;
star_r = 200;      // the star's outer radius (model)
band = 50;         // width of the coro band round the star
sleeve = 50;
slot = coro_t + 0.6;
block_t = slot + 8;
block_w = 90;
flare = 24;
// Slope of the star's lower arms either side of the bottom notch.
slope = (0.809 - 0.42)/0.588;
centre = 40;       // slot depth in the middle
side = centre + slope*block_w/2;
top = sleeve + flare + side + 8;

difference() {
  union() {
    cylinder(d = pole_d + 10, h = sleeve);
    hull() {
      translate([0, 0, sleeve - 1]) cylinder(d = pole_d + 10, h = 1);
      translate([-block_w/2, -block_t/2, sleeve + flare]) cube([block_w, block_t, 1]);
    }
    translate([-block_w/2, -block_t/2, sleeve + flare]) cube([block_w, block_t, top - sleeve - flare]);
  }
  translate([0, 0, -1]) cylinder(d = pole_d + 2*clr + 0.4, h = sleeve - 3);
  // V-floored slot, open at the top and both ends.
  rotate([90, 0, 0]) linear_extrude(slot, center = true)
    polygon([[-block_w/2 - 1, top + 1], [block_w/2 + 1, top + 1], [block_w/2 + 1, top - side - slope], [0, top - centre], [-block_w/2 - 1, top - side - slope]]);
  for (x = [-28, 28]) translate([x, 0, top - centre/2 - slope*28]) rotate([90, 0, 0]) cylinder(d = tie_d, h = block_t + 2, center = true);
  translate([0, 0, sleeve - 15]) rotate([0, 90, 0]) cylinder(d = 5.5, h = pole_d + 20, center = true);
}
