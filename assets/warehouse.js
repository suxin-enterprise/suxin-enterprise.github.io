// SuXin homepage: the animated isometric warehouse and the scroll story around it.
// Everything is drawn here as SVG (no images). The scene sits in a sticky stage; the
// story steps scroll over it and each step moves the camera to its part of the warehouse.
(function () {
  'use strict';

  var stage = document.querySelector('.story-stage');
  if (!stage) return;

  var NS = 'http://www.w3.org/2000/svg';
  var U = 20;                       // pixels per world unit
  var C = Math.cos(Math.PI / 6), S = 0.5;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- drawing helpers ----------
  function P(x, y, z) { return [(x - y) * C * U, ((x + y) * S - (z || 0)) * U]; }
  function pts(list) {
    return list.map(function (p) { var q = P(p[0], p[1], p[2]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // Axis-aligned block: three visible faces (top, the +y face, the +x face).
  function box(g, x, y, z, w, d, h, mat) {
    var b = el('g', { 'class': 'bx ' + mat }, g);
    el('polygon', { 'class': 'l', points: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]) }, b);
    el('polygon', { 'class': 'r', points: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]) }, b);
    el('polygon', { 'class': 't', points: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) }, b);
    return b;
  }
  // Flat quad on the floor
  function tile(g, x, y, w, d, z, cls) {
    return el('polygon', { 'class': cls, points: pts([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]) }, g);
  }
  // Transform that maps local (u right, v up) onto the +y face plane at world (x, y, z)
  function faceY(x, y, z) { var o = P(x, y, z); return 'matrix(' + [C * U, S * U, 0, -U, o[0], o[1]].map(function (n) { return n.toFixed(2); }).join(' ') + ')'; }
  // Text on the +x face, reading left to right (u along -y, v down like SVG text)
  function faceX(x, y, z) { var o = P(x, y, z); return 'matrix(' + [C * U, -S * U, 0, U, o[0], o[1]].map(function (n) { return n.toFixed(2); }).join(' ') + ')'; }
  function translate(node, x, y, z) { var q = P(x, y, z); node.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')'); }

  // ---------- scene ----------
  var svg = el('svg', { 'class': 'wh', 'aria-hidden': 'true', focusable: 'false' });
  stage.querySelector('.story-scene').appendChild(svg);
  var cam = el('g', { 'class': 'wh-cam' }, svg);
  var ground = el('g', {}, cam);
  var objs = el('g', {}, cam);
  var fx = el('g', { 'class': 'wh-fx' }, cam);

  var FW = 36, FD = 26;
  box(ground, 0, 0, -0.7, FW, FD, 0.7, 'm-floor');
  for (var gx = 2; gx < FW; gx += 2) el('polyline', { 'class': 'wh-grid', points: pts([[gx, 0, 0], [gx, FD, 0]]) }, ground);
  for (var gy = 2; gy < FD; gy += 2) el('polyline', { 'class': 'wh-grid', points: pts([[0, gy, 0], [FW, gy, 0]]) }, ground);

  // AGV lane: a closed loop the robots drive around
  var LOOP = [[3, 3], [23, 3], [23, 9], [33, 9], [33, 16.5], [15, 16.5], [15, 11], [3, 11], [3, 3]];
  for (var i = 0; i < LOOP.length - 1; i++) {
    var a = LOOP[i], b = LOOP[i + 1];
    var x0 = Math.min(a[0], b[0]) - 0.9, y0 = Math.min(a[1], b[1]) - 0.9;
    tile(ground, x0, y0, Math.abs(a[0] - b[0]) + 1.8, Math.abs(a[1] - b[1]) + 1.8, 0.01, 'wh-lane');
  }
  el('polyline', { 'class': 'wh-lane-dash', points: pts(LOOP.map(function (p) { return [p[0], p[1], 0.02]; })) }, ground);
  // Floor markings: dock bay, shop tiles, pallet bays
  tile(ground, 0.6, 18.4, 5, 7, 0.01, 'wh-mark');
  tile(ground, 16.2, 4.2, 6, 4.6, 0.01, 'wh-mark');

  // Static parts, depth-sorted by footprint centre
  var statics = [];
  function part(cx, cy, build, top) {
    var g = el('g', {});
    build(g);
    statics.push({ key: cx + cy + (top || 0), node: g });
    return g;
  }
  var BOXC = ['m-box', 'm-box', 'm-box2', 'm-box'];
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  // Rack bay: 4 uprights + shelves + cartons
  function rack(x, y, w, d, h, levels) {
    part(x + w / 2, y + d / 2, function (g) {
      var t = 0.12;
      box(g, x, y, 0, t, t, h, 'm-post');
      box(g, x + w - t, y, 0, t, t, h, 'm-post');
      for (var l = 0; l < levels; l++) {
        var z = 0.15 + l * (h - 0.2) / levels;
        box(g, x, y, z, w, d, 0.08, 'm-shelf');
        var bx = x + 0.12;
        while (bx < x + w - 0.5) {
          var bw = 0.4 + rnd() * 0.35, bh = 0.3 + rnd() * 0.35;
          if (bx + bw > x + w - 0.12) break;
          if (rnd() > 0.15) box(g, bx, y + 0.1, z + 0.08, bw, d - 0.2, bh, BOXC[Math.floor(rnd() * BOXC.length)]);
          bx += bw + 0.08;
        }
      }
      box(g, x, y + d - t, 0, t, t, h, 'm-post');
      box(g, x + w - t, y + d - t, 0, t, t, h, 'm-post');
    });
  }
  // Back wall of tall racks, a left row, and two aisle rows in the middle
  for (var rx = 1; rx < 22; rx += 1.75) rack(rx, 0.2, 1.65, 1.2, 3.8, 4);
  for (var ry = 4.4; ry < 9; ry += 1.75) rack(0.25, ry, 1.3, 1.65, 3.2, 3);
  for (var r2 = 5; r2 < 13.5; r2 += 1.75) { rack(r2, 5, 1.65, 1.1, 3, 3); rack(r2, 7.9, 1.65, 1.1, 3, 3); }

  // Pallet stacks by the forklift bay
  function pallet(x, y, n) {
    part(x + 0.6, y + 0.6, function (g) {
      box(g, x, y, 0, 1.2, 1.2, 0.18, 'm-pallet');
      for (var k = 0; k < n; k++) {
        box(g, x + 0.05, y + 0.05, 0.18 + k * 0.5, 0.55, 0.55, 0.48, BOXC[k % 3]);
        box(g, x + 0.62, y + 0.05, 0.18 + k * 0.5, 0.53, 0.55, 0.48, BOXC[(k + 1) % 3]);
        box(g, x + 0.05, y + 0.62, 0.18 + k * 0.5, 0.55, 0.53, 0.48, BOXC[(k + 2) % 3]);
        box(g, x + 0.62, y + 0.62, 0.18 + k * 0.5, 0.53, 0.53, 0.48, BOXC[k % 3]);
      }
    });
  }
  pallet(20.4, 4.5, 3); pallet(18.8, 4.5, 2); pallet(20.4, 6.2, 1);

  // Receiving: lorry at the dock
  part(3, 21.5, function (g) {
    box(g, 1.2, 18.8, 0.35, 3.4, 5.2, 3, 'm-truck');
    var w = el('g', { 'class': 'wh-brand', transform: faceX(4.6, 23.6, 1.4) }, g);
    el('rect', { x: 0, y: -0.86, width: 0.86, height: 0.86, rx: 0.2, 'class': 'wh-brand-mark' }, w);
    var tx = el('text', { x: 1.05, y: -0.14, 'font-size': 0.82 }, w);
    tx.textContent = 'SuXin';
    box(g, 1.2, 18.6, 0, 3.4, 0.2, 3.35, 'm-steel');
  });
  part(3, 25, function (g) {
    box(g, 1.3, 24, 0, 3.2, 1.7, 0.6, 'm-dark');
    box(g, 1.35, 24.05, 0.6, 3.1, 1.35, 1.8, 'm-cab');
    el('polygon', { 'class': 'wh-glass', points: pts([[1.6, 25.4, 1.3], [4.3, 25.4, 1.3], [4.3, 25.4, 2.2], [1.6, 25.4, 2.2]]) }, g);
  });

  // Conveyor from the lorry into the warehouse
  var BELT_Y = 20.2, BELT_X0 = 5.2, BELT_X1 = 21, BELT_Z = 0.95;
  for (var cx = BELT_X0; cx < BELT_X1; cx += 1.6) {
    (function (cx) {
      part(cx + 0.8, BELT_Y + 0.45 - 0.3, function (g) {
        box(g, cx + 0.1, BELT_Y + 0.1, 0, 0.12, 0.12, BELT_Z - 0.1, 'm-post');
        box(g, cx + 0.1, BELT_Y + 0.78, 0, 0.12, 0.12, BELT_Z - 0.1, 'm-post');
        box(g, cx, BELT_Y, BELT_Z - 0.15, 1.6, 1, 0.15, 'm-belt');
        el('polyline', { 'class': 'wh-belt-run', points: pts([[cx, BELT_Y + 0.5, BELT_Z], [cx + 1.6, BELT_Y + 0.5, BELT_Z]]) }, g);
      });
    })(cx);
  }

  // Packing cell, back right, on a dark platform
  part(30, 3.8, function (g) {
    box(g, 25.5, 0.6, 0, 9, 6.6, 0.45, 'm-dark');
    tile(g, 26, 1.1, 8, 5.6, 0.46, 'wh-plate');
  }, -4);
  part(32.6, 2, function (g) { box(g, 31.6, 1.2, 0.45, 2, 1.6, 1.1, 'm-machine'); box(g, 31.8, 1.4, 1.55, 1.6, 1.2, 0.3, 'm-steel'); });
  part(27.3, 2, function (g) { for (var k = 0; k < 3; k++) box(g, 26.4 + k * 0.62, 1.4, 0.45, 0.55, 0.55, 0.5 + (k % 2) * 0.45, BOXC[k]); });
  part(30, 6, function (g) {
    box(g, 26.2, 5.6, 0.45, 7.6, 0.9, 0.55, 'm-belt');
  });

  // Every Data office pod: desk + big screen
  part(28, 12.6, function (g) {
    box(g, 24.6, 10.6, 0, 7, 4.2, 0.25, 'm-pod');
  }, -3);
  part(28.4, 11.4, function (g) {
    box(g, 26.2, 11.2, 0.25, 4.6, 0.25, 0.1, 'm-steel');
    box(g, 27.4, 11.25, 0.35, 0.2, 0.15, 0.9, 'm-post');
    box(g, 25.6, 11.1, 1.2, 4.8, 0.2, 2.5, 'm-screen');
  });
  var chart = el('g', { transform: faceY(25.85, 11.3, 1.45) });
  var bars = [];
  el('rect', { x: 0, y: 0, width: 4.3, height: 2.0, 'class': 'wh-screen-bg' }, chart);
  for (var bi = 0; bi < 7; bi++) bars.push(el('rect', { x: 0.25 + bi * 0.56, y: 0.2, width: 0.36, height: 1, 'class': bi === 6 ? 'wh-bar hot' : 'wh-bar' }, chart));
  var line = el('polyline', { 'class': 'wh-spark', points: '' }, chart);
  part(28.6, 13, function (g) { box(g, 26, 12.4, 0.25, 4.4, 1.2, 0.85, 'm-desk'); box(g, 27.3, 12.55, 1.1, 1.1, 0.5, 0.05, 'm-screen'); });

  // Books corner: printer + invoices
  part(18.8, 12.6, function (g) {
    box(g, 16.4, 11.2, 0, 5.2, 3.4, 0.2, 'm-pod');
    box(g, 16.9, 11.6, 0.2, 2.6, 1.1, 0.85, 'm-desk');
    box(g, 17.3, 11.75, 1.05, 0.9, 0.7, 0.05, 'm-screen');
  }, -2);
  part(20.4, 13.6, function (g) {
    box(g, 19.7, 13, 0.2, 1.4, 1.1, 0.75, 'm-machine');
    box(g, 19.85, 13.15, 0.95, 1.1, 0.8, 0.12, 'm-steel');
  });
  var paper = el('g', {});
  var paperSheet = box(paper, 0, 0, 0, 0.8, 0.02, 0.9, 'm-paper');
  part(17.4, 14.1, function (g) { for (var k = 0; k < 4; k++) box(g, 17, 13.7, 0.2 + k * 0.05, 0.8, 0.6, 0.04, 'm-paper'); });

  // Shop with the POS counter, front right
  part(29.5, 21.5, function (g) {
    box(g, 24.6, 18.6, 0, 10.6, 6.8, 0.2, 'm-shop');
    for (var tx2 = 25; tx2 < 35; tx2 += 1) for (var ty2 = 19; ty2 < 25; ty2 += 1)
      if ((tx2 + ty2) % 2) tile(g, tx2, ty2, 1, 1, 0.21, 'wh-shoptile');
  }, -4);
  function gondola(x, y) {
    part(x + 0.6, y + 1.4, function (g) {
      box(g, x, y, 0.2, 1.1, 2.8, 0.25, 'm-steel');
      box(g, x, y, 0.2, 0.16, 2.8, 1.75, 'm-post');
      for (var l = 0; l < 3; l++) {
        box(g, x + 0.16, y, 0.45 + l * 0.5, 0.8, 2.8, 0.06, 'm-shelf');
        for (var k = 0; k < 6; k++) box(g, x + 0.3, y + 0.1 + k * 0.45, 0.51 + l * 0.5, 0.42, 0.32, 0.3, ['m-prod1', 'm-prod2', 'm-prod3'][(k + l) % 3]);
      }
    });
  }
  gondola(25.2, 19.2); gondola(25.2, 22.3);
  part(30.6, 20.4, function (g) {
    box(g, 28.6, 20, 0.2, 4, 0.9, 1.05, 'm-counter');
    box(g, 28.5, 19.95, 1.25, 4.2, 1, 0.08, 'm-steel');
    box(g, 31.4, 20.15, 1.33, 0.12, 0.12, 0.5, 'm-post');
    box(g, 30.9, 20.15, 1.8, 1.1, 0.12, 0.75, 'm-screen');
    box(g, 29.2, 20.3, 1.33, 0.7, 0.5, 0.25, 'm-dark');
  });
  var posScreen = el('g', { transform: faceY(30.98, 20.27, 1.86) });
  el('rect', { x: 0, y: 0, width: 0.94, height: 0.63, 'class': 'wh-screen-bg' }, posScreen);
  var posTotal = el('rect', { x: 0.1, y: 0.1, width: 0.5, height: 0.14, 'class': 'wh-bar hot' }, posScreen);
  el('rect', { x: 0.1, y: 0.33, width: 0.74, height: 0.07, 'class': 'wh-bar' }, posScreen);
  el('rect', { x: 0.1, y: 0.46, width: 0.6, height: 0.07, 'class': 'wh-bar' }, posScreen);

  // People: simple rounded figures
  function person(x, y, z, cls) {
    var g = el('g', { 'class': 'wh-person ' + (cls || '') });
    var inner = el('g', {}, g);
    el('ellipse', { cx: 0, cy: 0, rx: 7, ry: 3.5, 'class': 'wh-shadow' }, inner);
    el('rect', { x: -4.6, y: -22, width: 9.2, height: 22, rx: 4.2, 'class': 'legs' }, inner);
    el('rect', { x: -6, y: -34, width: 12, height: 17, rx: 5.5, 'class': 'body' }, inner);
    el('circle', { cx: 0, cy: -40, r: 5, 'class': 'head' }, inner);
    translate(g, x, y, z);
    statics.push({ key: x + y + 0.3, node: g });
    return inner;
  }
  var cashier = person(30.2, 19.5, 0.2, 'staff');
  var customer = person(30.6, 21.9, 0.2);
  var analyst = person(27.9, 13.1, 0.25, 'staff');
  var clerk = person(18.2, 12.9, 0.2, 'staff');
  var picker = person(14.2, 7.2, 0, 'staff');
  var dockman = person(5.6, 21.8, 0, 'staff');

  // ---------- moving things ----------
  var movers = [];
  function mover(build, top) {
    var m = { node: el('g', {}), key: 0, x: 0, y: 0, z: 0, top: top || 0, idx: -1 };
    build(m.node, m);
    movers.push(m);
    return m;
  }
  function place(m, x, y, z) { m.x = x; m.y = y; m.z = z || 0; m.key = x + y + m.top; translate(m.node, x, y, z); }

  // AGVs on the lane (some carry a carton)
  var loopLen = 0, seg = [];
  for (var s2 = 0; s2 < LOOP.length - 1; s2++) {
    var l2 = Math.abs(LOOP[s2 + 1][0] - LOOP[s2][0]) + Math.abs(LOOP[s2 + 1][1] - LOOP[s2][1]);
    seg.push(l2); loopLen += l2;
  }
  function onLoop(d) {
    d = ((d % loopLen) + loopLen) % loopLen;
    for (var k = 0; k < seg.length; k++) {
      if (d <= seg[k]) {
        var a = LOOP[k], b = LOOP[k + 1], f = d / seg[k];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      d -= seg[k];
    }
    return LOOP[0];
  }
  var agvs = [];
  for (var ai = 0; ai < 5; ai++) {
    (function (ai) {
      var m = mover(function (g) {
        el('ellipse', { cx: 0, cy: 3, rx: 24, ry: 12, 'class': 'wh-shadow' }, g);
        box(g, -0.7, -0.7, 0.08, 1.4, 1.4, 0.32, 'm-agv');
        box(g, -0.45, -0.45, 0.4, 0.9, 0.9, 0.05, 'm-agvtop');
        if (ai % 2 === 0) box(g, -0.4, -0.4, 0.45, 0.8, 0.8, 0.65, BOXC[ai % 3]);
        else el('circle', { cx: 0, cy: -9, r: 2.2, 'class': 'wh-led' }, g);
      });
      m.offset = ai * loopLen / 5;
      agvs.push(m);
    })(ai);
  }

  // Cartons riding the conveyor
  var cartons = [];
  for (var ci = 0; ci < 6; ci++) {
    (function (ci) {
      var m = mover(function (g) { box(g, -0.32, -0.32, 0, 0.64, 0.64, 0.52, BOXC[ci % 3]); el('polyline', { 'class': 'wh-tape', points: pts([[-0.32, 0, 0.52], [0.32, 0, 0.52]]) }, g); }, 1.6);
      m.offset = ci / 6;
      cartons.push(m);
    })(ci);
  }

  // Robot arms: base + two links, posed every frame
  function arm(x, y, z, phase, reach) {
    var m = mover(function (g, m) {
      var e = P(0, 0, 0);
      el('ellipse', { cx: e[0], cy: e[1], rx: 0.62 * U * 1.22, ry: 0.62 * U * 0.71, 'class': 'wh-armbase' }, g);
      box(g, -0.4, -0.4, 0, 0.8, 0.8, 0.45, 'm-machine');
      m.l1 = el('line', { 'class': 'wh-arm' }, g);
      m.l2 = el('line', { 'class': 'wh-arm' }, g);
      m.j1 = el('circle', { r: 3.6, 'class': 'wh-joint' }, g);
      m.j2 = el('circle', { r: 3, 'class': 'wh-joint' }, g);
      m.grip = el('polyline', { 'class': 'wh-grip' }, g);
      m.held = box(g, -0.25, -0.25, 0, 0.5, 0.5, 0.4, 'm-box');
    });
    m.phase = phase; m.reach = reach; m.bz = z;
    place(m, x, y, z);
    return m;
  }
  var arms = [arm(10.6, 18.7, 0, 0, Math.PI / 2), arm(16.4, 22.3, 0, 2.1, -Math.PI / 2), arm(29, 3.6, 0.45, 1, Math.PI / 2)];
  function poseArm(m, t) {
    var cyc = (t * 0.32 + m.phase) % (Math.PI * 2);
    var swing = Math.sin(cyc);                        // -1..1: pick side to drop side
    var yaw = m.reach + swing * 1.25;
    var dip = Math.max(0, Math.cos(cyc * 2)) * 0.35;  // lean down at each end
    var a1 = 0.55 + dip, a2 = 1.55 + dip * 0.8;       // angles from vertical
    var hx = Math.cos(yaw), hy = Math.sin(yaw);
    var b = [0, 0, 0.45], L1 = 1.5, L2 = 1.35;
    var j = [b[0] + hx * Math.sin(a1) * L1, b[1] + hy * Math.sin(a1) * L1, b[2] + Math.cos(a1) * L1];
    var e = [j[0] + hx * Math.sin(a2) * L2, j[1] + hy * Math.sin(a2) * L2, j[2] + Math.cos(a2) * L2];
    var pb = P(b[0], b[1], b[2]), pj = P(j[0], j[1], j[2]), pe = P(e[0], e[1], e[2]), pg = P(e[0], e[1], e[2] - 0.35);
    m.l1.setAttribute('x1', pb[0]); m.l1.setAttribute('y1', pb[1]); m.l1.setAttribute('x2', pj[0]); m.l1.setAttribute('y2', pj[1]);
    m.l2.setAttribute('x1', pj[0]); m.l2.setAttribute('y1', pj[1]); m.l2.setAttribute('x2', pe[0]); m.l2.setAttribute('y2', pe[1]);
    m.j1.setAttribute('cx', pj[0]); m.j1.setAttribute('cy', pj[1]);
    m.j2.setAttribute('cx', pe[0]); m.j2.setAttribute('cy', pe[1]);
    m.grip.setAttribute('points', (pe[0] - 4) + ',' + (pg[1] + 2) + ' ' + (pe[0] - 4) + ',' + pe[1] + ' ' + (pe[0] + 4) + ',' + pe[1] + ' ' + (pe[0] + 4) + ',' + (pg[1] + 2));
    var carrying = Math.cos(cyc) > 0;
    m.held.style.opacity = carrying ? 1 : 0;
    var hb = P(e[0], e[1], e[2] - 0.8);
    m.held.setAttribute('transform', 'translate(' + hb[0].toFixed(1) + ' ' + hb[1].toFixed(1) + ')');
    m.key = m.x + m.y + Math.max(0, e[0] + e[1]) * 0.5;
  }

  // Forklift shuttling pallets
  var fork = mover(function (g, fork) {
    el('ellipse', { cx: 0, cy: 4, rx: 26, ry: 13, 'class': 'wh-shadow' }, g);
    box(g, -0.9, -0.55, 0.15, 1.4, 1.1, 0.75, 'm-fork');
    box(g, -0.75, -0.45, 0.9, 0.9, 0.9, 0.06, 'm-steel');
    box(g, -0.8, -0.45, 0.9, 0.08, 0.08, 1.1, 'm-post');
    box(g, -0.8, 0.37, 0.9, 0.08, 0.08, 1.1, 'm-post');
    box(g, -0.8, -0.45, 1.95, 0.9, 0.9, 0.08, 'm-fork');
    box(g, 0.5, -0.5, 0, 0.12, 1, 2.3, 'm-post');
    fork.lift = el('g', {}, g);
    box(fork.lift, 0.62, -0.45, 0.2, 1.1, 0.9, 0.14, 'm-pallet');
    box(fork.lift, 0.68, -0.4, 0.34, 0.5, 0.8, 0.5, 'm-box');
    box(fork.lift, 1.2, -0.4, 0.34, 0.48, 0.8, 0.5, 'm-box2');
  }, 0.6);

  // Scanning drone over the aisle
  var drone = mover(function (g, drone) {
    drone.beam = el('polygon', { 'class': 'wh-beam', points: '' }, g);
    drone.body = el('g', {}, g);
    box(drone.body, -0.35, -0.35, 0, 0.7, 0.7, 0.22, 'm-agv');
    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(function (r) {
      var q = P(r[0], r[1], 0.3);
      el('ellipse', { cx: q[0], cy: q[1], rx: 7, ry: 3.5, 'class': 'wh-rotor' }, drone.body);
    });
  }, 40);

  // Invoice paper feeding out of the printer
  var paperM = mover(function (g) { g.appendChild(paper); }, 0.5);

  // Order objects by depth once, then slot movers in each frame
  statics.sort(function (a, b) { return a.key - b.key; });
  statics.forEach(function (s) { objs.appendChild(s.node); });
  movers.forEach(function (m) { objs.appendChild(m.node); });
  [chart, posScreen].forEach(function (n) { objs.appendChild(n); });
  // Screen contents draw just after the part that holds the screen
  var screenAnchors = [{ node: chart, key: 28.4 + 11.4 + 0.01 }, { node: posScreen, key: 30.6 + 20.4 + 0.01 }];
  function slot(node, key, cache) {
    var lo = 0, hi = statics.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (statics[mid].key <= key) lo = mid + 1; else hi = mid; }
    if (cache.idx === lo) return;
    cache.idx = lo;
    objs.insertBefore(node, lo < statics.length ? statics[lo].node : null);
  }

  // Focus rings: one per story step
  var STEPS = Array.prototype.slice.call(document.querySelectorAll('.story-step'));
  var rings = STEPS.map(function (st) {
    var c = (st.getAttribute('data-cam') || '18,13,1').split(',').map(Number);
    var r = Number(st.getAttribute('data-ring') || 0);
    var g = el('g', { 'class': 'wh-ring' }, fx);
    if (r) {
      var o = P(c[0], c[1], 0.05);
      el('ellipse', { cx: o[0], cy: o[1], rx: r * U * 1.22, ry: r * U * 0.71, 'class': 'a' }, g);
      el('ellipse', { cx: o[0], cy: o[1], rx: r * U * 1.22, ry: r * U * 0.71, 'class': 'b' }, g);
    }
    return g;
  });

  function frame(t) {
    // AGVs
    agvs.forEach(function (m) { var p = onLoop(t * 2.1 + m.offset); place(m, p[0], p[1], 0); });
    // Conveyor cartons: out of the lorry, along the belt, fade at the end
    cartons.forEach(function (m) {
      var f = (t * 0.09 + m.offset) % 1;
      place(m, BELT_X0 + f * (BELT_X1 - BELT_X0 - 0.4), BELT_Y + 0.5, BELT_Z);
      m.node.style.opacity = f < 0.04 ? f / 0.04 : f > 0.94 ? (1 - f) / 0.06 : 1;
    });
    arms.forEach(function (m) { poseArm(m, t); });
    // Forklift: drive in, lift, back out
    var fc = (t * 0.16) % 1, fxp = fc < 0.5 ? fc * 2 : 2 - fc * 2;
    var ease = fxp * fxp * (3 - 2 * fxp);
    place(fork, 16.9 + ease * 2.2, 7.35, 0);
    var liftZ = Math.max(0, Math.sin(fc * Math.PI * 2)) * 1.2;
    fork.lift.setAttribute('transform', 'translate(0 ' + (-liftZ * U).toFixed(1) + ')');
    // Drone sweeping the aisle between the middle racks
    var dx = 9.2 + Math.sin(t * 0.45) * 4.2, dz = 3.7 + Math.sin(t * 2.6) * 0.12;
    place(drone, dx, 6.95, dz);
    var aimY = Math.sin(t * 0.9) > 0 ? -1.1 : 1.1;
    var b0 = P(0, 0, 0), b1 = P(-0.55, aimY, -2.2), b2 = P(0.55, aimY, -2.2);
    drone.beam.setAttribute('points', b0.join(',') + ' ' + b1.join(',') + ' ' + b2.join(','));
    drone.beam.style.opacity = 0.35 + 0.35 * Math.abs(Math.sin(t * 5));
    // Chart bars on the Every Data screen
    var sp = [];
    bars.forEach(function (bar, k) {
      var h = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.8 + k * 0.9)) + k * 0.1;
      h = Math.min(h, 1.7);
      bar.setAttribute('height', h.toFixed(2));
      sp.push((0.43 + k * 0.56).toFixed(2) + ',' + (h + 0.12).toFixed(2));
    });
    line.setAttribute('points', sp.join(' '));
    // POS total ticks up
    posTotal.setAttribute('width', (0.2 + ((t * 0.4) % 1) * 0.55).toFixed(2));
    // Printer: a sheet rises out, then drops onto the stack
    var pc = (t * 0.3) % 1;
    place(paperM, 19.95, 13.55, 0.95);
    paperSheet.setAttribute('transform', 'translate(0 ' + (-Math.min(pc * 1.4, 1) * 0.55 * U).toFixed(1) + ')');
    paperSheet.style.opacity = pc > 0.85 ? (1 - pc) / 0.15 : 1;
    // People bob a little
    var bob = Math.sin(t * 3) * 0.8;
    cashier.setAttribute('transform', 'translate(0 ' + bob.toFixed(1) + ')');
    customer.setAttribute('transform', 'translate(0 ' + (-bob).toFixed(1) + ')');
    clerk.setAttribute('transform', 'translate(0 ' + (bob * 0.5).toFixed(1) + ')');
    picker.setAttribute('transform', 'translate(' + (Math.sin(t * 0.7) * 6).toFixed(1) + ' ' + (Math.sin(t * 0.7) * 3.5).toFixed(1) + ')');
    dockman.setAttribute('transform', 'translate(0 ' + (bob * 0.6).toFixed(1) + ')');
    analyst.setAttribute('transform', 'translate(0 ' + (-bob * 0.4).toFixed(1) + ')');
    // Depth
    movers.forEach(function (m) { slot(m.node, m.key, m); });
    screenAnchors.forEach(function (s) { slot(s.node, s.key, s); });
  }

  // ---------- camera ----------
  var W = 0, H = 0, fitScale = 1;
  var camNow = null, camTarget = [18, 13, 1];
  // Scene bounds in screen units (floor corners + rack height)
  var minX = P(0, FD)[0], maxX = P(FW, 0)[0], minY = P(0, 0, 4)[1], maxY = P(FW, FD, -0.7)[1];
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var wide = W > 900;
    var availW = wide ? W * 0.66 : W * 1.08, availH = wide ? H * 0.86 : H * 0.62;
    fitScale = Math.min(availW / (maxX - minX), availH / (maxY - minY));
  }
  function anchor() { return W > 900 ? [W * 0.62, H * 0.53] : [W * 0.5, H * 0.33]; }
  function applyCam(c) {
    var s = fitScale * c[2], q = P(c[0], c[1], 0.8), a = anchor();
    cam.setAttribute('transform', 'translate(' + (a[0] - q[0] * s).toFixed(1) + ' ' + (a[1] - q[1] * s).toFixed(1) + ') scale(' + s.toFixed(4) + ')');
  }
  // data-cam-m (optional) overrides the camera on narrow screens
  var cams = [];
  function readCams() {
    var narrow = W <= 900;
    cams = STEPS.map(function (st) {
      return ((narrow && st.getAttribute('data-cam-m')) || st.getAttribute('data-cam') || '18,13,1').split(',').map(Number);
    });
  }
  var dots = Array.prototype.slice.call(document.querySelectorAll('.story-rail a'));
  var active = -1;
  function readScroll() {
    var vc = window.innerHeight * 0.5, centers = STEPS.map(function (st) { var r = st.getBoundingClientRect(); return r.top + r.height / 2; });
    var i = 0;
    while (i < centers.length - 1 && centers[i + 1] <= vc) i++;
    var f = 0;
    if (i < centers.length - 1 && centers[i] < vc) f = Math.min(1, (vc - centers[i]) / (centers[i + 1] - centers[i]));
    // Hold on each step, move between them
    var e = f < 0.25 ? 0 : f > 0.75 ? 1 : (f - 0.25) / 0.5;
    e = e * e * (3 - 2 * e);
    var a = cams[i], b = cams[Math.min(i + 1, cams.length - 1)];
    camTarget = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
    var now = f > 0.5 ? Math.min(i + 1, STEPS.length - 1) : i;
    if (now !== active) {
      active = now;
      STEPS.forEach(function (st, k) { st.classList.toggle('is-active', k === now); });
      rings.forEach(function (r, k) { r.classList.toggle('on', k === now); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === now); if (k === now) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      stage.setAttribute('data-step', now);
    }
  }

  // ---------- loop ----------
  var visible = true, last = 0, clock = 0, running = false;
  function tick(ts) {
    running = false;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    clock += dt;
    if (!camNow) camNow = camTarget.slice();
    var k = reduceMotion ? 1 : 1 - Math.pow(0.0018, dt);
    for (var j = 0; j < 3; j++) camNow[j] += (camTarget[j] - camNow[j]) * k;
    applyCam(camNow);
    if (!reduceMotion) frame(clock);
    if (visible && !reduceMotion) request();
  }
  function request() { if (!running) { running = true; requestAnimationFrame(tick); } }

  resize();
  readCams();
  readScroll();
  frame(4);
  camNow = camTarget.slice();
  applyCam(camNow);
  window.addEventListener('resize', function () { resize(); readCams(); readScroll(); camNow = camTarget.slice(); applyCam(camNow); });
  window.addEventListener('scroll', function () { readScroll(); request(); }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { last = 0; request(); }
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = 0; request(); } });
  request();
  stage.classList.add('is-ready');
})();

// Page-wide scroll effects: progress bar, pinned product slider, conveyor dividers.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  var bar = document.querySelector('.scroll-prog');

  // Products slide sideways while the section is pinned
  var pin = document.querySelector('.hpin');
  var track = pin && pin.querySelector('.hpin-track');
  var pinBar = pin && pin.querySelector('.hpin-bar i');
  var pinCart = pin && pin.querySelector('.hpin-cart');
  var pinCards = track ? Array.prototype.slice.call(track.children) : [];
  var shift = 0;
  function layoutPin() {
    if (!pin) return;
    var on = !reduceMotion && window.innerWidth > 900 && window.innerHeight >= 660;
    pin.classList.toggle('is-on', on);
    track.style.transform = '';
    pinCards.forEach(function (c) { c.style.transform = ''; c.style.opacity = ''; c.classList.remove('is-focus'); });
    if (!on) { pin.style.height = ''; shift = 0; return; }
    // The scroll motion below replaces the fade-in for these cards
    pinCards.forEach(function (c) { c.setAttribute('data-in', ''); });
    shift = Math.max(0, track.scrollWidth + track.getBoundingClientRect().left - window.innerWidth);
    pin.style.height = (window.innerHeight + shift) + 'px';
  }

  // Conveyor dividers
  var belts = Array.prototype.slice.call(document.querySelectorAll('.belt')).map(function (host) {
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false' }, host);
    return { host: host, svg: svg, w: 0, cartons: [], rollers: [] };
  });
  var TAGS = ['POS', 'SCAN', 'WMS', 'DATA', 'BOOKS', 'SuXin'];
  function buildBelt(b) {
    var w = b.host.clientWidth;
    if (w === b.w) return;
    b.w = w;
    b.svg.textContent = '';
    b.svg.setAttribute('viewBox', '0 0 ' + w + ' 92');
    for (var x = 30; x < w; x += 180) el('rect', { 'class': 'leg', x: x, y: 70, width: 4, height: 22 }, b.svg);
    el('rect', { 'class': 'rail', x: -2, y: 58, width: w + 4, height: 14, rx: 7 }, b.svg);
    b.rollers = [];
    for (var rx = 18; rx < w; rx += 46) {
      var g = el('g', { transform: 'translate(' + rx + ' 65)' }, b.svg);
      el('circle', { 'class': 'roller', r: 5.5 }, g);
      b.rollers.push(el('line', { 'class': 'spoke', x1: -5, y1: 0, x2: 5, y2: 0 }, g));
    }
    b.cartons = [];
    var n = Math.ceil(w / 210) + 1;
    for (var i = 0; i < n; i++) {
      var c = el('g', {}, b.svg);
      var h = 34 + (i % 3) * 6, cw = 66 + (i % 2) * 14;
      el('rect', { 'class': 'ctn-side', x: 0, y: 58 - h, width: cw, height: h, rx: 2 }, c);
      el('rect', { 'class': 'ctn', x: 0, y: 58 - h, width: cw - 7, height: h, rx: 2 }, c);
      el('rect', { 'class': 'ctn-tape', x: (cw - 7) / 2 - 4, y: 58 - h, width: 8, height: h }, c);
      el('rect', { 'class': 'ctn-tag', x: 6, y: 58 - h + 8, width: 34, height: 14, rx: 2 }, c);
      var t = el('text', { 'class': 'ctn-label', x: 9, y: 58 - h + 18.5 }, c);
      t.textContent = TAGS[i % TAGS.length];
      b.cartons.push(c);
    }
  }

  function update() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    if (pin && shift) {
      var r = pin.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / shift));
      track.style.transform = 'translate3d(' + (-p * shift).toFixed(1) + 'px,0,0)';
      if (pinBar) pinBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (pinCart) pinCart.style.left = (p * 100).toFixed(2) + '%';
      // Tilt, lift and fade each card by its distance from the middle of the screen
      var mid = window.innerWidth / 2, best = null, bestD = 9;
      pinCards.forEach(function (c) {
        var cr = c.getBoundingClientRect();
        var d = Math.max(-1.6, Math.min(1.6, (cr.left + cr.width / 2 - mid) / mid));
        var a = Math.abs(d);
        c.style.transform = 'rotateY(' + (-d * 16).toFixed(2) + 'deg) translateY(' + (a * 28).toFixed(1) + 'px) scale(' + (1 - a * 0.07).toFixed(3) + ')';
        c.style.opacity = (1 - Math.min(0.6, a * 0.42)).toFixed(3);
        if (a < bestD) { bestD = a; best = c; }
      });
      pinCards.forEach(function (c) { c.classList.toggle('is-focus', c === best); });
    }
    belts.forEach(function (b) {
      var top = b.host.getBoundingClientRect().top;
      if (top > window.innerHeight || top < -100) return;
      var run = (window.innerHeight - top) * 0.9, gap = 210, span = b.cartons.length * gap;
      b.cartons.forEach(function (c, i) {
        var x = ((run + i * gap) % span + span) % span - gap;
        c.setAttribute('transform', 'translate(' + x.toFixed(1) + ' 0)');
      });
      var deg = (run / 5.5) * 57.3;
      b.rollers.forEach(function (s) { s.setAttribute('transform', 'rotate(' + deg.toFixed(1) + ')'); });
    });
  }
  var queued = false;
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
  function onResize() { layoutPin(); belts.forEach(buildBelt); update(); }
  onResize();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  // Fonts change card widths once they load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
})();
