// Shared pieces for the Winterlight PETG parts (Bambu Lab A1, 256 × 256 × 256 mm).
// Millimetres. Measure your own mounting strip and set strip_w / strip_t on the
// command line (-D strip_w=20) or in OpenSCAD's Customizer before printing.
$fn = 72;
strip_w = 30;   // pixel mounting strip width
strip_t = 1.54; // pixel mounting strip thickness (measured)
clr = 0.4;      // clearance per side, a snug slide fit in PETG
wall = 3;       // channel walls
tie_d = 4.5;    // holes for the 2.5 mm cable ties or an M4 bolt

// Closed slots the strip slides through (the ground strip's posts).
slot_t = strip_t + 2*clr;
slot_w = strip_w + 2*clr;
// Open pockets the strip ends sit in (mini trees, tree hub and ring): a close
// fit across, and a little shallower than the strip, so the strip stands
// proud of the face and the cable tie clamps it down.
proud = 0.3;
pocket_t = strip_t - proud;
pocket_w = strip_w + 2*0.2;
// Outside size of a strip channel: radial depth and tangential width.
ch_depth = pocket_t + wall;
ch_width = pocket_w + 2*wall;

// A channel that holds a strip's end: the strip runs up +Z with its face
// (and its pixels) towards +X. Open on the +X side so the strip drops in.
// Two pairs of holes go through the back wall: with the strip in place, drill
// through them into the strip (the part is the drill guide), then thread a
// cable tie in through one hole of a pair, across the strip's face and back
// out through the other, and close it behind the wall. One or two ties.
tie_pitch = 14;  // centre to centre of the two holes of a pair
module channel(h, floor = 3) {
  difference() {
    translate([-ch_depth, -ch_width/2, 0]) cube([ch_depth, ch_width, h]);
    translate([-pocket_t, -pocket_w/2, floor]) cube([pocket_t + 1, pocket_w, h]);
    for (z = [floor + 7, h - 8], y = [-tie_pitch/2, tie_pitch/2])
      translate([-ch_depth - 1, y, z]) rotate([0, 90, 0]) cylinder(d = tie_d, h = ch_depth + 2, $fn = 24);
  }
}

// n channels on a circle of radius r (the strip's face), leaning by tilt
// degrees: positive leans the top inwards, negative outwards.
module channel_ring(n, r, tilt, h, start = 0) {
  intersection() {
    for (i = [0 : n - 1]) rotate([0, 0, start + 360*i/n])
      translate([r, 0, 0]) rotate([0, -tilt, 0]) channel(h);
    translate([-1000, -1000, 0]) cube([2000, 2000, 1000]);
  }
}

// A flat ring with spokes to a centre boss: the plate that ties the channels together.
module spoked_ring(r_out, r_in, t, n, boss_d, arm_w = 8) {
  difference() { cylinder(r = r_out, h = t); translate([0, 0, -1]) cylinder(r = r_in, h = t + 2); }
  for (i = [0 : n - 1]) rotate([0, 0, 360*i/n + 180/n]) translate([0, -arm_w/2, 0]) cube([r_in + 1, arm_w, t]);
  cylinder(d = boss_d, h = t);
}

// Bricks for ballast: the paving in front of the house is stone, so nothing
// can be staked into it. The feet are trays that hold standard concrete paving
// bricks (betonklinkers, 22 × 11 × 8 cm, about 4 kg each). Set your own size.
brick_l = 220;
brick_w = 110;
brick_h = 80;
brick_clr = 3;      // bricks vary a few millimetres
tray_wall = 1.6;
tray_h = 20;
tray_lip = 10;      // the floor is only a ledge round the edge, to save PETG
tray_floor = 1.6;

// A tray for n bricks side by side along Y, its corner at the origin.
// gap: extra room between the bricks (for a rib); returns nothing, see tray_size.
function tray_inner(n = 1, gap = 0) = [brick_l + 2*brick_clr, n*(brick_w + 2*brick_clr) + gap];
module tray(n = 1, gap = 0) {
  in = tray_inner(n, gap);
  out = [in[0] + 2*tray_wall, in[1] + 2*tray_wall];
  difference() {
    cube([out[0], out[1], tray_h]);
    translate([tray_wall, tray_wall, tray_floor]) cube([in[0], in[1], tray_h]);
    translate([tray_wall + tray_lip, tray_wall + tray_lip, -1]) cube([in[0] - 2*tray_lip, in[1] - 2*tray_lip, tray_floor + 2]);
  }
}
