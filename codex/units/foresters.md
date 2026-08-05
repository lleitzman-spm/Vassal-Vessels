---
type: "unit"
id: "unit:foresters"
title: "Foresters"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 151
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:foresters"
---

# Foresters

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

People who eat because they can hit a moving deer. Superb shots, quick on their feet, slow to tire — and constitutionally unable to stand in a formed line where somebody can hit them back, which they know perfectly well and so should you. On the SCREEN job they back away automatically from anything that comes within forty-five paces, so they work without a single order. In woodland, where formations cannot hold and arrows are half wasted, they are the most dangerous troops on the field.

*Verified verbatim against `data/units.json`:151 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `MISSILE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `weald` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `60` |
| `marchSpeed` | Leagues per day on a good summer road. | `9` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `76` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `none` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `buckler` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `long-knife` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `missileWeapon` | What they shoot with, if anything (see the missile weapons shelf in `data/equipment.json`). | `hunting-bow` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `34` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `25` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1400` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `900` |
| `speedMulPermille` | A multiplier on this unit's movement, in thousandths, where it differs from its class. | `1150` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `screen` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `screen`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Evade`, `FastFoot`, `Nimble` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `will-not-stand-in-line` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `45` |

## What it beats, and what beats it

- **Role:** The best value in the game — in the trees. The worst — in a line.
- **Countered by:** Cavalry in the open, absolutely and always. Being cornered against anything.

## What you would see on the field

> Scattered, constantly moving, always backing away. If they are standing still in the open, something has gone wrong.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Evade]] — *its `traits` names `Evade` by id*
- [[Fleet]] — *its `traits` names `FastFoot` by id*
- [[Nimble]] — *its `traits` names `Nimble` by id; this page names "Nimble" literally*

## Equipment

- [[Buckler]] — *its `shield` names `buckler` by id; this page names "Buckler" literally*
- [[Homespun]] — *its `armour` names `none` by id*
- [[Long Knife]] — *its `primaryWeapon` names `long-knife` by id; its `sidearm` names `long-knife` by id*

## Formations

- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*
- [[Skirmish Screen]] — *its `allowedFormations` names `screen` by id; its `defaultFormation` names `screen` by id*

## Orders

- [[Screen]] — *this page names "Screen" literally*

## Terrain

- [[Woodland]] — *this page names "Woodland" literally*

## Quirks

- [[Will Not Stand in Line]] — *its `defaultQuirks` names `will-not-stand-in-line` by id*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `foresters`*

### Standing plans

- [[AMMO_BELOW]] — *this page names "Foresters" literally*

### Quirks

- [[Will Not Stand in Line]] — *this page names "Foresters" literally*

### Holdings

- [[Weald]] — *this page names "Foresters" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:151. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
