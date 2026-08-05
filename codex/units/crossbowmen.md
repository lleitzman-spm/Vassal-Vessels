---
type: "unit"
id: "unit:crossbowmen"
title: "Crossbowmen"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 271
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:crossbowmen"
---

# Crossbowmen

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Guildsmen with steel-bowed crossbows and standing shields. A crossbow takes an afternoon to learn and puts a bolt through full harness two hundred and fifty-nine times in a thousand — near three times what a war bow manages. The trade is rate: a volley every long while, and the pavise shelters them from the front ONLY while they stand still. Castles raise the better sort; towns the cheaper — same trade, different quality, which is the muster's business, not this sheet's.

*Verified verbatim against `data/units.json`:271 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `MISSILE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `castle`, `town` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `30` |
| `marchSpeed` | Leagues per day on a good summer road. | `7` |
| `dailyWear` | Fatigue points gained per day on the march. | `3` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `96` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `mail` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `pavise` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `sword` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `long-knife` |
| `missileWeapon` | What they shoot with, if anything (see the missile weapons shelf in `data/equipment.json`). | `crossbow` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `38` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `56` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `950` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1280` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `loose` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Pavise`, `ArmourPiercer` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `190` |

## What it beats, and what beats it

- **Role:** The answer to armour. Twenty-four bolts that go through anything.
- **Countered by:** Everything fast. They shoot a third as often as a war bow and are useless the moment they must move.

## What you would see on the field

> Big shields planted in a line, men crouched behind them winding cranks. When the shields come down, they are running.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Armour Piercer]] — *its `traits` names `ArmourPiercer` by id*
- [[Pavise (keyword)]] — *its `traits` names `Pavise` by id; this page names "Pavise" literally*

## Equipment

- [[Arming Sword]] — *its `primaryWeapon` names `sword` by id*
- [[Crossbow]] — *this page names "Crossbow" literally*
- [[Full Harness]] — *this page names "Full Harness" literally*
- [[Hauberk of Mail]] — *its `armour` names `mail` by id*
- [[Long Knife]] — *its `sidearm` names `long-knife` by id*
- [[Pavise]] — *its `shield` names `pavise` by id; this page names "Pavise" literally*
- [[War Bow]] — *this page names "War Bow" literally*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*

## Holdings

- [[Castle]] — *this page names "Castle" literally*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `crossbowmen`*

### Orders

- [[Guard]] — *this page names "Crossbowmen" literally*

### Holdings

- [[Castle]] — *this page names "Crossbowmen" literally*
- [[Town]] — *this page names "Crossbowmen" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:271. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
