/* ==========================================================================
   MysticCards — code-compiled artefact factory.
   Builds creature cards, spell cards, land cards and land tiles as DOM
   from MYSTIC_DATA. Shared partials keep the four artefacts consistent;
   the ART map centralizes every image path so art can be swapped over
   time without touching markup. Styling lives in css/cards.css.
   ========================================================================== */
window.MysticCards = (function () {
  "use strict";

  var D = window.MYSTIC_DATA;

  /* ---------- ART map (single place to re-point art) -------------------- */
  var ART = {
    biomeIcon: function (slug) { return "assets/icon-" + slug + ".png"; },
    classIcon: function (slug) { return "assets/type-" + slug + ".png"; },
    biomeArt: function (slug) { return "assets/biome-" + slug + ".jpg"; },
    classArt: function (slug) { return "assets/creature-" + slug + ".jpg"; },
    hexSymbol: "assets/hex-symbol.png",
    /* curated per-creature art (biome-class), optimized into assets/art/.
       Falls back to class art when no curated piece exists yet. */
    creatureArt: {
      "desert-dwarf": "assets/art/desert-dwarf.jpg"
    },
    /* curated spell art by spell name; generic fallback otherwise */
    spellArt: {
      "Fireball": "assets/art/spell-fire.jpg",
      "Meteor Shower": "assets/art/spell-fire.jpg",
      "Lightning": "assets/art/spell-storm.jpg"
    },
    spellFallback: "assets/art/spell-arcane.jpg"
  };

  function creatureArt(biomeSlug, classSlug) {
    return ART.creatureArt[biomeSlug + "-" + classSlug] || ART.classArt(classSlug);
  }
  function spellArt(name) {
    return ART.spellArt[name] || ART.spellFallback;
  }

  /* ---------- tiny DOM helper -------------------------------------------- */
  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  function img(src, alt, parent) {
    var i = new Image();
    i.src = src;
    i.alt = alt || "";
    i.loading = "lazy";
    if (parent) parent.appendChild(i);
    return i;
  }

  /* ---------- shared partials --------------------------------------------- */
  function biomeChip(biomeId, parent) {
    var b = D.biome[biomeId];
    var chip = el("span", "mcard__chip", parent);
    chip.title = b.name + " biome";
    /* inner hex window: the medallion is an opaque square, so it is
       zoomed inside a nested clip — same art as the biome chart */
    var win = el("span", "mcard__chipin", chip);
    img(ART.biomeIcon(b.slug), b.name, win);
    return chip;
  }
  function coin(value, label, parent) {
    var c = el("span", "mcard__coin", parent);
    c.textContent = value;
    c.title = label;
    return c;
  }
  function diamond(value, parent) {
    var d = el("span", "mcard__diamond", parent);
    d.title = "Strength " + value;
    el("span", null, d).textContent = value;
    return d;
  }
  function classIcon(classId, parent) {
    var c = D.cls[classId];
    var wrap = el("span", "mcard__class", parent);
    wrap.title = c.name;
    img(ART.classIcon(c.slug), c.name, wrap);
    return wrap;
  }
  function reactionShield(parent) {
    /* golden shield = playable as a reaction (Glossary) */
    var s = el("span", "mcard__shield", parent);
    s.title = "Reaction — may be played in response to another player's action";
    s.innerHTML =
      '<svg viewBox="0 0 24 28" aria-hidden="true">' +
      '<defs><linearGradient id="mshield-g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f6e7bd"/><stop offset="0.55" stop-color="#c9a24b"/>' +
      '<stop offset="1" stop-color="#8a6a25"/></linearGradient></defs>' +
      '<path d="M12 1 L22 5 V13.5 C22 20.5 17.5 25.2 12 27 C6.5 25.2 2 20.5 2 13.5 V5 Z" ' +
      'fill="url(#mshield-g)" stroke="#8a6a25" stroke-width="1.2"/>' +
      '<path d="M12 4.2 L18.6 7 V13.3 C18.6 18.4 15.4 22 12 23.4 C8.6 22 5.4 18.4 5.4 13.3 V7 Z" ' +
      'fill="none" stroke="rgba(255,253,244,0.75)" stroke-width="1"/>' +
      '<path d="M12.8 8 L9.6 14.4 H11.6 L11 19.6 L14.6 12.8 H12.4 Z" fill="#fffdf4"/>' +
      "</svg>";
    return s;
  }
  function artWindow(src, alt, parent) {
    var fig = el("figure", "mcard__art", parent);
    img(src, alt, fig);
    return fig;
  }
  function finishShell(card, tilt) {
    /* foil + glare layers + optional pointer tilt flag */
    el("div", "mcard__foil", card.querySelector(".mcard__inner"));
    el("div", "mcard__glare", card.querySelector(".mcard__inner"));
    if (tilt !== false) card.setAttribute("data-tilt", "");
    return card;
  }
  function shell(kind) {
    var card = el("article", "mcard mcard--" + kind);
    el("div", "mcard__inner", card);
    return card;
  }

  /* ---------- creature card ----------------------------------------------- */
  function creature(id, opts) {
    var c = D.creature[id];
    if (!c) return null;
    var biome = D.biome[c.biomeId];
    var cls = D.cls[c.classId];
    var ab = D.ability[c.abilityId];

    var card = shell("creature");
    var inner = card.firstChild;

    var head = el("header", "mcard__head", inner);
    biomeChip(c.biomeId, head);
    el("h4", "mcard__name", head).textContent = c.name;
    /* NOTE: summoning cost is not yet a data field (MYSTIC_ARTEFACTS.md
       §6.1) — the coin shows strength as a placeholder until costs land. */
    coin(c.strength, "Summoning cost (placeholder: strength)", head);

    artWindow(creatureArt(biome.slug, cls.slug), c.name + " — " + cls.name + " of the " + biome.name, inner);

    var rules = el("div", "mcard__rules", inner);
    el("strong", null, rules).textContent = ab.name;
    rules.appendChild(document.createTextNode(ab.text));

    var foot = el("footer", "mcard__foot", inner);
    diamond(c.strength, foot);
    el("span", "mcard__tag", foot).textContent = cls.name + " · " + biome.name;
    classIcon(c.classId, foot);

    if (ab.reaction) reactionShield(inner);
    return finishShell(card, opts && opts.tilt);
  }

  /* ---------- spell card --------------------------------------------------- */
  function spell(name, opts) {
    var s = D.spell(name);
    if (!s) return null;

    var card = shell("spell");
    var inner = card.firstChild;

    var head = el("header", "mcard__head", inner);
    var chip = el("span", "mcard__chip", head);
    chip.title = "Spell";
    img(ART.hexSymbol, "Spell", chip);
    el("h4", "mcard__name", head).textContent = s.name;
    coin(1, "Cost: 1 gold (Rules: all spells cost 1 gold)", head);

    artWindow(spellArt(s.name), s.name, inner);

    var rules = el("div", "mcard__rules mcard__rules--plain", inner);
    el("strong", null, rules).textContent = "Spell" + (s.reaction ? " · Reaction" : "");
    rules.appendChild(document.createTextNode(s.text));

    var foot = el("footer", "mcard__foot", inner);
    el("span", "mcard__tag", foot).textContent = "Spell card";

    if (s.reaction) reactionShield(inner);
    return finishShell(card, opts && opts.tilt);
  }

  /* ---------- land card ---------------------------------------------------- */
  function land(id, opts) {
    var l = D.land[id];
    if (!l) return null;
    var biome = D.biome[l.biomeId];

    var card = shell("land");
    var inner = card.firstChild;

    var head = el("header", "mcard__head", inner);
    biomeChip(l.biomeId, head);
    el("h4", "mcard__name", head).textContent = biome.name;
    coin(l.harvest, "Harvest yield: " + l.harvest + " gold", head);

    artWindow(ART.biomeArt(biome.slug), biome.name + " land", inner);

    var rules = el("div", "mcard__rules mcard__rules--plain", inner);
    el("strong", null, rules).textContent = "Land";
    rules.appendChild(document.createTextNode(
      "Yields " + l.harvest + " gold when harvested. Place on a matching " +
      biome.name + " tile to summon; its orientation marks your ownership."));

    var foot = el("footer", "mcard__foot", inner);
    el("span", "mcard__tag", foot).textContent = "Land card";

    return finishShell(card, opts && opts.tilt);
  }

  /* ---------- land tile (hex board piece) ---------------------------------- */
  function tile(biomeId, harvest, opts) {
    var biome = D.biome[biomeId];
    if (!biome) return null;
    var harvestYield = harvest == null ? 3 : harvest;

    var t = el("div", "mtile");
    t.setAttribute("role", "img");
    t.setAttribute("aria-label", biome.name + " land tile, yields " + harvestYield + " gold");

    var art = el("div", "mtile__art", t);
    img(ART.biomeArt(biome.slug), "", art);
    el("div", "mtile__veil", t);

    var chip = el("span", "mtile__chip", t);
    chip.title = biome.name + " biome";
    var chipWin = el("span", "mtile__chipin", chip);
    img(ART.biomeIcon(biome.slug), "", chipWin);

    el("span", "mtile__yield", t).textContent = harvestYield;
    el("span", "mtile__diamond", t).title = "Orientation marker — align diamonds when building the map";

    el("div", "mcard__foil", t);
    el("div", "mcard__glare", t);
    if (!opts || opts.tilt !== false) t.setAttribute("data-tilt", "");
    return t;
  }

  /* ---------- card back (deck pile) — single symmetric design -------------- */
  function back() {
    var card = shell("back");
    img(ART.hexSymbol, "", card.firstChild);
    return card;
  }

  return {
    creature: creature,
    spell: spell,
    land: land,
    tile: tile,
    back: back,
    ART: ART
  };
})();
