---
type: "module"
id: "module:src/battle/index.ts"
title: "src/battle/index.ts"
standing: "built"
standing_source: "derived"
source_path: "src/battle/index.ts"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "module:src/battle/index.ts"
---

# src/battle/index.ts

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

30 lines · 41 exported symbols.

## What the file says of itself

> The battle, from outside. Everything a caller needs and nothing it does not:
> hand in two Hosts, some ground, a seed and two lists of directives, and get
> back a replay log whose last two records are the Aftermaths the court absorbs.

## Shape

- **Lines:** 30
- **Exported symbols (41):** `BattleInput`, `BattleState`, `CHARGES`, `ChargeId`, `Directive`, `ENGINE_VERSION`, `GROUNDS`, `HONOURED_QUIRK_IDS`, `Interpretation`, `OrderId`, `OrderParams`, `PlanBinding`, `Posture`, `QUIRKS`, `ReplayHeader`, `ReplayLog`, `RunOptions`, `Side`, `TRIGGERS`, `TriggerId`, `Unit`, `allOrderIds`, `applyInterpretation`, `armourEff`, `captainOf`, `chronicle`, `computeHeed`, `contingentUnits`, `formation`, `initState`, `meleeOneWay`, `orderSheet`, `parseNdjson`, `readTide`, `replayFromHeader`, `rulesetHash`, `runBattle`, `tideWeight`, `unitType`, `winner`, `woundPermille`

## Modules

- [[src/battle/catalog.ts]] — *imported by this file*
- [[src/battle/engine.ts]] — *imported by this file*
- [[src/battle/herald.ts]] — *imported by this file*
- [[src/battle/log.ts]] — *imported by this file*
- [[src/battle/orders.ts]] — *imported by this file*
- [[src/battle/phase-command.ts]] — *imported by this file*
- [[src/battle/phase-fight.ts]] — *imported by this file*
- [[src/battle/setup.ts]] — *imported by this file*
- [[src/battle/terrain.ts]] — *imported by this file*
- [[src/battle/tide.ts]] — *imported by this file*
- [[src/battle/types.ts]] — *imported by this file*

## Backlinks

### Writs that specify it

- [[OPEN QUESTIONS]] — *this writ names `runBattle`; this writ names `TriggerId`*
- [[VASSAL VESSELS — The Constitution]] — *this writ names `runBattle`*
- [[WRIT — THE BATTLE]] — *this writ names `armourEff`; this writ names `BattleState`; +4 more*
- [[WRIT — THE COURT]] — *this writ names `runBattle`*

### Invariants that enforce it

*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*

- [[1. thirty stored battles, each fought twice, byte for byte the same]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[2. walking the units BACKWARDS changes nothing]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[3. the header alone refights the battle]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[4. the Tide recomputed from the log's own lines equals every logged value]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a broken unit that gets clear of the enemy RALLIES, once and only once]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a grudge the court recorded is a tactic that does not happen]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a horn is a trigger the player pulls by hand]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a plan fires with NO heed check — the loophole in the politics, deliberately left open]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[A SIDEARM IS WORTH MORE THAN ANY STAT: spear and sword wins the clash AND survives the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a standing plan fires the instant its trigger does; a courier takes nine seconds]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a unit that can see the Crown Banner takes the signal in one second and spends no rider]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[an interpretation logs every term of the heed, so a defeat can be read]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[an oath clamps outright refusal into foot-dragging]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[armour is a wall, not a slope — the cube law, against the worked numbers]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[backing out of a melee is paid for in blood]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[braced and steady, the horses stop and almost nobody dies]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[COURIER SCARCITY IS THE COURT'S HAND ON YOUR THROAT: with the riders out, the word never leaves]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[every captain gets a fate and a word the court will use about him]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[every morale event carries the terms that made it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[every one of the six is reachable, and each names its political cause]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[every shock event says the speed the refusal took away]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[going over a captain's head is an order obeyed and an insult remembered]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[long weapons drop to one fighting rank in the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[MORALE LIVES INSIDE THE COUNTER: braced but frightened and ragged is far worse]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[OBEY and OBEY-HIS-WAY count as obeyed; the rest do not]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[only one side holds the field, or neither]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[reproduces K.melee.verifiedRatios for pikes against company swords]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[rout, pursuit and an end to the day are all reachable]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the arcs are worth what the manual says: flank and rear beat the front]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the charger's own dead follow the same order — a stalled charge kills nobody, including its own]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the engine names no blame — the court computes its own]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[THE FIVE NUMBERS SUM TO THE MUSTER, EXACTLY, for every unit of every battle]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[THE INVERSION: a knife-carrying spear line's whole fortune turns at the six-second mark]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the log reads as a chronicle: the heralds tell the day without a picture]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the number of riders IS the Host's orderCapacity]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the ordering the arithmetic actually produces, asserted whole]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the physicians tilt dead toward wounded, and nothing else moves]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the receipts the court reads: ordersGiven and ordersObeyed]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the ruleset hash is stable and is carried in the header]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the same charge, told twice, gives the same answer]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the SUPPORT veto: he looks upon a rival hard-pressed, and looks away]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[turning the log off does not change one value]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[unbraced, the same spears take materially more]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[veterancy is earned by time in contact and capped where the court expects]] — *imported by the test FILE (shared source, not a claim about this one test)*

---

*Generated by `tools/codex/emit.mjs` from `src/battle/index.ts`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
