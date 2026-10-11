// Homepage scroll animations: one account, screens tabs, who it's for, getting started.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function ease(x) { return x * x * (3 - 2 * x); }
  var vh = window.innerHeight, vw = window.innerWidth;

  // Pin a section for `screens` viewport heights of scrolling when there's room for it
  function pinner(sec, screens, minH) {
    return {
      sec: sec,
      layout: function () {
        var on = !reduceMotion && vw > 900 && vh >= minH;
        sec.classList.toggle('is-pinned', on);
        sec.style.height = on ? (vh * (1 + screens)) + 'px' : '';
        this.on = on;
      },
      // 0..1 while pinned; otherwise how far the section has come into view
      progress: function () {
        var r = sec.getBoundingClientRect();
        if (this.on) return clamp(-r.top / (r.height - vh), 0, 1);
        return clamp((vh * 0.85 - r.top) / (r.height * 0.8 + vh * 0.2), 0, 1);
      },
    };
  }
  var parts = [];

  // ---------- One account ----------
  var oaSec = document.querySelector('.oa');
  if (oaSec) (function () {
    var pin = pinner(oaSec, 1.6, 680);
    var stage = oaSec.querySelector('.oa-stage'), card = oaSec.querySelector('.oa-card');
    var svg = oaSec.querySelector('.oa-lines');
    var nodes = Array.prototype.slice.call(oaSec.querySelectorAll('.oa-node'));
    var price = oaSec.querySelector('.oa-price'), qty = oaSec.querySelector('.oa-qty'), low = oaSec.querySelector('.oa-low');
    var links = [], centre = [0, 0];
    function draw() {
      svg.textContent = '';
      var s = stage.getBoundingClientRect(), c = card.getBoundingClientRect();
      centre = [c.left - s.left + c.width / 2, c.top - s.top + c.height / 2];
      links = nodes.map(function (n) {
        n.style.transform = '';
        var r = n.getBoundingClientRect();
        var p = [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
        var ln = document.createElementNS(NS, 'line');
        ln.setAttribute('class', 'ln');
        ln.setAttribute('x1', p[0]); ln.setAttribute('y1', p[1]); ln.setAttribute('x2', centre[0]); ln.setAttribute('y2', centre[1]);
        svg.appendChild(ln);
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('class', 'pulse'); dot.setAttribute('r', 5);
        svg.appendChild(dot);
        return { node: n, p: p, ln: ln, dot: dot };
      });
    }
    var state = {};
    parts.push({
      layout: function () { pin.layout(); draw(); },
      update: function () {
        var p = pin.progress();
        links.forEach(function (l, k) {
          // Fly in from outside, then wire up
          var a = ease(seg(p, 0.04 + k * 0.05, 0.26 + k * 0.05));
          var dx = (l.p[0] - centre[0]), dy = (l.p[1] - centre[1]), len = Math.hypot(dx, dy) || 1;
          var far = (1 - a) * 260;
          l.node.style.transform = 'translate(' + (dx / len * far).toFixed(1) + 'px,' + (dy / len * far).toFixed(1) + 'px) rotate(' + ((1 - a) * (k % 2 ? 40 : -40)).toFixed(1) + 'deg)';
          l.node.style.opacity = a.toFixed(3);
          l.ln.style.opacity = seg(p, 0.2 + k * 0.05, 0.32 + k * 0.05).toFixed(3);
          // Price change, then stock change, pulse out from the item to each app
          var u1 = seg(p, 0.5, 0.68), u2 = k === 0 || k === 4 ? 0 : seg(p, 0.8, 0.95);
          var u = u2 > 0 ? u2 : u1;
          var live = (u1 > 0 && u1 < 1) || (u2 > 0 && u2 < 1);
          l.dot.setAttribute('cx', (centre[0] + dx * u).toFixed(1));
          l.dot.setAttribute('cy', (centre[1] + dy * u).toFixed(1));
          l.dot.style.opacity = live ? 1 : 0;
          var hit = (u1 >= 1 && p < 0.78) || u2 >= 1;
          l.node.classList.toggle('hit', hit);
          l.ln.classList.toggle('on', u1 > 0);
        });
        var changed = p >= 0.48, sold = p >= 0.8;
        if (changed !== state.changed) {
          state.changed = changed;
          price.textContent = changed ? 'RM 17.50' : 'RM 16.90';
          price.classList.toggle('flash', changed);
        }
        if (sold !== state.sold) {
          state.sold = sold;
          qty.textContent = sold ? '19' : '20';
          qty.classList.toggle('flash', sold);
          low.classList.toggle('flash', sold);
        }
      },
    });
  })();

  // ---------- Screens: scroll flips through the tabs ----------
  var scr = document.querySelector('.scr-pin');
  if (scr) (function () {
    var pin = pinner(scr, 3, 680);
    var tabs = Array.prototype.slice.call(scr.querySelectorAll('[role="tab"]'));
    var fills = tabs.map(function (t) { var i = document.createElement('i'); i.className = 'tab-fill'; i.setAttribute('aria-hidden', 'true'); t.appendChild(i); return i; });
    var current = 0;
    function select(k) {
      tabs.forEach(function (t, j) {
        var on = j === k;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) { panel.classList.remove('is-enter'); void panel.offsetWidth; panel.classList.add('is-enter'); }
      });
      current = k;
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () {
        if (!pin.on) return;
        var top = scr.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (k + 0.08) / tabs.length * (scr.offsetHeight - vh), behavior: 'smooth' });
      });
    });
    parts.push({
      layout: function () { pin.layout(); },
      update: function () {
        if (!pin.on) return;
        var f = pin.progress() * tabs.length, k = Math.min(tabs.length - 1, Math.floor(f));
        var shown = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
        if (k !== shown) select(k);
        fills.forEach(function (i, j) { i.style.transform = 'scaleX(' + (j === k ? clamp(f - k, 0, 1) : 0).toFixed(3) + ')'; });
      },
    });
  })();

  // ---------- Who it's for: the deck fans out ----------
  var fan = document.querySelector('.fan');
  if (fan) (function () {
    var cards = Array.prototype.slice.call(fan.children);
    var on = false, offs = [];
    var ROT = [-9, -3, 3, 9];
    parts.push({
      layout: function () {
        on = !reduceMotion && vw > 860;
        cards.forEach(function (c) { c.style.transform = ''; });
        if (!on) return;
        var mid = fan.offsetWidth / 2;
        offs = cards.map(function (c) { c.setAttribute('data-in', ''); return mid - (c.offsetLeft + c.offsetWidth / 2); });
      },
      update: function () {
        if (!on) return;
        var r = fan.getBoundingClientRect();
        var e = ease(clamp((vh * 0.92 - r.top) / (vh * 0.5), 0, 1)), k = 1 - e;
        cards.forEach(function (c, i) {
          c.style.transform = 'translate(' + (offs[i] * k).toFixed(1) + 'px,' + (k * 40).toFixed(1) + 'px) rotate(' + (ROT[i] * k).toFixed(2) + 'deg) scale(' + (1 - k * 0.08).toFixed(3) + ')';
        });
      },
    });
  })();

  // ---------- Getting started: cart rides the track ----------
  var gs = document.querySelector('.gs-steps');
  if (gs) (function () {
    var track = document.querySelector('.gs-track');
    var bar = track.querySelector('i'), cart = track.querySelector('.gs-cart'), dots = track.querySelectorAll('span');
    var cards = Array.prototype.slice.call(gs.children);
    parts.push({
      layout: function () {},
      update: function () {
        var r = gs.getBoundingClientRect();
        var p = clamp((vh * 0.8 - r.top) / (vh * 0.45), 0, 1);
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        cart.style.left = (p * 100).toFixed(2) + '%';
        cards.forEach(function (c, i) {
          var lit = p > 0.02 && p >= i * 0.5 - 0.01;
          c.classList.toggle('is-lit', lit);
          if (dots[i]) dots[i].classList.toggle('on', lit);
        });
      },
    });
  })();

  var queued = false;
  function update() { queued = false; parts.forEach(function (p) { p.update(); }); }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function layout() { vh = window.innerHeight; vw = window.innerWidth; parts.forEach(function (p) { p.layout(); }); update(); }
  layout();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
