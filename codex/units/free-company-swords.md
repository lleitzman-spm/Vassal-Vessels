---
type: "unit"
id: "unit:company-swords"
title: "Free Company Swords"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 519
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:company-swords"
---

# Free Company Swords

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Hired men in mail with swords and small shields, and exactly one plan: survive the reach and win the crush. Against a pike hedge they lose badly for six seconds and then win overwhelmingly for the next sixty, because in the press long weapons drop to one fighting rank and take their crowd penalty while a sword takes none. They are professionals in three countries' wars — and they are mercenaries: run up arrears and their courage has no floor and their loyalty has a price the enemy can also pay.

*Verified verbatim against `data/units.json`:519 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `FOOT` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `contract` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `100` |
| `marchSpeed` | Leagues per day on a good summer road. | `9` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `92` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `mail` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `heater` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `sword` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `sword` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `62` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `52` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `120` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `3000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1050` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1240` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `PressFighter`, `Mercenary` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `flees-early-if-unpaid`, `first-to-plunder` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `200` |

## What it beats, and what beats it

- **Role:** Get inside the points and win the press. This unit exists to punish spears and pikes.
- **Countered by:** The first six seconds of anything with reach. Cavalry, always. Arrows in the open.

## What you would see on the field

> Close, quick, shoulder-to-shoulder work, and a visible turn in the fight at the six-second mark.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Mercenary]] — *its `traits` names `Mercenary` by id; this page names "Mercenary" literally*
- [[Press Fighter]] — *its `traits` names `PressFighter` by id*

## Equipment

- [[Arming Sword]] — *its `primaryWeapon` names `sword` by id; its `sidearm` names `sword` by id*
- [[Hauberk of Mail]] — *its `armour` names `mail` by id*
- [[Heater Shield]] — *its `shield` names `heater` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*

## Quirks

- [[Fights For Wages]] — *its `defaultQuirks` names `flees-early-if-unpaid` by id*
- [[First to Plunder]] — *its `defaultQuirks` names `first-to-plunder` by id*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:519. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
