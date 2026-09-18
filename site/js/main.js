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
        overwrite: true,
        clearProps: "transform" /* drop the composited layer after reveal — stale clip bug */
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
        var distance = function () { return track.scrollWidth - window.innerWidth; };
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
            invalidateOnRefresh: true
          }
        });
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
