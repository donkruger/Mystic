/* ==========================================================================
   MYSTIC_DATA — single source of truth for every artefact on the site.
   Transcribed from "Master Tables.xlsx - Mystic Artefact Descriptions and
   Metadata.xlsx" (see MYSTIC_ARTEFACTS.md for the reconciliation notes).
   Change data here and every code-rendered card updates.
   ========================================================================== */
window.MYSTIC_DATA = (function () {
  "use strict";

  /* --- Biomes (Biomes_tbl) ------------------------------------------------
     id, name, slug, debuff [name, text] (mismatch), buff [name, text] (match) */
  var biomes = [
    { id: 1, name: "Desert",   slug: "desert",    debuff: { name: "Scorched",     text: "Lose 1 gold whenever a creature enters this biome. Applies to summonings as well." }, buff: { name: "Conditioned",  text: "Gain 1 gold whenever a creature enters this biome. Applies to summonings as well." } },
    { id: 2, name: "Forest",   slug: "forest",    debuff: { name: "Entangled",    text: "Creature can not enter and leave this tile on the same turn." },                        buff: { name: "Camouflaged",  text: "+2 to strength on defense." } },
    { id: 3, name: "Plain",    slug: "plains",    debuff: { name: "Exposed",      text: "-1 to all rolls." },                                                                    buff: { name: "Ranged",       text: "Can attack creatures from an additional tile away. No roll penalty." } },
    { id: 4, name: "Tundra",   slug: "tundra",    debuff: { name: "Frostbitten",  text: "-2 to strength." },                                                                     buff: { name: "Acclimatized", text: "+2 to strength." } },
    { id: 5, name: "Mountain", slug: "mountains", debuff: { name: "Isolated",     text: "Spell cards and abilities do not work on creatures occupying this tile." },             buff: { name: "Resourceful",  text: "+2 gold when harvesting. Spell cards and abilities do work on this creature." } },
    { id: 6, name: "Town",     slug: "town",      debuff: { name: "Bartering",    text: "+1 gold for each adjacent allied creature and -2 gold for each adjacent enemy creature when harvested." }, buff: { name: "Negotiator", text: "+2 gold for each adjacent allied creature. -1 gold for each adjacent enemy creature when harvested." } },
    { id: 7, name: "Swamp",    slug: "swamp",     debuff: { name: "Stuck",        text: "Costs 2 actions to move into or out of this tile." },                                   buff: { name: "Evolved",      text: "Completely skip swamp tiles. Only costs 1 action to move into or out of." } },
    { id: 8, name: "Ocean",    slug: "ocean",     debuff: { name: "Unlucky",      text: "When you enter, roll a die. If the outcome is 1, discard two non-land cards from your hand." }, buff: { name: "Lucky", text: "When you enter, roll a die. If the outcome is 6, draw two cards from either deck." } },
    { id: 9, name: "Cave",     slug: "cave",      debuff: { name: "Trapped",      text: "A creature may only exit this tile from the direction they entered." },                 buff: { name: "Nocturnal",    text: "A creature can navigate out of a cave in any direction." } }
  ];

  /* --- Classes (Class_tbl) ------------------------------------------------ */
  var classes = [
    { id: 1,  name: "Dragon",    slug: "dragon" },
    { id: 2,  name: "Orc",       slug: "orc" },
    { id: 3,  name: "Elite",     slug: "elite" },
    { id: 4,  name: "Undead",    slug: "undead" },
    { id: 5,  name: "Elemental", slug: "elemental" },
    { id: 6,  name: "Angel",     slug: "angel" },
    { id: 7,  name: "Demon",     slug: "demon" },
    { id: 8,  name: "Giant",     slug: "giant" },
    { id: 9,  name: "Mermaid",   slug: "mermaid" },
    { id: 10, name: "Dwarf",     slug: "dwarf" }
  ];

  /* --- Abilities (Abilities_tbl) ------------------------------------------
     id, gold cost, name, reaction flag, rules text. ID 23 is absent in the
     source workbook (see MYSTIC_ARTEFACTS.md §6). */
  var abilities = [
    { id: 1,  cost: 1, name: "Invisibility",            reaction: false, text: "Immune to attacks while in its native biome. Attacking reveals the creature until the start of the next turn." },
    { id: 2,  cost: 3, name: "Multi-attack",            reaction: true,  text: "Roll the die twice in combat and choose the better outcome." },
    { id: 3,  cost: 3, name: "Copy cat",                reaction: true,  text: "Copy the ability of an adjacent ally until the start of the next turn." },
    { id: 4,  cost: 3, name: "Mimicry",                 reaction: true,  text: "Copy the ability of an adjacent enemy until the start of the next turn." },
    { id: 5,  cost: 3, name: "Stun",                    reaction: false, text: "Roll above 3 to stun an adjacent enemy, disabling its movement and attack until the end of its next turn." },
    { id: 6,  cost: 2, name: "Spell Deflect",           reaction: true,  text: "Roll above 3 to deflect spells or abilities targeting the creature, using them instead." },
    { id: 7,  cost: 5, name: "Fear",                    reaction: false, text: "Roll above 4 to force adjacent enemies to the furthest unoccupied tile; destroy them if none exists." },
    { id: 8,  cost: 5, name: "Command",                 reaction: false, text: "Roll above 3 to move all adjacent allies one space; this movement can initiate battles." },
    { id: 9,  cost: 6, name: "Time warp",               reaction: false, text: "Roll above 3 to skip one action of an adjacent enemy player on their next turn." },
    { id: 10, cost: 4, name: "Spontaneous Combustion",  reaction: true,  text: "Roll before attack or defense: above 3 destroys the enemy; below 4 destroys this creature instead." },
    { id: 11, cost: 2, name: "Resistance",              reaction: true,  text: "Negates negative movement effects from biomes for this creature." },
    { id: 12, cost: 4, name: "Golem Body",              reaction: true,  text: "Roll above 3 when defending to avoid the attack." },
    { id: 13, cost: 1, name: "Stealth",                 reaction: false, text: "Move onto an occupied enemy tile without conflict; if still occupied at end of turn, conflict initiates." },
    { id: 14, cost: 6, name: "Flight",                  reaction: false, text: "Move up to three tiles, ignoring occupied tiles and biomes; must land before claiming or battling. Does not work in caves." },
    { id: 15, cost: 3, name: "AOE",                     reaction: false, text: "Use additional actions to attack all adjacent enemies; the same creature can be attacked multiple times." },
    { id: 16, cost: 1, name: "Poison",                  reaction: false, text: "Cannot be destroyed when initiating an attack." },
    { id: 17, cost: 4, name: "Distraction",             reaction: true,  text: "Reduces adjacent enemies' battle strength by one." },
    { id: 18, cost: 5, name: "Telekinesis",             reaction: false, text: "Move an adjacent creature to an unoccupied adjacent tile. Forest restrictions apply." },
    { id: 19, cost: 5, name: "Mind Control",            reaction: false, text: "Force an adjacent creature to move to an unoccupied tile. Cave and forest restrictions apply." },
    { id: 20, cost: 3, name: "Elemental Adaptation",    reaction: true,  text: "+2 Strength when in a matching biome." },
    { id: 21, cost: 2, name: "Support",                 reaction: false, text: "Adjacent allies gain +2 Strength on attack." },
    { id: 22, cost: 2, name: "Shield",                  reaction: true,  text: "Adjacent allies gain +2 Strength on defense." },
    { id: 24, cost: 1, name: "Echo",                    reaction: true,  text: "When a spell targets this creature, roll: above 3 doubles the effect; below 3 negates it." },
    { id: 25, cost: 2, name: "Burrow",                  reaction: false, text: "On its matching biome, use an action to move to any other unoccupied tile of the same biome." },
    { id: 26, cost: 5, name: "Silence",                 reaction: false, text: "Roll above 4 to prevent spells on adjacent tiles and creatures until the next turn." },
    { id: 27, cost: 5, name: "Neutralize",              reaction: true,  text: "In a matching biome, adjacent enemy creatures cannot use abilities." },
    { id: 28, cost: 3, name: "Shapeshift",              reaction: false, text: "Change biome affiliation to the current biome once per turn, until turn's end." }
  ];

  /* --- Creatures (Creatures_tbl) ------------------------------------------
     [name, strength, abilityId, biomeId, classId] — card number = index + 1.
     The roster is a 9 x 10 matrix: each biome holds one creature per class. */
  var creatures = [
    ["Radiance", 4, 25, 1, 1], ["Dune", 4, 26, 1, 8], ["Panda-gger", 3, 3, 1, 3], ["Sand wraith", 3, 28, 1, 7], ["Krukk Sunscorcher", 2, 24, 1, 2],
    ["Bruna Sandtinkerer", 2, 22, 1, 10], ["Fire Spirit", 2, 10, 1, 6], ["Desert Elemental", 2, 20, 1, 5], ["Siren", 4, 5, 1, 9], ["Skelter", 2, 12, 1, 4],
    ["Druid", 4, 6, 2, 3], ["Sylvanus", 5, 14, 2, 1], ["Pummelpotamus", 3, 27, 2, 8], ["Nyxthorn", 2, 7, 2, 7], ["Zulgar the Wise", 2, 3, 2, 2],
    ["Gnarlroot", 2, 18, 2, 10], ["Necro", 4, 19, 2, 4], ["Fairy", 1, 14, 2, 6], ["Roggy", 4, 22, 2, 5], ["Triton", 1, 25, 2, 9],
    ["Scavenge", 4, 13, 9, 3], ["Terrafirma", 3, 28, 9, 8], ["Pebbles", 3, 15, 9, 1], ["Zirax", 2, 16, 9, 7], ["Torgath", 3, 25, 9, 2],
    ["Grimmalkin", 3, 12, 9, 10], ["Tomb Dweller", 3, 18, 9, 4], ["Treasure Guardian", 4, 2, 9, 6], ["Cave Elemental", 4, 19, 9, 5], ["Nebula", 3, 4, 9, 9],
    ["Granite", 5, 12, 5, 3], ["Rexxie", 3, 10, 5, 8], ["Volcandor", 6, 2, 5, 1], ["Korath, the Mountain King", 5, 27, 5, 7], ["Gorzak Warbringer", 5, 24, 5, 2],
    ["King Krag", 4, 8, 5, 10], ["Wraps", 3, 9, 5, 4], ["Sky", 6, 26, 5, 6], ["Earth Elemental", 4, 20, 5, 5], ["Relic", 3, 4, 5, 9],
    ["Quiver", 3, 1, 7, 3], ["Quagmire Montrosity", 4, 6, 7, 8], ["Muckwing", 3, 22, 7, 1], ["Imp", 1, 17, 7, 7], ["Grimlok", 3, 21, 7, 2],
    ["Mud", 2, 24, 7, 10], ["Mordecai", 2, 16, 7, 4], ["Forgotten", 4, 7, 7, 6], ["Swamp Elemental", 3, 16, 7, 5], ["Lilith", 5, 19, 7, 9],
    ["Iviq", 3, 26, 4, 3], ["Mittens", 4, 11, 4, 4], ["Yeti", 4, 20, 4, 8], ["Okami", 5, 8, 4, 1], ["Crystallos", 4, 21, 4, 6],
    ["Abaddon", 6, 9, 4, 7], ["Grommash Frostreaper", 5, 7, 4, 2], ["Frostbite", 4, 11, 4, 10], ["Ice Elemental", 4, 15, 4, 5], ["Svala", 4, 2, 4, 9],
    ["Meridian", 4, 26, 8, 3], ["Leviathan", 6, 7, 8, 8], ["Typhoon", 3, 20, 8, 1], ["Krakenos", 5, 17, 8, 7], ["Krakenkrog", 5, 27, 8, 2],
    ["Kelpfolk", 1, 6, 8, 10], ["Discarded Pirate", 1, 9, 8, 4], ["Aquilos", 3, 28, 8, 6], ["Water Elemental", 4, 20, 8, 5], ["Aquaria", 4, 20, 8, 9],
    ["Tatsuo", 1, 13, 6, 3], ["Adorable Giant", 5, 21, 6, 8], ["Obsidian", 4, 17, 6, 1], ["Kraven", 4, 15, 6, 7], ["Mugglug The Stubborn", 2, 12, 6, 2],
    ["Shade Walker", 3, 22, 6, 10], ["Zombie Horde", 2, 2, 6, 4], ["Baylie", 5, 5, 6, 6], ["Shaydie", 3, 10, 6, 5], ["Lunavira", 4, 13, 6, 9],
    ["Grasstalker", 2, 4, 3, 3], ["Storm Colossus", 5, 11, 3, 8], ["Bladewing", 4, 14, 3, 1], ["Vortexus", 5, 4, 3, 7], ["Brakka the Ferocious", 4, 8, 3, 2],
    ["Aero", 5, 1, 3, 10], ["Specter", 2, 25, 3, 4], ["Ophanim", 3, 18, 3, 6], ["Air Elemental", 3, 27, 3, 5], ["Zephyr", 4, 18, 3, 9]
  ].map(function (row, i) {
    return { id: i + 1, name: row[0], strength: row[1], abilityId: row[2], biomeId: row[3], classId: row[4] };
  });

  /* --- Spells (Spells_tbl) ------------------------------------------------ */
  var spells = [
    { name: "Abundance",          reaction: false, text: "Gain 3 additional actions this turn." },
    { name: "Alliance",           reaction: false, text: "Draw the top 10 creature cards; add one Dragon to your hand (revealed); shuffle the rest back." },
    { name: "Armor",              reaction: true,  text: "Prevents loss in battle. Play before attack rolls." },
    { name: "Barrier",            reaction: false, text: "Play on an enemy land tile: its creatures cannot move, attack, or be attacked there; spells have no effect. Lasts until end of your next turn." },
    { name: "Conjure",            reaction: false, text: "Restore a spell from the discard pile to your hand; it cannot be played until next turn." },
    { name: "Conquest",           reaction: false, text: "Take control of an enemy's unoccupied tile; add the land card to your hand." },
    { name: "Dimensional Door",   reaction: false, text: "Create a tunnel between two tiles; creatures move or attack as if adjacent. Lasts until end of next turn." },
    { name: "Domination",         reaction: false, text: "Move an enemy creature to an adjacent land tile. Cave and forest restrictions apply." },
    { name: "Espionage",          reaction: false, text: "Force an opponent to reveal all creature cards in hand and discard one of their choosing." },
    { name: "Fireball",           reaction: true,  text: "Deal 3 damage to an enemy creature. Play after attack roll." },
    { name: "Illusionary Double", reaction: true,  text: "Move an attacked creature to an unoccupied tile, causing the attack to fail. Play before attack rolls. Cave and forest restrictions apply." },
    { name: "Invisibility",       reaction: false, text: "A creature moves through enemy-occupied tiles; unoccupied tiles entered do not change ownership; conflict if still on an enemy tile at turn end." },
    { name: "Levitation",         reaction: false, text: "Ignore biome restrictions for one creature this turn." },
    { name: "Lightning",          reaction: true,  text: "Deal 4 damage to an enemy creature. Play after attack roll." },
    { name: "Manipulation",       reaction: false, text: "Control an enemy creature to attack another adjacent enemy; it cannot use abilities." },
    { name: "Meteor Shower",      reaction: true,  text: "Target a biome: all creatures attacking or defending on it have -5 strength until end of next turn. Play before attack roll." },
    { name: "Nullify",            reaction: true,  text: "Prevent an opponent's spell from activating; discard it." },
    { name: "Pacify",             reaction: true,  text: "Prevent an enemy creature from attacking or using abilities until end of its turn." },
    { name: "Prosperity",         reaction: false, text: "Gain 2 gold and 2 cards from either deck." },
    { name: "Protection Ward",    reaction: false, text: "Play on a land tile you own: enemies cannot enter, attack, or cast spells on it until end of next turn." },
    { name: "Reanimate",          reaction: false, text: "Resummon an undead creature from the discard pile onto any tile. Free of action; gold costs apply." },
    { name: "Rebellion",          reaction: false, text: "Remove an enemy-controlled unoccupied tile; shuffle its land card back into the deck." },
    { name: "Reinforce",          reaction: false, text: "Summon a creature onto an unoccupied land tile you own. Free of action; gold costs apply." },
    { name: "Resurrection",       reaction: false, text: "Revive a defeated creature from the discard pile into your hand." },
    { name: "Reversal",           reaction: false, text: "Switch direction of play; gain an additional action if only 2 players." },
    { name: "Surveillance",       reaction: false, text: "Force an opponent to reveal 2 land cards from hand; take one." },
    { name: "Swiftness",          reaction: false, text: "Gain 3 additional movement actions." },
    { name: "Switch",             reaction: false, text: "Swap positions of two adjacent creatures, ignoring biome restrictions." },
    { name: "Teleport",           reaction: false, text: "Move one allied creature to any unoccupied tile, ignoring biome restrictions." },
    { name: "Terraform",          reaction: false, text: "Switch two adjacent unoccupied land tiles." },
    { name: "Terrify",            reaction: true,  text: "Play on an allied creature: attacking creatures get -2 strength until end of your next turn. Play before rolls." },
    { name: "Usurp",              reaction: false, text: "Summon a creature onto an opponent's unoccupied land tile. Free of action; gold costs apply." },
    { name: "Warp",               reaction: false, text: "Move an enemy creature to any unoccupied tile. Ends your turn immediately." },
    { name: "Wealth",             reaction: false, text: "Gain 6 gold." },
    { name: "Wealth Drain",       reaction: false, text: "All opponents lose 5 gold." }
  ];

  /* --- Lands (Lands_tbl) --------------------------------------------------
     [biomeId, harvest] — LandID = index + 1. Four lands per biome; Desert
     runs 2-5 gold, every other biome 1-4. */
  var lands = [
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 1], [2, 2], [2, 3], [2, 4],
    [3, 1], [3, 2], [3, 3], [3, 4],
    [4, 1], [4, 2], [4, 3], [4, 4],
    [5, 1], [5, 2], [5, 3], [5, 4],
    [6, 1], [6, 2], [6, 3], [6, 4],
    [7, 1], [7, 2], [7, 3], [7, 4],
    [8, 1], [8, 2], [8, 3], [8, 4],
    [9, 1], [9, 2], [9, 3], [9, 4]
  ].map(function (row, i) {
    return { id: i + 1, biomeId: row[0], harvest: row[1] };
  });

  /* --- lookups ------------------------------------------------------------ */
  function byId(list) {
    var map = {};
    list.forEach(function (item) { map[item.id] = item; });
    return map;
  }

  return {
    biomes: biomes,
    classes: classes,
    abilities: abilities,
    creatures: creatures,
    spells: spells,
    lands: lands,
    biome: byId(biomes),
    cls: byId(classes),
    ability: byId(abilities),
    creature: byId(creatures),
    land: byId(lands),
    spell: function (name) {
      for (var i = 0; i < spells.length; i++) if (spells[i].name === name) return spells[i];
      return null;
    }
  };
})();
