---
type: "constant"
id: "constant:battle-morale"
title: "Battle: Morale"
standing: "built"
standing_source: "derived"
source_path: "data/constants.json"
source_line: 231
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "constant:battle-morale"
---

# Battle: Morale

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Morale is the real health bar. Casualties are only the INPUT; collapse is the OUTPUT. Every pressure a unit feels adds or subtracts a little will, every tick; when it runs out the unit routs, and a routing unit sprays panic ninety metres while a steady unit steadies only forty-five — panic travels twice as far as courage, and that one asymmetry is why battles end in an avalanche, not a grind. The ceiling only ever falls. ceilingFromResolve* turn the Host's 0-100 resolve into a starting ceiling (this canon's bridge between the court's scale and the battle's — see OPEN-QUESTIONS).

*Verified verbatim against `data/constants.json`:231 on every lint — no quote, no object.*

## The numbers

| constant | value |
|---|---|
| `battle.morale.steadyThreshold` | `600000` |
| `battle.morale.shakenThreshold` | `350000` |
| `battle.morale.breakThreshold` | `150000` |
| `battle.morale.nonCombatantBreakThreshold` | `400000` |
| `battle.morale.hysteresisMilli` | `30000` |
| `battle.morale.rallyThreshold` | `380000` |
| `battle.morale.rallyHoldTicks` | `60` |
| `battle.morale.rallyEnemyClearMm` | `80000` |
| `battle.morale.rallyCaptainRadiusMm` | `100000` |
| `battle.morale.ralliesAllowed` | `1` |
| `battle.morale.ceilingFromResolveBase` | `500000` |
| `battle.morale.ceilingFromResolvePerPoint` | `5000` |
| `battle.morale.ceilingLossPerHungerPoint` | `2000` |
| `battle.morale.floorPaid` | `200000` |
| `battle.morale.floorUnpaidMercenary` | `0` |
| `battle.morale.pCasualtyPerKillScaled` | `400` |
| `battle.morale.pMissileMultiplierPermille` | `1400` |
| `battle.morale.pFlankEngaged` | `-900` |
| `battle.morale.pRearEngaged` | `-1800` |
| `battle.morale.pCavalryDread` | `-1200` |
| `battle.morale.cavalryDreadRangeMm` | `60000` |
| `battle.morale.pOutnumberedPerMan` | `-6` |
| `battle.morale.pOutnumberedClamp` | `-1500` |
| `battle.morale.localCountRangeMm` | `70000` |
| `battle.morale.pFatigueDivisor` | `500` |
| `battle.morale.pFatigueAbove` | `600000` |
| `battle.morale.pCaptainNearPerValour` | `8` |
| `battle.morale.captainNearRangeMm` | `60000` |
| `battle.morale.pUphill` | `400` |
| `battle.morale.uphillThresholdMm` | `2000` |
| `battle.morale.pWinningPerNetKill` | `200` |
| `battle.morale.pReservePerContingent` | `250` |
| `battle.morale.pRecovery` | `180` |
| `battle.morale.pTidePerPoint` | `8` |
| `battle.morale.pCaptainKilled` | `-25000` |
| `battle.morale.pBannerLost` | `-250000` |
| `battle.morale.pRelicLost` | `-250000` |
| `battle.morale.pReserveCommitted` | `150000` |
| `battle.morale.pExhort` | `200000` |
| `battle.morale.ceilingLossPerKillScaled` | `700` |
| `battle.morale.ceilingLossCaptainKilled` | `60000` |
| `battle.morale.ceilingLossExhort` | `80000` |
| `battle.morale.contagionPanicPerMan` | `12` |
| `battle.morale.contagionPanicRangeMm` | `90000` |
| `battle.morale.contagionSteadyPerMan` | `4` |
| `battle.morale.contagionSteadyRangeMm` | `45000` |
| `battle.morale.contagionSteadyMinMorale` | `700000` |
| `battle.morale.contagionBlockedByRivalry` | yes |

## Backlinks

### Writs that specify it

- [[WRIT — THE BATTLE]] — *this writ names `battle.morale` literally; this writ names `ceilingFromResolveBase`; +7 more*
- [[Writ of the Codex — the living manual, and the law that keeps it honest]] — *this writ names `battle.morale` literally; this writ names `breakThreshold`*

### Modules

- [[src/battle/phase-command.ts]] — *this module names `K.morale` literally*
- [[src/battle/phase-morale.ts]] — *this module names `K.morale` literally*
- [[src/battle/phase-move.ts]] — *this module names `K.morale` literally*
- [[src/battle/setup.ts]] — *this module names `K.morale` literally*

### guard

- [[A captain, or home ground]] — *its `cites` names `battle.morale.rallyCaptainRadiusMm` by id; this page names `battle.morale` literally; +1 more*
- [[About to go]] — *its `cites` names `battle.morale.hysteresisMilli` by id; its `cites` names `battle.morale.shakenThreshold` by id; +4 more*
- [[Has a second chance left]] — *its `cites` names `battle.morale.ralliesAllowed` by id; this page names `battle.morale` literally; +1 more*
- [[Nerve back, and held there]] — *its `cites` names `battle.morale.rallyHoldTicks` by id; its `cites` names `battle.morale.rallyThreshold` by id; +4 more*
- [[Nerve comes back]] — *its `cites` names `battle.morale.hysteresisMilli` by id; its `cites` names `battle.morale.steadyThreshold` by id; +4 more*
- [[Nerve gives out]] — *its `cites` names `battle.morale.breakThreshold` by id; its `cites` names `battle.morale.nonCombatantBreakThreshold` by id; +3 more*
- [[Nerve starts to go]] — *its `cites` names `battle.morale.hysteresisMilli` by id; its `cites` names `battle.morale.shakenThreshold` by id; +6 more*
- [[Nobody close enough to kill them]] — *its `cites` names `battle.morale.rallyEnemyClearMm` by id; this page names `battle.morale` literally; +2 more*
- [[The banner falls at the wrong moment]] — *this page names `K.morale` literally; this page names `pBannerLost`*

### token

- [[Back Pay]] — *its `cites` names `battle.morale.floorUnpaidMercenary` by id; this page names `battle.morale` literally; +1 more*
- [[Nerve]] — *its `cites` names `battle.morale.breakThreshold` by id; its `cites` names `battle.morale.pCasualtyPerKillScaled` by id; +9 more*
- [[The Ceiling on Nerve]] — *its `cites` names `battle.morale.ceilingFromResolveBase` by id; its `cites` names `battle.morale.ceilingFromResolvePerPoint` by id; +5 more*
- [[The Floor Under Nerve]] — *its `cites` names `battle.morale.floorPaid` by id; its `cites` names `battle.morale.floorUnpaidMercenary` by id; +3 more*
- [[The Second Chance]] — *its `cites` names `battle.morale.ralliesAllowed` by id; this page names `battle.morale` literally; +1 more*

---

*Generated by `tools/codex/emit.mjs` from `data/constants.json`:231. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
