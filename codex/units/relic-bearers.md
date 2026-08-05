---
type: "unit"
id: "unit:relic-bearers"
title: "Relic Bearers"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 687
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:relic-bearers"
---

# Relic Bearers

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Clerics carrying a saint's bones on a bier, who march only when the cause is blessed. They cannot fight at all. Within a hundred and twenty paces they steady everyone; once a battle, they may absolve one contingent — a great surge of heart, free, no rider needed. If the relic is captured, the whole army's will takes a wound and so does the crown's standing with the Church, into next season. Bringing the saint to the field is a court decision with a battlefield price — the shape of the whole game in one unit.

*Verified verbatim against `data/units.json`:687 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `COMMAND` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `abbey` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `25` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `80` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `padded` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `none` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `long-knife` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `8` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `40` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1000` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1000` |
| `steadyRadiusMm` | How far this unit's steadiness reaches to hold neighbours together. The quiet reason a household guard is worth more than its own numbers. | `120000` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Standard`, `Holy`, `NonCombatant`, `Irreplaceable` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `0` |

## What it beats, and what beats it

- **Role:** A courage engine that cannot defend itself.
- **Countered by:** One troop of light horse that nobody was watching.

## What you would see on the field

> A slow, tottering knot of unarmed men with a gilt box, always somewhere they should not be.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Holy]] — *its `traits` names `Holy` by id*
- [[Irreplaceable]] — *its `traits` names `Irreplaceable` by id; this page names "Irreplaceable" literally*
- [[Non-Combatant]] — *its `traits` names `NonCombatant` by id*
- [[Standard]] — *its `traits` names `Standard` by id; this page names "Standard" literally*

## Equipment

- [[Long Knife]] — *its `primaryWeapon` names `long-knife` by id; its `sidearm` names `long-knife` by id*
- [[No Shield]] — *its `shield` names `none` by id*
- [[Padded Jack]] — *its `armour` names `padded` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*

## Traits

- [[Command]] — *this page names "Command" literally*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:687. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
