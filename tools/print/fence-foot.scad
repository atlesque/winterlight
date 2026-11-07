// Ground strip, foot of a post: a tray for one paving brick, lying along the
// strip behind it, with a socket for the post at the front. Print as is.
include <lib.scad>
tenon_w = 10;      // the post's tenon, across the strip
tenon_t = 16;      // and along it
socket_h = 110;
socket_depth = 40;
in = tray_inner(1);
out = [in[0] + 2*tray_wall, in[1] + 2*tray_wall];
block = [tenon_t + 10, tenon_w + 10];

difference() {
  union() {
    tray(1);
    // Socket on the front (+Y) side, in the middle.
    translate([out[0]/2 - block[0]/2, out[1] - tray_wall, 0]) cube([block[0], block[1] + tray_wall, socket_h]);
  }
  translate([out[0]/2 - tenon_t/2 - clr, out[1] + 5 - clr, socket_h - socket_depth]) cube([tenon_t + 2*clr, tenon_w + 2*clr, socket_depth + 1]);
}
