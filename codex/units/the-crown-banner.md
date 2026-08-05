---
type: "unit"
id: "unit:crown-banner"
title: "The Crown Banner"
standing: "proposed"
standing_source: "defaulted"
source_path: "data/units.json"
source_line: 460
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:crown-banner"
---

# The Crown Banner

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *NOT backed by anything in the tree yet; this is the compiler's default for a design in `data/` with no engine behind it.*

There is no player character in this game. There is a banner, and the picked men around it, and that is where your voice comes from. While it stands, every unit that can SEE it takes your orders in one second instead of a nine-second ride, and every friend within a hundred paces is steadied. If it falls, every unit in the army loses a quarter of its will at once and your signal range goes to nothing — every order forever after is a courier. Put it forward and your voice carries; put it forward and it can be reached. Where you plant it says what you believe.

*Verified verbatim against `data/units.json`:460 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | *undocumented in the file's own `fields` block* | `COMMAND` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `household` |
| `typicalMen` | *undocumented in the file's own `fields` block* | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `108` |
| `armour` | *undocumented in the file's own `fields` block* | `harness` |
| `shield` | *undocumented in the file's own `fields` block* | `heater` |
| `primaryWeapon` | *undocumented in the file's own `fields` block* | `poleaxe` |
| `sidearm` | *undocumented in the file's own `fields` block* | `mace` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `80` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `80` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `300` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `5000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `900` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1560` |
| `signalRadiusMm` | *undocumented in the file's own `fields` block* | `260000` |
| `steadyRadiusMm` | *undocumented in the file's own `fields` block* | `100000` |
| `defaultFormation` | *undocumented in the file's own `fields` block* | `close` |
| `allowedFormations` | *undocumented in the file's own `fields` block* | `close`, `column` |
| `traits` | *undocumented in the file's own `fields` block* | `Standard`, `SignalSource`, `Bodyguard`, `Irreplaceable` |
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

*Generated by `tools/codex/emit.mjs` from `data/units.json`:460. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
