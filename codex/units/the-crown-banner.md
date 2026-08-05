---
type: "unit"
id: "unit:crown-banner"
title: "The Crown Banner"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 647
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:crown-banner"
---

# The Crown Banner

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

There is no player character in this game. There is a banner, and the picked men around it, and that is where your voice comes from. While it stands, every unit that can SEE it takes your orders in one second instead of a nine-second ride, and every friend within a hundred paces is steadied. If it falls, every unit in the army loses a quarter of its will at once and your signal range goes to nothing — every order forever after is a courier. Put it forward and your voice carries; put it forward and it can be reached. Where you plant it says what you believe.

*Verified verbatim against `data/units.json`:647 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `COMMAND` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `household` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `108` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `harness` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `heater` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `poleaxe` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `mace` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `80` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `80` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `300` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `5000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `900` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1560` |
| `signalRadiusMm` | How far signals carry from this unit — the banner and the horn reaching the men who need to hear them. | `260000` |
| `steadyRadiusMm` | How far this unit's steadiness reaches to hold neighbours together. The quiet reason a household guard is worth more than its own numbers. | `100000` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Standard`, `SignalSource`, `Bodyguard`, `Irreplaceable` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `0` |

## What it beats, and what beats it

- **Role:** The commander's voice, made of cloth and forty picked men. There is no other body on the field that is you.
- **Countered by:** Being taken. That is the whole point of it existing.

## What you would see on the field

> The tallest thing on the field. If it goes down you will not need to be told.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Bodyguard]] — *its `traits` names `Bodyguard` by id; this page names "Bodyguard" literally*
- [[Irreplaceable]] — *its `traits` names `Irreplaceable` by id; this page names "Irreplaceable" literally*
- [[Signal Source]] — *its `traits` names `SignalSource` by id*
- [[Standard]] — *its `traits` names `Standard` by id; this page names "Standard" literally*

## Equipment

- [[Full Harness]] — *its `armour` names `harness` by id*
- [[Heater Shield]] — *its `shield` names `heater` by id*
- [[Mace]] — *its `sidearm` names `mace` by id*
- [[Poleaxe]] — *its `primaryWeapon` names `poleaxe` by id; this page names "Poleaxe" literally*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*

## Traits

- [[Command]] — *this page names "Command" literally*

## Backlinks

### Writs that specify it

- [[VASSAL VESSELS — The Constitution]] — *this writ names "The Crown Banner" literally*

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `crown-banner`*

### Governing numbers

- [[Battle: Army]] — *this page names "The Crown Banner" literally*
- [[Battle: Command]] — *this page names "The Crown Banner" literally*
- [[Battle: Terrain]] — *this page names "The Crown Banner" literally*

### Orders

- [[Exhort]] — *this page names "The Crown Banner" literally*
- [[Guard]] — *this page names "The Crown Banner" literally*
- [[Move the Banner]] — *this page names "The Crown Banner" literally*

### Standing plans

- [[BANNER_LOST]] — *this page names "The Crown Banner" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:647. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
