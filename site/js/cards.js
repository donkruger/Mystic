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
    classIcon: function (slug) { return "assets/type-" + slug + ".png"; },
    biomeArt: function (slug) { return "assets/biome-" + slug + ".jpg"; },
    classArt: function (slug) { return "assets/creature-" + slug + ".jpg"; },
    hexSymbol: "assets/hex-symbol.png",
    potion: "assets/potion.png",
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
    /* raw vector glyph in the biome's accent color — no housing */
    var chip = el("span", "mcard__chip bicon--" + b.slug, parent);
    chip.title = b.name + " biome";
    chip.innerHTML = window.MYSTIC_ICONS.biome(b.slug);
    return chip;
  }
  function coin(value, label, parent) {
    var c = el("span", "mcard__coin", parent);
    c.textContent = value;
    c.title = label;
    return c;
  }
  function strength(value, parent) {
    /* bare gold "+N" numeral — no housing (the die roll adds to it) */
    var d = el("span", "mcard__str", parent);
    d.title = "Strength " + value;
    el("span", "plus", d).textContent = "+";
    d.appendChild(document.createTextNode(value));
    return d;
  }
  function mirror(text, parent) {
    /* opponent index — rotated 180° so it reads from across the table */
    var m = el("span", "mcard__mirror", parent);
    m.textContent = text;
    return m;
  }
  function chevrons(parent) {
    /* column of six stacked upward chevrons beside the art = the card's
       facing direction; gold-foil spot element in print (PPF §1.8 / Part 6) */
    var s = el("span", "mcard__chev", parent);
    s.title = "Orientation — the card faces the way the chevrons point";
    var paths = "";
    for (var i = 0; i < 6; i++) {
      var y = 20 + i * 30;
      paths += '<path d="M4.5 ' + y + ' L12 ' + (y - 8) + ' L19.5 ' + y + '"/>';
    }
    s.innerHTML =
      '<svg viewBox="0 0 24 180" aria-hidden="true">' +
      '<defs><linearGradient id="mchev-g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f6e7bd"/><stop offset="0.55" stop-color="#c9a24b"/>' +
      '<stop offset="1" stop-color="#8a6a25"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#mchev-g)" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>';
    return s;
  }
  function mirrorRules(strongText, text, parent) {
    /* mirrored description band above the art — the opponent reads the card's
       essence upside down; key elements reflect, never the whole card */
    var mr = el("div", "mcard__rules mcard__rules--mirror", parent);
    mr.setAttribute("aria-hidden", "true");
    el("strong", null, mr).textContent = strongText;
    mr.appendChild(document.createTextNode(text));
    return mr;
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
    mirror("+" + c.strength + " · " + ab.name, head);
    /* NOTE: summoning cost is not yet a data field (MYSTIC_ARTEFACTS.md
       §6.1) — the coin shows strength as a placeholder until costs land. */
    coin(c.strength, "Summoning cost (placeholder: strength)", head);

    mirrorRules(ab.name, ab.text, inner);

    /* art at 73% width, left-aligned; right strip holds the chevron column
       with the reaction shield directly below it */
    var mid = el("div", "mcard__mid", inner);
    var fig = artWindow(creatureArt(biome.slug, cls.slug), c.name + " — " + cls.name + " of the " + biome.name, mid);
    el("h4", "mcard__artname", fig).textContent = c.name;
    classIcon(c.classId, fig);
    var strip = el("div", "mcard__strip", mid);
    chevrons(strip);
    if (ab.reaction) reactionShield(strip);

    var rules = el("div", "mcard__rules", inner);
    el("strong", null, rules).textContent = ab.name;
    rules.appendChild(document.createTextNode(ab.text));

    var foot = el("footer", "mcard__foot", inner);
    strength(c.strength, foot);

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
    chip.title = "Spell card";
    /* the spell-mark: raw potion medallion, same treatment as biome chips */
    img(ART.potion, "Spell", chip);
    mirror(s.name, head);
    coin(1, "Cost: 1 gold (Rules: all spells cost 1 gold)", head);

    mirrorRules("Spell" + (s.reaction ? " · Reaction" : ""), s.text, inner);

    var sfig = artWindow(spellArt(s.name), s.name, inner);
    el("h4", "mcard__artname", sfig).textContent = s.name;

    var rules = el("div", "mcard__rules mcard__rules--plain", inner);
    el("strong", null, rules).textContent = "Spell" + (s.reaction ? " · Reaction" : "");
    rules.appendChild(document.createTextNode(s.text));

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
    mirror(biome.name, head);
    coin(l.harvest, "Harvest yield: " + l.harvest + " gold", head);

    var landText = "Yields " + l.harvest + " gold when harvested. Place on a matching " +
      biome.name + " tile to summon; its orientation marks your ownership.";
    mirrorRules("Land", landText, inner);

    /* art at 73% width, left-aligned; chevron column fills the right strip */
    var mid = el("div", "mcard__mid", inner);
    var lfig = artWindow(ART.biomeArt(biome.slug), biome.name + " land", mid);
    el("h4", "mcard__artname", lfig).textContent = biome.name;
    chevrons(el("div", "mcard__strip", mid));

    var rules = el("div", "mcard__rules mcard__rules--plain", inner);
    el("strong", null, rules).textContent = "Land";
    rules.appendChild(document.createTextNode(landText));

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

    /* marker pair (biome chip + yield coin) repeated on every edge,
       rotated 60° apart — one pair per seat around the hex */
    for (var i = 0; i < 6; i++) {
      var mark = el("span", "mtile__mark mtile__mark--" + i, t);
      var chip = el("span", "mtile__chip bicon--" + biome.slug, mark);
      chip.title = biome.name + " biome";
      var chipWin = el("span", "mtile__chipin", chip);
      chipWin.innerHTML = window.MYSTIC_ICONS.biome(biome.slug);
      el("span", "mtile__yield", mark).textContent = harvestYield;
    }

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
