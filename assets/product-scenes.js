// Product pages: each product has its own scene (SVG drawn here), shown as a still picture.
// Each scene is a timeline P (0..1); the page poses it once at POSE and never moves it.
(function () {
  'use strict';

  var root = document.querySelector('.pstory');
  if (!root) return;

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, size, cls, s, anchor) {
    var t = el('text', { x: x, y: y, 'font-size': size, 'class': cls, 'text-anchor': anchor || 'start' }, parent);
    t.textContent = s;
    return t;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function ease(x) { return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function move(n, x, y, extra) { n.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (extra || '')); }
  function show(n, o) { n.style.opacity = o.toFixed(3); }
  function rm(v) { return 'RM ' + v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function popIn(n, k, cx, cy) {
    var s = 0.6 + 0.4 * ease(k);
    n.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + s.toFixed(3) + ') translate(' + -cx + ' ' + -cy + ')');
    show(n, k);
  }
  function barcode(g, x, y, w, h) {
    var bx = x + 3, k = 0;
    while (bx < x + w - 3) { var bw = [1, 2, 1, 3, 1, 2][k++ % 6]; el('rect', { x: bx, y: y + 2, width: bw, height: h - 4, 'class': 'c-dark' }, g); bx += bw + 1.6; }
  }

  // Each scene: build(svg) -> render(P, at, t). at(step, a, b) = progress through part of a step.
  var SCENES = {};

  // ---------- POS: checkout counter ----------
  SCENES.pos = function (svg) {
    el('ellipse', { cx: 300, cy: 452, rx: 270, ry: 16, 'class': 'c-shadow' }, svg);
    // Cards behind the counter: member card (step 2), sales chart (step 3)
    var member = el('g', {}, svg);
    el('rect', { x: 52, y: 58, width: 176, height: 108, rx: 14, 'class': 'c-acc' }, member);
    el('rect', { x: 52, y: 58, width: 176, height: 108, rx: 14, fill: 'url(#psGrad)' }, member);
    el('circle', { cx: 82, cy: 90, r: 14, 'class': 'c-white', opacity: .9 }, member);
    el('path', { d: 'M82 81l3 6 6.5 1-4.7 4.5 1.1 6.5-5.9-3.1-5.9 3.1 1.1-6.5L72.5 88l6.5-1z', 'class': 'c-warn' }, member);
    txt(member, 212, 96, 22, 't-dark', '−10%', 'end');
    var pts = [];
    for (var k = 0; k < 8; k++) pts.push(el('circle', { cx: 74 + k * 18, cy: 142, r: 5, 'class': 'c-white', opacity: .35 }, member));
    var chart = el('g', {}, svg);
    el('rect', { x: 52, y: 52, width: 210, height: 150, rx: 14, 'class': 'c-panel' }, chart);
    el('rect', { x: 68, y: 68, width: 70, height: 8, rx: 4, 'class': 'c-mut2' }, chart);
    var cbars = [];
    for (k = 0; k < 6; k++) cbars.push(el('rect', { x: 72 + k * 30, y: 180, width: 18, height: 0, rx: 4, 'class': k === 5 ? 'c-acc' : 'c-acc2' }, chart));

    // Terminal
    el('rect', { x: 470, y: 206, width: 12, height: 80, 'class': 'c-steel2' }, svg);
    el('rect', { x: 404, y: 92, width: 166, height: 122, rx: 12, 'class': 'c-dark' }, svg);
    el('rect', { x: 412, y: 100, width: 150, height: 106, rx: 7, 'class': 'c-screen' }, svg);
    var modes = [0, 1, 2].map(function (m) { return el('rect', { x: 420 + m * 46, y: 107, width: 40, height: 9, rx: 4.5, 'class': 'c-mut2' }, svg); });
    var lines = [];
    for (k = 0; k < 6; k++) lines.push([el('rect', { x: 420, y: 124 + k * 10, width: 0, height: 5, rx: 2.5, 'class': 'c-acc2' }, svg),
      el('rect', { x: 536, y: 124 + k * 10, width: 18, height: 5, rx: 2.5, 'class': 'c-acc2', opacity: 0 }, svg)]);
    var total = txt(svg, 554, 199, 12, 't-scr', 'RM 0.00', 'end');
    var paid = el('g', {}, svg);
    el('circle', { cx: 487, cy: 150, r: 26, 'class': 'c-acc' }, paid);
    el('path', { d: 'M475 150l8 8 16-17', 'class': 's-acc', stroke: '#fff', 'stroke-width': 5 }, paid);

    // Counter
    el('rect', { x: 40, y: 300, width: 520, height: 140, rx: 16, 'class': 'c-panel' }, svg);
    el('rect', { x: 62, y: 322, width: 190, height: 96, rx: 10, 'class': 'c-dim' }, svg);
    var drawer = el('g', {}, svg);
    el('rect', { x: 398, y: 322, width: 136, height: 44, rx: 6, 'class': 'c-steel2' }, drawer);
    for (k = 0; k < 4; k++) el('circle', { cx: 420 + k * 26, cy: 334, r: 8, 'class': 'c-warn' }, drawer);
    el('rect', { x: 398, y: 340, width: 136, height: 26, rx: 6, 'class': 'c-steel' }, drawer);
    el('rect', { x: 452, y: 350, width: 28, height: 6, rx: 3, 'class': 'c-steel2' }, drawer);
    el('rect', { x: 392, y: 316, width: 148, height: 28, 'class': 'c-panel', stroke: 'none' }, svg);
    el('rect', { x: 30, y: 284, width: 540, height: 20, rx: 8, 'class': 'c-steel' }, svg);
    // Receipt hanging over the front, printer on top
    var paper = el('g', {}, svg);
    var paperRect = el('rect', { x: 508, y: 282, width: 38, height: 0, rx: 2, 'class': 'c-paper' }, paper);
    var paperLines = [];
    for (k = 0; k < 8; k++) paperLines.push(el('rect', { x: 513, y: 292 + k * 12, width: 22 + (k % 3) * 3, height: 3, rx: 1.5, 'class': 'c-paperline' }, paper));
    el('rect', { x: 500, y: 254, width: 56, height: 32, rx: 6, 'class': 'c-dark' }, svg);
    el('rect', { x: 506, y: 280, width: 44, height: 4, rx: 2, 'class': 'c-steel2' }, svg);
    // Belt + scanner
    el('rect', { x: 46, y: 258, width: 262, height: 26, rx: 13, 'class': 'c-dark' }, svg);
    var beltRun = el('line', { x1: 60, y1: 271, x2: 294, y2: 271, 'class': 's-acc2', 'stroke-dasharray': '8 12', opacity: .6 }, svg);
    var beam = el('polygon', { points: '322,272 376,272 349,160', fill: 'url(#psBeamR)', opacity: 0 }, svg);
    el('rect', { x: 318, y: 270, width: 62, height: 14, rx: 4, 'class': 'c-screen' }, svg);

    // Items on the belt, and the bag they drop into
    var items = [];
    var prices = [15.9, 12.9, 3.5, 16.9, 4.2, 7.8];
    function item(i) {
      var g = el('g', {}, svg);
      if (i === 0) { el('rect', { x: -9, y: -44, width: 18, height: 36, rx: 5, 'class': 'p1' }, g); el('rect', { x: -4, y: -52, width: 8, height: 10, rx: 2, 'class': 'p1' }, g); el('rect', { x: -9, y: -32, width: 18, height: 10, 'class': 'c-white' }, g); el('rect', { x: -9, y: -8, width: 18, height: 8, 'class': 'p1' }, g); }
      if (i === 1) { el('rect', { x: -17, y: -32, width: 34, height: 32, rx: 3, 'class': 'c-kraft' }, g); el('rect', { x: -4, y: -32, width: 8, height: 32, 'class': 'c-tape' }, g); }
      if (i === 2) { el('rect', { x: -10, y: -30, width: 20, height: 30, rx: 4, 'class': 'p2' }, g); el('rect', { x: -10, y: -21, width: 20, height: 8, 'class': 'c-white', opacity: .8 }, g); }
      if (i === 3) { el('rect', { x: -18, y: -42, width: 36, height: 42, rx: 9, 'class': 'c-paper' }, g); el('rect', { x: -18, y: -26, width: 36, height: 10, 'class': 'p3' }, g); }
      if (i === 4) { el('rect', { x: -21, y: -18, width: 42, height: 18, rx: 9, 'class': 'p6' }, g); el('path', { d: 'M-10 -14v8M0 -15v9M10 -14v8', stroke: '#9a6a34', 'stroke-width': 2, 'stroke-linecap': 'round' }, g); }
      if (i === 5) { el('rect', { x: -19, y: -14, width: 38, height: 14, rx: 3, 'class': 'p3' }, g); for (var e = 0; e < 3; e++) el('ellipse', { cx: -11 + e * 11, cy: -15, rx: 5, ry: 6, 'class': 'c-white' }, g); }
      return g;
    }
    for (var i = 0; i < 6; i++) items.push(item(i));
    var bag = el('g', {}, svg);
    el('path', { d: 'M386 210c0-22 10-30 26-30s26 8 26 30', fill: 'none', stroke: '#10b981', 'stroke-width': 4 }, bag);
    el('path', { d: 'M372 214h80l-6 70h-68z', 'class': 'c-acc' }, bag);
    el('path', { d: 'M372 214h80l-2 18h-76z', 'class': 'c-teal' }, bag);
    el('defs', {}, svg).innerHTML = '<linearGradient id="psGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#0d9488"/></linearGradient>' +
      '<linearGradient id="psBeamR" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f87171"/><stop offset="1" stop-color="#f87171" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="psBeamG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></linearGradient>';

    return function (P, at, t) {
      var c = 0, n = 0, sum = 0, beep = false;
      items.forEach(function (g, i) {
        var q = seg(P, 0.05 + i * 0.075, 0.15 + i * 0.075);
        var start = 280 - 42 * (i - c);
        var x = lerp(start, 412, ease(q)), y = 258 + seg(x, 384, 412) * 46;
        if (x > 326 && x < 372) beep = true;
        if (x > 349) { n++; sum += prices[i]; }
        move(g, x, y);
        show(g, 1 - seg(x, 405, 412));
        c += q;
      });
      beltRun.setAttribute('stroke-dashoffset', (-P * 900 - t * 8).toFixed(1));
      beam.setAttribute('fill', beep ? 'url(#psBeamG)' : 'url(#psBeamR)');
      show(beam, beep ? 0.9 : 0.3 + 0.15 * Math.sin(t * 9));
      var mode = P < 0.2 ? 1 : at(1, 0, 1) < 1 ? Math.min(2, Math.floor(at(1, 0, 1) * 3)) : 1;
      modes.forEach(function (m, k) { m.setAttribute('class', k === mode ? 'c-acc' : 'c-mut2'); });
      lines.forEach(function (l, k) {
        var on = k < n;
        l[0].setAttribute('width', on ? 64 + (k * 17) % 40 : 0);
        show(l[1], on ? 1 : 0);
      });
      total.textContent = rm(sum);
      var len = n * 14 + at(3, 0, 1) * 18;
      paperRect.setAttribute('height', len.toFixed(1));
      paperLines.forEach(function (l, k) { show(l, 292 + k * 12 + 4 < 282 + len ? 1 : 0); });
      // Step 2: member card with points; step 3: sales chart
      var mIn = at(2, 0, 0.35), mOut = at(3, 0, 0.25);
      show(member, mIn * (1 - mOut));
      move(member, 0, (1 - ease(mIn)) * 30 - ease(mOut) * 30);
      pts.forEach(function (p, k) { show(p, at(2, 0.3 + k * 0.06, 0.36 + k * 0.06) > 0 ? 1 : 0.35); });
      show(chart, at(3, 0.1, 0.4));
      cbars.forEach(function (b, k) {
        var h = (30 + ((k * 37) % 60) + k * 8) * ease(at(3, 0.2 + k * 0.08, 0.5 + k * 0.08));
        b.setAttribute('y', (190 - h).toFixed(1)); b.setAttribute('height', h.toFixed(1));
      });
      // Step 4: paid, drawer open
      popIn(paid, at(4, 0.1, 0.45), 487, 150);
      move(drawer, 0, ease(at(4, 0.2, 0.6)) * 40);
    };
  };

  // ---------- Barcode Scan: a phone sweeping a shelf ----------
  SCENES['barcode-scan'] = function (svg) {
    var SHELF = [170, 285, 400];
    el('rect', { x: 26, y: 30, width: 548, height: 420, rx: 16, 'class': 'c-panel' }, svg);
    var tints = SHELF.map(function (y, r) { return el('rect', { x: 34, y: y - 110, width: 532, height: 112, rx: 8, 'class': 'c-acc', opacity: 0 }, svg); });
    var labels = [];
    var seed = 5;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    SHELF.forEach(function (y, r) {
      var x = 46;
      while (x < 540) {
        var w = 34 + Math.floor(rnd() * 22), h = 38 + Math.floor(rnd() * 34);
        if (x + w > 556) break;
        var cls = 'p' + (1 + Math.floor(rnd() * 6));
        if (rnd() > 0.5) el('rect', { x: x, y: y - h, width: w, height: h, rx: 4, 'class': cls }, svg);
        else { el('rect', { x: x + 3, y: y - h, width: w - 6, height: h, rx: (w - 6) / 2.6, 'class': cls }, svg); }
        el('rect', { x: x + 4, y: y - h * 0.62, width: w - 8, height: 8, rx: 2, 'class': 'c-white', opacity: .7 }, svg);
        var lg = el('g', {}, svg);
        el('rect', { x: x + w / 2 - 15, y: y + 10, width: 30, height: 15, rx: 2, 'class': 'c-white' }, lg);
        barcode(lg, x + w / 2 - 15, y + 10, 30, 15);
        var ok = el('rect', { x: x + w / 2 - 15, y: y + 10, width: 30, height: 15, rx: 2, 'class': 'c-acc', opacity: 0 }, lg);
        labels.push({ x: x + w / 2, row: r, ok: ok, y: y });
        x += w + 10;
      }
      el('rect', { x: 36, y: y, width: 528, height: 10, rx: 3, 'class': 'c-steel' }, svg);
    });
    // Two count differences, flagged in step 3
    var diffs = [labels.filter(function (l) { return l.row === 1; })[2], labels.filter(function (l) { return l.row === 2; })[5]].filter(Boolean);
    var flags = diffs.map(function (l) {
      var g = el('g', {}, svg);
      el('rect', { x: l.x - 22, y: l.y - 46, width: 44, height: 24, rx: 12, 'class': 'c-warn' }, g);
      txt(g, l.x, l.y - 29, 13, 't-dark', '−1', 'middle');
      return g;
    });
    // Location pills (head office, warehouse, shop)
    var pills = [0, 1, 2].map(function (k) {
      var g = el('g', {}, svg);
      var bg = el('rect', { x: 40 + k * 40, y: 38, width: 34, height: 22, rx: 11, 'class': 'c-dim' }, g);
      var d = ['M50 55v-9l7-5 7 5v9z', 'M88 55v-8l9-6 9 6v8zM93 55v-5h8v5', 'M128 55v-8h14v8zM126 47l3-5h12l3 5'][k];
      el('path', { d: d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'class': 'ps-ico' }, g);
      return bg;
    });
    // WMS box the differences fly to
    var wms = el('g', {}, svg);
    el('rect', { x: 446, y: 40, width: 112, height: 40, rx: 12, fill: 'url(#psGrad2)' }, wms);
    txt(wms, 502, 66, 15, 't-dark', 'WMS', 'middle');
    el('defs', {}, svg).innerHTML = '<linearGradient id="psGrad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#0d9488"/></linearGradient>';
    var packet = el('circle', { r: 7, 'class': 'c-warn', opacity: 0 }, svg);
    // Phone
    var phone = el('g', {}, svg);
    var cone = el('polygon', { points: '-18,75 18,75 15,100 -15,100', 'class': 'c-acc2', opacity: .45 }, phone);
    el('rect', { x: -44, y: -78, width: 88, height: 156, rx: 16, 'class': 'c-dark' }, phone);
    el('rect', { x: -38, y: -70, width: 76, height: 140, rx: 11, 'class': 'c-screen' }, phone);
    el('rect', { x: -30, y: -60, width: 60, height: 34, rx: 5, fill: 'none', stroke: '#5eead4', 'stroke-width': 1.6 }, phone);
    var vf = el('g', {}, phone); barcode(vf, -22, -54, 44, 22);
    var laser = el('rect', { x: -28, y: -44, width: 56, height: 2, 'class': 'c-red' }, phone);
    var count = txt(phone, 0, 6, 26, 't-scr', '0', 'middle');
    var rows = [];
    for (var k = 0; k < 3; k++) rows.push(el('rect', { x: -28, y: 22 + k * 11, width: 56, height: 6, rx: 3, 'class': 'c-acc2', opacity: .25 }, phone));
    var done = el('g', {}, svg);
    el('circle', { cx: 300, cy: 240, r: 44, 'class': 'c-acc' }, done);
    el('path', { d: 'M280 240l14 14 28-30', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, done);

    return function (P, at, t) {
      var sweep = seg(P, 0.06, 0.6) * 3, row = Math.min(2, Math.floor(sweep)), f = sweep - row;
      if (sweep >= 3) f = 1;
      var px = lerp(80, 520, f), py = SHELF[row] - 80;
      var fin = at(3, 0, 0.35);
      px = lerp(px, 380, ease(fin)); py = lerp(py, SHELF[1] - 80, ease(fin));
      move(phone, px, py);
      show(cone, (1 - fin) * (0.35 + 0.2 * Math.sin(t * 10)));
      show(laser, 0.6 + 0.4 * Math.sin(t * 12));
      laser.setAttribute('y', (-50 + Math.sin(t * 4) * 9).toFixed(1));
      var n = 0;
      labels.forEach(function (l) {
        var scanned = l.row < row || (l.row === row && l.x < px) || sweep >= 3;
        if (scanned) n++;
        show(l.ok, scanned ? 0.55 : 0);
      });
      count.textContent = String(n);
      rows.forEach(function (r, k) { show(r, n > k * 6 ? 0.9 : 0.25); });
      pills.forEach(function (b, k) { b.setAttribute('class', k === row ? 'c-acc' : 'c-dim'); });
      tints.forEach(function (tn, k) { show(tn, k === row && fin < 1 ? 0.07 : 0); });
      flags.forEach(function (g, k) { var a = at(3, 0.15 + k * 0.1, 0.3 + k * 0.1); move(g, 0, (1 - ease(a)) * 12); show(g, a * (1 - at(4, 0, 0.3))); });
      popIn(wms, at(3, 0.25, 0.45), 502, 60);
      var fly = at(3, 0.45, 0.9);
      var bx = lerp(px, 502, fly), by = lerp(py - 70, 60, fly) - Math.sin(fly * Math.PI) * 80;
      packet.setAttribute('cx', bx.toFixed(1)); packet.setAttribute('cy', by.toFixed(1));
      show(packet, fly > 0 && fly < 1 ? 1 : 0);
      popIn(done, at(4, 0.15, 0.5), 300, 240);
    };
  };

  // ---------- WMS: stacker crane filling a pallet rack ----------
  SCENES.wms = function (svg) {
    var X0 = 112, CW = 62, Y0 = 70, RH = 80, COLS = 6, ROWS = 4, FLOOR = 404, BELT = 352;
    function slotX(c) { return X0 + c * CW + CW / 2; }
    function slotY(r) { return Y0 + (r + 1) * RH - 6; }
    el('rect', { x: 14, y: 30, width: 572, height: 6, rx: 3, 'class': 'c-steel2' }, svg);
    el('rect', { x: 14, y: FLOOR, width: 572, height: 8, rx: 4, 'class': 'c-steel2' }, svg);
    for (var c = 0; c <= COLS; c++) el('rect', { x: X0 + c * CW - 3, y: Y0 - 10, width: 6, height: FLOOR - Y0 + 10, 'class': 'c-steel2' }, svg);
    for (var r = 0; r < ROWS; r++) el('rect', { x: X0 - 3, y: slotY(r), width: COLS * CW + 6, height: 6, 'class': 'c-warn' }, svg);
    // Conveyors: in (left), out (right)
    [16, 498].forEach(function (x) {
      el('rect', { x: x, y: BELT, width: 86, height: 12, rx: 6, 'class': 'c-steel' }, svg);
      for (var k = 0; k < 6; k++) el('circle', { cx: x + 8 + k * 14, cy: BELT + 6, r: 3, 'class': 'c-steel2' }, svg);
    });
    [30, 88, 512, 570].forEach(function (x) { el('rect', { x: x - 2, y: BELT + 10, width: 4, height: FLOOR - BELT - 10, 'class': 'c-steel2' }, svg); });
    function pallet(parent) {
      var g = el('g', {}, parent);
      el('rect', { x: -25, y: -8, width: 50, height: 8, rx: 2, 'class': 'c-kraft2' }, g);
      el('rect', { x: -23, y: -38, width: 22, height: 30, rx: 2, 'class': 'c-kraft' }, g);
      el('rect', { x: 1, y: -38, width: 22, height: 30, rx: 2, 'class': 'c-kraft' }, g);
      el('rect', { x: -12, y: -60, width: 24, height: 22, rx: 2, 'class': 'c-kraft' }, g);
      el('rect', { x: -14, y: -38, width: 4, height: 30, 'class': 'c-tape' }, g);
      el('rect', { x: 10, y: -38, width: 4, height: 30, 'class': 'c-tape' }, g);
      return g;
    }
    // Slots
    var slots = [];
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var s = { c: c, r: r, x: slotX(c), y: slotY(r) };
      s.empty = el('g', { opacity: 0 }, svg);
      el('rect', { x: s.x - 26, y: s.y - 66, width: 52, height: 62, rx: 6, 'class': 's-warn' }, s.empty);
      el('path', { d: 'M' + s.x + ' ' + (s.y - 44) + 'v18M' + (s.x - 9) + ' ' + (s.y - 35) + 'h18', stroke: '#f59e0b', 'stroke-width': 3, 'stroke-linecap': 'round' }, s.empty);
      s.g = pallet(svg); move(s.g, s.x, s.y);
      slots.push(s);
    }
    function slot(c, r) { return slots[r * COLS + c]; }
    var startEmpty = [[1, 0], [4, 0], [0, 1], [3, 1], [5, 1], [2, 2], [4, 2], [1, 3], [3, 3], [5, 3]].map(function (a) { return slot(a[0], a[1]); });
    var puts = startEmpty.slice(0, 6), takes = [slot(2, 3), slot(0, 2)];
    var jobs = [];
    puts.forEach(function (s, k) { jobs.push({ from: [60, BELT], to: [s.x, s.y], slot: s, put: true, a: 0.04 + k * 0.058, b: 0.1 + k * 0.058 }); });
    takes.forEach(function (s, k) { jobs.push({ from: [s.x, s.y], to: [530, BELT], slot: s, put: false, a: 0.64 + k * 0.08, b: 0.72 + k * 0.08 }); });
    // Van for the transfer
    var van = el('g', {}, svg);
    el('rect', { x: 0, y: -96, width: 110, height: 78, rx: 8, 'class': 'c-paper' }, van);
    el('rect', { x: 110, y: -66, width: 40, height: 48, rx: 8, 'class': 'c-acc' }, van);
    el('rect', { x: 118, y: -60, width: 24, height: 18, rx: 4, 'class': 'c-screen' }, van);
    el('rect', { x: 12, y: -70, width: 50, height: 14, rx: 7, 'class': 'c-acc' }, van);
    el('circle', { cx: 28, cy: -14, r: 13, 'class': 'c-dark' }, van);
    el('circle', { cx: 120, cy: -14, r: 13, 'class': 'c-dark' }, van);
    var inbound = pallet(svg);
    // Crane
    var crane = el('g', {}, svg);
    el('rect', { x: -7, y: 30, width: 14, height: FLOOR - 30, 'class': 'c-steel' }, crane);
    el('rect', { x: -18, y: FLOOR - 16, width: 36, height: 16, rx: 4, 'class': 'c-dark' }, crane);
    var carriage = el('g', {}, crane);
    el('rect', { x: -30, y: 0, width: 60, height: 8, rx: 3, 'class': 'c-acc' }, carriage);
    el('rect', { x: -10, y: -14, width: 20, height: 14, rx: 3, 'class': 'c-acc' }, carriage);
    var held = pallet(carriage);
    // PO card and pallet counter
    var po = el('g', {}, svg);
    el('rect', { x: 18, y: 46, width: 86, height: 120, rx: 8, 'class': 'c-paper' }, po);
    el('rect', { x: 18, y: 46, width: 86, height: 20, rx: 8, 'class': 'c-acc' }, po);
    txt(po, 61, 60, 10, 't-dark', 'PO', 'middle');
    for (var k = 0; k < 5; k++) { el('rect', { x: 26, y: 78 + k * 16, width: 44, height: 5, rx: 2.5, 'class': 'c-paperline' }, po); el('rect', { x: 78, y: 78 + k * 16, width: 18, height: 5, rx: 2.5, 'class': 'c-warn' }, po); }
    var counter = txt(svg, 572, 22, 13, 't-ink', '', 'end');

    return function (P, at, t) {
      var cx = 60, cy = BELT, carrying = false, filled = {};
      startEmpty.forEach(function (s) { filled[slots.indexOf(s)] = false; });
      var showInbound = false;
      jobs.forEach(function (j, k) {
        var u = seg(P, j.a, j.b);
        var prev = k ? jobs[k - 1].to : [60, BELT];
        if (u <= 0) { if (j.put && (k === 0 || seg(P, jobs[k - 1].a, jobs[k - 1].b) > 0.5)) showInbound = true; return; }
        if (u < 0.25) { var e = ease(u / 0.25); cx = lerp(prev[0], j.from[0], e); cy = lerp(prev[1], j.from[1], e); if (j.put) showInbound = true; }
        else if (u < 0.35) { cx = j.from[0]; cy = j.from[1] - seg(u, 0.25, 0.35) * 6; carrying = u > 0.3; if (j.put && !carrying) showInbound = true; }
        else if (u < 0.8) { var e2 = ease(seg(u, 0.35, 0.8)); cx = lerp(j.from[0], j.to[0], e2); cy = lerp(j.from[1] - 6, j.to[1] - 6, e2); carrying = true; }
        else { cx = j.to[0]; cy = j.to[1] - 6 + seg(u, 0.8, 0.9) * 6; carrying = u < 0.85; }
        var idx = slots.indexOf(j.slot);
        if (j.put) filled[idx] = u >= 0.85;
        else filled[idx] = u < 0.3;
      });
      move(crane, cx, 0);
      move(carriage, 0, cy);
      show(held, carrying ? 1 : 0);
      move(inbound, 60, BELT); show(inbound, showInbound ? 1 : 0);
      var reorder = at(2, 0.1, 0.4);
      var full = 0;
      slots.forEach(function (s, i) {
        var on = filled[i] === undefined ? true : filled[i];
        if (on) full++;
        show(s.g, on ? 1 : 0);
        show(s.empty, on ? 0 : reorder * (0.65 + 0.35 * Math.sin(t * 3)));
      });
      counter.textContent = full + ' / ' + slots.length;
      var poIn = at(2, 0, 0.35);
      show(po, poIn * (1 - at(3, 0, 0.2)));
      move(po, (1 - ease(poIn)) * -40, 0);
      var vx = lerp(620, 488, ease(at(3, 0, 0.25))) + ease(clamp(at(3, 0.88, 1) * 0.5 + at(4, 0, 0.5) * 0.5, 0, 1)) * 200;
      move(van, vx, FLOOR, ' scale(.74)');
    };
  };

  // ---------- Every Data: the dashboard builds itself ----------
  SCENES['every-data'] = function (svg) {
    el('rect', { x: 22, y: 22, width: 556, height: 436, rx: 24, 'class': 'c-dark' }, svg);
    el('rect', { x: 34, y: 34, width: 532, height: 412, rx: 15, 'class': 'c-panel' }, svg);
    var tiles = [['1273.16', true], ['35', false], ['36.38', true]].map(function (d, k) {
      var g = el('g', {}, svg);
      el('rect', { x: 52 + k * 170, y: 54, width: 156, height: 74, rx: 12, 'class': k === 0 ? 'c-acc' : 'c-dim' }, g);
      el('rect', { x: 66 + k * 170, y: 108, width: 60, height: 6, rx: 3, 'class': k === 0 ? 'c-white' : 'c-mut2', opacity: k === 0 ? .6 : 1 }, g);
      var v = txt(g, 66 + k * 170, 94, 22, k === 0 ? 't-dark' : 't-ink', '0');
      return { g: g, v: v, n: parseFloat(d[0]), money: d[1] };
    });
    // Line chart (sales)
    var line = el('g', {}, svg);
    for (var k = 0; k < 4; k++) el('rect', { x: 56, y: 186 + k * 60, width: 488, height: 1, 'class': 'c-mut2' }, line);
    var vals = [40, 62, 48, 90, 76, 118, 104, 150, 132, 176];
    var pts = vals.map(function (v, i) { return [64 + i * 52, 400 - v * 1.2]; });
    var d = 'M' + pts.map(function (p) { return p.join(' '); }).join(' L');
    var area = el('path', { d: d + ' L' + pts[pts.length - 1][0] + ' 400 L64 400 Z', 'class': 'c-acc', opacity: 0 }, line);
    var path = el('path', { d: d, 'class': 's-acc', 'stroke-width': 4, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, line);
    var dot = el('circle', { r: 7, 'class': 'c-acc2' }, line);
    // Bars (stock)
    var bars = el('g', {}, svg);
    var bh = [150, 120, 38, 170, 96, 30, 140, 110];
    var bl = bh.map(function (h, i) { return el('rect', { x: 66 + i * 60, y: 400, width: 34, height: 0, rx: 6, 'class': h < 50 ? 'c-red' : 'c-acc2' }, bars); });
    var warns = [2, 5].map(function (i) {
      var g = el('g', {}, bars);
      el('path', { d: 'M' + (83 + i * 60) + ' ' + 300 + 'l13 22h-26z', 'class': 'c-warn' }, g);
      el('rect', { x: 82 + i * 60, y: 308, width: 2, height: 7, 'class': 'c-dark' }, g);
      return g;
    });
    // Network (warehouse -> branches)
    var net = el('g', {}, svg);
    var hub = [300, 290], spokes = [[110, 200], [140, 380], [470, 190], [500, 360], [300, 410]];
    var links = spokes.map(function (s) { return el('path', { d: 'M' + hub.join(' ') + ' L' + s.join(' '), 'class': 's-dash' }, net); });
    var trucks = spokes.map(function () { return el('circle', { r: 6, 'class': 'c-acc2' }, net); });
    spokes.forEach(function (s, i) {
      el('circle', { cx: s[0], cy: s[1], r: 20, 'class': 'c-dim' }, net);
      el('path', { d: 'M' + (s[0] - 8) + ' ' + (s[1] + 7) + 'v-9l8-6 8 6v9z', fill: 'none', stroke: '#5eead4', 'stroke-width': 2, 'stroke-linejoin': 'round' }, net);
    });
    el('circle', { cx: hub[0], cy: hub[1], r: 34, 'class': 'c-acc' }, net);
    el('path', { d: 'M284 304v-18l16-11 16 11v18zM292 304v-10h16v10', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' }, net);
    var badges = [0, 2, 3].map(function (i) {
      var g = el('g', {}, net);
      el('circle', { cx: spokes[i][0] + 18, cy: spokes[i][1] - 18, r: 11, 'class': 'c-warn' }, g);
      txt(g, spokes[i][0] + 18, spokes[i][1] - 14, 11, 't-dark', 'PO', 'middle');
      return g;
    });
    // Phone with the same numbers (step 4)
    var phone = el('g', {}, svg);
    el('rect', { x: 400, y: 150, width: 150, height: 290, rx: 22, 'class': 'c-dark' }, phone);
    el('rect', { x: 409, y: 162, width: 132, height: 266, rx: 14, 'class': 'c-screen' }, phone);
    el('rect', { x: 419, y: 176, width: 112, height: 50, rx: 8, 'class': 'c-acc' }, phone);
    txt(phone, 429, 207, 15, 't-dark', 'RM 1,273', 'start');
    for (k = 0; k < 4; k++) el('rect', { x: 419, y: 240 + k * 26, width: 112, height: 18, rx: 5, 'class': 'c-acc2', opacity: .22 + k * 0.1 }, phone);
    var spark = el('path', { d: 'M424 410 L446 396 L468 402 L490 380 L512 386 L528 368', 'class': 's-acc2' }, phone);

    return function (P, at, t) {
      tiles.forEach(function (tl, k) {
        var a = at(0, 0.15 + k * 0.12, 0.45 + k * 0.12);
        show(tl.g, a); move(tl.g, 0, (1 - ease(a)) * 18);
        var v = tl.n * ease(seg(P, 0.03 + k * 0.03, 0.2 + k * 0.03));
        tl.v.textContent = tl.money ? v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(Math.round(v));
      });
      var o1 = 1 - at(2, 0, 0.25), o2 = at(2, 0, 0.25) * (1 - at(3, 0, 0.25)), o3 = at(3, 0, 0.25);
      show(line, o1); show(bars, o2); show(net, o3);
      var draw = ease(seg(P, 0.12, 0.36));
      path.setAttribute('stroke-dashoffset', (1 - draw).toFixed(4));
      show(area, draw * 0.12);
      var idx = draw * (pts.length - 1), i0 = Math.floor(idx), i1 = Math.min(pts.length - 1, i0 + 1), f = idx - i0;
      dot.setAttribute('cx', lerp(pts[i0][0], pts[i1][0], f).toFixed(1)); dot.setAttribute('cy', lerp(pts[i0][1], pts[i1][1], f).toFixed(1));
      dot.setAttribute('r', (6 + Math.sin(t * 5) * 1.5).toFixed(1));
      bl.forEach(function (b, i) { var h = bh[i] * ease(at(2, 0.1 + i * 0.05, 0.45 + i * 0.05)); b.setAttribute('y', (400 - h).toFixed(1)); b.setAttribute('height', h.toFixed(1)); });
      warns.forEach(function (w, i) { show(w, at(2, 0.6, 0.75) * (0.6 + 0.4 * Math.sin(t * 6 + i))); });
      links.forEach(function (l, i) { show(l, at(3, 0.1 + i * 0.06, 0.3 + i * 0.06)); l.setAttribute('stroke-dashoffset', (-t * 20).toFixed(1)); });
      trucks.forEach(function (tr, i) {
        var u = ((P * 6 + t * 0.15 + i * 0.23) % 1);
        tr.setAttribute('cx', lerp(hub[0], spokes[i][0], u).toFixed(1)); tr.setAttribute('cy', lerp(hub[1], spokes[i][1], u).toFixed(1));
        show(tr, at(3, 0.3, 0.5));
      });
      badges.forEach(function (b, i) { var a = at(3, 0.5 + i * 0.1, 0.65 + i * 0.1); show(b, a); });
      var ph = at(4, 0, 0.5);
      show(phone, ph); move(phone, (1 - ease(ph)) * 160, 0);
      show(spark, 0.6 + 0.4 * Math.sin(t * 3));
    };
  };

  // ---------- Books: invoice, MyInvois, balance, reports ----------
  SCENES.books = function (svg) {
    // Invoice
    var inv = el('g', {}, svg);
    el('rect', { x: 66, y: 40, width: 250, height: 404, rx: 12, 'class': 'c-shadow' }, inv);
    el('rect', { x: 58, y: 32, width: 250, height: 404, rx: 12, 'class': 'c-paper' }, inv);
    el('rect', { x: 78, y: 52, width: 30, height: 30, rx: 7, 'class': 'c-acc' }, inv);
    el('rect', { x: 118, y: 56, width: 90, height: 8, rx: 4, 'class': 'c-paperline' }, inv);
    el('rect', { x: 118, y: 70, width: 60, height: 6, rx: 3, 'class': 'c-paperline' }, inv);
    txt(inv, 288, 66, 10, 't-dark', 'INV-2026-00001', 'end');
    el('rect', { x: 78, y: 104, width: 210, height: 1.5, 'class': 'c-paperline' }, inv);
    var rows = [];
    var amounts = [143.1, 20, 15.9, 9.5, 6.4];
    for (var k = 0; k < 5; k++) {
      el('rect', { x: 78, y: 124 + k * 34, width: 210, height: 22, rx: 4, 'class': 'c-paperline', opacity: .25 }, inv);
      rows.push([el('rect', { x: 84, y: 131 + k * 34, width: 0, height: 8, rx: 4, 'class': 'c-steel2' }, inv),
        txt(inv, 282, 139 + k * 34, 10, 't-dark', '', 'end')]);
    }
    el('rect', { x: 78, y: 304, width: 210, height: 1.5, 'class': 'c-paperline' }, inv);
    var totalT = txt(inv, 288, 334, 18, 't-dark', 'RM 0.00', 'end');
    var qr = el('g', {}, inv);
    var seed = 3;
    for (var qx = 0; qx < 7; qx++) for (var qy = 0; qy < 7; qy++) {
      seed = (seed * 9301 + 49297) % 233280;
      var edge = (qx < 2 && qy < 2) || (qx > 4 && qy < 2) || (qx < 2 && qy > 4);
      if (edge || seed / 233280 > 0.5) el('rect', { x: 80 + qx * 8, y: 366 + qy * 8, width: 7, height: 7, 'class': 'c-dark' }, qr);
    }
    var stamp = el('g', {}, svg);
    var st = el('g', { transform: 'rotate(-12 222 392)' }, stamp);
    el('rect', { x: 160, y: 366, width: 126, height: 52, rx: 10, fill: 'none', stroke: '#10b981', 'stroke-width': 4 }, st);
    el('path', { d: 'M172 392l8 8 14-16', fill: 'none', stroke: '#10b981', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, st);
    txt(st, 202, 398, 13, 't-acc', 'MyInvois');
    // JSON file flying to MyInvois (step 1)
    var cloud = el('g', {}, svg);
    el('path', { d: 'M418 150a30 30 0 0 1 4-59 40 40 0 0 1 76-8 32 32 0 0 1 22 67z', 'class': 'c-dim' }, cloud);
    el('path', { d: 'M418 150a30 30 0 0 1 4-59 40 40 0 0 1 76-8 32 32 0 0 1 22 67z', 'class': 'c-line' }, cloud);
    var cloudOk = el('g', {}, cloud);
    el('circle', { cx: 470, cy: 118, r: 18, 'class': 'c-acc' }, cloudOk);
    el('path', { d: 'M461 118l6 6 12-13', fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, cloudOk);
    var file = el('g', {}, svg);
    el('rect', { x: -20, y: -26, width: 40, height: 52, rx: 6, 'class': 'c-acc2' }, file);
    txt(file, 0, 5, 13, 't-dark', '{ }', 'middle');
    // Balance (step 2)
    var bal = el('g', {}, svg);
    el('rect', { x: 444, y: 180, width: 12, height: 200, 'class': 'c-steel2' }, bal);
    el('rect', { x: 400, y: 376, width: 100, height: 12, rx: 6, 'class': 'c-steel2' }, bal);
    var beam = el('rect', { x: 352, y: 176, width: 196, height: 8, rx: 4, 'class': 'c-steel' }, bal);
    el('circle', { cx: 450, cy: 180, r: 9, 'class': 'c-acc' }, bal);
    function pan(sign) {
      var g = el('g', {}, bal);
      el('path', { d: 'M0 0L-30 70M0 0L30 70', stroke: 'currentColor', 'stroke-width': 1.5, 'class': 'ps-ico' }, g);
      el('path', { d: 'M-40 70h80a40 16 0 0 1-80 0z', 'class': 'c-steel2' }, g);
      txt(g, 0, 104, 18, 't-ink', sign, 'middle');
      var coins = [];
      for (var i = 0; i < 5; i++) coins.push(el('ellipse', { cx: (i % 3 - 1) * 16, cy: 62 - Math.floor(i / 3) * 8, rx: 9, ry: 5, 'class': sign === '+' ? 'c-acc' : 'c-red' }, g));
      return { g: g, coins: coins };
    }
    var inPan = pan('+'), outPan = pan('−');
    // Report (step 3)
    var rep = el('g', {}, svg);
    el('rect', { x: 344, y: 60, width: 220, height: 330, rx: 14, 'class': 'c-panel' }, rep);
    el('rect', { x: 362, y: 80, width: 90, height: 8, rx: 4, 'class': 'c-mut2' }, rep);
    var rb = [['c-acc', 200], ['c-red', 120], ['c-acc2', 80]].map(function (b, i) { return [el('rect', { x: 374 + i * 62, y: 330, width: 40, height: 0, rx: 6, 'class': b[0] }, rep), b[1]]; });
    el('rect', { x: 362, y: 336, width: 184, height: 1.5, 'class': 'c-mut2' }, rep);
    var chips = el('g', {}, rep);
    ['SST', 'PDF', 'CSV'].forEach(function (s, i) {
      el('rect', { x: 362 + i * 62, y: 350, width: 52, height: 24, rx: 12, 'class': 'c-dim' }, chips);
      txt(chips, 388 + i * 62, 366, 11, 't-ink', s, 'middle');
    });

    return function (P, at, t) {
      var sum = 0;
      rows.forEach(function (r, k) {
        var a = seg(P, 0.04 + k * 0.04, 0.09 + k * 0.04);
        r[0].setAttribute('width', (a * (70 + (k * 29) % 60)).toFixed(1));
        r[1].textContent = a >= 1 ? amounts[k].toFixed(2) : '';
        if (a >= 1) sum += amounts[k];
      });
      totalT.textContent = rm(sum);
      var fly = at(1, 0.1, 0.55);
      var fx = lerp(190, 470, ease(fly)), fy = lerp(330, 118, ease(fly)) - Math.sin(fly * Math.PI) * 60;
      move(file, fx, fy, ' scale(' + (1 - fly * 0.4).toFixed(3) + ')');
      show(file, fly > 0 && fly < 1 ? 1 : 0);
      var cl = 1 - at(2, 0, 0.2);
      show(cloud, Math.min(1, 0.35 + at(1, 0, 0.15)) * cl);
      popIn(cloudOk, at(1, 0.55, 0.7), 470, 118);
      var sa = at(1, 0.7, 0.9);
      stamp.style.transformOrigin = '222px 392px';
      stamp.style.transform = 'scale(' + (2.4 - 1.4 * ease(sa)).toFixed(3) + ')';
      show(stamp, sa);
      show(qr, at(1, 0.85, 1));
      // Balance: money in, money out, level at the end
      var b = at(2, 0, 0.2) * (1 - at(3, 0, 0.2));
      show(bal, b);
      var nin = Math.round(at(2, 0.15, 0.55) * 5), nout = Math.round(at(2, 0.35, 0.8) * 5);
      inPan.coins.forEach(function (c, i) { show(c, i < nin ? 1 : 0); });
      outPan.coins.forEach(function (c, i) { show(c, i < nout ? 1 : 0); });
      var ang = clamp((nout - nin) * 4, -14, 14) + Math.sin(t * 2) * (nin === nout ? 0.3 : 1.2);
      var rad = ang * Math.PI / 180;
      beam.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ' 450 180)');
      move(inPan.g, 450 - Math.cos(rad) * 92, 180 - Math.sin(rad) * 92);
      move(outPan.g, 450 + Math.cos(rad) * 92, 180 + Math.sin(rad) * 92);
      // Report
      show(rep, at(3, 0.05, 0.3));
      rb.forEach(function (r, i) { var h = r[1] * ease(at(3, 0.2 + i * 0.12, 0.55 + i * 0.12)); r[0].setAttribute('y', (330 - h).toFixed(1)); r[0].setAttribute('height', h.toFixed(1)); });
      show(chips, at(4, 0.05, 0.4));
    };
  };

  // ---------- driver ----------
  var build = SCENES[root.getAttribute('data-scene')];
  if (!build) return;
  var N = Number(root.getAttribute('data-steps')) || 5;
  // Where on each scene's timeline to freeze it: the point that shows the most at once
  var POSE = { pos: 0.3, 'barcode-scan': 0.3, wms: 0.3, 'every-data': 0.3, books: 0.3 };
  var now = POSE[root.getAttribute('data-scene')];
  var svg = el('svg', { 'class': 'ps-svg', viewBox: '0 0 600 480', 'aria-hidden': 'true', focusable: 'false' });
  root.querySelector('.pstory-scene').appendChild(svg);
  function at(step, a, b) { return seg(now * N - step, a, b); }
  build(svg)(now, at, 0);
})();
