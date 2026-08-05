# WRIT — THE BATTLE

The implementable specification of the battle simulation. Someone must be able to build
the engine from this document and `data/*.json` without asking a question. Every formula,
every mutation, every ordering. Constants are referenced as `K.<path>` and live in
`data/constants.json` under the `battle` key. Where a choice between the two source
battle designs was made, the choice is stated inline.

The top-level contract (types in `docs/WRIT-THE-COURT.md`):

```
runBattle(a: Host, b: Host, ground: Ground, seed: string, ordersA, ordersB) → ReplayLog
```

`ordersX` is the side's directive timeline: deployment choices (placements, charges,
standing plans) plus every mid-battle directive with the tick it was given. In live play
a front end appends to it in real time; in replay it is part of the log header. Same
inputs → byte-identical log, forever. The final records of the log are the two
`Aftermath` objects.

---

## 0. LAWS OF ARITHMETIC

### 0.1 The Integer Law (design A — chosen over design B's doubles because the spine
demands byte-identical replays across machines and runtimes)

**There is not one floating-point number anywhere in the simulation.** Not in state, not
in an intermediate, not in a constant.

- Integer division is `idiv(a, b) = Math.floor(a / b)`, always, including negative
  numerators. Never `Math.trunc`, never `| 0`, never `>>` as division.
- Products must fit ±2³¹ unless a formula is annotated `WIDE` (then ±2⁵³). Assert in
  debug builds.
- `clamp(v, lo, hi) = v < lo ? lo : (v > hi ? hi : v)`.
- `isqrt(n)`: integer Newton-Raphson seeded `x = 1 << ((bitLength(n) + 1) >> 1)`,
  iterate `x = idiv(x + idiv(n, x), 2)` exactly 6 times, then correct downward while
  `x*x > n` and upward while `(x+1)*(x+1) <= n`.

### 0.2 Units of measure

| Quantity | Unit | Type |
|---|---|---|
| Position | millimetres | int32 |
| Velocity | mm/tick | int32 |
| Angle | brads (4096 = full turn) | int32 in `[0, 4096)` |
| Time | ticks (20 per second — design A's rate; B's 10 Hz rejected because the Six Seconds and courier latency are calibrated at 50 ms) | int32 |
| Mass | kilograms | int32 |
| Morale / cohesion / fatigue | milli-units `[0, 1_000_000]` (display ÷ 1000) | int32 |
| Armour / penetration / skill / drill / heed | `[0, 100]` (armourEff may exceed 100) | int32 |
| Probability | per-mille `[0, 1000]` | int32 |
| Tide | `[-25, +25]` | int32 |

### 0.3 Trigonometry

- `SIN[1024]`: `SIN[i] = round(4096 * sin(2π·i/4096))` for the first quadrant, generated
  once and checked into source as a literal array. `sinB(a)` reduces mod 4096 and
  mirrors; `cosB(a) = sinB(a + 1024)`.
- `atan2B(dy, dx)`: octant selection, then a 257-entry checked-in table
  `ATAN[i] = round(512 * atan(i/256) / (π/4))` indexed `idiv(min*256, max)`.
- Distance times direction: `dx = idiv(dist * cosB(a), 4096)`.

### 0.4 Random numbers

xoshiro128\*\* on `Uint32Array(4)`, all ops `>>> 0`, seeded via splitmix32.

- **Global stream** `rngGlobal`, seeded from the battle seed (hash the seed string with
  FNV-1a 32-bit). Used only for army-level events, iterated in ascending side then
  ascending contingent index.
- **Per-unit streams**: `unit.rng` seeded
  `splitmix32(seedHash ^ imul(unitIndex + 1, 0x9E3779B9))`. Used for everything
  unit-local: heed jitter, hit rolls, capture rolls, treachery checks. Consequence:
  unit updates may run in any order, or in parallel, and produce the same battle. This
  is tested (§13).

Helpers: `rnd(s, n) = next(s) % n` (n ≤ 2²⁴), `roll100`, `rollPermille`,
`jitter8(s) = rnd(s, 17) - 8` (uniform −8..+8, the heed jitter — design B's ±8 kept).

### 0.5 Double buffering

Every phase reads the state as it stood at the top of the tick and writes into pending
accumulators (`pendingKills`, `pendingMorale`, `pendingCohesion`, `pendingFatigue`,
`pendingVel`, `pendingFacing`), folded in at the stated phase boundaries. No phase sees
another's partial writes.

---

## 1. STATE

### 1.1 `BattleState`

```
tick, seedHash, rngGlobal
field:   { widthMm: 1_200_000, heightMm: 800_000, tileMm: 8_000, tilesX: 150, tilesY: 100 }
terrain: { elevationDm: Int16Array, ground: Uint8Array, cover: Uint8Array }   // per tile
units: Unit[]                 // stable index; side A's units first, in Host order
contingents: Contingent[]     // command groups; each has a captain
captains: Captain[]
armies: [Army, Army]
volleys: Volley[]
couriers: Courier[]           // per army, count = host.command.orderCapacity
plans: StandingPlan[]         // armed standing plans, both sides
events: EventRecord[]         // this battle's emitted events (the Tide reads THIS)
log: LogWriter
phase: DEPLOY | BATTLE | PURSUIT | ENDED
pursuitTicksLeft: int
```

### 1.2 `Unit`

```
id, idx, side, typeId, contingentId
posX, posY (mm); velX, velY (mm/tick); facing (brads)
speedTier: STOP|WALK|ADVANCE|RUN|CHARGE|ROUT
strength, maxStrength, killAcc (milli-men)
files, ranks, frontageMm, depthMm, spacing: CLOSE|LOOSE, formationId
morale, moraleCeiling, moraleFloor, cohesion, fatigue (milli)
moraleState: STEADY|SHAKEN|WAVERING|ROUTING|RALLYING|FLED|DESTROYED
ralliesUsed: int                       // design B's once-only rally, kept
posture: NONE|BRACED|SHOOTING|STAKED;  postureChangeTicksLeft
ammo, volleyCooldownTicks
charge: ChargeId + params              // the standing job (see data/orders.json)
order: { id, params, commitTicksLeft, windupTicksLeft } | null
pendingOrder: { orderId, params, arriveTick, viaCourier } | null
engagements: [{ enemyIdx, overlapMm, arcOnMe, arcOnThem }]
contactTicks: int                      // continuous-contact counter; drives CLASH→PRESS
bloodlust, pursuing: bool
lastKillsTaken, lastKillsDealt, lastKillSource: MELEE|MISSILE|SHOCK|PURSUIT
ordersGiven, ordersObeyed              // receipts for the Aftermath
rng, renderSeed
type: UnitType (resolved, frozen — see §2.2)
```

### 1.3 `Contingent` and `Captain`

```
Contingent: { id, side, captainId, unitIdxs[], obedience, resolve, treachery,
              cohesion0, fellowship, quirks[], isReserve, committed,
              interpretation: { choice, urgency, sinceTick } }
Captain:    { id, contingentId, name, command, valour, wits,
              aggression, caution, pride, greed, loyalty, grievance, standing,
              rivals[], quirks[], insulted: bool, alive, bannerUnitIdx,
              nextThinkTick, successionTicksLeft }
```

Captain fields come verbatim from the Host (the court computes them; the battle never
does). Design B's axes map onto the contract: `boldness → aggression`,
`skill → command`, `honor → (100 − greed)` plus quirks.

### 1.4 `Courier`, `Volley`, `StandingPlan`, `Army`

```
Courier: { side, id, busyUntilTick }
Volley:  { shooterIdx, side, launchTick, landTick, targetX, targetY, spreadMm,
           shafts, aimed, weapon (resolved), shooterElevationDm }
StandingPlan: { side, recipient: contingentId|unitId, trigger, value, zone?, hornChannel?,
                orderId, params, armed: bool, firedAtTick: int|null }
Army: { side, hostId, commanderCaptainId, couriersTotal, exhortUsesLeft,
        bannerIdx, signalRangeMm, planSlots, hornsSounded: [tick,channel][],
        armyMorale, startingStrength, broken, brokeAtTick, tide }
```

`army.tide` is a cached copy of the most recent Tide reading (§11) — a convenience the
implementation may keep, but the canonical value is always recomputable from
`state.events`, and the determinism test recomputes it that way.

---

## 2. INITIALISATION

### 2.1 Terrain

The court hands a coarse `Ground` (features list + season). The battle owns terrain:
generate the tile map deterministically from `(seedHash, ground)` — place each named
feature (`ford`, `wood`, `ridge`, `marsh`, `road`, `mud`) as tiles of the matching
ground type from `data/terrain.json`, elevation from a fixed midpoint-displacement
routine seeded from `seedHash` (integer, checked-in). The exact generator is engine
detail; canon only requires: same seed + same ground → same tiles, and the tiles are
written whole into the replay header, so the log never depends on the generator.

### 2.2 Units from the Host

For each Host unit, resolve `UnitType` from `data/units.json` + `data/equipment.json` +
`data/formations.json` + `data/keywords.json`. Precompute and freeze: armourBase,
shieldBase, shieldMissileBonus, primary and sidearm weapon records, `pressWeapon`
(whichever of primary/sidearm maximises `rate × (1000 − pressPenaltyPermille) × pen`),
massPerManKg, refusalBase, refusalRangeMm, turnMulPermille, fatigueMulPermille,
chargeSpeedMmPerTick, arrivalReadyTicks, trait set, isMounted.

**The Host's per-unit numbers are authoritative where they overlap the type sheet**:
`drill` and `armour` from the Host replace the type's baseline; the type sheet supplies
everything the Host does not carry (weapons, reach, mass, refusal, formations, traits).

Then map the court's 0–100 politics into battle scales (these mappings are this canon's
own — neither source design had both scales; see OPEN-QUESTIONS §4):

```
moraleCeiling = K.morale.ceilingFromResolveBase                    // 500_000
              + unit.resolve * K.morale.ceilingFromResolvePerPoint // 5_000  → 500k..1M
morale        = moraleCeiling
cohesion      = K.cohesion.startBase + contingent.cohesion * K.cohesion.startPerPoint
                                                                   // 400_000 + c*6_000
fatigue       = unit.fatigue * 10_000                              // 0..1M
moraleCeiling -= unit.hunger * K.morale.ceilingLossPerHungerPoint  // 2_000/pt
moraleFloor   = (contingent is mercenary && arrears > 0) ? 0 : K.morale.floorPaid // 200_000
```

`strength = unit.strength`; `ammo` from the missile weapon; seed `rng` and
`renderSeed`; `recomputeGeometry` (§3.1). Units listed in `host.latecomers` are marked
off-field with `arrivalTick = idiv(entersAtFraction × K.time.plannedBattleTicks, 1)`
(`plannedBattleTicks` = 12_000); they enter at their declared edge in column on the
MARCH charge, `reinforcement_arrives` emitted. `reinforcement_sighted` is emitted
`K.command.reinforcementSightedLeadTicks` (1_200) ticks BEFORE arrival, to both sides —
dust on the road is not a secret, and a minute's warning is exactly enough time to spend
a courier on it.

### 2.3 Command

```
army.couriersTotal = host.command.orderCapacity          // THE JOIN: couriers = orderCapacity
army.planSlots     = host.command.orderCapacity + 2
army.exhortUsesLeft = 2 + idiv(commander.standing, 40)
army.bannerIdx = the crown-banner unit; army.signalRangeMm = K.command.signalRangeMm
```

Deployment consumes the side's directive prologue: placements (inside its own third of
the field), each contingent's opening charge (installed through a heed computation at
tick 0, exactly as a word arrival — a hostile captain's opening behaviour is visible
from the first second), stakes, and up to `planSlots` standing plans, free. Per-unit
plan limit: 1 armed plan per unit, 2 if its captain's `wits ≥ 70`.

`phase = BATTLE`, `tick = 0`.

---

## 3. GEOMETRY HELPERS (design A, unchanged)

### 3.1 `recomputeGeometry(u)`

```
f = formation(u.formationId)
u.files  = max(1, min(idiv(u.strength + targetRanks - 1, targetRanks), u.strength))
   wedge:  files = max(1, idiv(files * f.frontageMulPermille, 1000))
   column: files = min(4, u.strength)
u.ranks  = max(1, idiv(u.strength + u.files - 1, u.files))
u.frontageMm = u.files * f.manWidthMm;  u.depthMm = u.ranks * f.rankDepthMm
```

Called whenever strength, formation or spacing changes.
`missileDensityPermille(u) = idiv(idiv(u.strength * 100 * 1_000_000, u.frontageMm * u.depthMm) * 1000, 200)`  `WIDE`

### 3.2 Front line, arcs, overlap, gaps

- Front line: segment of length `frontageMm` centred `depthMm/2` ahead of the centre
  along `facing`, perpendicular direction `facing + 1024`.
- `arcOf(attacker, defender)`: fold the relative bearing to `[0, 2048]`;
  `≤ 683 → FRONT`, `≤ 1365 → FLANK`, else `REAR`.
- `overlapWidth(a, b)`: project both front lines onto `a`'s rank axis, overlap of the
  intervals, floored at 0. `WIDE`
- `gapBetween(a, b)`: perpendicular separation of bodies, floored at 0.
- `engagementGapMm(a,b) = max(primary reaches) + 300`; `bodyGapMm = 400`.

### 3.3 Terrain sampling and line of sight

`tileIndex`, `elevationMm`, `ground`, `cover` per design A; ground-type multipliers from
`data/terrain.json`, slope and sight constants from `K.battle.terrain`. Grade along travel:
`gradePermille = idiv((e2 − e1) * 1000, tileMm)`;
`slopeSpeedMul = clamp(1000 − grade*2, 400, 1150)`;
`slopeFatigueMul = 1000 + max(grade,0)*3`.
`hasLOS`: integer Bresenham across tiles; a tile blocks if its elevation exceeds the
interpolated sight line by more than 400 mm, or is woods/impassable. Memo per
(pair, tick-group of 10), cleared every group.

### 3.4 Spatial hash

Uniform 32 m grid rebuilt from scratch each tick; queries return candidates **sorted
ascending by unit index** (non-negotiable — this is what makes iteration stable).

---

## 4. THE TICK

`step(state)` runs phases 1–13 in this exact order:

```
 1. COMMAND      directives → couriers → deliveries → HEED → plans → captains' own hand
 2. PERCEPTION   spatial hash, threat sets, caches
 3. INTENT       charge/order/interpretation → desired velocity, facing, posture
 4. MOVEMENT     refusal deceleration → terrain → turn → integrate → separation
 5. CONTACT      new contacts → overlap & arc → SHOCK
 6. MELEE        per engaged pair, one tick of attrition both ways
 7. MISSILES     land flying volleys → launch new ones
 8. ATTRITION    fatigue, cohesion, ammo, bloodlust
 9. MORALE       pressures (incl. Tide drift) → contagion → apply → state transitions
10. ROUT         pursuit kills, captures, rally checks
11. ARMY & TIDE  army morale, Tide reading, treachery checks, break checks
12. VICTORY      phase transitions, battle end
13. LOG          events in phase order; keyframe every 10 ticks
```

---

### PHASE 1 — COMMAND

**1a. Ingest directives** with `t == tick`. Zero-courier directives (`EXHORT`,
`RIDE_TO`, `SOUND_RETREAT`, `HORN`) apply immediately (§1e). Everything else:

```
banner = army.bannerIdx
inSignal = banner alive && dist(target, banner) ≤ army.signalRangeMm
                           * (bannerMoving ? 500 : 1000) / 1000
           && hasLOS(target, banner)
if inSignal: arriveTick = tick + K.command.signalDelayTicks (20); no courier
else:
   courier = lowest-index courier with busyUntilTick ≤ tick
   if none: the order FAILS TO SEND. Log order_issued{sent:false}. No queue —
            the scarcity is the game; do not add a queue.
   dist   = straight line from banner to the recipient captain's banner unit
   travel = idiv(dist, K.command.courierSpeedMmPerTick)          // 500 mm/tick = 10 m/s (A;
                                                                 // B's 7 m/s rejected — A's field
                                                                 // and 9-second-ride feel are calibrated to it)
   if the path passes within 50_000 mm of an enemy unit: travel = idiv(travel*1250, 1000)
   if recipient contingent has any engaged unit:         travel += 60
                                                                 // both riders adopted from B
   arriveTick = tick + travel;  courier.busyUntilTick = tick + travel*2
```

Orders address a **contingent** (its captain relays to his units in the same tick) or a
**single unit** — over the captain's head: the captain sets `insulted = true` (−15 heed
for the rest of the day) and the unit takes the order at urgency 1000 with no heed
check of its own. Log `order_issued`, `courier_dispatch`.

**1b. Deliver and HEED.** For each pending order with `arriveTick == tick` — and only
then; no per-tick re-rolling — the captain computes (all integer, 0–100 scale):

```
heed = contingent.obedience                                   // the court's folded number
     + idiv(captain.command, 4)                               // craft steadies the hand: 0..25
     + (banner in LOS of captain's banner unit ? 10 : 0)
     + (exhort active on this contingent ? 15 : 0)
     − orderDifficulty(order, unit)                           // data/orders.json + modifiers
     − danger                                                 // 10 if his mean morale < 450_000;
                                                              // 20 if ordered toward a front where
                                                              // engaged enemy files ≥ 1.5× his own
     − idiv(contingentCasualtiesPermille, 20)                 // 0.5 heed per 1% of his men lost
     − (captain.insulted ? 15 : 0)
     − quirk modifiers                                        // data/quirks.json (e.g. old-grudge −20)
     − idiv(meanFatigue, 20_000)
     − meanBloodlust
     + jitter8(captainBannerUnit.rng)
```

**The SUPPORT veto comes first** (design B, kept whole): if the order is SUPPORT toward
a contingent whose captain this captain holds a rival/grudge against, and
`contingent.obedience < 75` → skip the table; outcome is DRAG if `aggression ≥ 50`,
else DEFY; and if the target contingent later breaks while this interpretation stands,
emit deed `abandoned`.

Then the six-outcome table (design B, verbatim thresholds):

| heed | outcome | effect |
|---|---|---|
| ≥ 70 | **OBEY** | install order, urgency 1000 |
| 50–69 | **OBEY-HIS-WAY** | install; `aggression ≥ 60` → pace one tier up; `aggression ≤ 40` → hold one unit back as his own reserve (if he has ≥ 3) |
| 35–49 | **DRAG** (`aggression ≥ 50`) | install, urgency 600 — movement pace ×600‰, every commit delayed ×1667‰ |
|      | **HEDGE** (else) | install the safe substitute: attack→advance-to-40 m-standoff; support→take-post-only; advance→advance-with-reserve. Urgency 850 |
| 20–34 | **OVERREACH** (`aggression ≥ 50`) | install the glory version: advance→attack nearest; attack→cavalry committed at once; sets `pursuesRepelled`; `boastful` quirk → will press a refused charge (§5b) |
|      | **HARD-HEDGE** (else) | as HEDGE, standoff 80 m, missiles never advance past effective range |
| < 20 | **DEFY** | charge becomes HOLD centred on his position ("protect my own"); herald cries it; deed recorded |

`iron-oath` quirk clamps DEFY → DRAG. Craven quirk widens hedge standoffs by 40 m.
Every order's HEDGE and OVERREACH substitutes are named per order in `data/orders.json`
(`hedgeSubstitute` / `overreachSubstitute`) — the engine never invents one.
Log `interpretation{captain, heed, choice, why-terms, herald}` — the herald line names
the political cause: take the single most negative term in the heed tally and render it
through `data/captains.json → heed.causePhrases`. Increment
`ordersGiven` for every affected unit; `ordersObeyed` only on OBEY / OBEY-HIS-WAY.
Re-evaluation happens only when: a new word arrives, his casualties cross 25%, a unit
of his own contingent breaks, or the Banner falls.

An existing unit order with `commitTicksLeft > 0` blocks installation of a new one
(logged `order_blocked{reason: COMMITTED}`).

**1c. Standing plans.** Every 5 ticks, evaluate each armed plan's trigger against
top-of-tick state (triggers in `data/standing-plans.json`; `HORN_SOUNDED(n)` is true on
the tick the player sounds horn channel n). On fire: **install the order directly on
the recipient's units — no courier, no heed check** (law 8: the captain agreed while he
was calm), clear the plan, log `plan_fired` with herald line. Mid-battle binding of a
new plan is the `BIND_PLAN` order: it rides a courier and passes heed ON ARRIVAL (he
can refuse to accept the envelope); once accepted it is armed and fires unchecked.

**1d. The captain's own hand** (merger of A's marshal initiative and B's doctrine).
Every 40 ticks, captains in ascending index order, at most one action each:

```
1. mercenary contingent with arrears > 0:  each unit rollPermille(rngGlobal) < 25 → it
   leaves the field (removed, logged, deed `deserted-unpaid`)
2. enemy mounted within 120_000 mm approaching his front, he has brace-capable
   unbraced units → BRACE them            (his brace call is late by
                                           idiv((100 − command) * 40, 100) ticks)
3. aggression ≥ 50, an enemy charge just struck his contingent, he has fresh mounted
   → counter-charge the charger's flank
4. one of his units WAVERING and he holds an unengaged unit → commit it beside the
   friend (aggression ≥ 60: at the enemy's flank)
5. one of his units ROUTING → he rides to it (enables its rally, §10)
6. caution ≥ 70 (or quirk craven) and his contingent's mean morale < 300_000 →
   sounds his OWN withdrawal: contingent charge = WITHDRAW, herald cries it,
   deed `sounded-own-withdrawal`
7. quirk hotheaded/charges-without-orders at intensity I: if an enemy is within
   100_000 mm and mean morale ≥ 600_000, rollPermille(bannerUnit.rng) < I*2 → ATTACK
```

**1e. Zero-courier directives.**
- `EXHORT(contingent)`: needs `exhortUsesLeft > 0` and banner LOS. Every unit:
  `morale += 200_000`, `moraleCeiling −= 80_000`; `exhortUntilTick = tick + 300`.
- `RIDE_TO(point)`: banner unit walks there; `bannerMoving = true`; signal range halves
  while moving.
- `HORN(n)`: log `horn`; plans on channel n fire in 1c next evaluation (same tick if
  tick % 5 == 0 — evaluate plans AFTER ingesting directives, which this ordering does).
  Horns have no intrinsic morale effect and no dullness (see OPEN-QUESTIONS §2).
- `SOUND_RETREAT`: army concedes; every contingent's charge = WITHDRAW; battle ends as
  a withdrawal when its last unit leaves or contact lapses (§12).

---

### PHASE 2 — PERCEPTION

Read-only caches per on-field unit: nearest enemy and distance, local friend/enemy
strength within 70 m, enemy cavalry in rear arc within 60 m, captain's banner unit in
LOS, banner in LOS, uncommitted reserve contingents in sight, elevation.

### PHASE 3 — INTENT

Routing units ignore everything and flee toward their own edge. Otherwise the active
ORDER wins; else the contingent's CHARGE compiles to per-unit tasks (compilation rules
per charge in `data/orders.json`), shaded by the standing `interpretation` (urgency
multiplies pace and delays commits; hedge standoffs applied here). Output per unit:
desired bearing, speed tier, desired facing, desired posture. Order windup and commit
countdowns decrement here. Charges like SCREEN auto-evade (trait `Evade`: any enemy
within 45 m → move directly away at RUN, no order needed).

### PHASE 4 — MOVEMENT

**4a. Refusal** (design A, verbatim — the canon's centrepiece):

```
for each unit c at CHARGE or RUN, for each enemy d with posture BRACED or STAKED:
   if arcOf(c, d) != FRONT: continue                    // brace is front-arc only
   range = d.refusalRangeMm (STAKED: 9_000)
   rangeEff = c.isMounted ? range : idiv(range * 300, 1000)
   if gapBetween(d, c) > rangeEff: continue
   eff = refusalBase × braceMul(1000‰ braced / 100‰ not)
         × cohesion‰ × morale‰ × speciesMul(mounted 1000‰ / foot 250‰)   // nested idiv chain
   decel = idiv(eff * 40, 1000)                          // mm/tick²
   c.speedCapThisTick = min(c.speedCapThisTick, max(0, currentSpeed − decel))
```

Morale and cohesion multiply refusal: **the same braced spears, frightened and ragged,
project almost nothing.** This property is load-bearing; preserve it exactly.

**Impalement rider** (design B's story, grafted onto A's physics): if the charging
captain's standing interpretation is OVERREACH and he carries quirk `boastful`, the
refusal deceleration applied to his units is halved (`decel = idiv(decel, 2)`) — he
spurs the horses onto the points — and any shock he delivers this charge costs him
`chargerLossPermille × 3`. Herald: he presses the charge home regardless; deed
`pressed-refused-charge`.

**4b–4d. Speed, facing, integration** — design A verbatim: tier speed × ground
multiplier (charge tiles use `chargeSpeedMul`) × slope × fatigue penalty × formation ×
type; accel 3 mm/tick² mounted, 2 foot, brake 12; turn rate from drill, type and
cohesion, ×350‰ in contact, cohesion −90 per brad turned; integrate; separate
non-engaged overlapping pairs once in ascending index order (mounted push foot 3:1);
movement cohesion drains and terrain cohesion caps applied.

### PHASE 5 — CONTACT AND SHOCK

**5a.** Contact exists iff `overlapWidth > 0 && gap ≤ engagementGapMm`. Engagement
lists sorted by index; `contact_begin`/`contact_end` logged; `contactTicks` counts
continuous contact.

**5b. Shock** on each NEW contact with closing speed ≥ 60 mm/tick (design A verbatim):

```
impactMen = min(idiv(overlapMm, attacker manWidth), c.files, idiv(overlapMm, defender manWidth))
shockRaw  = idiv(impactMen * massPerManKg * sq(idiv(closing,10)), 1000)      WIDE
          × wedge concentration (1700‰) × formation shockDeliveredMul × max(cohesion, 300_000)/1e6
resist    = 100 + armourEff(d, arc) + (braced front ? 140 : 0) + ranks*8
          + idiv(cohesion, 50_000) + formation shockResistBonus
killsMilli   = idiv(shockRaw * 240, resist)
chargerMilli = idiv(killsMilli * 90, 1000)         // ×3 under the impalement rider
d.morale −= idiv(killsMilli * 16_000, 1000)
c.cohesion −= 200_000;  d.cohesion −= 140_000
c stops dead; c.reformTicksLeft = type.arrivalReadyTicks
```

Log `shock` with closing speed, impactMen, both kill counts, arc, and a `why` block
(refusal applied, speed lost, braced, resist, terrain multiplier). Emit Tide record
`charge-landed` (+3) for the charger's side (§11).

### PHASE 6 — MELEE (design A verbatim — the Six Seconds)

Per engagement pair, both directions, top-of-tick state:

```
phase = (contactTicks ≥ 120 && both formations CLOSE-class) ? PRESS : CLASH
w     = PRESS ? pressWeapon : primary
ranks = PRESS ? 1 : min(u.ranks, w.fightingRanks)
engagedFiles = idiv(overlapMm, manWidth); FLANK caps at defender ranks, REAR at files
attackers = min(strength, engagedFiles * ranks)
reachClash = clamp(idiv((aReach − bReach) * 8, 100), −250, 250)   // PRIMARY weapons, both phases
reach = PRESS ? −idiv(reachClash, 2) : reachClash
hitP  = clamp(520 + (aSkill − bSkill)*4 + reach + (bMounted ? 90 : 0)
            + arcBonus(0/150/300) − idiv(fatigue*120, 1e6)
            − idiv((1e6 − cohesion)*80, 1e6), 120, 920)
pen   = w.pen + ((PRESS && w.pressPenaltyPermille ≤ 100) ? 12 : 0)
woundP = clamp(idiv(1000*pen³, pen³ + armourEff(b, arc)³), 10, 985)          WIDE
crowd = PRESS ? (1000 − w.pressPenaltyPermille) : 1000
disengage = (b just began FALL_BACK) ? 2500 : 1000
killsMilli = attackers × w.ratePer1000Ticks × hitP × woundP × crowd × disengage
             (nested idiv by 1000 at each step)
```

`armourEff(u, arc)`: front = armour + shield; flank = 82% armour + 25% shield; rear =
70% armour, no shield. Shield halved below 300_000 cohesion; shieldwall front ×1250‰;
mounted armour = `(rider*2 + horse)/3`. Whole kills removed from `killAcc`,
`recomputeGeometry`, `casualties` logged; `melee` aggregate logged every 10 ticks with
phase and both reach values.

Design B's engagement break-off (both sides under a cohesion floor separate to
breathe) is NOT adopted; see OPEN-QUESTIONS §5.

### PHASE 7 — MISSILES (design A verbatim)

Volleys are launched at the target's position AT LAUNCH and land where they were aimed
— a target that moves during the flight is missed; never lead the target. Hit chance =
260‰ base × target density‰ × cover multiplier × (1 + elevation bonus) × (moving
target ? 600‰ : 1000‰); wound by the cube law with `shieldMissileBonus` and Pavise
(front, stationary) added to armour; kills queue morale with the ×1400 missile terror
multiplier. Launch gating: posture SHOOTING, ammo, cooldown from the weapon's rate,
LOS, friendly-fire lane check (6 m); `ShootOnMove` trait shoots moving at −400‰.
Aimed volleys: windup 80, ×1600 hits, ×2 ammo, must be stationary. Ammo counts
volleys per man. Bombard: 60‰ misfire destroys the crew.

### PHASE 8 — ATTRITION

Fatigue drain by speed tier (STOP recovers 900; CHARGE costs 4200; melee floor 700) ×
armour/type multiplier × slope × ground. Above 800_000 fatigue the morale ceiling
erodes 2/tick. Cohesion recovers 900 + drill×12 standing still out of contact, capped
by formation and ground. Cooldowns decrement. Bloodlust: +60 per 100 ticks while
pursuing, capped 250, −1/tick otherwise.

### PHASE 9 — MORALE

**9a. Pressures** per unit, each term computed separately into a `why` record
(design A's table, plus the Tide term from design B):

```
casualties   −(killsTaken × 400 × 1e6 / maxStrength)   ×1400‰ if source MISSILE
flank/rear   −900 / −1800 per engagement in that arc
cavalryDread −1200 (enemy horse in rear arc within 60 m, not engaged)
outnumbered  −clamp((localEnemy − localFriend) × 6, 0, 1500)
fatigue      −idiv(fatigue, 500) when fatigue > 600_000
lordNear     +captain.valour × 8 when his banner unit is within 60 m
uphill       ±400 (≥ 2 m over an engaged enemy)
winning      +(dealt − taken) × 200
reserve      +250 per uncommitted reserve contingent in sight
recovery     +180 when unengaged and unshot
TIDE         + army.tide × 8            // B's coupling in A's units: ±200/tick at clamp
banner/exhort/reserve-committed one-shots as in data/constants.json
```

**9b. Contagion** (design A verbatim): each ROUTING unit (or active feigned
withdrawal — deliberately indistinguishable) emits `strength × 12` panic within 90 m,
linear falloff; each STEADY unit above 700_000 emits `strength × 4` courage within
45 m — but **courage does not pass between contingents whose captains are rivals or
carry `will-not-fight-beside`** (the court's feud, visible as a gap in the line).
Banner-trait units radiate their own steadiness.

**9c. Apply and clamp** to `[moraleFloor, moraleCeiling]`; ceiling erodes
`kills × 700 × 1e6 / maxStrength`.

**9d. State transitions** with hysteresis 30_000: STEADY↔SHAKEN at 600_000,
SHAKEN↔WAVERING at 350_000, WAVERING→ROUTING below 150_000 (no hysteresis — breaking
is breaking). On rout: cohesion = 100_000, order and plans cleared, formation loose,
`rout_begin` logged with panic emitted, Tide records written for both sides.
ROUTING→RALLYING needs: morale > 380_000 held 60 ticks, no enemy within 80 m, captain
alive within 100 m (his rally-ride, 1d.5, brings him) or the unit reached its own
baseline — **and `ralliesUsed == 0`. A unit rallies at most once (design B); a second
break is FLED, final.** RALLYING→SHAKEN after 60 ticks, `ralliesUsed = 1`.
Any state → DESTROYED below 10% strength. Non-combatants rout below 400_000.

**9e. Log** `morale` every 10 ticks per unit, immediately when any single term exceeds
±50_000, always with the full `why` breakdown. Mandatory, not an optimisation target.

### PHASE 10 — ROUT AND PURSUIT

Routing units take 900 milli-kills/tick from enemies within 30 m (×3500‰ mounted,
soak ignored). Capture every 20 ticks: `captureP‰ = 120 + (mounted ? 200 : 0) +
idiv(fatigue, 10_000) − captain.valour + (pursuer quirk hungry-for-ransom ? 150 : 0)`;
captured captains and men go to the Aftermath's captives. Pursuers' cohesion floors at
200_000 and bloodlust accrues — the longer they chase, the less they hear you.
Pursuit policy (REIN_IN / SHORT / FULL, set at deployment) is enforced through heed:
REIN_IN against a captain with high greed or `blood-feud` fails exactly like any
defied order, and `over-pursued` deeds are recorded.

**Captains fall here, and in phase 9.** A captain rides with his `bannerUnitIdx`. When
that unit enters ROUTING, roll `K.battle.captains.fallPermilleOnBannerUnitBreak` (300) on
the unit's own stream; when it is DESTROYED, he falls without a roll. On falling, split
his fate by `K.battle.captains.fateSplitPermille` (slain 340 / wounded 300 / maimed 110 /
captured 250) — a captured captain goes to the enemy's `Spoils.captives` at
`standing × K.aftermath.ransomCrownsPerStandingPoint`. Emit `captain_fell` or
`captain_captured`, write the Tide record, apply
`K.battle.morale.pCaptainKilled` to every unit of his contingent and
`K.battle.captains.contingentMoraleOnCaptainFall` once to the contingent, and stop the
ceiling by `K.battle.morale.ceilingLossCaptainKilled`. For
`K.battle.captains.successionTicks` (600) the contingent heeds nothing at all and runs no
own-hand actions; then the senior surviving unit's leader succeeds with every axis at
`successorAxesMulPermille` (750). A commander who falls is replaced the same way, and the
army's `authority` falls with him. Herald lines in `data/captains.json`.

### PHASE 11 — ARMY AND TIDE

```
armyMorale = strength-weighted mean morale of on-field units
```

**The Tide** (design B, integer-encoded; a READING over the event record):

every 20 ticks, per side:
```
tide = clamp( Σ over events of the last 600 ticks:
                 weight(kind) × TIDE_DECAY[idiv(tick − e.tick, 20)] / 4096 , −25, +25 )
```
`TIDE_DECAY[i] = round(4096 × 0.5^(i/15))` for i = 0..30, a checked-in table (half-life
15 s). Weights (`K.tide.weights`): enemy unit broke +8 / own −8; enemy captain fell
+5 / own −5; enemy banner fell +10 / own −10; charge landed +3; ground gained
+1 per 20 m of engaged-front advance (recorded per second). The Tide is derived
entirely from `state.events` — the determinism test recomputes it from the replay log
and asserts equality with the cached value.

**Treachery** (this canon's concrete spending of the court's number — the contract
leaves it to the battle, so the battle must say what it does): every 40 ticks, for
each contingent with `treachery ≥ 40` whose side's tide ≤ −10:

```
p‰ = (treachery − 30) × 2                    // 20‰..140‰ per check
roll = rollPermille(captainBannerUnit.rng)
if roll < p‰: treachery ≥ 60 → the contingent DEFECTS (changes side, herald cries it,
                                deed `turned-cloak`, Tide −10/+10)
              else            → it WITHDRAWS from the field (deed `left-the-field`)
```

**Army break** when any of: routed + destroyed + fled strength ≥ 450‰ of start;
armyMorale < 250_000 held 100 ticks; the Banner destroyed AND armyMorale < 450_000;
every contingent captain dead, captured or routing. On break: all units −400_000
morale, `army_break` logged, `phase = PURSUIT`, `pursuitTicksLeft = 1200 +
rnd(rngGlobal, 1201)`.

### PHASE 12 — VICTORY

In PURSUIT only phases 2,3,4,6,8,9,10,13 run. Battle ends when pursuitTicksLeft
reaches 0, or no contact for 1200 ticks after a SOUND_RETREAT, or `tick ≥ maxTicks`
(24_000). Emit `battle_end` and then the two Aftermath records (§14).

### PHASE 13 — LOG

Append-only, side-effect free: turning the log off must not change a single value.
Delta record every tick (position/facing/strength), keyframe every 10 ticks (full
renderable state incl. files, ranks, spacing, render seed), `army_morale` and `tide`
every 20 ticks, events on the tick they happen in phase order.

---

## 5. THE REPLAY LOG

NDJSON, `{t, k, ...}` per line, strictly non-decreasing `t`.

**Layer 1 — the seed of truth**: `header` (version, seed, rulesetHash = sha256 of all
`data/*.json` sorted, tick rate, field), `terrain` (RLE tiles), `roster` (both hosts
complete, plus the RESOLVED unit-type data actually used, copied in so old replays
survive rebalances), `inputs` (every directive with its tick). Re-running from these
must reproduce the event stream byte for byte; CI proves it.

**Layer 2 — the stream**: `key` / `d` frames as above, and events:

`order_issued · courier_dispatch · courier_arrive · interpretation · order_blocked ·
plan_bound · plan_fired · horn · charge_change · posture_change · contact_begin ·
contact_end · shock · melee · volley_launch · volley_land · casualties · morale ·
morale_state · rout_begin · rally · unit_fled · unit_destroyed · captain_fell ·
captain_captured · banner_fell · reserve_committed · exhort · reinforcement_sighted ·
reinforcement_arrives · deed · tide · army_morale · army_break · treachery ·
pursuit_begin · turning_point · battle_end · aftermath`

**Events carry their reasons** — a `morale` event logs every term; an `interpretation`
logs every heed term; a `shock` logs the speed the refusal took away. And every
narratable event carries a **`herald`** string (design B's name for design A's
`narrate` — one field, B's name chosen for its voice), filled from the templates in
`data/captains.json` and `data/standing-plans.json`, so the battle reads as a
chronicle with no renderer at all.

**Turning points**: every 20 ticks record `d(armyMorale)`; at the end emit the 3–6
worst excursions per side as `turning_point` records naming the unit, the tick, and
the dominant `why` term. *"You lost the battle at 4:12, when the knights took the
spears of Millrow in the rear and the left folded in eleven seconds."* Generated, not
written.

---

## 6. THE AFTERMATH

Assembled at `battle_end`, one per Host, shape per `docs/WRIT-THE-COURT.md`:

- per unit: `dead / wounded / captured / deserted / survived` (MUST sum to strength at
  muster — the court asserts it), `brokeAt` fraction, `defected`, `ordersGiven`,
  `ordersObeyed`, `veterancyGained` (= `idiv(min(contactTicks, 4000), 100)`).
  Wounded: `idiv(dead * (200 + physicians * 40), 1000)` of raw casualties are reported
  wounded instead of dead — the battle decides, the supply train's physicians tilt it.
- per captain: fate (unhurt/wounded/maimed/captured/slain) and conduct — computed from
  the record: `defected` → defected; fled the field routing → fled; any DEFY or
  `abandoned` deed → faltered; a `distinguished`-class deed (held-the-line ≥ 180 s,
  broke-the-enemy, slew-captain, took-banner) → distinguished; else steady;
  never engaged → did-not-engage. Plus ordersGiven/ordersObeyed and menLost.
- per contingent: `lossShare`, `defected`, `plunderSeized` (greed-weighted share of
  the field's plunder for pursuers).
- spoils: plunder, banners taken, captives (with ransom = captive standing × 4
  crowns), our people taken, baggage.
- `deeds[]`: the full typed list —
  `first-blood · held-the-line(seconds) · held-the-ford · broke-the-enemy ·
  slew-captain · took-banner · saved · abandoned · pressed-refused-charge ·
  over-pursued(n) · took-prisoners(n) · sounded-own-withdrawal · deserted-unpaid ·
  turned-cloak · left-the-field · died-at-the-banner · fled-the-field` —
  each with actor, target, tick fraction, and a one-sentence tale.
- `quirksHonoured`: the quirk ids this engine actually implemented, so the court
  narrates only real causes.
- `blame` / `glory`: this engine leaves them null; the court computes its own from
  conduct and casualties (the contract permits either).

---

## 7. DETERMINISM TEST (required, not optional)

1. A corpus of ≥ 30 stored battles; CI re-runs every header and asserts byte-identical
   event streams.
2. A run with units iterated in REVERSE index order in phases 2, 3, 6, 9 must be
   byte-identical (what the per-unit streams buy).
3. A run on a different Node major version must be byte-identical.
4. The Tide recomputed from the replay's own event lines must equal every logged `tide`
   value (proves it is a reading, not a store).
5. The build fails on any occurrence of `Math.random`, `Date.now`, `performance.now`,
   `Math.sqrt/sin/cos/atan2`, bare `/` outside `idiv`, or a numeric literal containing
   `.` inside the sim source tree.

---

## 8. IMPLEMENTATION ORDER

| Step | Build | Verify against |
|---|---|---|
| 1 | Tick loop, Unit, geometry, log writer | keyframes appear |
| 2 | Phases 3, 4, 6; two units, flat ground | the melee ratio table in `K.melee.verifiedRatios` |
| 3 | Phase 5 shock + 4a refusal | `K.shock.worked` and `K.refusal.verifiedApproaches`, exactly |
| 4 | Phase 9 morale + contagion + Tide | a line of six units folds unit by unit; the Tide swings and decays |
| 5 | Phase 1 couriers, heed, plans | **now it is Vassal Vessels** |
| 6 | Phase 7 missiles, Phase 8 fatigue | archers break a block they cannot kill |
| 7 | Terrain, LOS, signal range | the hill is worth taking for all three reasons (momentum, missiles, voice) |
| 8 | Phases 10–12, treachery, Aftermath | deeds and grudges reach the court |

The replay log goes in at step 1, not step 8. Every step ends with the determinism
test green.
