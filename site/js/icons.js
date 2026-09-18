/* ==========================================================================
   Mystic — vector biome icons
   Single-color geometric marks on a 24x24 grid, currentColor throughout:
   clean spot-color / foil separations at any size. Print masters live at
   site/assets/icons/biome/<slug>.svg — keep both in sync.
   ========================================================================== */
window.MYSTIC_ICONS = (function () {
  "use strict";

  var biome = {
    /* Desert — sun over twin dunes */
    desert:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<circle cx="16.5" cy="6.5" r="3"/>' +
      '<path d="M3 15.2 Q8 10.6 13 15.2 Z"/>' +
      '<path d="M8 19.2 Q14.5 13.6 21 19.2 Z"/></svg>',

    /* Forest — tiered pine */
    forest:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<polygon points="12,2.5 15.6,7.6 13.6,7.6 16.8,12.2 14.4,12.2 18,17 6,17 9.6,12.2 7.2,12.2 10.4,7.6 8.4,7.6"/>' +
      '<rect x="11" y="17" width="2" height="3.8" rx="0.6"/></svg>',

    /* Tundra — six-arm snowflake */
    tundra:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M12 3.2v17.6"/>' +
      '<path d="M4.4 7.6l15.2 8.8"/>' +
      '<path d="M19.6 7.6L4.4 16.4"/>' +
      '<circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/></svg>',

    /* Plains — wheat stalk */
    plains:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 2.6 Q13.8 4.8 12 7.4 Q10.2 4.8 12 2.6 Z"/>' +
      '<path d="M12 8.2 Q15 5.8 17.8 7.2 Q15.2 10 12 8.2 Z"/>' +
      '<path d="M12 8.2 Q9 5.8 6.2 7.2 Q8.8 10 12 8.2 Z"/>' +
      '<path d="M12 11.4 Q15 9 17.8 10.4 Q15.2 13.2 12 11.4 Z"/>' +
      '<path d="M12 11.4 Q9 9 6.2 10.4 Q8.8 13.2 12 11.4 Z"/>' +
      '<path d="M12 14.6 Q15 12.2 17.8 13.6 Q15.2 16.4 12 14.6 Z"/>' +
      '<path d="M12 14.6 Q9 12.2 6.2 13.6 Q8.8 16.4 12 14.6 Z"/>' +
      '<rect x="11.1" y="7" width="1.8" height="14.2" rx="0.9"/></svg>',

    /* Mountains — twin peaks */
    mountains:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<polygon points="2,19.5 8.5,7 12,12.6 15,5.5 22,19.5"/></svg>',

    /* Town — gabled hall, doorway cut out */
    town:
      '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
      '<path d="M3.2 11.2 L12 4 L20.8 11.2 L19 11.2 L19 20.5 L5 20.5 L5 11.2 Z ' +
      'M10.4 20.5 V15.4 Q10.4 13.9 12 13.9 Q13.6 13.9 13.6 15.4 V20.5 Z"/></svg>',

    /* Swamp — cattail reeds over water */
    swamp:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<ellipse cx="8.95" cy="7" rx="1.7" ry="3.2"/>' +
      '<rect x="8.2" y="9" width="1.5" height="8" rx="0.75"/>' +
      '<ellipse cx="15.05" cy="9.4" rx="1.7" ry="3"/>' +
      '<rect x="14.3" y="11.2" width="1.5" height="5.8" rx="0.75"/>' +
      '<path d="M3 18.8 Q5.2 17 7.4 18.8 T11.8 18.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M12.6 18.8 Q14.8 17 17 18.8 T21.4 18.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',

    /* Ocean — twin wave crests */
    ocean:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M3 9.6 Q6 7.2 9 9.6 Q12 12 15 9.6 Q18 7.2 21 9.6"/>' +
      '<path d="M3 15.6 Q6 13.2 9 15.6 Q12 18 15 15.6 Q18 13.2 21 15.6"/></svg>',

    /* Cave — mound with arched mouth */
    cave:
      '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true">' +
      '<path d="M2.5 20.5 Q2.5 7.5 12 7.5 Q21.5 7.5 21.5 20.5 Z ' +
      'M9.3 20.5 V15.6 Q9.3 13.4 12 13.4 Q14.7 13.4 14.7 15.6 V20.5 Z"/></svg>'
  };

  return {
    biome: function (slug) { return biome[slug] || ""; }
  };
})();
