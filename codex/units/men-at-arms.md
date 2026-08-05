---
type: "unit"
id: "unit:men-at-arms"
title: "Men-at-Arms"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 234
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:men-at-arms"
---

# Men-at-Arms

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Professional soldiers of a castle household, head to foot in steel, with poleaxes. You cannot cut them: a sword lands thirty-eight wounds in a thousand on full harness. You can barely shoot them. What you CAN do is make them run: their armour costs wind half again as fast as anyone's, and a tired unit swings slower, moves slower, and permanently loses morale ceiling. Never fight them; tire them.

*Verified verbatim against `data/units.json`:234 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `FOOT` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `castle` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `7` |
| `dailyWear` | Fatigue points gained per day on the march. | `3` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `108` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `harness` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `heater` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `poleaxe` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `mace` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `78` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `66` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `350` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `5000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `850` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1560` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `CanBrace`, `ArmourWall` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `420` |

## What it beats, and what beats it

- **Role:** The grinder. Put them where the fight will be longest and let them win it slowly.
- **Countered by:** Their own wind — harness burns half again the fatigue of anyone else, and a blown man in armour cannot lift his arms. Mud. Crossbows and mauls. And being made to chase skirmishers, which is the actual historical answer.

## What you would see on the field

> Slow, glittering, pushing through everything. Later: the same block, stopped, breathing.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Armour Wall]] — *its `traits` names `ArmourWall` by id*
- [[Can Brace]] — *its `traits` names `CanBrace` by id*

## Equipment

- [[Full Harness]] — *its `armour` names `harness` by id; this page names "Full Harness" literally*
- [[Heater Shield]] — *its `shield` names `heater` by id*
- [[Mace]] — *its `sidearm` names `mace` by id*
- [[Poleaxe]] — *its `primaryWeapon` names `poleaxe` by id; this page names "Poleaxe" literally*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*

## Holdings

- [[Castle]] — *this page names "Castle" literally*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `men-at-arms`*

### Standing plans

- [[SELF_STRENGTH_BELOW]] — *this page names "Men-at-Arms" literally*

### Holdings

- [[Castle]] — *this page names "Men-at-Arms" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:234. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
