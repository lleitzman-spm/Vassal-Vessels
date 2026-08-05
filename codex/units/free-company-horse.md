---
type: "unit"
id: "unit:company-horse"
title: "Free Company Horse"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 601
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:company-horse"
---

# Free Company Horse

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Professional horsemen who serve the purse. At 380 a tick their shock is about seven-tenths of a knight's — the square again — and their horses are unarmoured, which shows badly under arrows. They carry the game's most brutal wire between treasury and field: with arrears unpaid, every couple of seconds there is a small chance they simply ride off the field. Not a morale penalty. They go home.

*Verified verbatim against `data/units.json`:601 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `HORSE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `contract` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `70` |
| `marchSpeed` | Leagues per day on a good summer road. | `13` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `560` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `mail-and-plates` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `kite` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `lance` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `sword` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `58` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `54` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1600` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1300` |
| `chargeSpeedMmPerTick` | How fast they close in the last stretch, overriding the general table. Shock scales with the SQUARE of this, so it is worth far more than it looks. | `380` |
| `arrivalReadyTicks` | How long after arriving on the field before they are fit to fight. Men who have just marched on are not yet an asset. | `320` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `wedge`, `close`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Mounted`, `Shock`, `Mercenary`, `UnpaidLeave` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `flees-early-if-unpaid`, `first-to-plunder` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `300` |

## What it beats, and what beats it

- **Role:** Knights you can rent. Two-thirds of the punch at half the price and none of the pride — as long as the pay chest is full.
- **Countered by:** The same physics that beats knights, only sooner — and an empty treasury, which beats them completely.

## What you would see on the field

> Good horse doing sound work — or, if you did not pay them, an empty place where good horse used to be.

*Shelf: `units` in `data/units.json`.*

## Units

- [[Knights]] — *this page names "Knights" literally*

## Keywords

- [[Mercenary]] — *its `traits` names `Mercenary` by id; this page names "Mercenary" literally*
- [[Mounted]] — *its `traits` names `Mounted` by id; this page names "Mounted" literally*
- [[Shock]] — *its `traits` names `Shock` by id*
- [[Will Simply Leave]] — *its `traits` names `UnpaidLeave` by id*

## Equipment

- [[Arming Sword]] — *its `sidearm` names `sword` by id*
- [[Couched Lance]] — *its `primaryWeapon` names `lance` by id*
- [[Kite Shield]] — *its `shield` names `kite` by id*
- [[Mail and Coat of Plates]] — *its `armour` names `mail-and-plates` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*
- [[Wedge]] — *its `allowedFormations` names `wedge` by id*

## Quirks

- [[Fights For Wages]] — *its `defaultQuirks` names `flees-early-if-unpaid` by id*
- [[First to Plunder]] — *its `defaultQuirks` names `first-to-plunder` by id*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:601. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
