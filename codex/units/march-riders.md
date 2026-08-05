---
type: "unit"
id: "unit:march-riders"
title: "March Riders"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 393
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:march-riders"
---

# March Riders

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Frontier horsemen who have been raiding and being raided since childhood, on quick ponies, with javelins they throw at a canter. They turn nearly four times as fast as a pike block, so they win every race to a flank; they can shoot while moving, so they never have to accept a fight; and they carry the Feigner's craft — the false retreat that pulls a hothead out of his line and onto your knights. When an enemy breaks, nobody reaps a rout like march riders: mounted pursuers kill three and a half times faster and catch twice the ransoms.

*Verified verbatim against `data/units.json`:393 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `HORSE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `march-fort` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `50` |
| `marchSpeed` | Leagues per day on a good summer road. | `14` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `470` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `leather-and-helm` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `round` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `spear` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `sword` |
| `missileWeapon` | What they shoot with, if anything (see the missile weapons shelf in `data/equipment.json`). | `javelin` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `48` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `55` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `2200` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1100` |
| `chargeSpeedMmPerTick` | How fast they close in the last stretch, overriding the general table. Shock scales with the SQUARE of this, so it is worth far more than it looks. | `420` |
| `arrivalReadyTicks` | How long after arriving on the field before they are fit to fight. Men who have just marched on are not yet an asset. | `200` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `loose` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `loose`, `close`, `screen`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `Mounted`, `ShootOnMove`, `Feigner`, `Nimble`, `Pursuer` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `veterans-know-the-ground` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `160` |

## What it beats, and what beats it

- **Role:** Get round the side. Sting and be gone. Chase the broken. Pretend to run away.
- **Countered by:** Anything that catches them and can hit them — their armour is light and their ponies bare.

## What you would see on the field

> Loose, fast, always at the edges of the picture. When they turn and come back at somebody who chased them, that is the trap closing.

*Shelf: `units` in `data/units.json`.*

## Units

- [[Knights]] — *this page names "Knights" literally*

## Keywords

- [[Feigner]] — *its `traits` names `Feigner` by id; this page names "Feigner" literally*
- [[Mounted]] — *its `traits` names `Mounted` by id; this page names "Mounted" literally*
- [[Nimble]] — *its `traits` names `Nimble` by id; this page names "Nimble" literally*
- [[Pursuer]] — *its `traits` names `Pursuer` by id; this page names "Pursuer" literally*
- [[Shoot on the Move]] — *its `traits` names `ShootOnMove` by id*

## Equipment

- [[Arming Sword]] — *its `sidearm` names `sword` by id*
- [[Javelin]] — *this page names "Javelin" literally*
- [[Leather and Kettle Hat]] — *its `armour` names `leather-and-helm` by id*
- [[Round Shield]] — *its `shield` names `round` by id*
- [[Spear]] — *its `primaryWeapon` names `spear` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id; its `defaultFormation` names `loose` by id*
- [[Skirmish Screen]] — *its `allowedFormations` names `screen` by id*

## Orders

- [[Screen]] — *this page names "Screen" literally*

## Quirks

- [[Veterans]] — *its `defaultQuirks` names `veterans-know-the-ground` by id*

## Holdings

- [[March-fort]] — *this page names "March-fort" literally*

## Backlinks

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `march-riders`*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:393. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
