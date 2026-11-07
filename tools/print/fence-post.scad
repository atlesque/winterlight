// Ground strip, post: its tenon drops into the socket of a brick foot and the
// strip lies in the slot at the top, its centre at the model's 30 cm. The
// strip's face points towards +X (the street, or the path on the left run).
// Printed lying on its side. Print Y = up in use, 0 = the ground.
include <lib.scad>
strip_y = 300;
socket_h = 110;    // top of the foot's socket
tenon = 40;
w = 22;
t = 16;
tenon_w = 10;
front = 3;
top = strip_y + slot_w/2;

difference() {
  linear_extrude(t) union() {
    translate([-w/2, socket_h]) square([w, top - socket_h]);
    translate([-tenon_w/2, socket_h - tenon]) square([tenon_w, tenon + 1]);
  }
  translate([w/2 - front - slot_t, top - slot_w, -1]) cube([slot_t, slot_w + 1, t + 2]);
}
