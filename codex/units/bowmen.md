---
type: "unit"
id: "unit:bowmen"
title: "Bowmen"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 113
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:bowmen"
---

# Bowmen

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Men who have drawn a war bow at the butts every Sunday since boyhood. The bow does not actually kill very many people; being shot at from beyond answer is UNBEARABLE, and unbearable is what routs armies — so the right use of archers is never 'kill them with arrows', it is 'make them breakable, then charge'. Two things make bowmen more than a nuisance: STAKES — ninety seconds of hammering buys a hedge of points nearly as good as pikes, and unlike pikemen the archers keep shooting — and the MAUL, the stake-hammer that also flattens an exhausted man in plate. Bowmen finishing knights is arithmetic, not legend.

*Verified verbatim against `data/units.json`:113 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `MISSILE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `manor` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `3` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `86` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `padded` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `none` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `maul` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `missileWeapon` | What they shoot with, if anything (see the missile weapons shelf in `data/equipment.json`). | `war-bow` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `30` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `44` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1100` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1060` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `loose` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `loose`, `close`, `screen` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Stakes`, `MaulFinisher` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `130` |

## What it beats, and what beats it

- **Role:** Break the enemy's WILL at two hundred paces, then let somebody else break their bodies.
- **Countered by:** Cavalry that reaches them. Full harness (98 wounds in a thousand). Running out of arrows — they carry thirty-two.

## What you would see on the field

> Loose spacing you can count from across the field; volleys that arc for three seconds and land together; a visible fence of stakes.

*Shelf: `units` in `data/units.json`.*

## Units

- [[Knights]] — *this page names "Knights" literally*

## Keywords

- [[Maul]] — *its `traits` names `MaulFinisher` by id*
- [[Stakes]] — *its `traits` names `Stakes` by id; this page names "Stakes" literally*

## Equipment

- [[Full Harness]] — *this page names "Full Harness" literally*
- [[Lead Maul]] — *its `primaryWeapon` names `maul` by id*
- [[Long Knife]] — *its `sidearm` names `long-knife` by id*
- [[No Shield]] — *its `shield` names `none` by id*
- [[Padded Jack]] — *its `armour` names `padded` by id*
- [[War Bow]] — *this page names "War Bow" literally*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id; its `defaultFormation` names `loose` by id*
- [[Skirmish Screen]] — *its `allowedFormations` names `screen` by id*

## Orders

- [[Charge]] — *this page names "Charge" literally*
- [[Screen]] — *this page names "Screen" literally*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `bowmen`*

### Equipment

- [[Lead Maul]] — *this page names "Bowmen" literally*

### Holdings

- [[Manor]] — *this page names "Bowmen" literally*

### transition

- [[Loose!]] — *its `consumes` names `bowmen` by id; this page names "Bowmen" literally*
- [[Stakes in]] — *its `consumes` names `bowmen` by id; this page names "Bowmen" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:113. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
