---
type: "order"
id: "order:charge"
title: "Charge"
standing: "proposed"
standing_source: "defaulted"
source_path: "data/orders.json"
source_line: 385
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "order:charge"
---

# Charge

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *NOT backed by anything in the tree yet; this is the compiler's default for a design in `data/` with no engine behind it.*

The most important order in the game and the easiest to get wrong, because a charge is an acceleration problem and not a button. A warhorse needs seven and a half seconds — about thirty-four metres — to reach a gallop. Ordered from twenty-five metres your knights arrive at a trot and do a sixth of the damage. Ordered from two hundred they arrive blown. The sweet spot is sixty to a hundred and twenty metres, and you have to judge it THROUGH a nine-second courier ride, which means you are guessing where the enemy will be when the rider arrives. And against braced points the captain may simply refuse — difficulty 75, because men and horses do not want to run onto spears. That refusal is the counter working, not the game being unfair.

*Verified verbatim against `data/orders.json`:385 on every lint — no quote, no object.*

## The numbers

| field | meaning | value |
|---|---|---|
| `category` | Which of the three voices this belongs to: a standing charge always in force, an improvised order that must ride to its captain, or a pursuit policy. | `commitment` |
| `courierCost` | Riders spent. Zero means it is your own voice or your own horn and costs no rider. | `1` |
| `difficulty` | Subtracted from the captain's heed when the order lands. High difficulty is where an unpaid wergild becomes a tactic that never happens. | `35` |
| `commitTicks` | How long you cannot change your mind after it starts. | `160` |
| `windupTicks` | How long before it begins to take effect at all. | `0` |
| `params` | What the order needs pointing at — a place, a unit, a friend, a facing. An order with nowhere to point is not an order. | `targetUnit` |
| `hedgeSubstitute` | What a careful captain does instead when his heed lands in the DRAG/HEDGE band. Named here so no engine has to invent one. | `Advance to a forty-metre standoff and stop.` |
| `overreachSubstitute` | What a bold captain does instead when his heed lands in the OVERREACH band. | `Charge at once from wherever he stands, however far that is, and press it home even if refused (boastful captains only).` |
| `theCost` | What issuing it costs you, in something other than coin — usually a contingent doing nothing, or a flank left thin. Every order below is a trade. | `EIGHT SECONDS during which you cannot change your mind, and it is loud. Enormous wind. And on impact YOUR OWN unit loses two hundred thousand cohesion and must stand twenty seconds to redress before it can do it again.` |

## What you would see on the field

> Lances level. The last five seconds tell the whole story: still accelerating means somebody dies; slowing means the brace held.

*Shelf: `orders` in `data/orders.json`.*

## Units

- [[Knights]] — *this page names "Knights" literally*

## Orders

- [[Advance]] — *this page names "Advance" literally*
- [[Advance To]] — *this page names "Advance To" literally*

## Quirks

- [[Boastful]] — *this page names "Boastful" literally*

## Backlinks

### Rules that govern it

- [[Law 5 — Physics, not tables]] — *this law names "Charge" literally*
- [[Law 8 — Foresight is cheap; improvisation is dear]] — *this law names "Charge" literally*

### Writs that specify it

- [[OPEN QUESTIONS]] — *this writ names "Charge" literally*
- [[VASSAL VESSELS — The Constitution]] — *this writ names "Charge" literally*
- [[WRIT — THE BATTLE]] — *this writ names "Charge" literally*
- [[WRIT — THE COURT]] — *this writ names "Charge" literally*

### Units

- [[Bowmen]] — *this page names "Charge" literally*
- [[Free Company Pikes]] — *this page names "Charge" literally*
- [[Knights]] — *this page names "Charge" literally*

### Keywords

- [[Shock]] — *this page names "Charge" literally*

### Equipment

- [[Couched Lance]] — *this page names "Charge" literally*
- [[Harness and Barding]] — *this page names "Charge" literally*

### Formations

- [[Close Order]] — *this page names "Charge" literally*
- [[Open Order]] — *this page names "Charge" literally*
- [[Wedge]] — *this page names "Charge" literally*

### Governing numbers

- [[Battle: Acceleration]] — *this page names "Charge" literally*
- [[Battle: Cohesion]] — *this page names "Charge" literally*
- [[Battle: Heed]] — *this page names "Charge" literally*
- [[Battle: Missiles]] — *this page names "Charge" literally*
- [[Battle: Refusal]] — *this page names "Charge" literally*

### Orders

- [[Advance]] — *this page names "Charge" literally*
- [[Attack]] — *this page names "Charge" literally*
- [[Change the Standing Job]] — *this page names "Charge" literally*
- [[Close Ranks]] — *this page names "Charge" literally*
- [[March]] — *this page names "Charge" literally*
- [[Open Ranks]] — *this page names "Charge" literally*
- [[Set and Brace]] — *this page names "Charge" literally*

### Standing plans

- [[ENEMY_ENTERS_ZONE]] — *this page names "Charge" literally*

### Terrain

- [[Soft Ground and Mud]] — *this page names "Charge" literally*

### Quirks

- [[Boastful]] — *this page names "Charge" literally*
- [[Veterans]] — *this page names "Charge" literally*
- [[Will Not Strike His Wife's Family]] — *this page names "Charge" literally*

### flow

- [[A Unit's Pace]] — *this page names "Charge" literally*

### place

- [[Advancing]] — *this page names "Charge" literally*
- [[Braced]] — *this page names "Charge" literally*
- [[Carried Out]] — *this page names "Charge" literally*
- [[Charging]] — *this page names "Charge" literally*
- [[Fleeing]] — *this page names "Charge" literally*
- [[Halted]] — *this page names "Charge" literally*
- [[Overreach]] — *this page names "Charge" literally*
- [[Running]] — *this page names "Charge" literally*
- [[Walking]] — *this page names "Charge" literally*

### token

- [[Cohesion]] — *this page names "Charge" literally*

### transition

- [[Charge!]] — *its `consumes` names `CHARGE` by id; this page names "Charge" literally*
- [[It is carried out]] — *this page names "Charge" literally*
- [[It is refused]] — *this page names "Charge" literally*
- [[They break]] — *this page names "Charge" literally*
- [[They run the other way]] — *this page names "Charge" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/orders.json`:385. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
