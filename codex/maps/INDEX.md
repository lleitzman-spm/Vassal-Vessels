---
type: "map"
id: "map:index"
title: "Map of the Codex"
standing: "built"
standing_source: "derived"
source_path: "tools/codex/emit.mjs"
generated: "2026-08-05T17:57:33.909Z"
generator: "tools/codex/emit.mjs"
aliases:
  - "map:index"
---

# Map of the Codex

*Every page below is GENERATED. Never edit one — find the source named in its footer, fix that, and re-compile. The only hand-written page in the Codex is `00 START HERE.md`.*

*Data coverage: every `.json` file in `data/` is accounted for — mined, or named in `DELIBERATELY_UNMINED_DATA` with a reason. `npm run codex:lint` re-checks this on every run and fails if a new file ever slips through silently.*

## The count

| kind | pages |
|---|---:|
| invariant | 131 |
| transition | 80 |
| place | 76 |
| module | 53 |
| constant | 42 |
| guard | 34 |
| order | 34 |
| keyword | 31 |
| quirk | 28 |
| equipment | 26 |
| token | 18 |
| unit | 18 |
| grievance | 17 |
| flow | 13 |
| favour | 12 |
| standing-plan | 12 |
| rule | 11 |
| terrain | 11 |
| answer | 10 |
| holding | 9 |
| obligation | 8 |
| formation | 7 |
| seat | 7 |
| trait | 7 |
| troop-source | 5 |
| writ | 5 |
| season | 4 |
| example | 1 |
| **all** | **710** |

| standing | pages |
|---|---:|
| proposed | 407 |
| built | 291 |
| canon | 12 |

> **403 pages carry a DEFAULTED standing** — a design in `data/` with nothing in the tree behind it yet. That is the honest, expected state before the engine exists; watch this number fall as `src/` and `test/` are built.

## PROPOSED — not built, and never evidence that the game plays this way ⚠

*A proposed design rendered beside a built one, both in plain prose, is exactly the failure this axis exists to prevent — see `docs/WRIT-THE-CODEX.md`. These are designs. None of them is a build.*

- [["At once."]] — `data/transitions.json`
- [["Follow me!"]] — `data/transitions.json`
- [["I'll see it done."]] — `data/transitions.json`
- [["No."]] — `data/transitions.json`
- [["Presently."]] — `data/transitions.json`
- [["Some of us, then."]] — `data/transitions.json`
- [[A feast]] — `data/favours.json`
- [[A free company]] — `data/troop-sources.json`
- [[A gesture, and nothing more]] — `data/transitions.json`
- [[A gift of coin]] — `data/favours.json`
- [[A grant of land]] — `data/favours.json`
- [[A price is named]] — `data/transitions.json`
- [[A seat at court]] — `data/favours.json`
- [[A seat taken back]] — `data/grievances.json`
- [[A share of the plunder]] — `data/favours.json`
- [[A tourney]] — `data/favours.json`
- [[A victory won together]] — `data/favours.json`
- [[A wardship given away]] — `data/favours.json`
- [[Abandoned]] — `data/places.json`
- [[Abandoned (place)]] — `data/places.json`
- [[Abbey]] — `data/holdings.json`
- [[Absorbed]] — `data/places.json`
- [[Acting Against You]] — `data/places.json`
- [[Advance]] — `data/orders.json`
- [[Advance To]] — `data/orders.json`
- [[Aggression]] — `data/captains.json`
- [[Aimed Volley]] — `data/orders.json`
- [[Amended]] — `data/places.json`
- [[AMMO_BELOW]] — `data/standing-plans.json`
- [[An army comes apart]] — `data/transitions.json`
- [[An Old Grudge]] — `data/quirks.json`
- [[Answers In]] — `data/places.json`
- [[Answers to His Own Master]] — `data/quirks.json`
- [[Arming Sword]] — `data/equipment.json`
- [[Armour Piercer]] — `data/keywords.json`
- [[Armour Wall]] — `data/keywords.json`
- [[Arrived]] — `data/places.json`
- [[Arrows]] — `data/tokens.json`
- [[Attack]] — `data/orders.json`
- [[Back Pay]] — `data/tokens.json`
- [[BANNER_LOST]] — `data/standing-plans.json`
- [[Battle: Captains]] — `data/constants.json`
- [[Battle: Rng]] — `data/constants.json`
- [[Battle: Terrain]] — `data/constants.json`
- [[Battle: Wound]] — `data/constants.json`
- [[Beyond the Vessel]] — `data/places.json`
- [[Blood Feud]] — `data/quirks.json`
- [[Blood Up]] — `data/tokens.json`
- [[Blood-debt]] — `data/grievances.json`
- [[Boastful]] — `data/quirks.json`
- [[Bodyguard]] — `data/keywords.json`
- [[Bombard Stone]] — `data/equipment.json`
- [[Both sides break contact]] — `data/transitions.json`
- [[Bowmen]] — `data/units.json`
- [[Breaks Early]] — `data/quirks.json`
- [[Brothers Sworn]] — `data/quirks.json`
- [[Buckler]] — `data/equipment.json`
- [[Burning]] — `data/places.json`
- [[Called at harvest]] — `data/grievances.json`
- [[Called Off]] — `data/places.json`
- [[Called past his forty days]] — `data/grievances.json`
- [[Can Brace]] — `data/keywords.json`
- [[Carried Out]] — `data/places.json`
- [[Castle]] — `data/holdings.json`
- [[Castle-guard]] — `data/obligations.json`
- [[Cause Proclaimed]] — `data/places.json`
- [[Caution]] — `data/captains.json`
- [[Cautious With His Own]] — `data/quirks.json`
- [[Change the Standing Job]] — `data/orders.json`
- [[Charge]] — `data/orders.json`
- [[Charge!]] — `data/transitions.json`
- [[Charges Without Orders]] — `data/quirks.json`
- [[Claims the Place of Honour]] — `data/quirks.json`
- [[Close Ranks]] — `data/orders.json`
- [[Cohesion]] — `data/tokens.json`
- [[Cold]] — `data/places.json`
- [[Column of March]] — `data/formations.json`
- [[Comes in full]] — `data/answers.json`
- [[Comes late and short]] — `data/answers.json`
- [[Comes near full]] — `data/answers.json`
- [[Comes short]] — `data/answers.json`
- [[Comes with more than he owes]] — `data/answers.json`
- [[Command]] — `data/captains.json`
- [[Commit the Reserve]] — `data/orders.json`
- [[Cooling]] — `data/places.json`
- [[Couched Lance]] — `data/equipment.json`
- [[Court: Battle Joins]] — `data/constants.json`
- [[Court: Calendar]] — `data/constants.json`
- [[Court: Coin]] — `data/constants.json`
- [[Court: Loyalty]] — `data/constants.json`
- [[Court: March]] — `data/constants.json`
- [[Court: Obedience Formula]] — `data/constants.json`
- [[Court: Regeneration]] — `data/constants.json`
- [[Court: Resolve Formula]] — `data/constants.json`
- [[Court: Seats]] — `data/constants.json`
- [[Court: Supply]] — `data/constants.json`
- [[Court: Treachery Formula]] — `data/constants.json`
- [[Court: Wear]] — `data/constants.json`
- [[Court: Willingness]] — `data/constants.json`
- [[Crag]] — `data/terrain.json`
- [[Craven]] — `data/quirks.json`
- [[Crossbow]] — `data/equipment.json`
- [[Crossbowmen]] — `data/units.json`
- [[Crowns]] — `data/tokens.json`
- [[Customary]] — `data/places.json`
- [[Days in the Cup]] — `data/tokens.json`
- [[Deep Block]] — `data/keywords.json`
- [[Deep Water]] — `data/terrain.json`
- [[Denied the place of honour]] — `data/grievances.json`
- [[Died in Captivity]] — `data/places.json`
- [[Done]] — `data/places.json`
- [[Drawn Down]] — `data/places.json`
- [[Drillmaster]] — `data/quirks.json`
- [[Dry]] — `data/places.json`
- [[ENEMY_BROKE]] — `data/standing-plans.json`
- [[ENEMY_CAVALRY_WITHIN]] — `data/standing-plans.json`
- [[ENEMY_ENTERS_ZONE]] — `data/standing-plans.json`
- [[ENEMY_WITHIN]] — `data/standing-plans.json`
- [[ENGAGED_FOR_TICKS]] — `data/standing-plans.json`
- [[Envelop]] — `data/orders.json`
- [[Evade]] — `data/keywords.json`
- [[Exhort]] — `data/orders.json`
- [[Experience]] — `data/tokens.json`
- [[Fall Back]] — `data/orders.json`
- [[Fatigue]] — `data/tokens.json`
- [[Feign Withdrawal]] — `data/orders.json`
- [[Feigner]] — `data/keywords.json`
- [[Feudal service]] — `data/obligations.json`
- [[Fighting For Their Own Roofs]] — `data/quirks.json`
- [[Fights For Wages]] — `data/quirks.json`
- [[Firm Turf]] — `data/terrain.json`
- [[First to Plunder]] — `data/quirks.json`
- [[Fleet]] — `data/keywords.json`
- [[Ford]] — `data/terrain.json`
- [[Foreigners hired over him]] — `data/grievances.json`
- [[Foresters]] — `data/units.json`
- [[Fought]] — `data/places.json`
- [[Fragile]] — `data/keywords.json`
- [[Free Company Horse]] — `data/units.json`
- [[Free Company Pikes]] — `data/units.json`
- [[Free Company Swords]] — `data/units.json`
- [[FRIEND_ROUTS_WITHIN]] — `data/standing-plans.json`
- [[Full]] — `data/places.json`
- [[Full Harness]] — `data/equipment.json`
- [[Gathering]] — `data/places.json`
- [[Given the place of honour]] — `data/favours.json`
- [[Grain]] — `data/tokens.json`
- [[Greed]] — `data/captains.json`
- [[Grudging]] — `data/places.json`
- [[Guard]] — `data/orders.json`
- [[Halt]] — `data/transitions.json`
- [[Harness and Barding]] — `data/equipment.json`
- [[Harvest]] — `data/places.json`
- [[Harvest (season)]] — `data/seasons.json`
- [[Hauberk of Mail]] — `data/equipment.json`
- [[He dies in captivity]] — `data/transitions.json`
- [[He does not arrive]] — `data/transitions.json`
- [[He reaches the banner]] — `data/transitions.json`
- [[Heater Shield]] — `data/equipment.json`
- [[Held]] — `data/places.json`
- [[Held by Right]] — `data/places.json`
- [[Highsun]] — `data/places.json`
- [[Highsun (season)]] — `data/seasons.json`
- [[His Forty Days Are Nearly Done]] — `data/quirks.json`
- [[His heir died in your care]] — `data/grievances.json`
- [[His heir held too long]] — `data/grievances.json`
- [[His son expects it (transition)]] — `data/transitions.json`
- [[Hold Ground]] — `data/orders.json`
- [[Hold Position]] — `data/orders.json`
- [[Hold the Rein]] — `data/orders.json`
- [[Hold Your Arrows]] — `data/orders.json`
- [[Hold!]] — `data/transitions.json`
- [[Holy]] — `data/keywords.json`
- [[Homespun]] — `data/equipment.json`
- [[HORN_SOUNDED]] — `data/standing-plans.json`
- [[Horse-run]] — `data/holdings.json`
- [[Household Guard]] — `data/units.json`
- [[Houses Summoned]] — `data/places.json`
- [[Hungry]] — `data/quirks.json`
- [[Hungry for Ransom]] — `data/quirks.json`
- [[Hunting Bow]] — `data/equipment.json`
- [[Immobile]] — `data/keywords.json`
- [[In Force]] — `data/places.json`
- [[In Reserve]] — `data/orders.json`
- [[Inherited]] — `data/places.json`
- [[Iron Oath]] — `data/quirks.json`
- [[Irreplaceable]] — `data/keywords.json`
- [[Issued]] — `data/places.json`
- [[It becomes customary]] — `data/transitions.json`
- [[It becomes their job]] — `data/transitions.json`
- [[It cools]] — `data/transitions.json`
- [[It goes cold]] — `data/transitions.json`
- [[It goes into the record]] — `data/transitions.json`
- [[It is carried out]] — `data/transitions.json`
- [[It is refused]] — `data/transitions.json`
- [[It stops mattering]] — `data/transitions.json`
- [[It takes hold]] — `data/transitions.json`
- [[Javelin]] — `data/equipment.json`
- [[Judgement given in his favour]] — `data/favours.json`
- [[Justice denied]] — `data/grievances.json`
- *…and 207 more.*

## CONTESTED — two designs disagreed, nobody has ruled

*None. (That is not the same as everything agreeing — it means nothing has been marked.)*


## Load-bearing — what the rest of the game leans on

*Ranked by roads in plus roads out. A high count means many pages would move if this one did.*

| page | kind | standing | roads |
|---|---|---|---:|
| [[src/court/index.ts]] | module | built | 162 |
| [[WRIT — THE COURT]] | writ | proposed | 145 |
| [[WRIT — THE BATTLE]] | writ | proposed | 94 |
| [[Battle: Morale]] | constant | built | 87 |
| [[src/battle/index.ts]] | module | built | 75 |
| [[src/battle/types.ts]] | module | built | 72 |
| [[src/core/primitives.ts]] | module | built | 71 |
| [[OPEN QUESTIONS]] | writ | proposed | 70 |
| [[src/core/contract.ts]] | module | built | 68 |
| [[Charge]] | order | proposed | 52 |
| [[src/court/records.ts]] | module | built | 42 |
| [[VASSAL VESSELS — The Constitution]] | writ | canon | 41 |
| [[Close Order]] | formation | built | 39 |
| [[A Unit's Nerve]] | flow | built | 38 |
| [[The Host of Aldmarch]] | example | proposed | 38 |
| [[src/battle/phase-command.ts]] | module | built | 35 |
| [[src/battle/setup.ts]] | module | built | 35 |
| [[Knights]] | unit | proposed | 33 |
| [[src/battle/engine.ts]] | module | built | 31 |
| [[The Captain's Heed]] | flow | built | 31 |
| [[The Muster]] | flow | built | 31 |
| [[src/court/grievances.ts]] | module | built | 29 |
| [[Battle: Heed]] | constant | built | 28 |
| [[Battle: Pursuit]] | constant | built | 27 |
| [[Court: Obligation]] | constant | built | 27 |
| [[src/court/types.ts]] | module | built | 27 |
| [[Battle: Fatigue]] | constant | built | 26 |
| [[Court: Seats]] | constant | proposed | 26 |
| [[src/battle/phase-move.ts]] | module | built | 26 |
| [[src/court/host.ts]] | module | built | 26 |

## Ways in

- [[VASSAL VESSELS — The Constitution]] — *the constitution — it wins until amended*
- [[WRIT — THE BATTLE]] — *the implementable spec of the battle*
- [[WRIT — THE COURT]] — *the implementable spec of the court*
- [[Writ of the Codex — the living manual, and the law that keeps it honest]] — *the law that keeps this Codex honest*

## Every shelf

- `codex/rules/` — 11 rule pages
- `codex/writs/` — 5 writ pages
- `codex/examples/` — 1 example page
- `codex/units/` — 18 unit pages
- `codex/keywords/` — 31 keyword pages
- `codex/equipment/` — 26 equipment pages
- `codex/formations/` — 7 formation pages
- `codex/orders/` — 34 order pages
- `codex/standing-plans/` — 12 standing-plan pages
- `codex/traits/` — 7 trait pages
- `codex/quirks/` — 28 quirk pages
- `codex/terrain/` — 11 terrain pages
- `codex/seats/` — 7 seat pages
- `codex/obligations/` — 8 obligation pages
- `codex/holdings/` — 9 holding pages
- `codex/grievances/` — 17 grievance pages
- `codex/favours/` — 12 favour pages
- `codex/answers/` — 10 answer pages
- `codex/troop-sources/` — 5 troop-source pages
- `codex/seasons/` — 4 season pages
- `codex/flows/` — 13 flow pages
- `codex/places/` — 76 place pages
- `codex/transitions/` — 80 transition pages
- `codex/guards/` — 34 guard pages
- `codex/tokens/` — 18 token pages
- `codex/constants/` — 42 constant pages
- `codex/modules/` — 53 module pages
- `codex/invariants/` — 131 invariant pages
- `codex/maps/` — 0 map pages

---

*Generated by `tools/codex/emit.mjs` at 2026-08-05T17:57:33.909Z. This is the ONLY page carrying a build time — the rest hold no clock, so `git diff codex/` shows what actually changed. Re-compile with `npm run codex`; check it with `npm run codex:lint`; ask it a question with `npm run codex:trace -- "<subject>"` — the `--` is npm's, not ours, and without it npm swallows the subject.*
