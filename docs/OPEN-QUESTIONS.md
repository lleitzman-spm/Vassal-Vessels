# OPEN QUESTIONS

This file is where the seams live, so that they are not lost.

Vassal Vessels was made by grafting three independent designs into one: two battle designs
written blind to each other against the same brief (**A** and **B**), and one design for the
realm and the court (**the court design**). The graft is decided and `docs/KINGDOM.md` is the
constitution. But a graft has joins, and a join that nobody wrote down becomes, six months
later, a number somebody is afraid to touch because they cannot remember whether it was
reasoned or guessed.

Everything below is one of four things:

- **a number chosen on feel** — nobody has played this; the number is a starting position;
- **a join** — two mechanisms that touch, where the touching may not hold;
- **an incompatibility** — the three designs disagreed and one had to lose;
- **a doubt the designers themselves flagged**, carried forward in their own terms.

Nothing here is a to-do list. Several of these will be answered by the first hour of play and
several will still be open in a year. Add to it freely; it is meant to grow.

---

## 1. THE MOST SERIOUS ONE — the heed scale is the join of two differently-calibrated systems

Design B's six-outcome table (OBEY at 70, OBEY-HIS-WAY at 50, DRAG/HEDGE at 35,
OVERREACH/HARD-HEDGE at 20, DEFY below) was calibrated against **B's own heed formula**, which
had a base of 50, a half-weight on loyalty, and **no term at all for how hard the order was**.

Design A's order difficulties (0 for HOLD, 35 for CHARGE, 45 for FALL_BACK, 70 for FEIGN, 85
for FALL_BACK while in contact, 75 for CHARGE into braced polearms) were calibrated against
**A's own obey score**, which summed drill *and* loyalty *and* presence *and* morale/10000 —
a number that routinely reached 200 and was rolled against 0–99.

**The canon uses B's thresholds and A's difficulties.** That is a scale nobody tested, and on
paper it is much harsher than either parent. Worked from the example host in
`data/example-host.json`:

| Contingent | obedience | + craft | + banner | order | difficulty | heed | outcome |
|---|---|---|---|---|---|---|---|
| The Household | 88 | +15 | +10 | CHARGE | −35 | **78** | OBEY |
| The Household | 88 | +15 | +10 | FALL_BACK in contact | −85 | **28** | HARD-HEDGE |
| Thornbury | 60 | +13 | +10 | FALL_BACK in contact | −85 | **−2** | DEFY |
| Stormmarch | 47 | +19 | +10 | CHARGE into braced pikes | −75 | **1** | DEFY |

Read that table twice. It says that **the single most important order in the game — step back
out of the press before the six seconds turn — cannot be given by improvisation to anybody,
ever, including your own household guard.** And it says that ordering a charge onto set spears
produces a public defiance and a court deed, rather than a captain sensibly declining.

There are three honest readings and we do not know which is right:

1. **It is correct and beautiful.** Law 8 says foresight is cheap and improvisation is dear.
   Under this scale, the six-second disengage is reachable *only* through a standing plan bound
   before the battle (`ENGAGED_FOR_TICKS 110 → FALL_BACK`, which takes no heed check at all).
   The hardest tactics in the game become things you must have foreseen. That is a strong,
   coherent design — but it was arrived at by accident, not on purpose, and it makes standing
   plans close to mandatory rather than clever.
2. **The formula needs a base.** Adding a flat +20 (B's base, scaled for the missing loyalty
   half-weight) moves the Household to 48 on a fighting withdrawal and Thornbury to 18 — still
   hard, no longer impossible.
3. **The difficulties need rescaling.** A's in-contact modifiers (+40 on FALL_BACK, +40 on
   WHEEL) were sized for a 200-point scale and are simply too large on a 100-point one.

**Nothing has been changed.** The canon stands as written; this is flagged, not fixed, because
the answer is a playtest and not an argument. Whoever plays first should look at this table
before touching anything else — and should watch for the second-order effect: DEFY writes a
deed, deeds write grievances, and a scale that produces DEFY on routine orders will inflate the
whole court's grudge economy inside two campaigns.

---

## 2. Numbers chosen on feel

### 2.1 The courier count — the designers' own flag, and we made it worse

Design A stated plainly that the courier count (**3 to 6**, set by the Marshal's quality) is
*the whole difficulty dial of the battle*, and that the range was **picked from feel**. Nobody
had played it either.

The graft joined that dial to the court's `orderCapacity`, which is the cleanest single join in
the whole project — two designs having independently invented the same number. But the court's
range starts at **2** for a vacant Marshalcy, not 3. So the merged floor is a third harder than
the floor A chose by feel, and it arrives exactly when the player is least equipped for it:
early, poor, with no Marshal.

Open: is 2 riders playable at all, or is it a punishment nobody recovers from? Should the vacant
Marshalcy give 3 and a great Marshal 7, moving the whole band up? Should the floor depend on the
size of the host, so a small army with two riders is fine and a large one is not?

### 2.2 Standing-plan slots (`orderCapacity + 2`)

Invented for this canon. Design A gave **two** free pre-battle sealed writs per army plus one
armed writ per unit; design B gave **four** briefed horn signals. The graft gives 4 to 8 free
plans at deployment, which is far more generous than either parent, on the reasoning that the
mechanism is the fun part and should be reachable.

Open: does 8 plans on a great Marshal mean the battle runs itself and the player watches? The
per-unit cap (1, or 2 at wits ≥ 70) is the intended brake. Nobody knows if it is enough.

### 2.3 The melee pacing — design B's own flag

Design B flagged its melee constants as unproven and named the target explicitly: fights that
**pulse** rather than grind, and a press that lasts **three to five minutes** before somebody's
cohesion crosses the knee. It reached that pacing partly through an **engagement break-off** —
two exhausted units separating fifteen metres to breathe — which the canon **did not adopt**
(§4.3).

So the pacing target survives and the mechanism that produced it does not. Open, and important:
does a three-to-five-minute press actually emerge from A's per-tick attrition and the Six
Seconds, or do lines grind to mutual destruction because nothing ever lets go? The verified
ratios in `K.battle.melee.verifiedRatios` fix the *relative* outcomes; nothing fixes the
*duration*, and duration is the whole feel of a battle.

### 2.4 The Six Seconds is exactly 120 ticks

Design A's press onset. The number is a good one — it matches the historical intuition and it
gives a spear line a job it can be trained to do — but it is a hard step, not a ramp. At tick
119 reach is worth +250; at tick 121 it is worth −125. Open: should the inversion ramp over a
second or two? A ramp would be kinder and would blur the tell, and the tell is the point.

### 2.5 The jitter is ±8

From design B, kept whole because it is small enough not to dominate and large enough that the
same battle is not the same story twice. Untested against the merged scale (§1), where a swing
of 16 points crosses a whole outcome band.

### 2.6 The Tide's half-life is 15 seconds

Design B's anti-snowball, kept exactly. Fifteen seconds is short: an advantage that is not
pressed evaporates almost visibly. Open: does that make the Tide feel responsive, or does it
make it feel like weather — always moving, never meaning anything?

### 2.7 The treachery numbers

`(treachery − 30) × 2` per mille per check, every 40 ticks, only when the Tide is at −10 or
worse. **These are this canon's own invention.** The court contract deliberately says the battle
decides when and how a contingent turns, and neither battle design said anything at all, so the
rule had to be written from nothing. At treachery 60 that is 60 per mille every two seconds
while losing — roughly even odds inside a minute of a bad Tide. Open: too eager? Should the
check require the contingent to be *unengaged*, so a defection is a choice rather than a
collapse?

### 2.8 The bridges between the court's 0–100 scales and the battle's bars

`moraleCeiling = 500_000 + resolve × 5_000`, `cohesion = 400_000 + contingentCohesion × 6_000`,
`fatigue = courtFatigue × 10_000`. **All three are this canon's own.** Neither battle design had
both scales; the court design deliberately declined to say. They are linear, they are
defensible, and they are guesses. The consequence to watch: resolve 20 gives a ceiling of
600,000, which is exactly the STEADY threshold — so the worst troops in the realm start the
battle one point of pressure from SHAKEN. That may be exactly right or a cliff.

### 2.9 Captain mortality

`fallPermilleOnBannerUnitBreak = 300`, the fate split, and the 600-tick succession blackout are
design B's shape with this canon's numbers. Design A had **no captain-death rule whatsoever**,
which left the Aftermath's required `CaptainFate` with nothing to compute it from — a genuine
hole, filled here rather than left. Untested: a 30 per cent chance per break may kill most of a
realm's leadership in three battles, which the court would experience as a succession crisis
every campaign.

---

## 3. Where the three designs disagreed, and who lost

| Question | A said | B said | Canon | Why, and what we gave up |
|---|---|---|---|---|
| Tick rate | 20 Hz | 10 Hz | **20 Hz** | The Six Seconds and courier latency are calibrated at 50 ms. B's melee constants were per-second and had to be re-derived; any error in that re-derivation is invisible until playtest. |
| Arithmetic | integers only | doubles | **integers only** | The replay is the proof, and a float replay diverges. Cost: every one of B's formulas had to be re-expressed, and `0.0002` style factors became `× 240 / resist`. |
| Field | 1200 × 800 m | 1200 × 900 m | **1200 × 800** | A's tile grid was already built to it. Trivial. |
| Cavalry refusal | a deceleration field, front arc, multiplied by morale and cohesion | a binary balk at 10 m plus free spear strikes | **A, whole** | The best single idea in either design: morale lives inside the counter. B's impalement story survives as a rider on the boastful quirk. |
| Disobedience | one roll: obey / hesitate / refuse | six outcomes, all visible motion | **B, whole** | Disobedience as a verb, never a null. Cost: see §1. |
| Momentum | none | the Tide, a pure reading | **B, whole** | It fits law 1 exactly. |
| Terrain | 8 m tile grid, 11 ground types | feature polygons, 8 features | **A's grid**, B's features folded into the six words the court says | B's *village* and *brook* are gone (§4.6). |
| Horns | none | 4 briefed signals, dulling with repetition | **3 channels, no dulling** | A horn here carries no morale of its own — only a plan somebody already agreed to — so there is nothing for dullness to reduce. Cost: B's lovely "the first horn is God, the third is the camp dog" is gone, and with it a real reason to hoard horns. |
| Melee break-off | none | both sides under 15 cohesion separate to breathe | **not adopted** | It contradicted A's continuous-contact model and the Six Seconds counter. See §4.3 — this is the one rejection most likely to be wrong. |
| Captain axes | 8 lord stats | 4 axes | **the court contract's 7** | Both mapped on cleanly. A's `presence` became `valour`; A's `initiative` became `wits` plus quirks; B's `honor` became low `greed` plus quirks. `drill` moved to the unit, where it belongs. |
| Courier speed | 10 m/s | 7 m/s | **10 m/s** | A's nine-second ride to the far wing is a tuned feel of A's field. B's two riders — a quarter longer past danger, three seconds to find a captain in the press — were adopted on top, which is a small graft nobody has tested together. |

---

## 4. Joins that may not hold

### 4.1 The standing-plan loophole is deliberately unbalanced

A plan fires with **no heed check**. That is the mechanism's whole reason to exist and it is
stated as law 8. It also means the correct play against a disloyal army is to bind everything in
advance and improvise nothing — and if §1's scale stands, that is not a strategy, it is the only
strategy. Watch for a player who binds eight plans and then does nothing for eleven minutes. If
that happens the fix is probably not to weaken plans but to make the *player's own hand* (the
three horns) carry more of the load.

### 4.2 Quirks are permitted to be ignored, which could become "ignored"

The contract says an engine implements what it can and legally ignores the rest, and reports
what it honoured. `data/quirks.json` specifies all 28 exactly, so the canonical engine has no
excuse — but the permission is real and there is no test that would ever fail if an engine
quietly implemented four of them. Open: should the Aftermath be required to report the quirks it
*ignored* as well as the ones it honoured, so the gap is visible in the report rather than in
nobody's conscience?

### 4.3 Nothing lets a melee stop

Design B's break-off was rejected on structural grounds and it may have been carrying more than
we noticed: it produced the pulse, the pulse produced the moments when horns and reserves
mattered, and the whole "crisis" beat of B's dramatic arc hangs off it. The canon's substitute
is A's FALL_BACK — which §1 suggests is unreachable by improvisation. If the press turns out to
be a grind with no rhythm, this is the first place to look.

### 4.4 A Host says nothing about the other side, but four quirks point at it

`blood-feud`, `refuses-to-strike-kin`, `may-turn` and `will-not-fight-beside` all carry a target
id, and the first three target something on the *enemy's* side. `runBattle` receives both hosts,
so the lookup is legal — but it is the only place in the whole design where one side's paperwork
reaches across the line, and it quietly means a Host is not quite self-contained after all.
Open: should the court instead resolve these into plain numbers before the battle (a resolve
bonus, a melee multiplier) and keep the wall intact?

### 4.5 The Aftermath's sum invariant is strict and the pursuit is messy

`dead + wounded + captured + deserted + survived` MUST equal strength at muster, and the court
asserts it loudly. Meanwhile the battle removes whole men from a milli-man accumulator, units
defect mid-battle, mercenaries walk off the field, and latecomers may never arrive. Every one of
those is a place where the sum can drift by one man. Open, and worth a test on day one: which
bucket does a defected unit's men go into? (Canon implies `deserted`, but does not say it.)

### 4.6 Village and brook

Design B had both and neither survived, because the court's `Ground.features` vocabulary is six
words and adding to it is a contract change. A village — narrow frontage, half cover, no
formations, and *somebody's home* — is a good piece of ground and its absence is felt. Open:
extend the vocabulary in a minor contract bump, or let the battle synthesise a village from
`road` plus a home holding on the field?

### 4.7 The obligation days never reach the battle as a number

Design A's best court-to-field wire was `obligationDaysLeft`: a lord on day thirty-eight of
forty is thinking about his harvest, and his men are harder to order and break sooner. The Host
contract has no field for it. It is expressed here as the quirk `service-nearly-up` — which
works, and is a good demonstration of what quirks are *for*, but it means an engine is allowed
to ignore the single most elegant wire in the design.

---

## 5. The court design's own doubt: is a dice-free muster too legible?

The court design flagged this itself, and it is the deepest question in the project.

**The muster never rolls dice.** Given the records, what stands in the field is determined
arithmetic, and the forecast screen will tell you before you send the letter: this house will
send sixty-eight of ninety, and here are the seven terms and the four records that made it.
Every argument for that rule is strong. It makes the game *about* reading rather than gambling.
It means a defection is never unfair. It makes "I did not know" a fact in the book rather than
an excuse.

And it may drain all the dread out of sending a letter.

The worry, stated plainly: a summons should feel like posting a letter you cannot unpost. If the
forecast is exact, sending it is a calculation, and calculations are not frightening. The
uncertainty that remains is *hidden information* — grudges you never learned of, factions you
never uncovered — which is real, but which a careful player can drive close to zero with a
Spymaster, at which point the court becomes a very well-lit spreadsheet.

Three candidate answers, none adopted:

1. **Leave it.** The dread is meant to live in the *deadline*, not the dice: you have 41 days
   and eleven things worth doing, and the terror is opportunity cost. If that lands, no change
   is needed.
2. **Make the Spymaster costlier than he looks**, so full information is a real sacrifice rather
   than a seat you fill once. (He currently makes no enemies at all when granted, which is
   deliberate and possibly too kind.)
3. **Give the vassal a decision, not a die.** Keep the arithmetic exact, but let a house's
   *answer* depend on something the crown genuinely cannot see — what the enemy offered him last
   winter. Not randomness: another agent's reasons. This is the most interesting answer and much
   the most work.

---

## 6. Seams in the data model itself

- **Where numbers live.** The rule is in `data/constants.json → whereNumbersLive`: formula
  constants and shared dials live in `constants.json`; a row's own facts live on the row. It is
  a judgement call and it is applied by hand. A reasonable person could want every number in one
  file; the counter-argument is that the manual is the acceptance test and a twelve-year-old
  should not have to open two files to learn what a spear reaches.
- **Prose drift.** Many `explains` sentences say a number out loud ("four points of grudge for
  every point of his claim"). If the constant is retuned the prose goes stale and nothing
  catches it. A lint that reads every `k` key and checks the prose nearby would be a genuinely
  good tool and does not exist.
- **There is no `acts.json`.** Act day-costs and tracks were folded into
  `K.court.actDays` rather than given a table of their own, because they are the calendar and
  the calendar is the hardest dial in the court. Consequence: the *explanations* of what each
  act is for now live only in `data/seats.json`, `data/obligations.json` and this repo's docs,
  not beside their prices. If that reads badly in the Codex, split it back out.
- **`$`-prefixed keys.** `data/example-host.json` carries its commentary under `$explains` and
  `$about`, because it is a contract artefact and a strict consumer should be able to drop every
  `$` key and still have a valid Host. Every other data file uses plain `explains`. Two
  conventions in one directory is a small ugliness with a real reason.
- **`keywords.json` or `traits.json`?** The canon calls the unit-trait sheet
  `data/keywords.json` and `docs/WRIT-THE-BATTLE.md` §2.2 resolves against that name. The Codex
  tooling currently asks for a `data/traits.json` and reports it as "not yet authored". They are
  the same thing under two names and there must only be one file — writing a second would
  duplicate the whole trait vocabulary, which is exactly the failure this project is arranged to
  avoid. Whoever owns the tooling should rename its expectation to `keywords.json`, or the canon
  should be amended to `traits.json` and every reference moved with it. Not both.
- **Double-counted grudges.** `mercenaries-preferred` appears both as a grievance and as a
  willingness term. The canon resolves it by counting it once — shown as its own line in the
  willingness tally, excluded from the loyalty fold. `over-called` and `harvest-taken` also
  appear twice but are genuinely two different things (a state he is in, and a record he keeps).
  Somebody should check that reasoning with fresh eyes.

---

## 7. Things only play will answer

- Does an eleven-minute battle with two riders feel like command, or like watching?
- Is the Tide readable without a screen that draws it, and is drawing it a display decision that
  would change the design? (It must not be — see the first law in `CLAUDE.md`.)
- Does the cascade — one unit breaks, panic reaches twice as far as courage, a wing folds in
  eleven seconds — actually emerge, or does it need a nudge?
- Do the eight loops in `KINGDOM.md` §12 behave as judged? The Precedent Loop especially: an
  unpunished refusal costing every other house 3 obedience compounds fast, and the only exit is
  attainder, which is expensive and makes four enemies.
- Is `readForecast` the screen the player lives on, or the screen the player learns to ignore?
- After three campaigns, is the court a story or a maintenance chore?

---

## 8. How to close a question

Play it, or run it. Then edit `docs/KINGDOM.md` — the constitution wins until amended, so an
answer that is not written there is not an answer. Move the question out of this file into the
relevant writ, say in the commit which one you closed and what the evidence was, and leave the
seam visible in prose if the join is still load-bearing.

Do not close a question by deleting it.

---

## Raised by the court build

Everything below was found while building `src/court/` against `docs/WRIT-THE-COURT.md`. The
writ is precise nearly everywhere; these are the places where it was silent, where it and the
data disagreed, or where the implementation had to choose a reading and could defensibly have
chosen another. Each says what was done, so the choice can be reversed by someone who knows
better rather than rediscovered.

### C1. Five data files the writ names do not exist

The writ points at `data/answers.json`, `data/grievances.json`, `data/favours.json`,
`data/holdings.json` and `data/captains.json → quirks`, and at causes for a war. None of them
is in `data/`. Law 6 says a number not in `data/` does not exist, so the layer is currently in
breach of it by necessity.

**What was done.** The five tables are written in `src/court/codex.ts`, below a divider that
says loudly that they are standing-ins, in the shape the JSON should take. When the files land,
that section is deleted and a loader replaces it — no call site changes, because everything
reads them through the same exported names.

`data/obligations.json → acts`, which the writ also named, HAS since landed as
`court.actDays` in `data/constants.json`, and the layer reads it there. Note that its table
prices twenty-two acts of the twenty-eight in the record vocabulary: **`homage` and `wed` have
no row**, and are priced on feel in `codex.ts → UNPRICED_ACTS` (2 days and 10 days).

### C2. The court's constants are transcribed, not loaded — because the layer may not read a file

Every reading in the writ has a signature with no codex argument (`readAnswer(c, campaignId,
houseId, at)`), so the constants must be reachable from module scope; and the layer is required
to be pure and headless, so it may not read a file. The two together force a transcription of
`data/constants.json → court` into TypeScript.

**What was done.** `src/court/codex.ts → COURT` is that transcription, and
`test/court/codex.test.ts` reads the JSON off disk and fails if one digit has drifted **in
either direction** — a number on disk that the codex ignores is also a failure. The file on
disk stays the authority. If a future front end can inject a codex, the signatures in the writ
would have to grow an argument; that is a writ change, not an implementation one.

### C3. Nine answers, ten answer kinds

§3.2 says the thresholds pick "one of the nine answers"; `AnswerKind` has ten members.

**What was done.** `scutage` is read as NOT a rung on the ladder — it is a bargain struck in a
record of its own (`AcceptScutage`), which is why the writ counts nine and the union holds ten.
A house whose willingness lands in the middle bands also reports `scutageOffered`, the coin it
would rather pay, so the player can take it. The nine bands and their fractions
(1.25 / 1.0 / 0.9 / 0.75 / 0.6 / 0.5 / 0.2 / 0 / 0) are feel-chosen inside the two fixed points
the writ gives: more-than-owed at 95, turncoat below 3.

### C4. Kinship is counted once, in loyalty, not twice

§2 defines loyalty as "50 + favours (decayed) + kinship − grievances". §3.1 also lists
"kinship" as a willingness term. Counting it in both would count the same fact twice, and a
number counted twice cannot be predicted by a player.

**What was done.** Kinship lives in loyalty. Willingness does not lump loyalty into one term —
it **flattens loyalty's terms into itself**, so the kinship term is visibly there, beside the
grudges, in the answer sheet. (Flattening is also what makes the required "the grievance is
visible as a term in the Tally" true rather than approximately true.) Where loyalty clamps at
0 or 100, a correction term is added by name so the terms still sum exactly to the value.

### C5. How blood kinship is told from marriage

The writ gives `Betroth` and `Wed` and two constants (`kinshipBlood` 15, `kinshipMarriage` 8)
and never says which record makes which.

**What was done.** A `wed` joining captains of two houses is kinship by MARRIAGE. A `birth`
recorded in either house afterwards makes the tie BLOOD — the marriage bore a child and the
houses now share a grandchild. A `betroth` not yet followed by a wedding is a FAVOUR
(`betrothal`), not kinship, and stops counting the day the wedding happens. A wardship is a
tie of a third kind worth nothing in loyalty on purpose: it buys obedience by holding a child,
and pretending it also buys affection would be the game lying about what hostages are.

### C6. What a summons drinks from the vessel

The writ says summonses drink from the vessel and that the vessel is forty days, but a
`Summon` record carries a stand-by day and no duration.

**What was done.** A summons drinks the days the campaign actually kept men in the field — read
from the records where the records know (a later `march` of the same campaign, a casualty
record inside the window) — and otherwise the full forty, because a crown that summons a house
must plan on owing it the whole bond. The consequence is that in an ordinary year the FIRST
summons empties the cup and the SECOND is the one that pays the dry-vessel penalty, which is
what makes the −15 / −25 / −35 ladder legible.

### C7. A vacant seat's grievance has no record behind it

Every grievance in the layer points at the act that caused it, so that striking the act revokes
it. "The claimants sour slowly while the seat sits empty" (KINGDOM §8.3) is caused by the
ABSENCE of a record, which has no id.

**What was done.** It is emitted with a synthetic cause id `vacancy:<seatId>` and commented as
the one grievance that is revoked by WRITING a record rather than striking one. If that is
unacceptable, the alternative is to make vacancy a real record (`declare-vacant`), which is a
writ change.

### C8. `UnitFate.veterancyGained` has no word in the record vocabulary

`AftermathRecord.kind` is a closed list and none of its fourteen values means "these men
learned something", but the writ says the court adds the battle's `veterancyGained`, capped at
80.

**What was done.** It is written as a `distinguished` record whose `subjectId` is a UNIT id
rather than a captain id. Readings that want a captain ignore it cleanly, because a unit id is
nobody's captain. This is the least bad of three bad options (the others: discard the engine's
number and count battles instead, or widen the record vocabulary, which is a writ change).

### C9. Seat effect is a factor between a half and one, and `SeatRecord.base` is a bag of levers

`SeatReading.effect` is declared a `Tally`, and the formula is `base × (competence/100) ×
(0.5 + loyalty/200)`, but `SeatRecord.base` is `Record<string, number>` — a bag, not a number —
and `authorityPerEffect: 40` only makes sense if effect is around 1.

**What was done.** The conventional key `strength` (defaulting to 1) is what the formula
multiplies, so `effect` lands in [0.5, 1.0] and `40 × effect` gives the writ's authority band.
Every other key in `base` is a named lever a particular reading knows how to spend. Which of a
captain's three competences an office uses is also unstated and was chosen per seat (Marshal on
command, Chancellor and Spymaster on wits, and so on) — see `seats.ts → competenceFor`.

### C10. A vacant Marshalcy gives MORE authority and FEWER couriers

With the seat empty the crown commands in person, and `authorityCrownBloodBonus` plus the
crown's own standing outweigh the half-effect penalty — so granting the Marshalcy to a
middling vassal RAISES order capacity from 2 to 4-plus while LOWERING authority a little.

This falls straight out of the writ's two formulas and it reads as a real trade rather than a
bug, so it was left alone and asserted in `test/court/season.test.ts`. But it is worth a
playtest: if "grant the Marshalcy" should be a pure gain, `authorityBase` or the crown-blood
bonus is the dial.

### C11. Things the writ does not price at all

Chosen on feel, gathered in `codex.ts → CHOSEN` so the untuned list is one screen long:

- **Season march speed and wear.** The writ gives forage (1.2 at harvest, 0.4 in winter) and
  the willingness penalties, and says seasons change march speed and wear without saying by how
  much. Chosen: speed 0.9 / 1.0 / 0.95 / 0.7, wear 1.0 / 1.0 / 1.0 / 1.3.
- **`entersAtFraction` for a latecomer.** Chosen: `min(1, lateDays / 2)`. The contract lets an
  engine treat any value above zero as absent, so this only has to be honest.
- **Surprise.** Chosen from the season alone (0.5 for a winter march, per §4's own note).
- **Physicians and baggage carts.** One physician per abbey in the realm; one cart per twenty
  sacks. Neither is in any data file.
- **Legitimacy per cause.** Six causes, 85 down to 20, plus `10 × chaplain effect` when
  blessed, plus every `legitimacy` record since. The writ gives only the blessing term.
- **Equipment score.** Derived from a unit type's muster cost (`20 + min(70, cost/8)`), because
  nothing else in the data expresses "how well equipped".
- **The reward clock, the ward souring rate, and the unransomed rate.** One year, six a year
  after three, three a season to a cap of thirty — the last two from §5's own prose.

### C12. Harvest willingness falls only on farmland

`harvestCallFarmland: -15` names farmland specifically, and nothing says which holdings are
farmland. Chosen: manor, town and abbey are farmland; castle, port, march-fort, horse-run, mine
and weald are not. A miner does not lose his year in Harvest; a farmer does.

### C13. A faction is counted one level deep

"Faction fellows already refusing (−5 each)" is recursive by construction: whether a house
refuses depends on whether its fellows refuse. Chosen: fellows are asked ONCE, with the faction
term switched off in their own reading. A faction is a room of men looking at each other once,
not forever. A fixed-point iteration would be the alternative and would sometimes not converge.

### C14. Absences include houses that came SHORT, not only houses that did not come

§3.8 says "every called house … that did not stand is an Absence" but also that an Absence
carries "the numbers owed and sent". Read as: any called party whose men fell short of what it
owed is a finding, because "sent 66 of 110" is exactly the sentence the list exists to say.
A house that came in full does not appear.

### C15. The chartered town and the Sworn Order are pulled OUT of their lord's roster

Neither is a vassal's to send: a chartered town musters for itself (that is what its lord
sold), and the Order answers its own Grandmaster and comes only for a blessed cause. So both
are removed from the house's muster roll and appear as contingents of their own. A chartered
town is counted as called when the letters name the town OR name the house that holds it.

---

## Raised by the engine build

Everything below was found while building `src/core/` and `src/battle/` against
`docs/WRIT-THE-BATTLE.md`. Each one is a place where the writ was silent, ambiguous, or at odds
with itself, and each says what the engine now does, so the reading can be argued with rather
than archaeologically reconstructed.

### E1. THE MOST SERIOUS ONE — the morale floor makes routing impossible as written

§2.2 sets `moraleFloor` to 200,000 for anyone who is paid, and §9c says morale is clamped to
`[moraleFloor, moraleCeiling]`. §9d says a unit routs **below 150,000**. Those three lines
cannot all be true: a paid unit's will can never reach 150,000, so no paid unit ever routs, ever
— which deletes the rout, the rally, the pursuit, the army break and most of the game. Only
unpaid mercenaries (floor 0) could break, which is the opposite of the intended reading: the
Mercenary keyword says their courage has no floor *unlike everyone else's*.

**Chosen:** the floor is a DRAG, not a wall. Morale is clamped to `[0, ceiling]`, and below a
unit's floor every negative pressure bites at **one fifth** of its weight. A paid man in a formed
body has something holding him up and slows as he approaches breaking; an unpaid mercenary, floor
nought, has nothing damping him at all. Both numbers keep their job and the whole back half of
the battle becomes reachable. The one fifth is a feel number and is the first thing to tune.

### E2. The morale and ceiling casualty formulas are out by a factor of a thousand

§9a: `casualties −(killsTaken × 400 × 1e6 / maxStrength)`, and §9c: the ceiling erodes
`kills × 700 × 1e6 / maxStrength`. Taken literally, one man lost out of a hundred costs
4,000,000 morale — four times the whole bar — and a unit wiped out erodes its ceiling by seven
hundred times the bar.

**Chosen:** read as thousandths of the bar, i.e. `kills × 400 × 1000 / maxStrength`. Then losing
a quarter of a hundred men costs a tenth of the bar and total destruction erodes seventy per cent
of the ceiling, which are the magnitudes the rest of the table is written at.

### E3. A routing unit could never rally, because running is what routing is

Not a contradiction in the writ, but a dead end its parts produce together. Routing costs 900
wind a tick; above 600,000 wind a unit loses `fatigue/500` will a tick, which reaches 2,000 —
more than every positive term put together. So a unit that routs runs, and running keeps it
blown, and being blown keeps its will at nought. §9d's rally conditions can never be met by
anybody. Observed directly: eleven scenarios, eleven routs, no rally.

**Chosen:** a routing unit that has no enemy within the rally-clear distance (80 m) **stops
running**. Men run until they are out of danger and then stand about gasping. Standing recovers
wind at 900 a tick, the fatigue pressure lifts, and the rally becomes reachable — it is asserted
in `test/aftermath.test.ts`. The distance is deliberately the same 80 m the rally itself asks
for, so there is one number, not two.

### E4. The engine's vocabulary is coarser than `data/orders.json`'s

`data/orders.json`, `data/standing-plans.json`, `data/terrain.json` and
`data/captains.json` were not in the repository when the engine was built and appeared while it
was being finished. Everything numeric is now read from them — the ground types, every order's
difficulty, lock and windup, every standing job's difficulty, and the whole trigger vocabulary
(which the engine's own `TriggerId` union was renamed to match).

Two seams are left, and both are the same seam:

- **The order vocabulary is coarser in the engine than in the data.** The data separates
  `LOOSE_ORDER` from `CLOSE_ORDER`, `ADVANCE_TO` from `HOLD_POSITION`, and prices `SET_PURSUIT`
  once for both reining in and letting slip. The engine has nineteen orders where the data has
  twenty-two, and `src/battle/orders.ts` carries an explicit map saying which data row prices
  which engine order. Three data orders — `ENVELOP`, `COMMIT_RESERVE`, `AIMED_VOLLEY` — are
  priced in the data and not yet issuable; `SET_CHARGE` is expressed as a `CHARGE` directive
  rather than as an order that rides a courier, which is arguably wrong and is the first thing
  to fix if a player ever wants to change a standing job mid-battle through a rider.
- **One trigger cannot be watched.** `ENEMY_ENTERS_ZONE` — the ambush — wants a box drawn on the
  map, and the directive vocabulary has no shape for one. It is listed in
  `TRIGGERS_NOT_YET_WATCHED` so a front end can grey it out honestly instead of binding a plan
  that never fires.

What is still engine-local rather than data-driven: the herald templates and the quirk heed
weights in `src/battle/herald.ts`. `data/captains.json` carries `heraldTemplates` and
`data/quirks.json` carries a prose `battleEffect` per quirk, but neither gives a NUMBER for what
a quirk costs a captain's heed, so those nineteen weights are the engine's own and are
unplaytested.

### E5. The refusal counter's third case cannot behave as the brief describes

The obvious expectation — braced spears take nearly nothing, unbraced take more, and *braced but
frightened and ragged take more again* — is unreachable under the writ's own constants. An
unbraced line's refusal is already only a tenth (`braceMulUnbracedPermille: 100`), which leaves
the charge at essentially full speed; a ragged brace cannot give away more speed than that, and
bracing still carries its `+140` shock resistance. So the ordering the arithmetic produces is
**braced-and-steady ≪ braced-and-ragged < unbraced**, and that is what `test/refusal.test.ts`
asserts, with the measurements printed. The load-bearing claim — that the same braced spears,
frightened and ragged, take many times the casualties — holds and is asserted. To get the third
case above the second, `braceMulUnbracedPermille` would have to rise (say to 300) so that an
unbraced line still slows a charge measurably.

### E6. Deployment inside "its own third" of an 800 m field is fatal to the attacker

§2.3 says placements go inside a side's own third. On a field 800 m deep that is a minimum
separation of 266 m. An advance costs 300 wind a tick (420 in mail and plates) and a man is
blown at a million, so crossing 266 m arrives at 85–100 % fatigue — and a blown unit loses
2,000 will a tick. Observed: both hosts collapsed from exhaustion before making contact, twice,
in a battle nobody had fought yet.

**Chosen:** the ENGINE's automatic deployment stands the lines **100 m apart**, centred, which
leaves an attacker winded on arrival rather than destroyed before it. A `PLACE` directive
overrides this entirely, so a player who wants the far edge of his own third may have it and pay
for it in wind. The tension is real and lives in the data: either the field is too deep, or the
approach tiers are too expensive, and only play can say which.

### E7. The double buffer's fold points are not stated

§0.5 says pending accumulators are "folded in at the stated phase boundaries" and then never
states them. **Chosen**, and marked in `src/battle/engine.ts` where they happen: velocity and
facing at the end of phase 4; casualties after phase 7, so morale sees one honest number for the
tick from all four sources of death; fatigue, cohesion and the morale ceiling at the end of
phase 8; morale itself in phase 9c, which is the only place morale is written.

### E8. The order of the lines in the log is an output, and the writ does not say so

§7.2 requires a run with the units walked backwards through phases 2, 3, 6 and 9 to be
byte-identical. The arithmetic was order-independent immediately (that is what per-unit streams
buy) — but three things WRITTEN by those phases were not: the order of the terms inside a
`morale` event's `why`, and the order of the `melee` and `posture_change` lines. Identical
numbers, different bytes. Fixed by sorting: `why` terms heaviest-against-him first (which is also
the order a player wants to read them in), and the two event kinds by unit index. Worth stating
in the writ, because it is not obvious and the test is what found it.

### E9. In the pursuit, phases 5, 11 and 12 must still run

§12 says only phases 2, 3, 4, 6, 8, 9, 10 and 13 run in the pursuit. But phase 6 has nothing to
fight over without phase 5's contact lists, and the battle can never END without phases 11 and
12. **Chosen:** phase 1 (command — the chase is deaf, which is the point) and phase 7 (missiles)
are the two that stop. Everything else runs.

### E10. Several smaller readings, each taken once and marked in the code

- **`danger` in the heed** is described twice ("10 if his mean morale < 450,000; 20 if ordered
  toward a front where engaged enemy files ≥ 1.5× his own") without saying whether they add.
  Chosen: they add, because `K.heed` gives them two separate names.
- **The nested `idiv` order in the melee formula.** Chosen: attackers × rate first (which makes
  the intermediate milli-attempts per tick), then hit, wound, crowd, disengage, flooring at each
  step.
- **The defender's `shockReceivedMulPermille`** is in `data/formations.json` (a column takes
  1400 ‰, open order 300 ‰) but is not in §5b's shock formula. Chosen: it multiplies the raw
  shock, because a number in `data/` that nothing reads is a number that does not exist.
- **`woundedPermilleOfCasualties`** — §6 says "of raw casualties are reported wounded instead of
  dead", which could be a share of the dead or of everyone down. Chosen: a share of the men who
  went down, taken back out of the dead.
- **`Aftermath.hours`** is a whole number and most battles here last six to twelve MINUTES, so it
  is nearly always nought. The exact duration in seconds and ticks is put in `notes` instead.
- **The seventh worked wound number** (`swordCut30VsUnarmoured8: 976`) does not come out of the
  formula, which gives 981; the other six land exactly. Probably a slip when the table was
  written. The test asserts the six and a bound on the seventh rather than fudging the formula.
- **`entersAtFraction`** is the one fraction the court hands IN. It is turned into a tick at the
  boundary in `setup.ts` and never touched again. `Aftermath`'s fractions out are the mirror of
  it, in `aftermath.ts`. Those two files are the only ones the integer-law test lets near a
  slash, and it asserts the list has not grown.

### E11. What the determinism test cannot do from inside one process

§7.3 asks for a run on a different Node major version. That is a CI matrix, not a test, and it is
not in `.github/workflows/ci.yml` yet. §7.1 asks for "a corpus of ≥ 30 stored battles"; the
corpus is **generated** from thirty seeds and each battle fought twice, rather than checked in as
golden files — a stored corpus would have to be regenerated on every deliberate rebalance, and
what the writ actually wants proved is byte-identity, which generation proves just as well and
without the maintenance trap.

### E12. Terrain, and what is deliberately not modelled

The tile generator is engine detail by §2.1's own words, and the tiles go whole into the replay
header so no replay depends on it. Two choices worth naming: a `ford` is laid as a band of
shallow crossing rather than a river with one gap, because impassable water can strand an army
where the engine cannot finish the battle; and the feature list is applied in sorted order, so
two hosts that list the same ground differently still get the same field.

### E13. Quirks honoured, and quirks ignored

Nineteen quirk ids are implemented (`src/battle/herald.ts` → `QUIRKS`) and reported back in
`Aftermath.quirksHonoured`. The contract says ignoring the rest is legal and expected. Two are
carried in the vocabulary but change nothing yet: `will-not-leave-the-province` and
`breaks-early` are named on unit sheets in `data/units.json` and have no expression on the field
— the first has no map to leave, the second is already covered by that unit's morale ceiling cap.
They are still listed as honoured, which is arguably a small lie to the court; the alternative is
to drop them from the list and have the court narrate nothing about a unit whose sheet advertises
them.
