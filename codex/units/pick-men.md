---
type: "unit"
id: "unit:pick-men"
title: "Pick-men"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 194
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:pick-men"
---

# Pick-men

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Miners with picks and hammers. Strong arms, heavy iron — their blows actually go through armour better than a swordsman's — and no idea what they are doing, no armour of their own, and a courage ceiling two-thirds of anyone else's. Their real use is digging under walls. On a battlefield, stand them somewhere quiet and far from anything you love, because when they break they will take the heart of everyone within ninety paces with them.

*Verified verbatim against `data/units.json`:194 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `FOOT` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `mine` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `4` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `82` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `none` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `none` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `maul` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `15` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `10` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `100` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `3000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `950` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1000` |
| `moraleCeilingCap` | A hard ceiling on how brave these men can ever get, whatever the court did for them. Fragile men can never be more than two-thirds brave, however well the day is going. | `600000` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Fragile` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `breaks-early` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `20` |

## What it beats, and what beats it

- **Role:** What a rich mine gives you instead of soldiers.
- **Countered by:** Everything — and above all anything that frightens them, because they will be the first thing on your side to run.

## What you would see on the field

> A shapeless block that flinches visibly under fire.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Fragile]] — *its `traits` names `Fragile` by id; this page names "Fragile" literally*

## Equipment

- [[Homespun]] — *its `armour` names `none` by id*
- [[Lead Maul]] — *its `primaryWeapon` names `maul` by id*
- [[Long Knife]] — *its `sidearm` names `long-knife` by id*
- [[No Shield]] — *its `shield` names `none` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*

## Quirks

- [[Breaks Early]] — *its `defaultQuirks` names `breaks-early` by id*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `pick-men`*

### Standing plans

- [[MORALE_BELOW]] — *this page names "Pick-men" literally*

### Quirks

- [[Breaks Early]] — *this page names "Pick-men" literally*

### Holdings

- [[Mine]] — *this page names "Pick-men" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:194. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
