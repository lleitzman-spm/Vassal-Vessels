---
type: "unit"
id: "unit:company-pikes"
title: "Free Company Pikes"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 560
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:company-pikes"
---

# Free Company Pikes

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Two hundred drilled mercenaries, eight ranks deep, with pikes longer than four men are tall. Braced, the hedge projects twelve metres of refusal — horses stop dead, and the shock of a charge falls by a factor of hundreds, because shock is the square of the speed the points took away. Then the pikes kill the stalled horses at leisure. But: refusal is only to the front; the block turns slower than anything on the field; it has nothing but belt-knives when the press comes, and dies in it sixteen to one; and it is the densest arrow target that has ever stood still. A pike hedge is a wall, and walls do not manoeuvre.

*Verified verbatim against `data/units.json`:560 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `FOOT` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `contract` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `200` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `3` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `88` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `leather-and-helm` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `none` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `pike` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `30` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `74` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `900` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `12000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `500` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1140` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `ring`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `CanBrace`, `DeepBlock`, `Mercenary` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `flees-early-if-unpaid` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `210` |

## What it beats, and what beats it

- **Role:** A wall that horses cannot cross. Nothing else in the game stops a charge as completely.
- **Countered by:** Its own flanks — brace is front-arc only and it turns at half speed, so a quarter-wheel takes eight and a half seconds. Arrows, because it is dense and unshielded. And swordsmen who get inside the points.

## What you would see on the field

> A forest of shafts at head height. Its failure is equally unmistakable: the shafts go vertical and the block folds inward.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Can Brace]] — *its `traits` names `CanBrace` by id*
- [[Deep Block]] — *its `traits` names `DeepBlock` by id*
- [[Mercenary]] — *its `traits` names `Mercenary` by id; this page names "Mercenary" literally*

## Equipment

- [[Leather and Kettle Hat]] — *its `armour` names `leather-and-helm` by id*
- [[Long Knife]] — *its `sidearm` names `long-knife` by id*
- [[No Shield]] — *its `shield` names `none` by id*
- [[Pike]] — *its `primaryWeapon` names `pike` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Ring of Points]] — *its `allowedFormations` names `ring` by id*

## Orders

- [[Charge]] — *this page names "Charge" literally*

## Quirks

- [[Fights For Wages]] — *its `defaultQuirks` names `flees-early-if-unpaid` by id*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:560. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
