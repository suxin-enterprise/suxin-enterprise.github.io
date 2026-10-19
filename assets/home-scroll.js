// Homepage: draws the static connector lines in the "one account" diagram. No animation.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  var oaSec = document.querySelector('.oa');
  if (!oaSec) return;
  var stage = oaSec.querySelector('.oa-stage'), card = oaSec.querySelector('.oa-card');
  var svg = oaSec.querySelector('.oa-lines');
  var nodes = Array.prototype.slice.call(oaSec.querySelectorAll('.oa-node'));

  // One solid line from each app tile to the item record in the middle
  function draw() {
    svg.textContent = '';
    var s = stage.getBoundingClientRect(), c = card.getBoundingClientRect();
    var cx = c.left - s.left + c.width / 2, cy = c.top - s.top + c.height / 2;
    nodes.forEach(function (n) {
      var r = n.getBoundingClientRect();
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('class', 'ln on');
      ln.setAttribute('x1', r.left - s.left + r.width / 2); ln.setAttribute('y1', r.top - s.top + r.height / 2);
      ln.setAttribute('x2', cx); ln.setAttribute('y2', cy);
      svg.appendChild(ln);
    });
  }
  draw();
  window.addEventListener('resize', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
