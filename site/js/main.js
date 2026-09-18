/* ============================================================
   MYSTIC MANUEVERS — scroll-driven animation system
   Lenis smooth scroll + GSAP ScrollTrigger, in the spirit of
   Shopify Editions: pinned scenes, layered parallax, staggered
   text reveals, counters and a horizontal gallery.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  /* Graceful degradation: if CDNs fail, show everything. */
  if (!hasGsap) {
    document.documentElement.classList.add("gsap-off");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (typeof window.SplitText !== "undefined") gsap.registerPlugin(SplitText);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- anchor scrolling ---------- */
  document.querySelectorAll("[data-scroll-to]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  if (reduceMotion) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    return;
  }

  /* ---------- scroll progress bar ---------- */
  var progressBar = document.querySelector(".progress__bar");
  if (progressBar) {
    gsap.to(progressBar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.4 }
    });
  }

  /* ---------- hero entrance ---------- */
  var heroTitle = document.querySelector(".hero__title");
  if (heroTitle && typeof window.SplitText !== "undefined") {
    var heroSplit = new SplitText(heroTitle, { type: "chars", charsClass: "char" });
    gsap.from(heroSplit.chars, {
      yPercent: 110,
      opacity: 0,
      rotateX: -50,
      transformOrigin: "50% 100%",
      duration: 1.1,
      ease: "power4.out",
      stagger: 0.035,
      delay: 0.25
    });
  }
  gsap.from("[data-hero-fade]", {
    opacity: 0, y: 26, duration: 1.1, ease: "power3.out", stagger: 0.18, delay: 0.7
  });
  gsap.from("[data-hero-hex]", {
    opacity: 0, scale: 0.6, rotate: -30, duration: 1.6, ease: "power3.out", delay: 0.1
  });

  /* Hero hex: slow idle spin only — no scroll fade (it read as a glitch) */
  var heroHex = document.querySelector("[data-hero-hex]");
  if (heroHex) {
    gsap.to(heroHex, { rotate: 360, duration: 90, ease: "none", repeat: -1 });
  }

  /* ---------- layered parallax ---------- */
  document.querySelectorAll("[data-parallax]").forEach(function (layer) {
    var depth = parseFloat(layer.getAttribute("data-parallax")) || 0.3;
    gsap.fromTo(layer, { yPercent: -depth * 30 }, {
      yPercent: depth * 30,
      ease: "none",
      scrollTrigger: {
        trigger: layer.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

  /* ---------- section titles: word-by-word reveal ---------- */
  if (typeof window.SplitText !== "undefined") {
    document.querySelectorAll("[data-split]").forEach(function (title) {
      if (title.classList.contains("hero__title")) return; // hero handled above
      var split = new SplitText(title, { type: "words", wordsClass: "word" });
      gsap.from(split.words, {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
        scrollTrigger: { trigger: title, start: "top 85%", once: true }
      });
    });
  }

  /* ---------- generic reveals ---------- */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 88%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1, y: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        overwrite: true
      });
    }
  });

  /* ---------- stat counters ---------- */
  document.querySelectorAll("[data-count]").forEach(function (num) {
    var end = parseInt(num.getAttribute("data-count"), 10);
    var prefix = num.getAttribute("data-prefix") || "";
    var state = { value: 0 };
    ScrollTrigger.create({
      trigger: num,
      start: "top 88%",
      once: true,
      onEnter: function () {
        gsap.to(state, {
          value: end,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: function () {
            num.textContent = prefix + Math.round(state.value);
          }
        });
      }
    });
  });

  /* ---------- horizontal creature gallery (pinned on desktop) ---------- */
  var gallery = document.querySelector("[data-gallery]");
  var track = document.querySelector("[data-gallery-track]");
  if (gallery && track) {
    ScrollTrigger.matchMedia({
      "(min-width: 769px)": function () {
        var cards = gsap.utils.toArray(track.children);
        var distance = function () { return track.scrollWidth - window.innerWidth; };

        /* cards fade/rise into place as they cross into the viewport */
        gsap.set(cards, { opacity: 0, y: 28 });
        var revealVisible = function () {
          var d = 0;
          cards.forEach(function (card) {
            if (card.dataset.seen) return;
            if (card.getBoundingClientRect().left < window.innerWidth - 40) {
              card.dataset.seen = "1";
              gsap.to(card, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: d });
              d += 0.08;
            }
          });
        };
        ScrollTrigger.create({
          trigger: gallery, start: "top 85%", once: true,
          onEnter: revealVisible
        });
        gsap.to(track, {
          x: function () { return -distance(); },
          ease: "none",
          scrollTrigger: {
            trigger: gallery,
            start: "top top",
            end: function () { return "+=" + distance(); },
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: revealVisible
          }
        });

        return function () {
          /* matchMedia cleanup: restore plain cards for mobile */
          cards.forEach(function (card) { delete card.dataset.seen; });
          gsap.set(cards, { clearProps: "opacity,transform" });
        };
      }
    });
  }

  /* ---------- biome cards: organic clip reveal ---------- */
  document.querySelectorAll(".biome-card").forEach(function (card, i) {
    gsap.fromTo(card,
      { clipPath: "inset(12% 6% 12% 6% round 24px)", opacity: 0.001, y: 60 },
      {
        clipPath: "inset(0% 0% 0% 0% round 16px)",
        opacity: 1, y: 0,
        duration: 1.15,
        ease: "power3.out",
        delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: card, start: "top 88%", once: true }
      });
  });

  /* ---------- win section: connected hex grid ---------- */
  var hexgrid = document.querySelector("[data-hexgrid]");
  if (hexgrid) {
    var SIZE = 26;
    /* the highlighted winning chain: "q,r" -> fill opacity (some faded, some less) */
    var chain = { "-2,0": 0.55, "-1,0": 0.75, "-1,-1": 0.5, "0,-1": 0.85, "0,0": 1, "1,-1": 0.65, "1,0": 0.9 };
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "-120 -125 240 250");
    svg.setAttribute("class", "hexgrid");
    for (var q = -2; q <= 2; q++) {
      for (var r = -2; r <= 2; r++) {
        if (Math.abs(q + r) > 2) continue;
        var cx = SIZE * 1.5 * q;
        var cy = SIZE * Math.sqrt(3) * (r + q / 2);
        var pts = [];
        for (var k = 0; k < 6; k++) {
          var ang = Math.PI / 180 * (60 * k);
          pts.push((cx + SIZE * Math.cos(ang)).toFixed(1) + "," + (cy + SIZE * Math.sin(ang)).toFixed(1));
        }
        var poly = document.createElementNS(ns, "polygon");
        poly.setAttribute("points", pts.join(" "));
        var key = q + "," + r;
        if (Object.prototype.hasOwnProperty.call(chain, key)) {
          poly.setAttribute("class", "hexgrid__cell hexgrid__cell--win");
          poly.style.fillOpacity = chain[key];
        } else {
          poly.setAttribute("class", "hexgrid__cell");
        }
        svg.appendChild(poly);
      }
    }
    hexgrid.appendChild(svg);
    gsap.from(svg.children, {
      opacity: 0, scale: 0.4, transformOrigin: "50% 50%",
      duration: 0.7, ease: "back.out(1.7)", stagger: 0.045,
      scrollTrigger: { trigger: hexgrid, start: "top 85%", once: true }
    });
  }

  /* ---------- win section: dramatic quote ---------- */
  var check = document.querySelector(".win__check");
  if (check) {
    gsap.fromTo(check,
      { scale: 0.85, opacity: 0, letterSpacing: "0.2em" },
      {
        scale: 1, opacity: 1, letterSpacing: "0.02em",
        duration: 1.4, ease: "power3.out",
        scrollTrigger: { trigger: check, start: "top 82%", once: true }
      });
  }

  /* Keep triggers honest once media has loaded */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* TEMP-QA: headless scroll hook */
  var qaJump = new URLSearchParams(location.search).get("jump");
  if (qaJump) {
    setTimeout(function () {
      if (lenis && lenis.destroy) lenis.destroy();
      var t = null;
      try { t = document.querySelector(qaJump); } catch (e) { t = null; }
      window.scrollTo(0, t ? t.getBoundingClientRect().top + window.pageYOffset : parseInt(qaJump, 10) || 0);
    }, 500);
  }
})();

/* ============================================================
   BATTLE SIMULATOR — animated rules explainer (Elite vs Demon)
   Self-contained: the board builds with plain DOM for everyone;
   GSAP motion and 3D dice layer on when appropriate.
   ============================================================ */
(function () {
  "use strict";

  var sim = document.querySelector("[data-battle-sim]");
  if (!sim) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var ns = "http://www.w3.org/2000/svg";

  var board = sim.querySelector("[data-battle-board]");
  var tray = sim.querySelector("[data-dice-tray]");
  var captionEl = sim.querySelector("[data-step-caption]");
  var dotsWrap = sim.querySelector("[data-step-dots]");
  var controls = sim.querySelector(".battle-sim__controls");

  var DUR = 1; /* duration scale — shrink for debugging */

  /* ---------- hex math (flat-top axial, same family as the win grid) ---------- */
  var SIZE = 26;
  var SQRT3 = Math.sqrt(3);
  function hexCenter(q, r) { return { x: SIZE * 1.5 * q, y: SIZE * SQRT3 * (r + q / 2) }; }
  function hexPoints(cx, cy) {
    var pts = [];
    for (var k = 0; k < 6; k++) {
      var ang = Math.PI / 180 * (60 * k);
      pts.push((cx + SIZE * Math.cos(ang)).toFixed(1) + "," + (cy + SIZE * Math.sin(ang)).toFixed(1));
    }
    return pts.join(" ");
  }
  function key(q, r) { return q + "," + r; }

  /* ---------- board model ---------- */
  var DEMON_HOME = { q: 0, r: 0 };
  var ELITE_HOME = { q: 1, r: 0 };
  var RETREAT_CELL = { q: 2, r: 0 };
  var CELLS = [
    { q: 0, r: 0 }, { q: 1, r: 0 },
    { q: 2, r: 0 }, { q: 2, r: -1 }, { q: 1, r: 1 },   /* adjacent AND further from the Demon: valid retreats */
    { q: 1, r: -1 }, { q: 0, r: 1 },                  /* adjacent but same distance: not valid */
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: -1, r: 1 } /* behind the Demon: map context */
  ];
  var RETREAT_KEYS = ["2,0", "2,-1", "1,1"];
  var SAME_KEYS = ["1,-1", "0,1"];

  var cellMap = {};
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  CELLS.forEach(function (cell) {
    var c = hexCenter(cell.q, cell.r);
    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
    var poly = document.createElementNS(ns, "polygon");
    poly.setAttribute("points", hexPoints(c.x, c.y));
    poly.setAttribute("class", "sim-hex");
    board.appendChild(poly);
    cellMap[key(cell.q, cell.r)] = { poly: poly, cx: c.x, cy: c.y, mark: null };
  });
  var PAD = 40;
  board.setAttribute("viewBox",
    (minX - PAD) + " " + (minY - PAD) + " " + (maxX - minX + PAD * 2) + " " + (maxY - minY + PAD * 2));

  function setHexClass(q, r, cls) {
    cellMap[key(q, r)].poly.setAttribute("class", "sim-hex" + (cls ? " " + cls : ""));
  }
  function addMark(q, r, glyph) {
    var cell = cellMap[key(q, r)];
    if (cell.mark) return;
    var t = document.createElementNS(ns, "text");
    t.setAttribute("class", "sim-mark");
    t.setAttribute("x", cell.cx);
    t.setAttribute("y", cell.cy + 5);
    t.textContent = glyph;
    board.appendChild(t);
    cell.mark = t;
  }
  function hideMarks() {
    Object.keys(cellMap).forEach(function (k) {
      var mk = cellMap[k].mark;
      if (mk) { mk.remove(); cellMap[k].mark = null; }
    });
  }

  /* ---------- tokens ---------- */
  function makeToken(cls, label, r) {
    var g = document.createElementNS(ns, "g");
    g.setAttribute("class", "sim-token " + cls);
    /* ownership orientation: the Demon's card is rotated 60° — cards face
       their owner, so the two battle cards must read as different players */
    g.__rot = cls.indexOf("demon") !== -1 ? 60 : 0;
    if (cls.indexOf("blocker") !== -1) {
      /* blockers stay simple pips */
      var cir = document.createElementNS(ns, "circle");
      cir.setAttribute("r", r || 13);
      var bt = document.createElementNS(ns, "text");
      bt.setAttribute("y", 5);
      bt.textContent = label;
      g.appendChild(cir);
      g.appendChild(bt);
    } else {
      /* creature tokens are miniature cards — the same visual language as
         the setup/action sims: rounded rect, hex pip up top, initial below */
      var W = 24, H = 32;
      var rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", -W / 2); rect.setAttribute("y", -H / 2);
      rect.setAttribute("width", W); rect.setAttribute("height", H);
      rect.setAttribute("rx", 4);
      rect.setAttribute("class", "sim-token__card");
      g.appendChild(rect);
      var pp = [];
      for (var k = 0; k < 6; k++) {
        var ang = Math.PI / 180 * (60 * k);
        pp.push((3.6 * Math.cos(ang)).toFixed(1) + "," + (-9 + 3.6 * Math.sin(ang)).toFixed(1));
      }
      var pip = document.createElementNS(ns, "polygon");
      pip.setAttribute("points", pp.join(" "));
      pip.setAttribute("class", "sim-token__pip");
      g.appendChild(pip);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("y", 8.5);
      t.textContent = label;
      g.appendChild(t);
    }
    board.appendChild(g);
    if (hasGsap && !reduceMotion) {
      /* set the transform origin ONCE — changing it later (e.g. after a
         scale:0 hide) leaves GSAP's SVG transform cache with a stale
         compensation offset and the token renders off-centre */
      gsap.set(g, { transformOrigin: "50% 50%", rotation: g.__rot });
    }
    return g;
  }
  var demonToken = makeToken("sim-token--demon", "D");
  var eliteToken = makeToken("sim-token--elite", "E");
  var blockers = [makeToken("sim-token--blocker", "✕", 13), makeToken("sim-token--blocker", "✕", 13)];

  function place(token, q, r) {
    var cell = cellMap[key(q, r)];
    if (hasGsap && !reduceMotion) {
      gsap.set(token, { x: cell.cx, y: cell.cy, scale: 1, opacity: 1 });
    } else {
      token.setAttribute("transform", "translate(" + cell.cx + "," + cell.cy + ")" + (token.__rot ? " rotate(" + token.__rot + ")" : ""));
    }
  }
  function hideToken(token) {
    if (hasGsap && !reduceMotion) gsap.set(token, { opacity: 0 }); /* opacity only — never scale */
    else token.setAttribute("display", "none");
  }
  function hideBlockers() { blockers.forEach(hideToken); }
  function resetHexes() {
    CELLS.forEach(function (cl) { setHexClass(cl.q, cl.r, ""); });
    hideMarks();
    hideBlockers();
  }

  /* ---------- die faces (overlay chips + flat fallback dice) ---------- */
  var PIPS = {
    1: [[12, 12]],
    2: [[8, 8], [16, 16]],
    3: [[8, 8], [12, 12], [16, 16]],
    4: [[8, 8], [16, 8], [8, 16], [16, 16]],
    5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]],
    6: [[8, 7.5], [16, 7.5], [8, 12], [16, 12], [8, 16.5], [16, 16.5]]
  };
  function setDie(svg, value) {
    if (!svg) return;
    svg.querySelectorAll("circle").forEach(function (c) { c.remove(); });
    (PIPS[value] || PIPS[1]).forEach(function (p) {
      var cir = document.createElementNS(ns, "circle");
      cir.setAttribute("cx", p[0]);
      cir.setAttribute("cy", p[1]);
      cir.setAttribute("r", 1.9);
      svg.appendChild(cir);
    });
  }
  var eliteDie = document.querySelector('[data-die="elite"]');
  var demonDie = document.querySelector('[data-die="demon"]');
  var eliteTotalEl = document.querySelector('[data-total="elite"]');
  var demonTotalEl = document.querySelector('[data-total="demon"]');
  function updateChips(elite, demon) {
    setDie(eliteDie, elite);
    setDie(demonDie, demon);
    if (eliteTotalEl) eliteTotalEl.textContent = elite + 2;
    if (demonTotalEl) demonTotalEl.textContent = demon + 3;
  }

  /* ---------- initial layout (all modes) ---------- */
  place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
  place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
  hideBlockers();
  captionEl.textContent = "The battle plays out here as you reach it.";

  /* ---------- static fallback: no GSAP or reduced motion ---------- */
  if (!hasGsap || reduceMotion) {
    tray.style.display = "none";
    controls.style.display = "none";
    setHexClass(ELITE_HOME.q, ELITE_HOME.r, "sim-hex--vacated");
    place(eliteToken, RETREAT_CELL.q, RETREAT_CELL.r);
    place(demonToken, ELITE_HOME.q, ELITE_HOME.r);
    captionEl.textContent = "The Demon wins by 2 — less than 4: the Elite retreats to an adjacent tile further from the Demon, and the Demon advances into the vacated tile.";
    return;
  }

  /* ---------- 3D dice (lazy) ---------- */
  var diceBox = null, diceInit = null;
  function loadDice() {
    if (diceInit) return diceInit;
    diceInit = import("/vendor/dice-box/dice-box.es.min.js").then(function (mod) {
      var DiceBox = mod.default;
      diceBox = new DiceBox({
        container: "[data-dice-tray]",
        assetPath: "/assets/dice-box/",
        theme: "default",
        themeColor: "#c9a24b",
        scale: 8,
        throwForce: 3.2,
        spinForce: 2.4,
        lightIntensity: 1.15,
        offscreen: false
      });
      return diceBox.init();
    }).catch(function () { diceBox = null; });
    return diceInit;
  }
  /* team colors — match the board tokens */
  var ELITE_COLOR = "#f6ecc9"; /* ivory */
  var DEMON_COLOR = "#2a2118"; /* near-black umber */

  function rollValues() {
    if (!diceBox) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (groups) {
        if (done) return;
        done = true;
        var elite = null, demon = null, positional = [];
        (groups || []).forEach(function (g) {
          var rolls = g && g.rolls ? g.rolls : (g && typeof g.value === "number" ? [g] : []);
          rolls.forEach(function (r) {
            if (typeof r.value !== "number") return;
            positional.push(r.value);
            var col = (r.themeColor || "").toLowerCase();
            if (col === ELITE_COLOR) elite = r.value;
            else if (col === DEMON_COLOR) demon = r.value;
          });
        });
        if (elite === null && positional.length >= 1) elite = positional[0];
        if (demon === null && positional.length >= 2) demon = positional[1];
        resolve(elite !== null && demon !== null ? { elite: elite, demon: demon } : null);
      };
      diceBox.onRollComplete = finish;
      try {
        var p = diceBox.roll([
          { qty: 1, sides: 6, themeColor: ELITE_COLOR },
          { qty: 1, sides: 6, themeColor: DEMON_COLOR }
        ]);
        if (p && p.then) p.then(finish, function () { finish(null); });
      } catch (e) { finish(null); }
      setTimeout(function () { finish(null); }, 12000); /* safety net */
    });
  }

  /* flat fallback dice when the 3D tray is unavailable */
  var trayDice = null;
  function buildTrayDice() {
    if (trayDice) return;
    trayDice = [];
    tray.classList.add("battle-sim__dice--flat");
    for (var i = 0; i < 2; i++) {
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", "battle-sim__flatdie battle-sim__flatdie--" + (i === 0 ? "elite" : "demon"));
      var rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", 2); rect.setAttribute("y", 2);
      rect.setAttribute("width", 20); rect.setAttribute("height", 20); rect.setAttribute("rx", 4.5);
      svg.appendChild(rect);
      tray.appendChild(svg);
      setDie(svg, 4 + i);
      trayDice.push(svg);
    }
  }
  function shuffleTrayDice(ms) {
    return new Promise(function (resolve) {
      var iv = setInterval(function () {
        setDie(trayDice[0], 1 + Math.floor(Math.random() * 6));
        setDie(trayDice[1], 1 + Math.floor(Math.random() * 6));
      }, 90);
      setTimeout(function () { clearInterval(iv); resolve(); }, ms);
    });
  }

  /* ---------- stepper machinery ---------- */
  var STEP_COUNT = 5;
  var lastRoll = null;
  var playToken = 0;
  var currentStep = 0;
  var stepTl = null;

  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function alive(token) { return token === playToken; }
  function caption(html) { captionEl.innerHTML = html; }
  function killStep() {
    if (stepTl) { stepTl.kill(); stepTl = null; }
    gsap.killTweensOf([demonToken, eliteToken]);
  }
  function hop(tl, token, q, r, dur, at) {
    var target = cellMap[key(q, r)];
    var fromY = parseFloat(gsap.getProperty(token, "y")) || 0;
    tl.to(token, { x: target.cx, duration: dur * DUR, ease: "power1.inOut" }, at * DUR);
    tl.to(token, {
      keyframes: [
        { y: (fromY + target.cy) / 2 - 20, duration: dur * DUR / 2, ease: "power2.out" },
        { y: target.cy, duration: dur * DUR / 2, ease: "power2.in" }
      ]
    }, at * DUR);
  }
  function destroy(tl, token, at) {
    tl.to(token, { scale: 1.3, duration: 0.22 * DUR, ease: "power2.out" }, at * DUR)
      .to(token, { scale: 0, opacity: 0, duration: 0.4 * DUR, ease: "power2.in" }, (at + 0.22) * DUR);
  }
  function highlightRetreats() {
    RETREAT_KEYS.forEach(function (k) {
      var p = k.split(",");
      setHexClass(+p[0], +p[1], "sim-hex--valid");
    });
    SAME_KEYS.forEach(function (k) {
      var p = k.split(",");
      setHexClass(+p[0], +p[1], "sim-hex--invalid");
      addMark(+p[0], +p[1], "✕");
    });
  }
  function clearRetreatHighlight() {
    setHexClass(2, 0, ""); setHexClass(2, -1, ""); setHexClass(1, 1, "");
    setHexClass(1, -1, ""); setHexClass(0, 1, "");
    hideMarks();
  }
  function ensureRoll() {
    if (!lastRoll) {
      lastRoll = { elite: 4, demon: 5 };
      updateChips(4, 5);
    }
    return lastRoll;
  }
  function marginOf(roll) { return (roll.demon + 3) - (roll.elite + 2); }

  /* ---------- the five beats ---------- */
  async function stepRoll(token) {
    killStep();
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    setDots(0);
    caption("The roll — both creatures cast a die.");
    await loadDice();
    if (!alive(token)) return;
    if (!diceBox) buildTrayDice();

    var elite, demon, values;
    do {
      if (diceBox) values = await rollValues();
      else { await shuffleTrayDice(1100); values = null; }
      if (!alive(token)) return;
      elite = values ? values.elite : 1 + Math.floor(Math.random() * 6);
      demon = values ? values.demon : 1 + Math.floor(Math.random() * 6);
      if (!diceBox && trayDice) { setDie(trayDice[0], elite); setDie(trayDice[1], demon); }
      updateChips(elite, demon);
      if (elite + 2 >= demon + 3) {
        caption("Deadlock — " + (elite + 2) + " against " + (demon + 3) + ". The Demon fails to bite; roll again.");
        await delay(1600);
        if (!alive(token)) return;
      }
    } while (elite + 2 >= demon + 3);

    lastRoll = { elite: elite, demon: demon };
    caption("Elite rolls " + elite + " (+2&nbsp;=&nbsp;<strong>" + (elite + 2) + "</strong>). Demon rolls " + demon + " (+3&nbsp;=&nbsp;<strong>" + (demon + 3) + "</strong>).");
    await delay(1400);
  }

  async function stepMargin(token) {
    killStep();
    var roll = ensureRoll();
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    setDots(1);
    var margin = marginOf(roll);
    if (margin >= 4) {
      caption("The Demon wins by <strong>" + margin + "</strong> — four or more. No retreat can save the Elite.");
    } else {
      caption("The Demon wins by <strong>" + margin + "</strong> — less than four. The Elite is not destroyed… but it cannot stay.");
    }
    stepTl = gsap.timeline();
    stepTl.to([demonToken, eliteToken], { scale: 1.15, duration: 0.3 * DUR, yoyo: true, repeat: 1, transformOrigin: "50% 50%" });
    await delay(1500);
  }

  async function stepOutcome(token) {
    killStep();
    var roll = ensureRoll();
    var margin = marginOf(roll);
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    setDots(2);
    stepTl = gsap.timeline();
    if (margin >= 4) {
      caption("A margin of " + margin + ": the Elite is <strong>destroyed</strong> where it stands — and the Demon must advance.");
      destroy(stepTl, eliteToken, 0.3);
      hop(stepTl, demonToken, ELITE_HOME.q, ELITE_HOME.r, 0.7, 1.1);
    } else {
      caption("Further means further: the Elite retreats to a gold tile — adjacent, unoccupied, and further from the Demon.");
      highlightRetreats();
      stepTl.to({}, { duration: 1.3 * DUR }); /* dwell on the classification */
      hop(stepTl, eliteToken, RETREAT_CELL.q, RETREAT_CELL.r, 0.7, 1.4);
      stepTl.call(function () {
        setHexClass(ELITE_HOME.q, ELITE_HOME.r, "sim-hex--vacated");
        setHexClass(2, -1, ""); setHexClass(1, 1, "");
      }, null, 1.8 * DUR);
      hop(stepTl, demonToken, ELITE_HOME.q, ELITE_HOME.r, 0.7, 2.3);
      stepTl.call(function () { setHexClass(ELITE_HOME.q, ELITE_HOME.r, ""); }, null, 3.1 * DUR);
    }
    await delay(3600);
  }

  async function stepOther(token) {
    killStep();
    var roll = ensureRoll();
    var margin = marginOf(roll);
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    setDots(3);
    stepTl = gsap.timeline();
    if (margin >= 4) {
      /* the roll was lethal — show the retreat branch instead */
      caption("Had the margin been less than four, the Elite would instead retreat to a gold tile — further from the Demon.");
      highlightRetreats();
      stepTl.to({}, { duration: 1.2 * DUR });
      hop(stepTl, eliteToken, RETREAT_CELL.q, RETREAT_CELL.r, 0.7, 1.3);
      stepTl.call(function () {
        setHexClass(ELITE_HOME.q, ELITE_HOME.r, "sim-hex--vacated");
        setHexClass(2, -1, ""); setHexClass(1, 1, "");
      }, null, 1.7 * DUR);
      hop(stepTl, demonToken, ELITE_HOME.q, ELITE_HOME.r, 0.7, 2.2);
      stepTl.call(function () { setHexClass(ELITE_HOME.q, ELITE_HOME.r, ""); }, null, 3 * DUR);
    } else {
      /* the roll was a retreat — show outright destruction instead */
      caption("Had the margin been four or more, there would be no retreat at all — the Elite would be <strong>destroyed</strong> on the spot.");
      destroy(stepTl, eliteToken, 0.4);
      hop(stepTl, demonToken, ELITE_HOME.q, ELITE_HOME.r, 0.7, 1.2);
    }
    await delay(3400);
  }

  async function stepNoWayOut(token) {
    killStep();
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    setDots(4);
    /* every further tile is denied: two occupied, one past the map's edge */
    place(blockers[0], 2, 0);
    place(blockers[1], 2, -1);
    setHexClass(1, 1, "sim-hex--edge");
    addMark(1, 1, "✕");
    setHexClass(1, -1, "sim-hex--invalid"); addMark(1, -1, "✕");
    setHexClass(0, 1, "sim-hex--invalid"); addMark(0, 1, "✕");
    caption("No way out: if every further tile is occupied or past the map's edge, the retreating creature is <strong>destroyed</strong> — and the attacker still advances.");
    stepTl = gsap.timeline();
    stepTl.to({}, { duration: 1.6 * DUR }); /* dwell on the denied board */
    destroy(stepTl, eliteToken, 1.7);
    hop(stepTl, demonToken, ELITE_HOME.q, ELITE_HOME.r, 0.7, 2.5);
    await delay(3800);
  }

  var STEPS = [stepRoll, stepMargin, stepOutcome, stepOther, stepNoWayOut];
  var lastAutoAt = 0; /* timestamp of the last auto-play advance (race guard) */

  function runStep(idx, token) {
    currentStep = idx;
    return STEPS[idx](token);
  }
  async function playAll() {
    var token = ++playToken;
    for (var i = 0; i < STEP_COUNT; i++) {
      if (!alive(token)) return;
      lastAutoAt = Date.now();
      await runStep(i, token);
      if (!alive(token)) return;
      await delay(1800);
    }
    /* closing beat: back to the start, inviting a replay */
    if (!alive(token)) return;
    killStep();
    resetHexes();
    place(demonToken, DEMON_HOME.q, DEMON_HOME.r);
    place(eliteToken, ELITE_HOME.q, ELITE_HOME.r);
    caption("Every battle tells a different story — press <strong>Replay</strong> to roll again.");
  }
  function goTo(idx) {
    playToken++; /* halt auto-play */
    runStep(idx, playToken);
  }

  /* ---------- controls ---------- */
  var dots = [];
  for (var d = 0; d < STEP_COUNT; d++) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "battle-sim__dot";
    dot.setAttribute("aria-label", "Go to step " + (d + 1));
    (function (idx, el) {
      el.addEventListener("click", function () { goTo(idx); });
    })(d, dot);
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }
  function setDots(active) {
    dots.forEach(function (el, idx) {
      el.classList.toggle("battle-sim__dot--active", idx === active);
    });
  }
  sim.querySelector("[data-step-prev]").addEventListener("click", function () {
    goTo(Math.max(0, currentStep - 1));
  });
  sim.querySelector("[data-step-next]").addEventListener("click", function () {
    /* a click landing right as auto-play advanced means "show me the scene
       that just appeared", not "skip past it" — don't compound the two */
    var justAutoAdvanced = Date.now() - lastAutoAt < 900;
    goTo(Math.min(STEP_COUNT - 1, currentStep + (justAutoAdvanced ? 0 : 1)));
  });
  sim.querySelector("[data-replay]").addEventListener("click", function () {
    lastRoll = null;
    playAll();
  });

  /* ---------- lazy dice preload + auto-play on approach ---------- */
  if ("IntersectionObserver" in window) {
    var preloader = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { loadDice(); preloader.disconnect(); }
      });
    }, { rootMargin: "700px" });
    preloader.observe(sim);

    var player = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { player.disconnect(); playAll(); }
      });
    }, { threshold: 0.4 });
    player.observe(sim);
  } else {
    playAll();
  }
})();

/* ============================================================
   Setup simulator — animated five-step walkthrough of setup.
   Same stepper convention as the battle sim: async beats, dot /
   arrow / replay chrome, auto-play on approach, static fallback.
   ============================================================ */
(function () {
  "use strict";

  var sim = document.querySelector("[data-setup-sim]");
  if (!sim) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var ns = "http://www.w3.org/2000/svg";

  var stage = sim.querySelector("[data-setup-stage]");
  var captionEl = sim.querySelector("[data-setup-caption]");
  var dotsWrap = sim.querySelector("[data-setup-dots]");
  var controls = sim.querySelector(".setup-sim__controls");

  var DUR = 1; /* duration scale — shrink for debugging */
  stage.setAttribute("viewBox", "0 0 640 340");

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(ns, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function hexPts(cx, cy, s) {
    var pts = [];
    for (var k = 0; k < 6; k++) {
      var a = Math.PI / 180 * (60 * k);
      pts.push((cx + s * Math.cos(a)).toFixed(1) + "," + (cy + s * Math.sin(a)).toFixed(1));
    }
    return pts.join(" ");
  }
  var PIPS = {
    1: [[12, 12]],
    2: [[8, 8], [16, 16]],
    3: [[8, 8], [12, 12], [16, 16]],
    4: [[8, 8], [16, 8], [8, 16], [16, 16]],
    5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]],
    6: [[8, 7.5], [16, 7.5], [8, 12], [16, 12], [8, 16.5], [16, 16.5]]
  };
  function setDieFace(svg, value) {
    svg.querySelectorAll("circle").forEach(function (c) { c.remove(); });
    (PIPS[value] || PIPS[1]).forEach(function (p) {
      el("circle", { cx: p[0], cy: p[1], r: 1.9 }, svg);
    });
  }

  /* Position a group. transformOrigin is set ONCE here and never again —
     changing it mid-stream corrupts GSAP's SVG transform cache. */
  function put(node, x, y, rot, scale) {
    if (hasGsap && !reduceMotion) {
      gsap.set(node, { x: x, y: y, rotation: rot || 0, scale: scale == null ? 1 : scale, transformOrigin: "50% 50%" });
    } else {
      node.setAttribute("transform", "translate(" + x + "," + y + ")" + (rot ? " rotate(" + rot + ")" : ""));
    }
  }
  function show(node) {
    if (hasGsap && !reduceMotion) gsap.set(node, { opacity: 1 });
    else node.setAttribute("opacity", "1");
  }
  function hide(node) {
    if (hasGsap && !reduceMotion) gsap.set(node, { opacity: 0 });
    else node.setAttribute("opacity", "0");
  }

  /* card group, local coords centred on (0,0) */
  function makeCard(kind, w, h) {
    w = w || 44; h = h || 60;
    var g = el("g", { "class": "setup-card setup-card--" + kind }, stage);
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4 }, g);
    if (kind === "creature") {
      el("polygon", { "class": "setup-card__mark", points: hexPts(0, -h * 0.14, 7) }, g);
      el("path", { "class": "setup-card__mark", d: "M" + (-w * 0.22) + "," + (h * 0.22) + " H" + (w * 0.22) + " M" + (-w * 0.22) + "," + (h * 0.22 + 4) + " H" + (w * 0.1) }, g);
    } else {
      el("path", { "class": "setup-card__mark", d: "M" + (-w * 0.24) + "," + (-h * 0.16) + " H" + (w * 0.24) + " M" + (-w * 0.24) + "," + (-h * 0.16 + 5) + " H" + (w * 0.24) + " M" + (-w * 0.24) + "," + (-h * 0.16 + 10) + " H" + (w * 0.05) }, g);
    }
    return g;
  }

  /* ---------- stepper machinery ---------- */
  var STEP_COUNT = 6;
  var currentStep = 0;
  var playToken = 0;
  var stepTl = null;
  var shuffleIv = null;

  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function alive(token) { return token === playToken; }
  function caption(html) { captionEl.innerHTML = html; }
  function killStep() {
    if (stepTl) { stepTl.kill(); stepTl = null; }
    if (shuffleIv) { clearInterval(shuffleIv); shuffleIv = null; }
  }
  function clearStage() {
    killStep();
    stage.textContent = "";
  }

  /* ============ STEP 1 — Share the tiles ============ */
  async function stepShare(token) {
    clearStage();
    caption("Share the land tiles out <strong>evenly</strong> between the players — these become the map.");

    var S = 22;
    var stackC = { x: 320, y: 158 };
    var piles = [{ x: 130, y: 158, label: "YOU" }, { x: 510, y: 158, label: "OPPONENT" }];
    var DEAL = 10; /* tiles dealt, alternating */

    /* central stack (three ghost outlines suggest depth) */
    for (var g = 2; g >= 0; g--) {
      el("polygon", { "class": "setup-tile", points: hexPts(stackC.x + g * 3, stackC.y - g * 3, S) }, stage);
    }
    var labels = piles.map(function (p) {
      var t = el("text", { "class": "setup-seat", x: p.x, y: p.y + 58 }, stage);
      t.textContent = p.label;
      hide(t);
      return t;
    });

    var counts = [0, 0];
    var tiles = [];
    for (var i = 0; i < DEAL; i++) {
      var tile = el("polygon", { "class": "setup-tile " + (i % 2 ? "setup-tile--p2" : "setup-tile--p1"), points: hexPts(0, 0, S) }, stage);
      put(tile, stackC.x, stackC.y);
      hide(tile);
      tiles.push(tile);
    }

    stepTl = gsap.timeline();
    tiles.forEach(function (tile, i) {
      var p = piles[i % 2];
      var n = counts[i % 2];
      counts[i % 2]++;
      var t = 0.35 * DUR + i * 0.24 * DUR;
      stepTl.to(tile, { opacity: 1, duration: 0.08 * DUR }, t)
        .to(tile, { x: p.x + (n % 5) * 4 - 8, y: p.y - Math.floor(n % 5) * 4 + Math.floor(n / 5) * 26 - 12, duration: 0.4 * DUR, ease: "power2.out" }, t);
    });
    var tEnd = 0.35 * DUR + DEAL * 0.24 * DUR + 0.45 * DUR;
    stepTl.to(labels, { opacity: 1, duration: 0.4 * DUR }, tEnd);
    await delay((tEnd / DUR + 0.6) * 1000 * DUR);
  }

  /* ============ STEP 2 — Build the continent ============ */
  var HEX = 30, SQ3 = Math.sqrt(3);
  var MAP_C = { x: 320, y: 158 };
  function axial(q, r) { return { x: MAP_C.x + HEX * 1.5 * q, y: MAP_C.y + HEX * SQ3 * (r + q / 2) }; }
  /* placement order keeps every new tile adjacent to the growing continent */
  var SLOTS = [[0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [2, -1], [-2, 1]];
  var BAD_SLOT = [3, 0]; /* disconnected from every slot */
  var PILES = [{ x: 88, y: 158, label: "YOU" }, { x: 552, y: 158, label: "OPPONENT" }];

  function buildMapFinal() {
    clearStage();
    SLOTS.forEach(function (s, i) {
      var c = axial(s[0], s[1]);
      var cls = i === 0 ? "setup-tile setup-tile--first" : "setup-tile " + (i % 2 ? "setup-tile--p1" : "setup-tile--p2");
      el("polygon", { "class": cls, points: hexPts(c.x, c.y, HEX - 1.5) }, stage);
    });
  }

  async function stepMap(token) {
    clearStage();
    caption("One tile starts the map — then players take turns placing tiles <strong>from their own pile</strong>. The continent must stay <strong>connected</strong>.");

    /* the two player piles the tiles fly from */
    PILES.forEach(function (p, pi) {
      for (var g = 2; g >= 0; g--) {
        el("polygon", { "class": "setup-tile " + (pi ? "setup-tile--p2" : "setup-tile--p1"), points: hexPts(p.x + g * 3, p.y - g * 3, 18) }, stage);
      }
      el("text", { "class": "setup-seat", x: p.x, y: p.y + 52 }, stage).textContent = p.label;
    });

    var slots = SLOTS.map(function (s) {
      var c = axial(s[0], s[1]);
      var g = el("polygon", { "class": "setup-hexslot", points: hexPts(c.x, c.y, HEX - 1.5) }, stage);
      hide(g);
      return { c: c, ghost: g };
    });
    var badC = axial(BAD_SLOT[0], BAD_SLOT[1]);
    var phantom = el("polygon", { "class": "setup-tile setup-tile--bad", points: hexPts(badC.x, badC.y, HEX - 1.5) }, stage);
    hide(phantom);

    var tiles = SLOTS.map(function (s, i) {
      var cls = i === 0 ? "setup-tile setup-tile--first" : "setup-tile " + (i % 2 ? "setup-tile--p1" : "setup-tile--p2");
      var t = el("polygon", { "class": cls, points: hexPts(0, 0, HEX - 1.5) }, stage);
      var pile = PILES[i % 2];
      put(t, pile.x, pile.y);
      hide(t);
      return t;
    });

    stepTl = gsap.timeline();
    slots.forEach(function (s, i) { stepTl.to(s.ghost, { opacity: 1, duration: 0.3 * DUR }, i * 0.05 * DUR); });

    /* first tile — the random seed — drops in */
    stepTl.to(tiles[0], { opacity: 1, duration: 0.12 * DUR }, 0.5 * DUR)
      .to(tiles[0], { x: slots[0].c.x, y: slots[0].c.y, duration: 0.55 * DUR, ease: "back.out(1.6)" }, 0.5 * DUR);

    /* tiles 2–4 fly in, alternating players */
    var t = 1.3 * DUR;
    for (var i = 1; i <= 3; i++) {
      stepTl.to(tiles[i], { opacity: 1, duration: 0.1 * DUR }, t)
        .to(tiles[i], { x: slots[i].c.x, y: slots[i].c.y, duration: 0.5 * DUR, ease: "power2.out" }, t);
      t += 0.38 * DUR;
    }

    /* teaching beat: tile 5 tries a disconnected slot and is refused */
    var bad = 4; /* slot index [-1,1] */
    stepTl.to(phantom, { opacity: 0.9, duration: 0.25 * DUR }, t);
    stepTl.to(tiles[bad], { opacity: 1, duration: 0.1 * DUR }, t)
      .to(tiles[bad], { x: badC.x, y: badC.y, duration: 0.5 * DUR, ease: "power2.out" }, t);
    t += 0.55 * DUR;
    for (var w = 0; w < 3; w++) {
      stepTl.to(tiles[bad], { x: badC.x + 7, duration: 0.06 * DUR }, t + w * 0.12 * DUR)
        .to(tiles[bad], { x: badC.x - 7, duration: 0.06 * DUR }, t + (w * 0.12 + 0.06) * DUR);
    }
    stepTl.to(phantom, { opacity: 0, duration: 0.3 * DUR }, t + 0.4 * DUR);
    stepTl.to(tiles[bad], { x: slots[bad].c.x, y: slots[bad].c.y, duration: 0.55 * DUR, ease: "power2.inOut" }, t + 0.42 * DUR);
    t += 1.05 * DUR;

    /* remaining tiles complete the continent */
    for (var j = 5; j < SLOTS.length; j++) {
      stepTl.to(tiles[j], { opacity: 1, duration: 0.1 * DUR }, t)
        .to(tiles[j], { x: slots[j].c.x, y: slots[j].c.y, duration: 0.5 * DUR, ease: "power2.out" }, t);
      t += 0.38 * DUR;
    }
    await delay((t / DUR + 0.4) * 1000 * DUR);
  }

  /* ============ STEP 2 — Sort the cards ============ */
  async function stepDecks(token) {
    clearStage();
    caption("Sort the cards into two decks — the <strong>Creature deck</strong> and the <strong>Lands &amp; Spells deck</strong>.");

    var kinds = ["creature", "land", "creature", "land", "creature", "land", "creature", "land"];
    var deckL = { x: 170, y: 150 }, deckR = { x: 470, y: 150 };
    var li = 0, ri = 0;

    var cards = kinds.map(function (kind, i) {
      var c = makeCard(kind);
      put(c, 320 + (i - 3.5) * 16, 152 + (i % 2 ? 4 : -4), (i - 3.5) * 5, 0);
      return c;
    });

    var lblL = el("text", { "class": "setup-decklabel", x: deckL.x, y: 228 }, stage);
    lblL.textContent = "CREATURE DECK";
    var lblR = el("text", { "class": "setup-decklabel", x: deckR.x, y: 228 }, stage);
    lblR.textContent = "LANDS & SPELLS";
    hide(lblL); hide(lblR);

    stepTl = gsap.timeline();
    cards.forEach(function (c, i) {
      stepTl.to(c, { scale: 1, duration: 0.3 * DUR, ease: "back.out(1.7)" }, i * 0.07 * DUR);
    });
    var t = 0.9 * DUR;
    cards.forEach(function (c, i) {
      var left = kinds[i] === "creature";
      var tgt = left ? deckL : deckR;
      var off = left ? li++ : ri++;
      stepTl.to(c, { x: tgt.x + off * 2.5, y: tgt.y - off * 2.5, rotation: 0, duration: 0.55 * DUR, ease: "power2.inOut" }, t + i * 0.14 * DUR);
    });
    t += 8 * 0.14 * DUR + 0.6 * DUR;
    stepTl.to([lblL, lblR], { opacity: 1, duration: 0.4 * DUR }, t);
    await delay((t / DUR + 0.7) * 1000 * DUR);
  }

  /* ============ STEP 3 — Roll for the start ============ */
  async function stepFirst(token) {
    clearStage();
    caption("Roll the die to decide who takes the <strong>first turn</strong>.");

    el("text", { "class": "setup-seat", x: 320, y: 58 }, stage).textContent = "OPPONENT";
    var you = el("text", { "class": "setup-seat", x: 320, y: 298 }, stage);
    you.textContent = "YOU";

    var dieG = el("g", { "class": "setup-die" }, stage);
    var dieSvg = el("svg", { x: -34, y: -34, width: 68, height: 68, viewBox: "0 0 24 24" }, dieG);
    el("rect", { x: 2, y: 2, width: 20, height: 20, rx: 4.5 }, dieSvg);
    setDieFace(dieSvg, 1);
    put(dieG, 320, 158, 0, 0);

    var crown = el("polygon", {
      "class": "setup-crown",
      points: "-13,7 -13,-3 -6.5,2 0,-7 6.5,2 13,-3 13,7"
    }, stage);
    put(crown, 320, 262, 0, 0);

    stepTl = gsap.timeline();
    stepTl.to(dieG, { scale: 1, duration: 0.45 * DUR, ease: "back.out(1.8)" }, 0.1 * DUR);

    /* tumble: pip shuffle + rotation wobble + hop */
    shuffleIv = setInterval(function () { setDieFace(dieSvg, 1 + Math.floor(Math.random() * 6)); }, 90);
    stepTl.to(dieG, { rotation: 14, duration: 0.16 * DUR }, 0.6 * DUR)
      .to(dieG, { y: 138, duration: 0.16 * DUR, ease: "power2.out" }, 0.6 * DUR)
      .to(dieG, { rotation: -12, y: 158, duration: 0.2 * DUR }, 0.78 * DUR)
      .to(dieG, { rotation: 8, y: 144, duration: 0.18 * DUR }, 1.0 * DUR)
      .to(dieG, { rotation: 0, y: 158, duration: 0.22 * DUR, ease: "power2.in" }, 1.2 * DUR);

    await delay(1.5 * 1000 * DUR);
    if (!alive(token)) return;
    killStep(); /* stops the shuffle */
    setDieFace(dieSvg, 6);

    stepTl = gsap.timeline();
    stepTl.to(dieG, { scale: 1.14, duration: 0.16 * DUR, ease: "power2.out" }, 0)
      .to(dieG, { scale: 1, duration: 0.3 * DUR, ease: "power2.inOut" }, 0.16 * DUR)
      .to(crown, { scale: 1, duration: 0.5 * DUR, ease: "back.out(2.2)" }, 0.4 * DUR);
    await delay(1.1 * 1000 * DUR);
    you.setAttribute("class", "setup-seat setup-seat--win");
  }

  /* ============ STEP 4 — Opening hand ============ */
  async function stepHand(token) {
    clearStage();
    caption("Draw your opening hand — <strong>1 creature</strong> and <strong>2 land/spell cards</strong> — plus <strong>4 gold</strong> from the supply.");

    /* mini decks */
    var deckC = { x: 180, y: 82 }, deckL = { x: 460, y: 82 };
    [[deckC, "creature"], [deckL, "land"]].forEach(function (cfg) {
      for (var i = 2; i >= 0; i--) {
        var c = makeCard(cfg[1], 36, 50);
        put(c, cfg[0].x + i * 2.5, cfg[0].y - i * 2.5);
      }
    });
    el("text", { "class": "setup-decklabel", x: deckC.x, y: 128 }, stage).textContent = "CREATURES";
    el("text", { "class": "setup-decklabel", x: deckL.x, y: 128 }, stage).textContent = "LANDS & SPELLS";

    /* hand fan */
    var hand = [
      { x: 176, y: 246, r: -14, kind: "creature", from: deckC },
      { x: 214, y: 238, r: 0, kind: "land", from: deckL },
      { x: 252, y: 246, r: 14, kind: "land", from: deckL }
    ];
    var cards = hand.map(function (h) {
      var c = makeCard(h.kind);
      put(c, h.from.x, h.from.y, 0, 0.82);
      hide(c);
      return c;
    });

    /* gold */
    var coins = [0, 1, 2, 3].map(function (i) {
      var c = el("circle", { "class": "setup-coin", r: 11 }, stage);
      put(c, 420 + i * 26, 246, 0, 0);
      return c;
    });
    var count = el("text", { "class": "setup-coincount", x: 446, y: 292, "text-anchor": "middle" }, stage);
    count.textContent = "";
    hide(count);

    stepTl = gsap.timeline();
    cards.forEach(function (c, i) {
      var t = 0.4 * DUR + i * 0.3 * DUR;
      stepTl.to(c, { opacity: 1, duration: 0.12 * DUR }, t)
        .to(c, { x: hand[i].x, y: hand[i].y, rotation: hand[i].r, duration: 0.5 * DUR, ease: "power2.out" }, t);
    });
    var t = 1.6 * DUR;
    coins.forEach(function (c, i) {
      stepTl.to(c, { scale: 1, duration: 0.34 * DUR, ease: "back.out(2)" }, t + i * 0.18 * DUR);
      stepTl.call(function () { count.textContent = "× " + (i + 1); show(count); }, null, t + i * 0.18 * DUR);
    });
    await delay((t / DUR + 1.1) * 1000 * DUR);
  }

  /* ============ STEP 6 — Face your seat (orientation finale) ============ */
  async function stepOrient(token) {
    clearStage();
    caption("Choose your orientation — every card you play <strong>faces where you sit</strong>. Up to six players, one per side of the hexagon.");

    var S = 30, cx = 320, cy = 158;
    function ax(q, r) { return { x: cx + S * 1.5 * q, y: cy + S * SQ3 * (r + q / 2) }; }
    /* seven-hex flower */
    var flower = [[0, 0], [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(function (s) { return ax(s[0], s[1]); });
    var hexNodes = flower.map(function (c) {
      var h = el("polygon", { "class": "setup-tile", points: hexPts(c.x, c.y, S - 1.5) }, stage);
      hide(h);
      return h;
    });
    el("text", { "class": "setup-seat", x: 320, y: 34 }, stage).textContent = "OPPONENT";
    el("text", { "class": "setup-seat", x: 320, y: 312 }, stage).textContent = "YOU";

    /* creature stacks: opponent's on the top hexes, yours on the bottom */
    var stacks = [
      { c: flower[3], rot: 180 }, { c: flower[2], rot: 180 }, /* opponent's */
      { c: flower[6], rot: 0 }, { c: flower[5], rot: 0 }      /* yours */
    ].map(function (cfg) {
      /* physical stack: land card on the tile, creature card on top */
      var land = makeCard("land", 32, 44);
      put(land, cfg.c.x, cfg.c.y, 90, 0);
      var cre = makeCard("creature", 26, 38);
      put(cre, cfg.c.x, cfg.c.y, 90, 0);
      return { land: land, cre: cre, rot: cfg.rot };
    });
    /* a lone land card of the opponent's on the centre hex — the claim beat */
    var claim = makeCard("land", 32, 44);
    put(claim, flower[0].x, flower[0].y, 90, 0);

    stepTl = gsap.timeline();
    hexNodes.forEach(function (h, i) { stepTl.to(h, { opacity: 1, duration: 0.3 * DUR }, i * 0.05 * DUR); });
    stacks.forEach(function (s, i) {
      var t = 0.5 * DUR + i * 0.12 * DUR;
      stepTl.to(s.land, { scale: 1, duration: 0.3 * DUR, ease: "back.out(1.7)" }, t)
        .to(s.cre, { scale: 1, duration: 0.3 * DUR, ease: "back.out(1.7)" }, t + 0.08 * DUR);
    });
    stepTl.to(claim, { scale: 1, duration: 0.3 * DUR, ease: "back.out(1.7)" }, 1.0 * DUR);

    /* everything turns to face its owner */
    var t = 1.7 * DUR;
    stacks.forEach(function (s) {
      stepTl.to([s.land, s.cre], { rotation: s.rot, duration: 0.7 * DUR, ease: "power2.inOut" }, t);
    });
    stepTl.to(claim, { rotation: 180, duration: 0.7 * DUR, ease: "power2.inOut" }, t);
    await delay((t / DUR + 1.0) * 1000 * DUR);
    if (!alive(token)) return;

    /* claim beat: take the centre tile and its land card turns to face you —
       two 90° steps so the motion registers (180° reads as no movement) */
    caption("Take a tile and its land card <strong>turns to face you</strong> — lose it, and it turns away.");
    stepTl = gsap.timeline();
    stepTl.to(claim, { rotation: 90, duration: 0.45 * DUR, ease: "power2.inOut" }, 0.2 * DUR)
      .to(claim, { rotation: 0, duration: 0.45 * DUR, ease: "power2.inOut" }, 0.7 * DUR);
    await delay(1.5 * 1000 * DUR);
  }

  var STEPS = [stepShare, stepMap, stepDecks, stepFirst, stepHand, stepOrient];
  var lastAutoAt = 0; /* timestamp of the last auto-play advance (race guard) */

  async function runStep(idx, token) {
    currentStep = idx;
    setDots(idx);
    return STEPS[idx](token);
  }
  async function playAll() {
    var token = ++playToken;
    for (var i = 0; i < STEP_COUNT; i++) {
      if (!alive(token)) return;
      lastAutoAt = Date.now();
      await runStep(i, token);
      if (!alive(token)) return;
      await delay(1900);
    }
    /* closing beat: the finished continent, inviting a replay */
    if (!alive(token)) return;
    buildMapFinal();
    setDots(0);
    caption("The realm is set — press <strong>Replay</strong> to walk through setup again.");
  }
  function goTo(idx) {
    playToken++; /* halt auto-play */
    runStep(idx, playToken);
  }

  /* ---------- controls ---------- */
  var dots = [];
  for (var d = 0; d < STEP_COUNT; d++) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "battle-sim__dot";
    dot.setAttribute("aria-label", "Go to setup step " + (d + 1));
    (function (idx, elBtn) {
      elBtn.addEventListener("click", function () { goTo(idx); });
    })(d, dot);
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }
  function setDots(active) {
    dots.forEach(function (elDot, idx) {
      elDot.classList.toggle("battle-sim__dot--active", idx === active);
    });
  }
  sim.querySelector("[data-setup-prev]").addEventListener("click", function () {
    goTo(Math.max(0, currentStep - 1));
  });
  sim.querySelector("[data-setup-next]").addEventListener("click", function () {
    /* a click landing right as auto-play advanced means "show me the scene
       that just appeared", not "skip past it" — don't compound the two */
    var justAutoAdvanced = Date.now() - lastAutoAt < 900;
    goTo(Math.min(STEP_COUNT - 1, currentStep + (justAutoAdvanced ? 0 : 1)));
  });
  sim.querySelector("[data-setup-replay]").addEventListener("click", function () {
    playAll();
  });

  /* ---------- static fallback ---------- */
  if (!hasGsap || reduceMotion) {
    buildMapFinal();
    setDots(0);
    caption("Setup: share out the tiles, build a connected continent, sort the two decks, roll for the first turn, draw 1 creature + 2 land/spell cards and 4 gold, then face your cards to your seat.");
    if (controls) controls.style.display = "none";
    return;
  }

  /* ---------- auto-play on approach ---------- */
  if ("IntersectionObserver" in window) {
    var player = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { player.disconnect(); playAll(); }
      });
    }, { threshold: 0.4 });
    player.observe(sim);
  } else {
    playAll();
  }
})();

/* ============================================================
   Actions simulator — the five actions as animated scenes.
   Same stepper convention as the setup and battle sims.
   ============================================================ */
(function () {
  "use strict";

  var sim = document.querySelector("[data-actions-sim]");
  if (!sim) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var ns = "http://www.w3.org/2000/svg";

  var stage = sim.querySelector("[data-actions-stage]");
  var captionEl = sim.querySelector("[data-actions-caption]");
  var dotsWrap = sim.querySelector("[data-actions-dots]");
  var controls = sim.querySelector(".setup-sim__controls");

  var DUR = 1; /* duration scale — shrink for debugging */
  stage.setAttribute("viewBox", "0 0 640 340");

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(ns, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function hexPts(cx, cy, s) {
    var pts = [];
    for (var k = 0; k < 6; k++) {
      var a = Math.PI / 180 * (60 * k);
      pts.push((cx + s * Math.cos(a)).toFixed(1) + "," + (cy + s * Math.sin(a)).toFixed(1));
    }
    return pts.join(" ");
  }
  var PIPS = {
    1: [[12, 12]],
    2: [[8, 8], [16, 16]],
    3: [[8, 8], [12, 12], [16, 16]],
    4: [[8, 8], [16, 8], [8, 16], [16, 16]],
    5: [[8, 8], [16, 8], [12, 12], [8, 16], [16, 16]],
    6: [[8, 7.5], [16, 7.5], [8, 12], [16, 12], [8, 16.5], [16, 16.5]]
  };
  function setDieFace(svg, value) {
    svg.querySelectorAll("circle").forEach(function (c) { c.remove(); });
    (PIPS[value] || PIPS[1]).forEach(function (p) {
      el("circle", { cx: p[0], cy: p[1], r: 1.9 }, svg);
    });
  }
  /* transformOrigin is set ONCE here and never changed afterwards */
  function put(node, x, y, rot, scale) {
    if (hasGsap && !reduceMotion) {
      gsap.set(node, { x: x, y: y, rotation: rot || 0, scale: scale == null ? 1 : scale, transformOrigin: "50% 50%" });
    } else {
      node.setAttribute("transform", "translate(" + x + "," + y + ")" + (rot ? " rotate(" + rot + ")" : ""));
    }
  }
  function show(node) {
    if (hasGsap && !reduceMotion) gsap.set(node, { opacity: 1 });
    else node.setAttribute("opacity", "1");
  }
  function hide(node) {
    if (hasGsap && !reduceMotion) gsap.set(node, { opacity: 0 });
    else node.setAttribute("opacity", "0");
  }
  function makeCard(kind, w, h) {
    w = w || 44; h = h || 60;
    var g = el("g", { "class": "setup-card setup-card--" + kind }, stage);
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 4 }, g);
    if (kind === "creature" || kind === "foe") {
      el("polygon", { "class": "setup-card__mark", points: hexPts(0, -h * 0.14, 7) }, g);
      el("path", { "class": "setup-card__mark", d: "M" + (-w * 0.22) + "," + (h * 0.22) + " H" + (w * 0.22) + " M" + (-w * 0.22) + "," + (h * 0.22 + 4) + " H" + (w * 0.1) }, g);
    } else {
      el("path", { "class": "setup-card__mark", d: "M" + (-w * 0.24) + "," + (-h * 0.16) + " H" + (w * 0.24) + " M" + (-w * 0.24) + "," + (-h * 0.16 + 5) + " H" + (w * 0.24) + " M" + (-w * 0.24) + "," + (-h * 0.16 + 10) + " H" + (w * 0.05) }, g);
    }
    return g;
  }
  /* the physical stack: land card flat on the tile, creature card on top.
     Side-offset keeps a full-height strip of the land card exposed so its
     rotation (ownership) stays readable while covered. */
  function makeStack(x, y, rot, scale) {
    var land = makeCard("land", 36, 50);
    put(land, x - 5, y - 2, rot || 0, scale);
    var cre = makeCard("creature", 32, 46);
    put(cre, x + 5, y + 3, rot || 0, scale);
    return { cre: cre, land: land };
  }
  function makeCoin() {
    return el("circle", { "class": "setup-coin", r: 11 }, stage);
  }

  /* action icon badge, top-right of the stage */
  var ICONS = {
    summon: '<polygon points="24,5 40.5,14.5 40.5,33.5 24,43 7.5,33.5 7.5,14.5"/><path d="M24 17 L26 22 L31 24 L26 26 L24 31 L22 26 L17 24 L22 22 Z" fill="currentColor" stroke="none"/>',
    move: '<polygon points="12,18 17,21 17,27 12,30 7,27 7,21"/><path d="M22 24 H38"/><path d="M32 18 L38 24 L32 30"/>',
    battle: '<path d="M12 10 L30 28"/><path d="M30 28 L34 32"/><path d="M24 30 L32 22"/><path d="M36 10 L18 28"/><path d="M18 28 L14 32"/><path d="M16 22 L24 30"/>',
    harvest: '<circle cx="24" cy="24" r="14"/><path d="M24 16 L26.2 21.4 L32 21.8 L27.6 25.6 L29 31.2 L24 28 L19 31.2 L20.4 25.6 L16 21.8 L21.8 21.4 Z" fill="currentColor" stroke="none"/>',
    draw: '<rect x="8" y="14" width="18" height="24" rx="2.5"/><rect x="22" y="10" width="18" height="24" rx="2.5"/>'
  };
  function badge(iconKey) {
    var g = el("g", { "class": "actions-icon-badge" }, stage);
    el("circle", { cx: 588, cy: 48, r: 26 }, g);
    var svg = el("svg", { x: 574, y: 34, width: 28, height: 28, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    svg.innerHTML = ICONS[iconKey];
    el("text", { "class": "actions-cost", x: 588, y: 92, "text-anchor": "middle" }, g).textContent = "1 ACTION";
    return g;
  }

  /* ---------- shared mini board: seven-hex flower ---------- */
  var S = 32, BC = { x: 270, y: 168 }, SQ3 = Math.sqrt(3);
  function ax(q, r) { return { x: BC.x + S * 1.5 * q, y: BC.y + S * SQ3 * (r + q / 2) }; }
  var FLOWER = [[0, 0], [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(function (s) { return ax(s[0], s[1]); });
  function buildBoard() {
    return FLOWER.map(function (c) {
      var h = el("polygon", { "class": "setup-tile", points: hexPts(c.x, c.y, S - 1.5) }, stage);
      hide(h);
      return h;
    });
  }
  function revealBoard(tl, hexes) {
    hexes.forEach(function (h, i) { tl.to(h, { opacity: 1, duration: 0.3 * DUR }, i * 0.05 * DUR); });
  }

  /* ============ SCENE 1 — Summon ============ */
  async function actSummon(token) {
    clearStage();
    caption("<strong>Summon</strong> — pay its gold cost, place the land card on its matching tile, and set the creature card on top. Each land card summons only once.");
    badge("summon");
    var hexes = buildBoard();
    var target = FLOWER[6];

    /* hand + gold (land created first so the creature card paints on top) */
    var land = makeCard("land");
    put(land, 452, 84, -6, 0);
    var cre = makeCard("creature");
    put(cre, 502, 78, 8, 0);
    var coins = [0, 1, 2, 3].map(function (i) {
      var c = makeCoin();
      put(c, 462 + i * 26, 236, 0, 0);
      return c;
    });
    var count = el("text", { "class": "actions-goldcount", x: 500, y: 280, "text-anchor": "middle" }, stage);
    count.textContent = "× 4";
    hide(count);

    stepTl = gsap.timeline();
    revealBoard(stepTl, hexes);
    stepTl.to(hexes[6], { fill: "rgba(201,162,75,0.3)", stroke: "#c9a24b", duration: 0.4 * DUR }, 0.5 * DUR);
    stepTl.to([land, cre], { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.6 * DUR);
    stepTl.to(count, { opacity: 1, duration: 0.3 * DUR }, 0.7 * DUR);
    coins.forEach(function (c, i) {
      stepTl.to(c, { scale: 1, duration: 0.3 * DUR, ease: "back.out(2)" }, 0.7 * DUR + i * 0.08 * DUR);
    });

    /* pay 3 gold — coins slide off to the supply */
    var t = 1.5 * DUR;
    [3, 2, 1].forEach(function (ci, k) {
      stepTl.to(coins[ci], { x: 660, y: 20, opacity: 0, duration: 0.45 * DUR, ease: "power2.in" }, t + k * 0.16 * DUR);
      stepTl.call(function () { count.textContent = "× " + (3 - k); }, null, t + k * 0.16 * DUR + 0.2 * DUR);
    });

    /* land card onto its matching tile, then the creature card on top */
    t += 0.75 * DUR;
    stepTl.to(land, { x: target.x - 5, y: target.y - 2, rotation: 0, scale: 0.82, duration: 0.55 * DUR, ease: "power2.inOut" }, t);
    stepTl.to(cre, { x: target.x + 5, y: target.y + 3, rotation: 0, scale: 0.73, duration: 0.55 * DUR, ease: "power2.inOut" }, t + 0.35 * DUR);
    await delay((t / DUR + 1.3) * 1000 * DUR);
  }

  /* ============ SCENE 2 — Move ============ */
  async function actMove(token) {
    clearStage();
    caption("<strong>Move</strong> — lift your creature card off the stack and set it on an adjacent tile. The land card stays behind: territory endures.");
    badge("move");
    var hexes = buildBoard();
    var from = FLOWER[0], to = FLOWER[1];

    var stack = makeStack(from.x, from.y, 0, 0);

    stepTl = gsap.timeline();
    revealBoard(stepTl, hexes);
    stepTl.to([stack.land, stack.cre], { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.5 * DUR);
    /* destination pulses */
    stepTl.to(hexes[1], { fill: "rgba(201,162,75,0.3)", stroke: "#c9a24b", duration: 0.35 * DUR }, 1.1 * DUR);
    /* lift the creature card off the top of the stack... */
    stepTl.to(stack.cre, { y: from.y - 16, scale: 1.08, duration: 0.3 * DUR, ease: "power2.out" }, 1.6 * DUR);
    /* ...and set it down on the adjacent tile */
    stepTl.to(stack.cre, { x: to.x, duration: 0.55 * DUR, ease: "power1.inOut" }, 2.0 * DUR);
    stepTl.to(stack.cre, {
      keyframes: [
        { y: (from.y + to.y) / 2 - 18, duration: 0.28 * DUR, ease: "power2.out" },
        { y: to.y, duration: 0.27 * DUR, ease: "power2.in" }
      ]
    }, 2.0 * DUR);
    stepTl.to(stack.cre, { scale: 1, duration: 0.2 * DUR, ease: "power1.in" }, 2.5 * DUR);
    /* the vacated land card settles back onto the centre of its tile */
    stepTl.to(stack.land, { x: from.x, y: from.y, duration: 0.35 * DUR, ease: "power2.inOut" }, 2.7 * DUR);
    await delay(3.4 * 1000 * DUR);
  }

  /* ============ SCENE 3 — Claim (no badge: a consequence, not an action) ============ */
  async function actClaim(token) {
    clearStage();
    caption("<strong>Claim</strong> — cover an unoccupied tile and its land card turns to <strong>face that player</strong>. Defend your land.");
    var hexes = buildBoard();
    var home = FLOWER[4]; /* upper-left hex holds your land card */
    var path = [FLOWER[1], FLOWER[2], FLOWER[3]]; /* start + the two prior tiles it hops across */

    /* land card created first so the covering creature card paints on top */
    var land = makeCard("land", 36, 50);
    put(land, home.x - 5, home.y - 2, 0, 0);
    var foe = makeCard("foe", 32, 46);
    put(foe, path[0].x, path[0].y, 60, 0); /* 60° seat — a turn you can actually see */

    stepTl = gsap.timeline();
    revealBoard(stepTl, hexes);
    stepTl.to(land, { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.5 * DUR);
    stepTl.to(foe, { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.9 * DUR);

    /* hop across the two prior tiles, then onto the land card's tile */
    var t = 1.5 * DUR;
    var from = path[0];
    [path[1], path[2], { x: home.x + 5, y: home.y + 3 }].forEach(function (stop) {
      stepTl.to(foe, { x: stop.x, duration: 0.5 * DUR, ease: "power1.inOut" }, t);
      stepTl.to(foe, {
        keyframes: [
          { y: (from.y + stop.y) / 2 - 18, duration: 0.25 * DUR, ease: "power2.out" },
          { y: stop.y, duration: 0.25 * DUR, ease: "power2.in" }
        ]
      }, t);
      from = stop;
      t += 0.65 * DUR;
    });

    /* the land card turns 60° to face the claiming player's seat */
    stepTl.to(land, { rotation: 60, duration: 0.6 * DUR, ease: "power2.inOut" }, t + 0.15 * DUR);
    await delay((t / DUR + 1.2) * 1000 * DUR);
  }

  /* ============ SCENE 3 — Battle (teaser) ============ */
  async function actBattle(token) {
    clearStage();
    caption("<strong>Battle</strong> — attack an enemy creature on an adjacent tile. Strength plus a die roll decides it — and there is more to it than that: advances, retreats and deadlocks are all broken down in the full battle walkthrough <strong>below</strong>.");
    badge("battle");
    var hexes = buildBoard();
    var home = FLOWER[0], foe = FLOWER[1];

    var you = makeCard("creature", 40, 54);
    put(you, home.x, home.y, 0, 0);
    var enemy = makeCard("foe", 40, 54);
    put(enemy, foe.x, foe.y, 180, 0);

    var dice = [0, 1].map(function (i) {
      var g = el("g", { "class": "setup-die" }, stage);
      var svg = el("svg", { x: -24, y: -24, width: 48, height: 48, viewBox: "0 0 24 24" }, g);
      el("rect", { x: 2, y: 2, width: 20, height: 20, rx: 4.5 }, svg);
      setDieFace(svg, 1);
      put(g, 470 + i * 64, 120, 0, 0);
      return { g: g, svg: svg };
    });

    stepTl = gsap.timeline();
    revealBoard(stepTl, hexes);
    stepTl.to([you, enemy], { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.5 * DUR);
    stepTl.to(dice.map(function (d) { return d.g; }), { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.9 * DUR);

    /* the lunge + tumble */
    stepTl.to(you, { x: home.x + 14, yoyo: true, repeat: 1, duration: 0.14 * DUR }, 1.4 * DUR);
    shuffleIv = setInterval(function () {
      dice.forEach(function (d) { setDieFace(d.svg, 1 + Math.floor(Math.random() * 6)); });
    }, 90);
    stepTl.to(dice.map(function (d) { return d.g; }), { rotation: 12, yoyo: true, repeat: 3, duration: 0.1 * DUR }, 1.4 * DUR);
    await delay(2.2 * 1000 * DUR);
    if (!alive(token)) return;
    killStep();
    setDieFace(dice[0].svg, 5);
    setDieFace(dice[1].svg, 3);
    stepTl = gsap.timeline();
    stepTl.to(enemy, { x: foe.x + 5, yoyo: true, repeat: 3, duration: 0.06 * DUR }, 0.1 * DUR);
    await delay(0.8 * 1000 * DUR);
  }

  /* ============ SCENE 4 — Harvest ============ */
  async function actHarvest(token) {
    clearStage();
    caption("<strong>Harvest</strong> — collect gold equal to the land tile's value from a tile your creature occupies. Each tile harvests once per turn.");
    badge("harvest");
    var hexes = buildBoard();
    var home = FLOWER[0];

    var stack = makeStack(home.x, home.y, 0, 0);

    /* gold pile */
    var pile = [0, 1, 2, 3].map(function (i) {
      var c = makeCoin();
      put(c, 480 + i * 24, 240, 0, 0);
      return c;
    });
    var count = el("text", { "class": "actions-goldcount", x: 516, y: 282, "text-anchor": "middle" }, stage);
    count.textContent = "× 4";
    hide(count);
    var tick = el("text", { "class": "actions-tick", x: home.x, y: home.y - S - 6 }, stage);
    tick.textContent = "✓";
    hide(tick);

    stepTl = gsap.timeline();
    revealBoard(stepTl, hexes);
    stepTl.to([stack.cre, stack.land], { scale: 1, duration: 0.35 * DUR, ease: "back.out(1.7)" }, 0.5 * DUR);
    stepTl.to(count, { opacity: 1, duration: 0.3 * DUR }, 0.6 * DUR);
    pile.forEach(function (c, i) {
      stepTl.to(c, { scale: 1, duration: 0.3 * DUR, ease: "back.out(2)" }, 0.6 * DUR + i * 0.08 * DUR);
    });

    /* two coins rise from the tile into your pile */
    var t = 1.5 * DUR;
    [0, 1].forEach(function (k) {
      var c = makeCoin();
      put(c, home.x, home.y - 10, 0, 0);
      stepTl.to(c, { scale: 1, duration: 0.25 * DUR, ease: "back.out(2)" }, t + k * 0.35 * DUR)
        .to(c, { x: 540 + k * 24, y: 200, duration: 0.5 * DUR, ease: "power2.inOut" }, t + 0.3 * DUR + k * 0.35 * DUR)
        .to(c, { opacity: 0, duration: 0.2 * DUR }, t + 0.75 * DUR + k * 0.35 * DUR);
      stepTl.call(function () { count.textContent = "× " + (5 + k); }, null, t + 0.8 * DUR + k * 0.35 * DUR);
    });
    /* tile is spent for the turn */
    stepTl.call(function () { hexes[0].setAttribute("class", "setup-tile actions-tile--harvested"); show(tick); }, null, t + 1.3 * DUR);
    await delay((t / DUR + 2.0) * 1000 * DUR);
  }

  /* ============ SCENE 5 — Draw ============ */
  async function actDraw(token) {
    clearStage();
    caption("<strong>Draw</strong> — take a card and ready your next manoeuvre.");
    badge("draw");
    var hexes = buildBoard();
    revealBoard(gsap.timeline(), hexes); /* static backdrop */

    /* two mini decks */
    [[430, "creature", "CREATURES"], [540, "land", "LANDS & SPELLS"]].forEach(function (cfg) {
      for (var i = 2; i >= 0; i--) {
        var c = makeCard(cfg[1], 36, 50);
        put(c, cfg[0] + i * 2.5, 84 - i * 2.5);
      }
      el("text", { "class": "setup-decklabel", x: cfg[0], y: 128 }, stage).textContent = cfg[2];
    });

    /* existing hand */
    var hand = [
      { x: 448, y: 250, r: -10 },
      { x: 490, y: 246, r: 0 }
    ].map(function (h) {
      var c = makeCard("land");
      put(c, h.x, h.y, h.r, 0);
      return c;
    });
    var drawn = makeCard("land");
    put(drawn, 545, 76, 0, 0.9);
    hide(drawn);

    stepTl = gsap.timeline();
    hand.forEach(function (c, i) {
      stepTl.to(c, { scale: 1, duration: 0.3 * DUR, ease: "back.out(1.7)" }, 0.4 * DUR + i * 0.1 * DUR);
    });
    stepTl.to(drawn, { opacity: 1, duration: 0.12 * DUR }, 1.0 * DUR)
      .to(drawn, { x: 532, y: 250, rotation: 10, duration: 0.6 * DUR, ease: "power2.out" }, 1.0 * DUR);
    await delay(2.2 * 1000 * DUR);
  }

  var STEPS = [actSummon, actMove, actClaim, actBattle, actHarvest, actDraw];
  var lastAutoAt = 0; /* timestamp of the last auto-play advance (race guard) */

  /* ---------- stepper machinery ---------- */
  var STEP_COUNT = 6;
  var currentStep = 0;
  var playToken = 0;
  var stepTl = null;
  var shuffleIv = null;

  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function alive(token) { return token === playToken; }
  function caption(html) { captionEl.innerHTML = html; }
  function killStep() {
    if (stepTl) { stepTl.kill(); stepTl = null; }
    if (shuffleIv) { clearInterval(shuffleIv); shuffleIv = null; }
  }
  function clearStage() {
    killStep();
    stage.textContent = "";
  }

  async function runStep(idx, token) {
    currentStep = idx;
    setDots(idx);
    return STEPS[idx](token);
  }
  async function playAll() {
    var token = ++playToken;
    for (var i = 0; i < STEP_COUNT; i++) {
      if (!alive(token)) return;
      lastAutoAt = Date.now();
      await runStep(i, token);
      if (!alive(token)) return;
      await delay(1900);
    }
    /* closing beat: back to the first scene, inviting a replay */
    if (!alive(token)) return;
    lastAutoAt = Date.now();
    runStep(0, playToken);
  }
  function goTo(idx) {
    playToken++; /* halt auto-play */
    runStep(idx, playToken);
  }

  /* ---------- controls ---------- */
  var dots = [];
  for (var d = 0; d < STEP_COUNT; d++) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "battle-sim__dot";
    dot.setAttribute("aria-label", "Go to scene " + (d + 1));
    (function (idx, elBtn) {
      elBtn.addEventListener("click", function () { goTo(idx); });
    })(d, dot);
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }
  function setDots(active) {
    dots.forEach(function (elDot, idx) {
      elDot.classList.toggle("battle-sim__dot--active", idx === active);
    });
  }
  sim.querySelector("[data-actions-prev]").addEventListener("click", function () {
    goTo(Math.max(0, currentStep - 1));
  });
  sim.querySelector("[data-actions-next]").addEventListener("click", function () {
    /* a click landing right as auto-play advanced means "show me the scene
       that just appeared", not "skip past it" — don't compound the two */
    var justAutoAdvanced = Date.now() - lastAutoAt < 900;
    goTo(Math.min(STEP_COUNT - 1, currentStep + (justAutoAdvanced ? 0 : 1)));
  });
  sim.querySelector("[data-actions-replay]").addEventListener("click", function () {
    playAll();
  });

  /* ---------- static fallback ---------- */
  function buildStatic() {
    clearStage();
    FLOWER.forEach(function (c) {
      el("polygon", { "class": "setup-tile", points: hexPts(c.x, c.y, S - 1.5) }, stage);
    });
    makeStack(FLOWER[0].x, FLOWER[0].y, 0);
  }

  if (!hasGsap || reduceMotion) {
    buildStatic();
    setDots(0);
    caption("The five actions — summon, move, battle, harvest, draw — each costs one action; spells and abilities are free.");
    if (controls) controls.style.display = "none";
    return;
  }

  /* ---------- auto-play on approach ---------- */
  if ("IntersectionObserver" in window) {
    var player = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { player.disconnect(); playAll(); }
      });
    }, { threshold: 0.4 });
    player.observe(sim);
  } else {
    playAll();
  }
})();

/* ==========================================================================
   THE ARTEFACTS — code-compiled card explainer + deck explorer.
   Cards are built by MysticCards from MYSTIC_DATA; hotspots annotate each
   element; the pile deals random cards (after fanki's Card Randomizer);
   pointer-tracked gold foil + tilt after simeydotme's holo cards.
   ========================================================================== */
(function () {
  var section = document.querySelector(".artefacts");
  if (!section || !window.MysticCards || !window.MYSTIC_DATA) return;

  var C = window.MysticCards;
  var D = window.MYSTIC_DATA;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof gsap !== "undefined";

  /* ---------- annotated panels ---------- */
  var EXAMPLES = {
    creature: function () { return C.creature(6); },    /* Bruna Sandtinkerer — reaction ability, shows the shield */
    spell: function () { return C.spell("Fireball"); }, /* reaction spell */
    land: function () { return C.land(3); },            /* Desert, harvest 4 */
    tile: function () { return C.tile(1, 4, { tilt: false }); }
  };
  /* annotation anchor keys -> card element selectors */
  var ANCHORS = {
    chip: ".mcard__chip", coin: ".mcard__coin", strength: ".mcard__str",
    rules: ".mcard__rules", shield: ".mcard__shield", "class": ".mcard__class",
    art: ".mcard__art", mirror: ".mcard__mirror", qr: ".mcard__qr",
    tchip: ".mtile__chip", tyield: ".mtile__yield", tart: ".mtile__art",
    tdiamond: ".mtile__diamond"
  };

  document.querySelectorAll("[data-artefact-panel]").forEach(function (panel) {
    var kind = panel.getAttribute("data-artefact-panel");
    var stage = panel.querySelector("[data-artefact-stage]");
    var card = EXAMPLES[kind] && EXAMPLES[kind]();
    if (!stage || !card) return;
    stage.appendChild(card);
    wireDiagram(panel, card);
  });

  /* Dashed connector lines from each numbered label to its card element,
     measured from the live DOM so the diagram stays honest at any size. */
  function wireDiagram(panel, card) {
    var diagram = panel.querySelector("[data-diagram]");
    var svg = diagram && diagram.querySelector(".artefact-lines");
    if (!diagram || !svg) return;
    var SVGNS = "http://www.w3.org/2000/svg";
    var annos = Array.prototype.slice.call(diagram.querySelectorAll(".anno[data-anchor]"));

    function draw() {
      var dr = diagram.getBoundingClientRect();
      if (dr.width < 10) return;
      svg.setAttribute("viewBox", "0 0 " + dr.width + " " + dr.height);
      svg.textContent = "";
      annos.forEach(function (anno) {
        var sel = ANCHORS[anno.getAttribute("data-anchor")];
        var target = sel && card.querySelector(sel);
        if (!target) return;
        var badge = anno.querySelector(".anno__n") || anno;
        var br = badge.getBoundingClientRect();
        var tr = target.getBoundingClientRect();
        var left = anno.getAttribute("data-side") === "left";
        /* start at the numeral edge facing the card, end at the
           element edge facing the label — never covering the art */
        var x1 = (left ? br.right : br.left) - dr.left;
        var y1 = br.top + br.height / 2 - dr.top;
        var x2 = (left ? tr.left : tr.right) - dr.left;
        var y2 = tr.top + tr.height / 2 - dr.top;
        var line = document.createElementNS(SVGNS, "line");
        line.setAttribute("x1", x1.toFixed(1));
        line.setAttribute("y1", y1.toFixed(1));
        line.setAttribute("x2", x2.toFixed(1));
        line.setAttribute("y2", y2.toFixed(1));
        line.setAttribute("class", "artefact-line");
        svg.appendChild(line);
        var dot = document.createElementNS(SVGNS, "circle");
        dot.setAttribute("cx", x2.toFixed(1));
        dot.setAttribute("cy", y2.toFixed(1));
        dot.setAttribute("r", "3");
        dot.setAttribute("class", "artefact-line-dot");
        svg.appendChild(dot);
      });
    }

    /* keep honest: fonts, images and layout shifts all move the anchors */
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    window.addEventListener("load", draw);
    if (window.ResizeObserver) new ResizeObserver(draw).observe(diagram);

    /* connectors fade in gently when the panel scrolls into view */
    if (hasGsap && !reduceMotion && window.ScrollTrigger) {
      gsap.set(svg, { opacity: 0 });
      ScrollTrigger.create({
        trigger: diagram,
        start: "top 82%",
        once: true,
        onEnter: function () {
          draw();
          gsap.to(svg, { opacity: 1, duration: 0.7, ease: "power2.out" });
        }
      });
    }
  }

  /* ---------- deck explorer ---------- */
  var deck = document.querySelector("[data-deck]");
  if (deck) {
    var pile = deck.querySelector("[data-deck-draw]");
    var stageEl = deck.querySelector("[data-deck-stage]");
    var meta = deck.querySelector("[data-deck-meta]");

    for (var b = 0; b < 3; b++) pile.insertBefore(C.back(), pile.firstChild);

    var drawing = false;
    function pickRandom() {
      var roll = Math.random();
      if (roll < 0.55) {
        var c = D.creatures[(Math.random() * D.creatures.length) | 0];
        var ab = D.ability[c.abilityId];
        return {
          node: C.creature(c.id),
          meta: "<strong>" + c.name + "</strong> — " + D.biome[c.biomeId].name + " " + D.cls[c.classId].name +
                " · Strength " + c.strength + " · " + ab.name + (ab.reaction ? " (reaction)" : "")
        };
      }
      if (roll < 0.85) {
        var s = D.spells[(Math.random() * D.spells.length) | 0];
        return {
          node: C.spell(s.name),
          meta: "<strong>" + s.name + "</strong> — Spell" + (s.reaction ? " · reaction" : "") + " · costs 1 gold"
        };
      }
      var l = D.lands[(Math.random() * D.lands.length) | 0];
      return {
        node: C.land(l.id),
        meta: "<strong>" + D.biome[l.biomeId].name + " land</strong> — yields " + l.harvest + " gold when harvested"
      };
    }

    pile.addEventListener("click", function () {
      if (drawing) return;
      drawing = true;
      var pick = pickRandom();
      var old = stageEl.querySelector(".mcard");
      stageEl.appendChild(pick.node);
      meta.innerHTML = pick.meta;
      if (hasGsap && !reduceMotion) {
        gsap.fromTo(pick.node,
          { rotationY: -95, x: -140, opacity: 0, scale: 0.82 },
          { rotationY: 0, x: 0, opacity: 1, scale: 1, duration: 0.75, ease: "power3.out",
            onComplete: function () { drawing = false; } });
        if (old) {
          gsap.to(old, { rotationY: 55, x: 110, opacity: 0, scale: 0.9, duration: 0.5, ease: "power2.in",
            onComplete: function () { old.remove(); } });
        }
      } else {
        if (old) old.remove();
        drawing = false;
      }
    });
  }

  /* ---------- gold-foil tilt (pointer-fine devices only) ---------- */
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    var active = null;
    var reset = function (card) {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--hover", "0");
    };
    document.addEventListener("pointermove", function (e) {
      var card = e.target && e.target.closest ? e.target.closest("[data-tilt]") : null;
      if (card !== active) { if (active) reset(active); active = card; }
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      var py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      card.style.setProperty("--mx", (px * 100).toFixed(1));
      card.style.setProperty("--my", (py * 100).toFixed(1));
      card.style.setProperty("--ry", ((px - 0.5) * 14).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
      card.style.setProperty("--hover", "1");
    });
    document.addEventListener("pointerout", function (e) {
      if (active && !active.contains(e.relatedTarget)) { reset(active); active = null; }
    });
  }
})();
