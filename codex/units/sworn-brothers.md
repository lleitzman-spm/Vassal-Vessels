---
type: "unit"
id: "unit:sworn-brothers"
title: "Sworn Brothers"
standing: "built"
standing_source: "derived"
source_path: "data/units.json"
source_line: 478
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "unit:sworn-brothers"
---

# Sworn Brothers

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Warrior monks of the Sworn Order, housed in an abbey's chapter, who come only for a cause your Chaplain has blessed. The best-drilled foot in the game, they do not flee — which is not always good news — and they answer their own Grandmaster before your Marshal, so at some point they will do what they believe is right instead of what you asked. Resolve like iron and obedience capped at 55 is a very specific kind of nightmare to command.

*Verified verbatim against `data/units.json`:478 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `class` | What kind of thing it is — foot, horse, or something that does not fight. It decides which of the engine's speed and fatigue tables the unit is read against. | `FOOT` |
| `raisedBy` | Which holding types (data/holdings.json) or bargains (data/obligations.json) raise this unit. | `abbey` |
| `typicalMen` | How many men a unit of this sort usually musters. Real numbers vary with the holding that raised them and how the year has gone. | `60` |
| `marchSpeed` | Leagues per day on a good summer road. | `8` |
| `dailyWear` | Fatigue points gained per day on the march. | `2` |
| `massPerManKg` | Man plus kit — or horse plus man plus kit. Only matters for shock. | `102` |
| `armour` | What they are wearing (see the armour shelf in `data/equipment.json`). Armour reduces wounds rather than hits, and it costs fatigue every minute it is worn. | `mail-and-plates` |
| `shield` | What they are carrying (see the shields shelf in `data/equipment.json`). Worth a great deal to the front and nothing at all to the rear. | `heater` |
| `primaryWeapon` | What they fight with first (see `data/equipment.json`). Long weapons win the clash and lose the press — the whole Six Seconds inversion is here. | `poleaxe` |
| `sidearm` | What they fall back on once the press starts and there is no room for the long weapon. This is why spearmen have a bad time after six seconds. | `mace` |
| `skill` | 0-100 individual fighting quality; feeds to-hit. | `76` |
| `drillBase` | 0-100 formation quality; the Host's per-unit drill overrides it. | `90` |
| `refusalBase` | 0-1000. How strongly this unit's set weapons make a charging horse refuse — ONLY when braced, only in the front arc. | `400` |
| `refusalRangeMm` | How far ahead the refusal reaches. Longer weapons project further. | `5000` |
| `turnMulPermille` | Multiplier on the base turn rate. | `950` |
| `fatigueMulPermille` | How fast this unit tires, from armour weight and the work. | `1380` |
| `defaultFormation` | The shape they take when nobody has said otherwise. | `close` |
| `allowedFormations` | Every shape they can adopt at all. A unit that cannot form a shieldwall cannot be told to. | `close`, `shieldwall`, `loose`, `column` |
| `traits` | The keywords that govern what this unit can do (see `data/keywords.json`). `CanBrace` is the one that decides most battles. | `CanBrace` |
| `defaultQuirks` | Quirks these men carry by their nature rather than by their history (see `data/quirks.json`). | `answers-to-the-grandmaster`, `will-not-flee` |
| `musterCost` | Coin per battle, for the court's arithmetic. Not a battle number. | `0` |

## What it beats, and what beats it

- **Role:** Sixty men who will not run away from anything, ever, for free — and are not entirely yours.
- **Countered by:** Their own certainty. A unit that cannot retreat is a unit that can be destroyed in place, and their obedience can never rise above 55.

## What you would see on the field

> A block that advances when the horn says advance and, occasionally, when God does.

*Shelf: `units` in `data/units.json`.*

## Keywords

- [[Can Brace]] — *its `traits` names `CanBrace` by id*

## Equipment

- [[Heater Shield]] — *its `shield` names `heater` by id*
- [[Mace]] — *its `sidearm` names `mace` by id*
- [[Mail and Coat of Plates]] — *its `armour` names `mail-and-plates` by id*
- [[Poleaxe]] — *its `primaryWeapon` names `poleaxe` by id; this page names "Poleaxe" literally*

## Formations

- [[Close Order]] — *its `allowedFormations` names `close` by id; its `defaultFormation` names `close` by id*
- [[Column of March]] — *its `allowedFormations` names `column` by id*
- [[Open Order]] — *its `allowedFormations` names `loose` by id*
- [[Shield Wall]] — *its `allowedFormations` names `shieldwall` by id*

## Traits

- [[Command]] — *this page names "Command" literally*

## Quirks

- [[Answers to His Own Master]] — *its `defaultQuirks` names `answers-to-the-grandmaster` by id*
- [[Will Not Flee]] — *its `defaultQuirks` names `will-not-flee` by id*

## Troop sources

- [[The Sworn Order]] — *this page names "The Sworn Order" literally*

## Backlinks

### Seats

- [[The Chaplain]] — *this page names "Sworn Brothers" literally*

### Obligations

- [[The Order's oath]] — *this page names "Sworn Brothers" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/units.json`:478. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
