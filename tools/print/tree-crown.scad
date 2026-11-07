// Wireframe tree, crown hub. The 16 strands come up from the ground pegs into
// its channels; the 3 m pole runs through the centre and on up to the star
// holder. Printed upside down (channels up), no supports. Pin it to the pole
// with an M5 bolt through the side hole, or a cable tie round pole and sleeve.
include <lib.scad>
strands = 16;
r_base = 420;    // strand radius on the ground (the model's 42 cm)
r_hub = 88;      // strand radius at the hub: 16 channels need this much room
height = 2500;   // ground to hub, the model's tree height
pole_d = 32;     // measure the pole and set this
ch_h = 36;
tilt = atan((r_base - r_hub)/height);
plate = 5;
sleeve = 60;

difference() {
  union() {
    spoked_ring(r_hub + 1, r_hub - ch_depth - 8, plate, 8, pole_d + 12, 10);
    cylinder(d = pole_d + 12, h = sleeve);
    channel_ring(strands, r_hub, -tilt, ch_h);
  }
  translate([0, 0, -1]) cylinder(d = pole_d + 2*clr + 0.4, h = sleeve + 2);
  translate([0, 0, sleeve - 15]) rotate([90, 0, 0]) cylinder(d = 5.5, h = pole_d + 20, center = true);
}
