---
type: "unit"
id: "unit:knights"
title: "Knights"
standing: "proposed"
standing_source: "defaulted"
source_path: "data/units.json"
source_line: 251
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:knights"
---

# Knights

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *NOT backed by anything in the tree yet; this is the compiler's default for a design in `data/` with no engine behind it.*

Armoured men on armoured horses, going nine metres a second. At full gallop into unbraced men they kill by the dozen in the first instant; into braced pikes they kill a tenth of a man, because the points take the SPEED away and shock is the square of the speed. And the thing nobody expects: charging home disorders the CHARGER — a knight unit that strikes loses two hundred thousand cohesion and needs twenty seconds standing to redress. Cavalry is a piston: charge, strike, wheel out, reform, charge — and every stroke costs a rider out and a rider back, so how many pistons you can run at once IS your courier count, which is a court number. That is where the politics touches the field hardest. They are also your proudest vassals and worth ransoms, both of which will cost you.

*Verified verbatim against `data/units.json`:251 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | *undocumented in the file's own `fields` block* | `HORSE` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `horse-run` |
| `typicalMen` | *undocumented in the file's own `fields` block* | `40` |
| `marchSpeed` | Leagues per day on a good summer road. | `12` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `640` |
| `armour` | *undocumented in the file's own `fields` block* | `barded` |
| `shield` | *undocumented in the file's own `fields` block* | `heater` |
| `primaryWeapon` | *undocumented in the file's own `fields` block* | `lance` |
| `sidearm` | *undocumented in the file's own `fields` block* | `sword` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `84` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `58` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `0` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `0` |
| `turnMulPermille` | Multiplier on the base turn rate. | `1500` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1400` |
| `chargeSpeedMmPerTick` | *undocumented in the file's own `fields` block* | `450` |
| `arrivalReadyTicks` | *undocumented in the file's own `fields` block* | `400` |
| `defaultFormation` | *undocumented in the file's own `fields` block* | `wedge` |
| `allowedFormations` | *undocumented in the file's own `fields` block* | `wedge`, `close`, `loose`, `column` |
| `traits` | *undocumented in the file's own `fields` block* | `Mounted`, `Shock`, `Proud`, `Ransomable` |
| `defaultQuirks` | *undocumented in the file's own `fields` block* | `charges-without-orders`, `first-to-plunder` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `600` |

## What it beats, and what beats it

- **Role:** One enormous hammer blow, delivered to the right place at the right speed. Then reform, then again.
- **Countered by:** Braced points, absolutely. Mud, which halves charge speed and so quarters shock. Charging from too close, which is your fault. And archers, because a horse is a very large target.

## What you would see on the field

> Lances level at forty paces. The last five seconds tell the whole story: still accelerating means somebody dies; slowing means the brace held.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Mounted]] — *its `traits` names `Mounted` by id; this page names "Mounted" literally*
- [[Proud]] — *its `traits` names `Proud` by id*
- [[Ransomable]] — *its `traits` names `Ransomable` by id; this page names "Ransomable" literally*
- [[Shock]] — *its `traits` names `Shock` by id*

## Equipment

- [[Arming Sword]] — *its `sidearm` names `sword` by id*
- [[Couched Lance]] — *its `primaryWeapon` names `lance` by id*
- [[Harness and Barding]] — *its `armour` names `barded` by id*
- [[Heater Shield]] — *its `shield` names `heater` by id*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*
- [[Wedge]] — *its `allowedFormations` names `wedge` by id; its `defaultFormation` names `wedge` by id*

## Orders

- [[Charge]] — *this page names "Charge" literally*

## Quirks

- [[Charges Without Orders]] — *its `defaultQuirks` names `charges-without-orders` by id*
- [[First to Plunder]] — *its `defaultQuirks` names `first-to-plunder` by id*

## Holdings

- [[Horse-run]] — *this page names "Horse-run" literally*

## Backlinks

### Writs that specify it

- [[VASSAL VESSELS — The Constitution]] — *this writ names "Knights" literally*
- [[WRIT — THE BATTLE]] — *this writ names "Knights" literally*
- [[WRIT — THE COURT]] — *this writ names "Knights" literally*
- [[Writ of the Codex — the living manual, and the law that keeps it honest]] — *this writ names "Knights" literally*

### Worked examples

- [[The Host of Aldmarch]] — *fields a unit of type `knights`*

### Units

- [[Bowmen]] — *this page names "Knights" literally*
- [[Free Company Horse]] — *this page names "Knights" literally*
- [[March Riders]] — *this page names "Knights" literally*

### Equipment

- [[Lead Maul]] — *this page names "Knights" literally*

### Orders

- [[Charge]] — *this page names "Knights" literally*

### Standing plans

- [[ENEMY_BROKE]] — *this page names "Knights" literally*

### Quirks

- [[Charges Without Orders]] — *this page names "Knights" literally*
- [[First to Plunder]] — *this page names "Knights" literally*

### Holdings

- [[Horse-run]] — *this page names "Knights" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:251. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
