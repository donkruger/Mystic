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
    var cir = document.createElementNS(ns, "circle");
    cir.setAttribute("r", r || 16);
    var t = document.createElementNS(ns, "text");
    t.setAttribute("y", 5);
    t.textContent = label;
    g.appendChild(cir);
    g.appendChild(t);
    board.appendChild(g);
    return g;
  }
  var demonToken = makeToken("sim-token--demon", "D");
  var eliteToken = makeToken("sim-token--elite", "E");
  var blockers = [makeToken("sim-token--blocker", "✕", 13), makeToken("sim-token--blocker", "✕", 13)];

  function place(token, q, r) {
    var cell = cellMap[key(q, r)];
    if (hasGsap && !reduceMotion) {
      gsap.set(token, { x: cell.cx, y: cell.cy, scale: 1, opacity: 1, transformOrigin: "50% 50%" });
    } else {
      token.setAttribute("transform", "translate(" + cell.cx + "," + cell.cy + ")");
    }
  }
  function hideToken(token) {
    if (hasGsap && !reduceMotion) gsap.set(token, { opacity: 0, scale: 0 });
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
  function rollValues() {
    if (!diceBox) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (groups) {
        if (done) return;
        done = true;
        var values = [];
        (groups || []).forEach(function (g) {
          if (g && g.rolls) g.rolls.forEach(function (r) { if (typeof r.value === "number") values.push(r.value); });
          else if (g && typeof g.value === "number") values.push(g.value);
        });
        resolve(values.length >= 2 ? values.slice(0, 2) : null);
      };
      diceBox.onRollComplete = finish;
      try {
        var p = diceBox.roll("2d6");
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
      svg.setAttribute("class", "battle-sim__flatdie");
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
      elite = values ? values[0] : 1 + Math.floor(Math.random() * 6);
      demon = values ? values[1] : 1 + Math.floor(Math.random() * 6);
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

  function runStep(idx, token) {
    currentStep = idx;
    return STEPS[idx](token);
  }
  async function playAll() {
    var token = ++playToken;
    for (var i = 0; i < STEP_COUNT; i++) {
      if (!alive(token)) return;
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
    goTo(Math.min(STEP_COUNT - 1, currentStep + 1));
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
