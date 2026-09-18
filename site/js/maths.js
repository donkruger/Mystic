/* ==========================================================================
   THE INSANE MATHEMATICS OF MYSTIC — every figure computed live.
   Battle odds come from an exact enumeration of the 36 (attacker, defender)
   die outcomes; roster/economy/deck statistics come straight from
   window.MYSTIC_DATA (card-data.js). Change the master data and this page
   re-derives itself. No charting library, no simulation.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("maths-js");

  var D = window.MYSTIC_DATA;
  if (!D) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme palette (read from style.css custom properties) ------- */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  var GOLD = cssVar("--gold", "#c9a24b");
  var GOLD_DEEP = cssVar("--gold-deep", "#8a6a25");
  var MISMATCH = cssVar("--mismatch", "#b0563a");
  var INK = cssVar("--ink", "#221d12");
  var MUTED = cssVar("--muted", "#6f6858");
  var PARCHMENT = "#ece4cf";
  var biomeColor = {};
  D.biomes.forEach(function (b) { biomeColor[b.slug] = cssVar("--biome-" + b.slug, GOLD); });

  /* ---------- formatting --------------------------------------------------- */
  function pc(count, total) { return (100 * count / (total || 36)).toFixed(1) + "%"; }
  function f1(x) { return x.toFixed(1); }
  function f2(x) { return x.toFixed(2).replace(/0$/, ""); }

  /* ==========================================================================
     EXACT BATTLE MATH
     enumerate(modA, modB): all 36 roll pairs. margin = (rollA + modA) - (rollB + modB)
      margin >= 4            -> attacker destroys defender ("kill")
      1 <= margin <= 3       -> defender retreats ("retreat")
      margin == 0            -> draw: the attack fails, defender holds
      -3 <= margin <= -1     -> attacker repelled ("repelled")
      margin <= -4           -> attacker destroyed ("death")
     ========================================================================== */
  function enumerate(modA, modB) {
    var r = { kill: 0, retreat: 0, tie: 0, repelled: 0, death: 0, total: 36 };
    for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) {
      var m = a + modA - (b + modB);
      if (m >= 4) r.kill++;
      else if (m >= 1) r.retreat++;
      else if (m === 0) r.tie++;
      else if (m >= -3) r.repelled++;
      else r.death++;
    }
    r.win = r.kill + r.retreat;          /* attacker flips the tile either way */
    return r;
  }
  function outcomeOf(margin) {
    if (margin >= 4) return "kill";
    if (margin >= 1) return "retreat";
    if (margin === 0) return "tie";
    if (margin >= -3) return "repelled";
    return "death";
  }
  var OUTCOMES = [
    { key: "kill",     label: "Destroy",   note: "attacker wins by 4+" },
    { key: "retreat",  label: "Retreat",   note: "attacker wins by 1–3" },
    { key: "tie",      label: "Draw",      note: "attack fails; defender holds" },
    { key: "repelled", label: "Repelled",  note: "defender wins by 1–3" },
    { key: "death",    label: "Destroyed", note: "defender wins by 4+" }
  ];

  /* ==========================================================================
     DERIVED STATISTICS (all from MYSTIC_DATA)
     ========================================================================== */
  var creatures = D.creatures, lands = D.lands, abilities = D.abilities, spells = D.spells;

  var strSum = creatures.reduce(function (s, c) { return s + c.strength; }, 0);
  var strMean = strSum / creatures.length;
  var strDist = [0, 0, 0, 0, 0, 0, 0]; /* index = strength */
  creatures.forEach(function (c) { strDist[c.strength]++; });

  var budgetByBiome = {}, countByBiome = {};
  creatures.forEach(function (c) {
    budgetByBiome[c.biomeId] = (budgetByBiome[c.biomeId] || 0) + c.strength;
    countByBiome[c.biomeId] = (countByBiome[c.biomeId] || 0) + 1;
  });
  var budgetByClass = {}, countByClass = {};
  creatures.forEach(function (c) {
    budgetByClass[c.classId] = (budgetByClass[c.classId] || 0) + c.strength;
    countByClass[c.classId] = (countByClass[c.classId] || 0) + 1;
  });

  var harvestByBiome = {};
  lands.forEach(function (l) {
    (harvestByBiome[l.biomeId] = harvestByBiome[l.biomeId] || []).push(l.harvest);
  });
  var harvestTotal = lands.reduce(function (s, l) { return s + l.harvest; }, 0);
  var harvestMean = harvestTotal / lands.length;
  function meanOf(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  var desertYieldMean = meanOf(harvestByBiome[1]);
  var otherYields = lands.filter(function (l) { return l.biomeId !== 1; }).map(function (l) { return l.harvest; });
  var otherYieldMean = meanOf(otherYields);

  var abilityCostDist = [0, 0, 0, 0, 0, 0, 0];
  abilities.forEach(function (a) { abilityCostDist[a.cost]++; });
  var abilityCostMean = meanOf(abilities.map(function (a) { return a.cost; }));

  /* implied summoning costs: cost = strength + ability gold cost, the formula
     implied by the north star Ice Elemental (strength 4, cost 6, Freeze = 2) */
  var impliedCosts = creatures.map(function (c) { return c.strength + D.ability[c.abilityId].cost; });
  var impliedCostMean = meanOf(impliedCosts);
  var impliedCostMin = Math.min.apply(null, impliedCosts);
  var impliedCostMax = Math.max.apply(null, impliedCosts);
  var impliedCostDist = {};
  impliedCosts.forEach(function (v) { impliedCostDist[v] = (impliedCostDist[v] || 0) + 1; });

  /* class-targeted spells: only Alliance (Dragon) and Reanimate (Undead) */
  var classSpells = spells.filter(function (s) {
    return D.classes.some(function (c) {
      return new RegExp("\\b" + c.name + "s?\\b", "i").test(s.text);
    });
  });

  var reactAbilities = abilities.filter(function (a) { return a.reaction; });
  var reactSpells = spells.filter(function (s) { return s.reaction; });
  var reactAbilityIds = {};
  reactAbilities.forEach(function (a) { reactAbilityIds[a.id] = true; });
  var reactCreatures = creatures.filter(function (c) { return reactAbilityIds[c.abilityId]; }).length;

  var nLS = lands.length + spells.length;
  var pLand = lands.length / nLS;
  /* opening hand: 2 cards from the 71-card deck; P(at least one land) */
  var pOpenLand = 1 - (spells.length / nLS) * ((spells.length - 1) / (nLS - 1));
  var pBiomeMatch = 1 / D.biomes.length;

  var eq = enumerate(0, 0);            /* parity battle */
  var up1 = enumerate(1, 0), up2 = enumerate(2, 0), up3 = enumerate(3, 0);
  var dn1 = enumerate(-1, 0), dn2 = enumerate(-2, 0);

  /* ==========================================================================
     INLINE VALUES — fill every [data-v] from this map
     ========================================================================== */
  var values = {
    nCreatures: creatures.length, nCreatures2: creatures.length,
    nTiles: lands.length, nLands: lands.length,
    nAbilities: abilities.length, nSpells: spells.length, nSpells2: spells.length,
    nLS: nLS,
    strSum: strSum, strMean: f2(strMean), strMean2: f2(strMean), strMean3: f2(strMean),
    worldMean: f2(strMean),
    killParity: pc(eq.kill), killParity2: pc(eq.kill),
    tieParity: pc(eq.tie), tieParity2: pc(eq.tie),
    holdParity: pc(eq.repelled + eq.death + eq.tie),
    retreatParity: pc(eq.retreat), retreatParity2: pc(eq.retreat),
    winParity: pc(eq.win), flipParity: pc(eq.win),
    tieRange: pc(enumerate(4, 0).tie).replace("%", "") + "–" + pc(eq.tie),
    winPlus1: pc(up1.win), killPlus1: pc(up1.kill),
    winPlus2: pc(up2.win), killPlus2: pc(up2.kill),
    winPlus3: pc(up3.win), killPlus3: pc(up3.kill),
    winMinus1: pc(dn1.win), flipVsBuff: pc(dn2.win),
    killMargin3: pc(6), /* P(margin >= 3 at parity) = 6/36 */
    tundraBudget: budgetByBiome[4], tundraMean: f1(budgetByBiome[4] / countByBiome[4]),
    tundraEff: f1(budgetByBiome[4] / countByBiome[4] + 2),
    mountainBudget: budgetByBiome[5],
    harvestMean: f2(harvestMean), harvestMean2: f2(harvestMean), harvestMean3: f2(harvestMean),
    harvestMean4: f2(harvestMean),
    desertYieldMean: f1(desertYieldMean), desertYieldMean2: f1(desertYieldMean),
    otherYieldMean: f1(otherYieldMean),
    mountainEffMean: f1(meanOf(harvestByBiome[5]) + 2),
    abilityCostMean: f1(abilityCostMean), abilityCostMean2: f1(abilityCostMean),
    impliedCostMean: f2(impliedCostMean), impliedCostMean2: f2(impliedCostMean),
    impliedCostMean3: f2(impliedCostMean),
    impliedCostMin: impliedCostMin, impliedCostMax: impliedCostMax,
    impliedCostRange: impliedCostMin + "–" + impliedCostMax,
    harvestsPerSummon: f1(impliedCostMean / harvestMean),
    harvestsPerSummon2: f1(impliedCostMean / harvestMean),
    classSpells: classSpells.length + " of " + spells.length,
    classesCovered: classSpells.length + " of " + D.classes.length,
    classesOpen: (D.classes.length - classSpells.length) + " of " + D.classes.length,
    oceanEV: f2(4 / 6), oceanEV2: "+" + f2(4 / 6),
    pLand: (100 * pLand).toFixed(1) + "%",
    pOpenLand: (100 * pOpenLand).toFixed(1) + "%",
    pBiomeMatch: (100 * pBiomeMatch).toFixed(1) + "%",
    reactAb: reactAbilities.length + " of " + abilities.length,
    reactSp: reactSpells.length + " of " + spells.length,
    abilityCostMean3: f1(abilityCostMean),
    pLand2: (100 * pLand).toFixed(1) + "%",
    pNoLand: (100 * (1 - pOpenLand)).toFixed(1) + "%"
  };
  document.querySelectorAll("[data-v]").forEach(function (n) {
    var k = n.getAttribute("data-v");
    if (values[k] !== undefined) n.textContent = values[k];
  });

  /* ==========================================================================
     SVG CHART TOOLKIT
     ========================================================================== */
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, str, cls, anchor) {
    var t = el("text", { x: x, y: y, "class": cls || "", "text-anchor": anchor || "middle" }, parent);
    t.textContent = str;
    return t;
  }
  function mount(name) { return document.querySelector('[data-chart="' + name + '"]'); }
  function newSvg(parent, w, h) {
    return el("svg", { viewBox: "0 0 " + w + " " + h, width: "100%", role: "img" }, parent);
  }

  /* ----- generic vertical bars ----- */
  function vbars(mountEl, data, opts) {
    if (!mountEl) return;
    opts = opts || {};
    var W = 560, H = opts.h || 240, padL = 34, padB = 30, padT = 26;
    var maxV = opts.max || Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.15;
    var svg = newSvg(mountEl, W, H);
    var plotW = W - padL - 14, plotH = H - padT - padB;
    var bw = plotW / data.length;
    /* gridlines */
    [0.25, 0.5, 0.75, 1].forEach(function (g) {
      var y = padT + plotH * (1 - g);
      el("line", { x1: padL, x2: W - 14, y1: y, y2: y, "class": "grid-line" }, svg);
    });
    data.forEach(function (d, i) {
      var h = plotH * (d.value / maxV);
      var x = padL + i * bw + bw * 0.18;
      var r = el("rect", {
        x: x, y: padT + plotH - h, width: bw * 0.64, height: Math.max(h, 1.5),
        rx: 4, fill: d.color || GOLD, "class": "anim-bar"
      }, svg);
      if (d.opacity) r.setAttribute("opacity", d.opacity);
      txt(svg, x + bw * 0.32, padT + plotH - h - 7, d.valueLabel != null ? d.valueLabel : d.value, "svg-value");
      txt(svg, padL + i * bw + bw / 2, H - 10, d.label, "svg-label");
    });
    if (opts.meanX != null) {
      /* vertical mean marker: category value v sits at band (v - base + 0.5) / n */
      var base = opts.base || 1;
      var mx = padL + plotW * (opts.meanX - base + 0.5) / data.length;
      el("line", { x1: mx, x2: mx, y1: padT - 6, y2: padT + plotH, "class": "mean-line" }, svg);
      txt(svg, mx + 6, padT - 10, "mean " + f2(opts.meanX), "svg-note", "start");
    }
  }

  /* ----- generic horizontal bars ----- */
  function hbars(mountEl, data, opts) {
    if (!mountEl) return;
    opts = opts || {};
    var W = 600, rowH = opts.rowH || 34, padL = opts.labelW || 128, padR = 96, padT = 8;
    var H = padT + data.length * rowH + 8;
    var maxV = opts.max || Math.max.apply(null, data.map(function (d) { return d.value; })) * 1.06;
    var svg = newSvg(mountEl, W, H);
    var plotW = W - padL - padR;
    data.forEach(function (d, i) {
      var y = padT + i * rowH;
      txt(svg, padL - 10, y + rowH / 2 + 4, d.label, "svg-label", "end");
      var w = Math.max(plotW * (d.value / maxV), 2);
      el("rect", { x: padL, y: y + 5, width: w, height: rowH - 10, rx: 5, fill: d.color || GOLD, "class": "anim-bar" }, svg);
      var v = txt(svg, padL + w + 8, y + rowH / 2 + 4, d.valueLabel != null ? d.valueLabel : d.value, "svg-value", "start");
      if (d.sub) v.textContent += "  " + d.sub;
    });
  }

  /* ----- 6x6 outcome matrix (reused by the calculator) ----- */
  function matrixInto(mountEl, dmod, small) {
    if (!mountEl) return;
    mountEl.innerHTML = "";
    var cell = small ? 40 : 52, pad = small ? 26 : 34;
    var W = pad * 2 + cell * 6;
    var svg = newSvg(mountEl, W, W + 8);
    txt(svg, pad + cell * 3, 16, "defender rolls →", "svg-note");
    var side = txt(svg, 12, pad + cell * 3, "attacker rolls →", "svg-note");
    side.setAttribute("transform", "rotate(-90 12 " + (pad + cell * 3) + ")");
    for (var a = 1; a <= 6; a++) {
      for (var b = 1; b <= 6; b++) {
        var m = a - b + dmod;
        var x = pad + (b - 1) * cell, y = pad + (a - 1) * cell;
        var oc = outcomeOf(m);
        el("rect", {
          x: x + 1.5, y: y + 1.5, width: cell - 3, height: cell - 3, rx: 7,
          "class": "mx-cell mx-" + oc
        }, svg);
        txt(svg, x + cell / 2, y + cell / 2 + 4.5, (m > 0 ? "+" : "") + m, "mx-num mx-num--" + oc);
        if (a === 1) txt(svg, x + cell / 2, pad - 8, b, "svg-label");
        if (b === 1) txt(svg, pad - 10, y + cell / 2 + 4, a, "svg-label", "end");
      }
    }
  }

  /* ----- legends ----- */
  function fillLegend(name) {
    document.querySelectorAll('[data-legend="' + name + '"]').forEach(function (ul) {
      OUTCOMES.forEach(function (o) {
        var li = document.createElement("li");
        var sw = document.createElement("span");
        sw.className = "mlegend__swatch mx-" + o.key;
        li.appendChild(sw);
        var t = document.createElement("span");
        t.innerHTML = "<strong>" + o.label + "</strong>: " + o.note;
        li.appendChild(t);
        ul.appendChild(li);
      });
    });
  }

  /* ==========================================================================
     SECTION 1 — THE DIE IS CAST
     ========================================================================== */
  matrixInto(mount("matrix"), 0, false);
  fillLegend("matrix");
  fillLegend("ladder");

  /* triangular distribution of (attacker - defender) at parity */
  (function () {
    var m = mount("diffdist");
    if (!m) return;
    var data = [];
    for (var d = -5; d <= 5; d++) {
      var count = 6 - Math.abs(d);
      data.push({ label: (d > 0 ? "+" : "") + d, value: count, valueLabel: pc(count), color: null, outcome: outcomeOf(d) });
    }
    var W = 560, H = 240, padL = 20, padB = 30, padT = 26;
    var svg = newSvg(m, W, H);
    var plotW = W - padL - 14, plotH = H - padT - padB;
    var bw = plotW / data.length;
    data.forEach(function (d, i) {
      var h = plotH * (d.value / 6);
      var x = padL + i * bw + bw * 0.14;
      el("rect", {
        x: x, y: padT + plotH - h, width: bw * 0.72, height: h, rx: 4,
        "class": "anim-bar mx-" + d.outcome
      }, svg);
      txt(svg, x + bw * 0.36, padT + plotH - h - 7, d.valueLabel, "svg-value");
      txt(svg, padL + i * bw + bw / 2, H - 10, d.label, "svg-label");
    });
  })();

  /* the ladder of advantage: stacked outcome bars per differential */
  (function () {
    var m = mount("ladder");
    if (!m) return;
    var diffs = [4, 3, 2, 1, 0, -1, -2, -3];
    var W = 600, rowH = 34, padL = 52, padR = 74, padT = 6;
    var H = padT + diffs.length * rowH + 10;
    var svg = newSvg(m, W, H);
    var plotW = W - padL - padR;
    diffs.forEach(function (d, i) {
      var r = enumerate(d, 0);
      var y = padT + i * rowH;
      txt(svg, padL - 12, y + rowH / 2 + 4, (d > 0 ? "+" : "") + d, "svg-value", "end");
      var x = padL;
      OUTCOMES.forEach(function (o) {
        var c = r[o.key];
        if (!c) return;
        var w = plotW * c / 36;
        el("rect", { x: x, y: y + 5, width: w, height: rowH - 10, "class": "mx-" + o.key }, svg);
        if (c >= 3) txt(svg, x + w / 2, y + rowH / 2 + 4, Math.round(100 * c / 36) + "", "mx-pct mx-pct--" + o.key);
        x += w;
      });
      txt(svg, W - padR + 12, y + rowH / 2 + 4, pc(r.win) + " win", "svg-note", "start");
    });
  })();

  /* ==========================================================================
     SECTION 2 — THE ROSTER
     ========================================================================== */
  vbars(mount("strhist"), [1, 2, 3, 4, 5, 6].map(function (s) {
    return { label: "str " + s, value: strDist[s], color: s >= 5 ? GOLD_DEEP : GOLD };
  }), { meanX: strMean, max: 32 });

  hbars(mount("classmeans"), D.classes.map(function (c) {
    return {
      label: c.name,
      value: budgetByClass[c.id] / countByClass[c.id],
      valueLabel: f2(budgetByClass[c.id] / countByClass[c.id]),
      color: GOLD
    };
  }).sort(function (a, b) { return b.value - a.value; }), { max: 4.6, labelW: 104 });

  hbars(mount("biomebudget"), D.biomes.map(function (b) {
    return {
      label: b.name,
      value: budgetByBiome[b.id],
      valueLabel: budgetByBiome[b.id] + "  ·  mean " + f1(budgetByBiome[b.id] / countByBiome[b.id]),
      color: biomeColor[b.slug]
    };
  }).sort(function (a, b) { return b.value - a.value; }), { max: 50, labelW: 104, rowH: 38 });

  /* ==========================================================================
     SECTION 3 — BIOME EQUITY
     ========================================================================== */
  (function () {
    var m = mount("buffpower");
    if (!m) return;
    var wrapA = document.createElement("div");
    var wrapB = document.createElement("div");
    wrapA.className = "mchart__half";
    wrapB.className = "mchart__half";
    var hA = document.createElement("h4"); hA.className = "mchart__sub"; hA.textContent = "Dice: your win% in an even-base fight";
    var hB = document.createElement("h4"); hB.className = "mchart__sub"; hB.textContent = "Gold: expected gold per trigger";
    m.appendChild(hA); m.appendChild(hB);
    m.appendChild(wrapA); m.appendChild(wrapB);
    hbars(wrapA, [
      { label: "Acclimatized (Tundra)", value: 100 * up2.win / 36, valueLabel: pc(up2.win), color: biomeColor.tundra, sub: "atk + def" },
      { label: "Hidden (Forest)", value: 100 * up2.win / 36, valueLabel: pc(up2.win), color: biomeColor.forest, sub: "defence only" },
      { label: "No biome (baseline)", value: 100 * eq.win / 36, valueLabel: pc(eq.win), color: MUTED },
      { label: "Exposed (Plains)", value: 100 * dn1.win / 36, valueLabel: pc(dn1.win), color: biomeColor.plains },
      { label: "Frostbitten (Tundra)", value: 100 * dn2.win / 36, valueLabel: pc(dn2.win), color: MISMATCH }
    ], { max: 100, labelW: 168, rowH: 36 });
    hbars(wrapB, [
      { label: "Resourceful (Mountain)", value: 2, valueLabel: "+2.00", color: biomeColor.mountains, sub: "per harvest" },
      { label: "Negotiator (Town)", value: 2, valueLabel: "+2.00", color: biomeColor.town, sub: "per adjacent ally" },
      { label: "Conditioned (Desert)", value: 1, valueLabel: "+1.00", color: biomeColor.desert, sub: "per crossing" },
      { label: "Lucky (Ocean)", value: 4 / 6, valueLabel: "+0.67", color: biomeColor.ocean, sub: "EV per entry" }
    ], { max: 2.4, labelW: 168, rowH: 36 });
  })();

  /* biome table with quantified values */
  (function () {
    var table = document.querySelector('[data-table="biomes"]');
    if (!table || !window.MYSTIC_ICONS) return;
    var tbody = table.querySelector("tbody");
    var quant = {
      desert:   ["+1 gold per crossing (±2 per in-and-out)", "−1 gold per crossing"],
      forest:   ["+2 str defending: attacker win " + pc(eq.win) + " → " + pc(dn2.win), "tempo: no enter-and-leave in one turn"],
      tundra:   ["+2 str: win " + pc(eq.win) + " → " + pc(up2.win) + ", kill " + pc(eq.kill) + " → " + pc(up2.kill), "−2 str: win " + pc(eq.win) + " → " + pc(dn2.win) + ", death " + pc(eq.death) + " → " + pc(up2.kill)],
      plains:   ["attack from 2 tiles away (positional)", "−1 to rolls: win " + pc(eq.win) + " → " + pc(dn1.win)],
      mountains:["+2 gold per harvest (+" + Math.round(200 / 2.5) + "% on its mean tile)", "spells & abilities blocked, which cuts both ways"],
      town:     ["+2 gold per adjacent ally, −1 per enemy", "+1 per ally, −2 per adjacent enemy"],
      swamp:    ["1-action crossings, may skip swamps", "2-action crossings, up to ⅔ of a turn"],
      ocean:    ["EV +0.67 gold per entry (⅙ × 4)", "⅙ chance: discard 2 non-land cards"],
      cave:     ["exit in any direction", "exit only where you entered"]
    };
    D.biomes.forEach(function (b) {
      var tr = document.createElement("tr");
      var icon = '<span class="bicon bicon--' + b.slug + '">' + window.MYSTIC_ICONS.biome(b.slug) + "</span>";
      tr.innerHTML =
        "<td><span class='mtable__biome'>" + icon + b.name + "</span></td>" +
        "<td><strong class='mtable__fx--match'>" + b.buff.name + "</strong><br>" + b.buff.text + "</td>" +
        "<td>" + quant[b.slug][0] + "</td>" +
        "<td><strong class='mtable__fx--mismatch'>" + b.debuff.name + "</strong><br>" + b.debuff.text + "</td>" +
        "<td>" + quant[b.slug][1] + "</td>";
      tbody.appendChild(tr);
    });
  })();

  /* ==========================================================================
     SECTION 4 — THE ECONOMY
     ========================================================================== */
  (function () {
    var m = mount("harvest");
    if (!m) return;
    var W = 600, rowH = 30, padL = 104, padR = 40, padT = 10;
    var rows = D.biomes.map(function (b) {
      var ys = harvestByBiome[b.id].slice().sort(function (x, y) { return x - y; });
      return { name: b.name, slug: b.slug, ys: ys, mean: meanOf(ys) };
    }).sort(function (a, b) { return b.mean - a.mean; });
    var H = padT + rows.length * rowH + 22;
    var svg = newSvg(m, W, H);
    var plotW = W - padL - padR;
    function gx(v) { return padL + plotW * (v - 0.5) / 5; }
    [1, 2, 3, 4, 5].forEach(function (v) {
      el("line", { x1: gx(v), x2: gx(v), y1: padT - 2, y2: H - 22, "class": "grid-line" }, svg);
      txt(svg, gx(v), H - 6, v + "g", "svg-label");
    });
    rows.forEach(function (r, i) {
      var y = padT + i * rowH + rowH / 2;
      txt(svg, padL - 10, y + 4, r.name, "svg-label", "end");
      el("line", { x1: gx(r.ys[0]), x2: gx(r.ys[r.ys.length - 1]), y1: y, y2: y, stroke: biomeColor[r.slug], "stroke-width": 3, "stroke-linecap": "round", opacity: 0.45 }, svg);
      r.ys.forEach(function (v) {
        el("circle", { cx: gx(v), cy: y, r: 5.5, fill: biomeColor[r.slug], "class": "anim-dot" }, svg);
      });
      el("circle", { cx: gx(r.mean), cy: y, r: 8, fill: "none", stroke: GOLD_DEEP, "stroke-width": 2 }, svg);
      txt(svg, gx(r.mean), y - 13, f1(r.mean), "svg-value");
    });
  })();

  vbars(mount("abilitycost"), [1, 2, 3, 4, 5, 6].map(function (c) {
    return { label: c + " gold", value: abilityCostDist[c], color: c >= 5 ? GOLD_DEEP : GOLD };
  }), { meanX: abilityCostMean, max: 8 });

  /* implied summoning-cost curve: cost = strength + ability cost */
  (function () {
    var data = [];
    for (var v = impliedCostMin; v <= impliedCostMax; v++) {
      data.push({ label: v + "g", value: impliedCostDist[v] || 0, color: v >= 9 ? GOLD_DEEP : GOLD });
    }
    vbars(mount("costcurve"), data, { meanX: impliedCostMean, base: impliedCostMin, max: 24 });
  })();

  /* ==========================================================================
     SECTION 5 — DECK & DRAW MATH
     ========================================================================== */
  (function () {
    var m = mount("decksplit");
    if (!m) return;
    var W = 600, padL = 8, padR = 8;
    var H = 150;
    var svg = newSvg(m, W, H);
    var plotW = W - padL - padR;
    function stackedBar(y, label, parts) {
      txt(svg, padL, y - 8, label, "svg-label", "start");
      var x = padL;
      parts.forEach(function (p) {
        var w = plotW * p.frac;
        el("rect", { x: x, y: y, width: w, height: 30, fill: p.color, "class": "anim-bar" }, svg);
        if (p.frac > 0.12) {
          var t = txt(svg, x + w / 2, y + 20, p.label, "mx-pct");
          t.setAttribute("fill", p.text || "#fff");
        }
        x += w;
      });
    }
    stackedBar(34, "The Lands & Spells deck (" + nLS + " cards)", [
      { frac: pLand, label: lands.length + " lands · " + (100 * pLand).toFixed(1) + "%", color: GOLD },
      { frac: 1 - pLand, label: spells.length + " spells · " + (100 * (1 - pLand)).toFixed(1) + "%", color: PARCHMENT, text: MUTED }
    ]);
    stackedBar(104, "Your opening hand (2 cards from that deck)", [
      { frac: pOpenLand, label: "≥1 land · " + (100 * pOpenLand).toFixed(1) + "%", color: GOLD_DEEP },
      { frac: 1 - pOpenLand, label: "no land · " + (100 * (1 - pOpenLand)).toFixed(1) + "%", color: MISMATCH }
    ]);
  })();

  hbars(mount("reactions"), [
    { label: "Creatures with a reaction ability", value: 100 * reactCreatures / creatures.length, valueLabel: reactCreatures + "/" + creatures.length + " · " + (100 * reactCreatures / creatures.length).toFixed(1) + "%", color: GOLD_DEEP },
    { label: "Abilities that are reactions", value: 100 * reactAbilities.length / abilities.length, valueLabel: reactAbilities.length + "/" + abilities.length + " · " + (100 * reactAbilities.length / abilities.length).toFixed(1) + "%", color: GOLD },
    { label: "Spells that are reactions", value: 100 * reactSpells.length / spells.length, valueLabel: reactSpells.length + "/" + spells.length + " · " + (100 * reactSpells.length / spells.length).toFixed(1) + "%", color: GOLD },
    { label: "“Roll above 3” triggers", value: 50, valueLabel: "3/6 · 50.0%", color: PARCHMENT },
    { label: "“Roll above 4” triggers", value: 100 * 2 / 6, valueLabel: "2/6 · 33.3%", color: PARCHMENT }
  ], { max: 100, labelW: 218, rowH: 38 });

  /* ==========================================================================
     SECTION 6 — THE CHAIN (live polyhex enumeration)
     ========================================================================== */
  var DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  var PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function canonKey(cells) {
    var best = null;
    PERMS.forEach(function (p) {
      [1, -1].forEach(function (s) {
        var t = cells.map(function (c) {
          var cube = [c[0], -c[0] - c[1], c[1]];      /* axial -> cube (x, y, z) */
          return [s * cube[p[0]], s * cube[p[2]]];    /* permute + maybe negate -> axial */
        });
        t.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
        var q0 = t[0][0], r0 = t[0][1];
        var key = t.map(function (c) { return (c[0] - q0) + "," + (c[1] - r0); }).join(";");
        if (best === null || key < best) best = key;
      });
    });
    return best;
  }
  function freePolyhexes(n) {
    var current = new Map();
    var seed = [[0, 0]];
    current.set(canonKey(seed), seed);
    for (var size = 1; size < n; size++) {
      var next = new Map();
      current.forEach(function (cells) {
        var inSet = {}, frontier = {};
        cells.forEach(function (c) { inSet[c[0] + "," + c[1]] = true; });
        cells.forEach(function (c) {
          DIRS.forEach(function (d) {
            var nc = [c[0] + d[0], c[1] + d[1]], k = nc[0] + "," + nc[1];
            if (!inSet[k]) frontier[k] = nc;
          });
        });
        Object.keys(frontier).forEach(function (k) {
          var shape = cells.concat([frontier[k]]);
          var key = canonKey(shape);
          if (!next.has(key)) next.set(key, shape);
        });
      });
      current = next;
    }
    return current;
  }
  var polyCounts = {}, polyShapes = {};
  for (var pn = 3; pn <= 7; pn++) {
    var ph = freePolyhexes(pn);
    polyCounts[pn] = ph.size;
    if (pn <= 4) polyShapes[pn] = Array.from(ph.values());
  }
  values.poly7 = polyCounts[7];
  var poly7Node = document.querySelector('[data-v="poly7"]');
  if (poly7Node) poly7Node.textContent = polyCounts[7];

  /* draw every winning shape of sizes 3 and 4 — each cell borrows the
     landing page's hero-map tile verbatim: gold ring + parchment inset +
     biome icon, at the hero-map ratios (stepX = 0.866W, stepY = 0.75W,
     hexRound clip). Deliberately small: this is a diagram, not a hero. */
  (function () {
    var m = mount("polyhex");
    if (!m || !window.MYSTIC_ICONS) return;
    var W = 34; /* cell box, px */
    function rot60(c) { return [-c[1], c[0] + c[1]]; } /* axial 60° rotation */
    function layout(cells) {
      var pts = cells.map(function (c) {
        return [0.866 * W * (c[0] + c[1] / 2), 0.75 * W * c[1]];
      });
      var minX = Math.min.apply(null, pts.map(function (p) { return p[0]; }));
      var minY = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
      var norm = pts.map(function (p) { return [p[0] - minX, p[1] - minY]; });
      var maxX = Math.max.apply(null, norm.map(function (p) { return p[0]; }));
      var maxY = Math.max.apply(null, norm.map(function (p) { return p[1]; }));
      return { pts: norm, w: maxX + W, h: maxY + W };
    }
    [3, 4].forEach(function (size) {
      var row = document.createElement("div");
      row.className = "polyrow";
      var cap = document.createElement("p");
      cap.className = "polyrow__cap";
      cap.innerHTML = "<strong>" + size + " tiles</strong>: " + polyCounts[size] + " shape" + (polyCounts[size] > 1 ? "s" : "");
      row.appendChild(cap);
      var strip = document.createElement("div");
      strip.className = "polyrow__strip";
      polyShapes[size].forEach(function (cells, si) {
        /* rotate each shape to its most compact orientation (min height, then min width) */
        var best = null, cur = cells;
        for (var k = 0; k < 6; k++) {
          var lay = layout(cur);
          if (!best || lay.h < best.h - 0.01 || (Math.abs(lay.h - best.h) < 0.01 && lay.w < best.w)) best = lay;
          cur = cur.map(rot60);
        }
        var shape = document.createElement("span");
        shape.className = "polyshape";
        shape.style.width = Math.ceil(best.w) + "px";
        shape.style.height = Math.ceil(best.h) + "px";
        best.pts.forEach(function (p, ci) {
          var biome = D.biomes[(si + ci) % D.biomes.length];
          var cell = document.createElement("span");
          cell.className = "hexmap__cell bicon--" + biome.slug;
          cell.style.width = W + "px";
          cell.style.height = W + "px";
          cell.style.left = p[0].toFixed(1) + "px";
          cell.style.top = p[1].toFixed(1) + "px";
          var inner = document.createElement("span");
          inner.className = "hexmap__cellin";
          inner.innerHTML = window.MYSTIC_ICONS.biome(biome.slug);
          cell.appendChild(inner);
          shape.appendChild(cell);
        });
        strip.appendChild(shape);
      });
      row.appendChild(strip);
      m.appendChild(row);
    });
  })();

  vbars(mount("polycount"), [3, 4, 5, 6, 7].map(function (n) {
    return { label: "chain of " + n, value: polyCounts[n], color: n === 7 ? GOLD_DEEP : GOLD };
  }), { max: 380 });

  /* holding the line: chain survival through k attacks */
  (function () {
    var m = mount("survival");
    if (!m) return;
    var W = 560, H = 250, padL = 44, padB = 30, padT = 18, padR = 120;
    var svg = newSvg(m, W, H);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var pFlipParity = eq.win / 36;          /* 15/36 */
    var pFlipBuff = dn2.win / 36;           /* attacker at -2: 6/36 */
    [0, 25, 50, 75, 100].forEach(function (g) {
      var y = padT + plotH * (1 - g / 100);
      el("line", { x1: padL, x2: W - padR, y1: y, y2: y, "class": "grid-line" }, svg);
      txt(svg, padL - 8, y + 4, g + "%", "svg-label", "end");
    });
    function series(pFlip, color, label) {
      var pts = [];
      for (var k = 1; k <= 6; k++) {
        var x = padL + plotW * (k - 1) / 5;
        var y = padT + plotH * (1 - Math.pow(1 - pFlip, k));
        pts.push([x, y, Math.pow(1 - pFlip, k)]);
      }
      el("polyline", {
        points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "),
        fill: "none", stroke: color, "stroke-width": 2.5, "stroke-linecap": "round"
      }, svg);
      pts.forEach(function (p, i) {
        el("circle", { cx: p[0], cy: p[1], r: 4, fill: color }, svg);
        txt(svg, p[0], p[1] - 9, Math.round(100 * p[2]) + "%", "svg-value");
        if (i === 0) txt(svg, p[0], H - 10, "1 attack", "svg-label");
        else txt(svg, p[0], H - 10, i + 1 + "", "svg-label");
      });
      var last = pts[pts.length - 1];
      txt(svg, last[0] + 10, last[1] + 4, label, "svg-note", "start");
    }
    series(pFlipBuff, GOLD_DEEP, "defender +2 (Forest/Tundra)");
    series(pFlipParity, MISMATCH, "even fight");
  })();

  /* ==========================================================================
     SECTION 7 — BATTLE-ODDS CALCULATOR
     ========================================================================== */
  (function () {
    var root = document.querySelector("[data-calc]");
    if (!root) return;
    function q(name) { return root.querySelector('[data-calc="' + name + '"]'); }
    var selA = q("attacker"), selD = q("defender"), selT = q("tile");
    var cusA = q("attacker-custom"), cusD = q("defender-custom");
    var strA = q("attacker-str"), strD = q("defender-str");
    var bioA = q("attacker-biome"), bioD = q("defender-biome");
    var readA = q("attacker-readout"), readD = q("defender-readout");
    var barsMount = q("bars"), matrixMount = q("matrix");

    function fillCreatureSelect(sel) {
      var opt = document.createElement("option");
      opt.value = "custom";
      opt.textContent = "Custom creature…";
      sel.appendChild(opt);
      D.biomes.forEach(function (b) {
        var g = document.createElement("optgroup");
        g.label = b.name;
        creatures.forEach(function (c) {
          if (c.biomeId !== b.id) return;
          var o = document.createElement("option");
          o.value = c.id;
          o.textContent = c.name + " (str " + c.strength + ")";
          g.appendChild(o);
        });
        sel.appendChild(g);
      });
    }
    function fillBiomeSelect(sel) {
      D.biomes.forEach(function (b) {
        var o = document.createElement("option");
        o.value = b.id;
        o.textContent = b.name;
        sel.appendChild(o);
      });
    }
    fillCreatureSelect(selA); fillCreatureSelect(selD);
    fillBiomeSelect(bioA); fillBiomeSelect(bioD);
    [strA, strD].forEach(function (s) {
      for (var i = 1; i <= 6; i++) {
        var o = document.createElement("option");
        o.value = i; o.textContent = i;
        if (i === 3) o.selected = true;
        s.appendChild(o);
      }
    });
    var openOpt = document.createElement("option");
    openOpt.value = ""; openOpt.textContent = "Open ground (no biome effect)";
    selT.appendChild(openOpt);
    D.biomes.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b.slug; o.textContent = b.name;
      selT.appendChild(o);
    });

    /* defaults: a Tundra dragon defending its home ice against a Forest dragon */
    selA.value = String(D.creature[54].id);  /* Okami — Tundra, str 5 */
    selD.value = String(D.creature[12].id);  /* Sylvanus — Forest, str 5 */
    selT.value = "tundra";

    function side(sel, cus, strSel, bioSel) {
      if (sel.value === "custom") {
        cus.hidden = false;
        return { name: "Custom", str: +strSel.value, biomeId: +bioSel.value };
      }
      cus.hidden = true;
      var c = D.creature[+sel.value];
      return { name: c.name, str: c.strength, biomeId: c.biomeId };
    }
    function modFor(biomeId, tileSlug, isDefender) {
      if (tileSlug === "tundra") return biomeId === 4 ? 2 : -2;
      if (tileSlug === "forest") return (isDefender && biomeId === 2) ? 2 : 0;
      if (tileSlug === "plains") return biomeId === 3 ? 0 : -1;
      return 0;
    }
    function effectNote(biomeId, tileSlug, isDefender) {
      var m = modFor(biomeId, tileSlug, isDefender);
      if (!tileSlug) return "no biome effect";
      var b = D.biome[biomeId];
      if (m > 0) return b.buff.name + " " + (m > 0 ? "+" : "") + m;
      if (m < 0) return b.debuff.name + " " + m;
      return "no strength effect here";
    }
    function render() {
      var a = side(selA, cusA, strA, bioA);
      var d = side(selD, cusD, strD, bioD);
      var tile = selT.value;
      var modA = modFor(a.biomeId, tile, false);
      var modD = modFor(d.biomeId, tile, true);
      var effA = a.str + modA, effD = d.str + modD;
      readA.innerHTML = "<strong>" + a.name + "</strong> · " + D.biome[a.biomeId].name +
        ", base " + a.str + ", " + effectNote(a.biomeId, tile, false) + " → effective <strong>" + effA + "</strong>";
      readD.innerHTML = "<strong>" + d.name + "</strong> · " + D.biome[d.biomeId].name +
        ", base " + d.str + ", " + effectNote(d.biomeId, tile, true) + " → effective <strong>" + effD + "</strong>";

      var r = enumerate(a.str + modA, d.str + modD);
      barsMount.innerHTML = "";
      OUTCOMES.forEach(function (o) {
        var c = r[o.key];
        var row = document.createElement("div");
        row.className = "cbar";
        var pct = pc(c);
        row.innerHTML =
          '<span class="cbar__label"><strong>' + o.label + '</strong><span>' + o.note + "</span></span>" +
          '<span class="cbar__track"><span class="cbar__fill mx-' + o.key + '" style="width:0%"></span></span>' +
          '<span class="cbar__val">' + pct + ' <em>(' + c + "/36)</em></span>";
        barsMount.appendChild(row);
        var fill = row.querySelector(".cbar__fill");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { fill.style.width = (100 * c / 36) + "%"; });
        });
      });
      matrixInto(matrixMount, a.str + modA - (d.str + modD), true);
    }
    [selA, selD, selT, strA, strD, bioA, bioD].forEach(function (s) {
      s.addEventListener("change", render);
    });
    render();
  })();

  /* ==========================================================================
     REVEAL ON SCROLL + PROGRESS BAR (no GSAP dependency on this page)
     ========================================================================== */
  var bar = document.querySelector("[data-progress]");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  var revealEls = document.querySelectorAll("[data-mreveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (n) { n.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (n) { io.observe(n); });
  }
})();
