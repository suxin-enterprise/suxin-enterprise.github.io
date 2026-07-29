(function () {
  "use strict";

  var services = {
    wms: {
      title: "WMS — Warehouse Management",
      longDescription: "Track stock in real time across bins, zones, and locations. Manage receiving, picking, packing, and cycle counts with barcode scanning built in — so you always know what's on hand and where, and never oversell what you don't have.",
      bullets: ["Real-time inventory tracking", "Barcode & RF scanning", "Automated pick & pack workflows", "Low-stock & reorder alerts"],
      coverClass: "cover-blue",
      icon: { className: "icon-swatch swatch-blue" },
    },
    tms: {
      title: "TMS — Transportation Management",
      longDescription: "Plan routes, dispatch drivers, and track deliveries from a single dashboard. Cut fuel costs and missed windows with smarter routing and live shipment visibility for you and your customers.",
      bullets: ["Route planning & optimization", "Live driver & fleet tracking", "Proof-of-delivery capture", "Freight cost reporting"],
      coverClass: "cover-cyan",
      icon: { className: "icon-swatch swatch-cyan icon-rect" },
    },
    pos: {
      title: "POS — Point of Sale",
      longDescription: "A fast, reliable checkout for retail and F&B counters. Ring up sales, take payments, and sync stock automatically, so every sale updates inventory in real time across every till and location.",
      bullets: ["Fast checkout & multi-payment support", "Real-time stock sync", "Staff shifts & till reconciliation", "Daily sales reporting"],
      coverClass: "cover-green",
      icon: { className: "icon-swatch swatch-green icon-circle" },
    },
    trading: {
      title: "Trading Analyser",
      longDescription: "A dashboard that watches markets and your positions together — flags patterns, tracks P&L, and surfaces the signals that matter instead of drowning you in charts and tabs.",
      bullets: ["Live market & position tracking", "Automated signal & pattern alerts", "P&L and risk reporting", "Custom watchlists"],
      coverClass: "cover-violet",
      icon: { className: "icon-swatch icon-chart" },
    },
    bot: {
      title: "AI Agent — WhatsApp Support",
      longDescription: "An AI agent that lives in your client WhatsApp groups — reads the full conversation, checks your docs and order data, and replies with real answers instead of a canned response. Escalates to a human when it should.",
      bullets: ["Understands full conversation context", "Pulls answers from your own data", "Escalates to a human when needed", "Works directly inside WhatsApp groups"],
      coverClass: "cover-teal",
      icon: { className: "icon-swatch swatch-teal icon-bubble" },
    },
    quote: {
      title: "Quotation Builder — for Contractors",
      longDescription: "Save your standard items once — \"Wiring point — RM80/point\", \"Plaster ceiling — RM5.50/sqft\" — then build a full quote on-site in about two minutes. Auto-totalled by section, with discounts and deposit terms. Sent as a professional PDF, with your logo, SSM number and bank details, straight over WhatsApp. Accepted quotes convert to invoices, deposits to receipts, and job milestones to progress claims (40% deposit, 40% mid, 20% completion) — all with one tap.",
      bullets: ["Reusable item library with saved pricing", "2-minute quotes with sections & deposits", "Professional PDF sent via WhatsApp", "One-tap quote → invoice → receipt", "Live dashboard of quotes sent & paid"],
      coverClass: "cover-orange",
      icon: { className: "icon-swatch swatch-orange icon-square-outline" },
    },
  };

  var overlay = document.getElementById("service-overlay");
  var modalCover = document.getElementById("modal-cover");
  var modalIcon = document.getElementById("modal-icon");
  var modalTitle = document.getElementById("modal-title");
  var modalDesc = document.getElementById("modal-desc");
  var modalBullets = document.getElementById("modal-bullets");
  var modalClose = document.getElementById("modal-close");

  function openService(id) {
    var s = services[id];
    if (!s) return;
    modalCover.className = "modal-cover " + s.coverClass;
    modalIcon.className = s.icon.className;
    modalTitle.textContent = s.title;
    modalDesc.textContent = s.longDescription;
    modalBullets.innerHTML = "";
    s.bullets.forEach(function (b) {
      var li = document.createElement("li");
      li.textContent = b;
      modalBullets.appendChild(li);
    });
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeService() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".service-card").forEach(function (card) {
    card.addEventListener("click", function () {
      openService(card.getAttribute("data-service"));
    });
  });

  overlay.addEventListener("click", closeService);
  overlay.querySelector(".modal").addEventListener("click", function (e) {
    e.stopPropagation();
  });
  modalClose.addEventListener("click", closeService);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) closeService();
  });

  var form = document.getElementById("demo-form");
  var submitBtn = document.getElementById("submit-btn");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitBtn.textContent = "Thanks — we'll be in touch";
    submitBtn.disabled = true;
  });
})();
