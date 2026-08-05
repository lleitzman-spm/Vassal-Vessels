---
type: "unit"
id: "unit:march-riders"
title: "March Riders"
standing: "proposed"
standing_source: "defaulted"
source_path: "data/units.json"
source_line: 282
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:march-riders"
---

# March Riders

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *NOT backed by anything in the tree yet; this is the compiler's default for a design in `data/` with no engine behind it.*

Frontier horsemen who have been raiding and being raided since childhood, on quick ponies, with javelins they throw at a canter. They turn nearly four times as fast as a pike block, so they win every race to a flank; they can shoot while moving, so they never have to accept a fight; and they carry the Feigner's craft — the false retreat that pulls a hothead out of his line and onto your knights. When an enemy breaks, nobody reaps a rout like march riders: mounted pursuers kill three and a half times faster and catch twice the ransoms.

*Verified verbatim against `data/units.json`:282 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | *undocumented in the file's own `fields` block* | `HORSE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `march-fort` |
| `typicalMen` | *undocumented in the file's own `fields` block* | `50` |
| `marchSpeed` | Leagues per day on a good summer road. | `14` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `470` |
| `armour` | *undocumented in the file's own `fields` block* | `leather-and-helm` |
| `shield` | *undocumented in the file's own `fields` block* | `round` |
| `primaryWeapon` | *undocumented in the file's own `fields` block* | `spear` |
| `sidearm` | *undocumented in the file's own `fields` block* | `sword` |
| `missileWeapon` | *undocumented in the file's own `fields` block* | `javelin` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `48` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `55` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `2200` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1100` |
| `chargeSpeedMmPerTick` | *undocumented in the file's own `fields` block* | `420` |
| `arrivalReadyTicks` | *undocumented in the file's own `fields` block* | `200` |
| `defaultFormation` | *undocumented in the file's own `fields` block* | `loose` |
| `allowedFormations` | *undocumented in the file's own `fields` block* | `loose`, `close`, `screen`, `column` |
| `traits` | *undocumented in the file's own `fields` block* | `Mounted`, `ShootOnMove`, `Feigner`, `Nimble`, `Pursuer` |
| `defaultQuirks` | *undocumented in the file's own `fields` block* | `veterans-know-the-ground` |
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

*Generated by `tools/codex/emit.mjs` from `data/units.json`:282. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
