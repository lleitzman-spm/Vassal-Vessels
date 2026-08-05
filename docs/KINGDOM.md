# VASSAL VESSELS — The Constitution

This document is the canon. Where any other file, comment, or memory disagrees with it,
this document wins until it is amended. It was made by grafting three designs into one:
two battle designs written blind to each other against the same brief (called **A** and
**B** below where a choice between them must be named), and one design for the realm and
the court (called **the court design**). The two battle designs converged, independently,
on the same spine — real time, no turns, orders that travel at a rider's speed and land
on a captain who may or may not obey — which is the strongest evidence a design can get
that the spine is right. Where they diverged, this document records which branch was
taken and why. The joins are meant to be visible; see `docs/OPEN-QUESTIONS.md` for every
seam.

---

## 1. What the game is

> **You do not command an army; you command the few men who will still listen to you —
> and who those men are was decided at court, months ago, by you.**

Vassal Vessels is two games wired together so tightly that neither makes sense alone.

**The court** is a game of days. A war is declared and with it a date: *the enemy stands
at the ford in 41 days.* Every act of governance — a summons, a seat granted, a grudge
settled, a company hired — costs days off that number, and what shows up at the muster
is arithmetic you could have done in your head. No dice. Ever.

**The battle** is a game of minutes. Six to twelve minutes of continuous simulation that
never pauses and never waits. You watch a line of real physics — mass, speed, reach,
fear — and you steer it through three slow, crude, dangerous levers: standing plans you
bound before the fighting, riders who take nine seconds to cross the field, and a banner
that is your voice and can be taken.

The wire between them is the game's soul. Every political fact becomes a number on the
field: the seat you never granted is two riders you do not have; the wergild you never
paid is a wing that comes short; the grudge you never learned of is a contingent that
turns its coat at the worst moment — foreseeably, because you could have read it, which
makes it your fault, which makes it a story.

---

## 2. The laws

Numbered so arguments can cite them. Every mechanic in this repository must be able to
point at the law it serves.

1. **Records in, readings out.** State is never stored; it is always computed from an
   append-only list of records. Removing a record IS revocation. A battle is a seed plus
   a list of orders, and everything else is derived — that is precisely what makes the
   replay possible. Loyalty, willingness, the Tide, cohesion: readings, not fields.

2. **The muster never rolls dice.** Given the records, what stands at the mustering
   place is fully determined. All uncertainty in the court is hidden information —
   grudges you never learned of, cabals you never uncovered — never randomness.
   Discovery is itself a record (`Learn`), so "I did not know" is a fact in the book,
   not an excuse. Dice live in exactly two places: the world's own hand (harvests,
   raids, deaths, written by a seeded world clock) and inside the battle.

3. **No turns, and nothing ever waits.** The court's calendar advances only when an act
   is placed on a track; there is no end-turn button. The battle runs at a fixed
   timestep and never pauses; every unit always has a standing job it will do with zero
   input, so the battle finishes with or without you.

4. **Every reading shows its working.** Every number the court produces is a tally of
   named terms, each term pointing at the records that made it. Every event the battle
   logs carries its own reasons — a morale change records the seven pressures that
   summed to it. The answer to "why did I lose?" is printed, never guessed.

5. **Physics, not tables.** There is no counter chart. Seven physical facts — mass,
   closing speed, density, facing, bracing, reach, armour by arc — and every counter is
   a consequence. The one that matters most: **bracing grants no bonus; it projects a
   refusal field that takes a charge's speed away, and shock scales with the SQUARE of
   the speed left at contact.** And because refusal is multiplied by the defender's
   morale and cohesion, the same braced spears, frightened and ragged, take ten times
   the casualties. Morale is not bolted onto combat; it lives inside the counter.
   (Taken from design A whole, and it is the best single idea in either battle design.)

6. **Everything is legible on the field.** Every mechanic has a visible tell, recorded
   in its data as `readOnField`; an element that cannot fill that field is cut. Every
   outcome of an order is heralded in plain words that name the political cause. And
   every object in `data/` carries an `explains` written for a smart twelve-year-old
   with the manual open on their knees — the wiki IS the data, and a number that is not
   in `data/` does not exist.

7. **Disobedience is a verb, never a null.** A captain who will not obey does not stand
   idle. He obeys his own way, drags, hedges, overreaches, or follows his own counsel —
   all of which are visible motion, all of which the herald announces. (Design B's
   six-outcome table, taken whole over A's simpler roll; see §6.)

8. **Foresight is cheap; improvisation is dear.** Anything agreed before the battle —
   a standing charge, a conditional standing plan — executes instantly when its moment
   comes, with no obedience check, because the captain agreed while he was calm.
   Anything improvised during the battle rides a courier at a physical speed and passes
   through a captain's temper when it lands. The deepest skill in the game is guessing
   this morning which crisis tonight will bring.

9. **The battle writes the next season's politics.** The field hands back an Aftermath:
   the dead, the captured, the distinguished, the disgraced, and named deeds — who held,
   who fled, who watched a rival die. The court turns deeds into grudges and glory,
   which write the next muster. The loop has no outside.

10. **There is no player character.** The crown is an institution, not a body on a
    horse. On the field the commander is a banner and the forty men around it — a
    position with a voice, vulnerable and never steerable like a hero.

11. **A spiral may exist, but never without a visible exit** — and the exit is always a
    political act, never a number quietly recharging. The eight feedback loops are
    named and judged in §12.

---

## 3. The vocabulary

Plain words, used exactly. No term below needs a glossary to guess.

| Word | Meaning |
|---|---|
| **Chronicle** | The whole game state: a founding book adopted once, plus the append-only list of acts. Nothing else exists. |
| **Act** | One record in the chronicle. The player's, a vassal's, or the world's. |
| **Reading** | Any value computed from the chronicle. Never stored. |
| **Tally** | A reading that shows its working: a value plus the named terms that made it, each linked to its records. |
| **House** | A noble family holding land of the crown. |
| **Holding** | A piece of land: manor, castle, town, port, abbey, march-fort, horse-run, mine, weald. Levies are OF a holding and named for it. |
| **The Vessel** | A house's year of owed service: so many men, for forty days, refilled at the new year and never on a timer. The game is named for it. |
| **Seat** | One of the seven offices of the court. A filled seat is a second pair of hands on the calendar and a lever on the muster. |
| **Summons** | The letter that calls a house to war. It drinks from the vessel. |
| **Muster** | The gathering of the host, and the arithmetic that predicts it. |
| **Host** | One side's army as handed to the battle: contingents, units, captains, supply, and everyone who did NOT come, named. |
| **Contingent** | One house's men (or the crown's household, a hired company, a town's militia, the Order's chapter) under one captain. Politics attaches here. |
| **Captain** | A person with a temper. Every order passes through one. |
| **Charge** | A contingent's standing job — hold, advance, attack, support, screen, guard, reserve, withdraw. Always in force; the battle never waits. |
| **Order** | An improvised instruction sent mid-battle. It rides a courier and faces the captain's heed when it lands. |
| **Standing plan** | A conditional order bound in advance — "if horsemen come within a hundred paces, brace" — that fires instantly, with no heed check, when its trigger fires. |
| **Courier** | A rider who physically carries an order. You have as many as your Marshal is worth, and each is busy for the ride out and back. |
| **The Crown Banner** | The commander's standard and bodyguard. Units that can see it take orders in a second; if it falls, the army's heart falls with it. |
| **Heed** | The score a captain computes when an order lands, which picks one of the six outcomes. |
| **The six outcomes** | OBEY · OBEY-HIS-WAY · DRAG · HEDGE · OVERREACH · DEFY. Every one is visible motion; every one is heralded with its cause. |
| **Refusal** | The slowing field a braced line projects in front of itself. A horse will not run onto a set point. |
| **The Six Seconds** | The moment sustained contact turns from the clash (reach wins) to the press (reach inverts and sidearms decide). |
| **The Tide** | A side's momentum: a pure reading over the last thirty seconds of events, decaying with a fifteen-second half-life. Never stored. |
| **Rout** | What a unit does when its morale runs out. The pursuit that follows is where most of a battle's dead actually die. |
| **Aftermath** | What the battle hands back: fates, deeds, spoils, blame. It becomes records; the records become the next muster. |
| **Deed** | A named moment with a tale — `held-the-ford`, `abandoned`, `slew-captain` — the battle's testimony to the court. |
| **Grievance** | A named grudge with a weight. It does not fade; it is settled, or it is inherited. |
| **Favour** | A named kindness with a half-life. Generosity is a subscription, not a purchase. |
| **Seasons** | Seedtime, Highsun, Harvest, Wolfmoon. Ninety days each. |

---

## 4. The loop of a season

```
A WAR IS DECLARED — and with it a DAY. Visible from the first moment; it never moves.
        │
        ▼
YOU SPEND THE DAYS. Every act costs days off the deadline, on the crown's own track
or on a filled seat's track. A seat you never granted is a hand you do not have.
        │
        ▼
THE HOST STANDS (or does not). Pure arithmetic: this house owed 90 and sent 68,
because you passed its lady over for the Stewardship two winters ago. Every absence
is named, with its reason, and the records that caused it.
        │
        ▼
THE BATTLE. Your politics ride into it inside every unit: how many men, how tired,
how willing, whether they will carry out the order you send, and whether the man on
your right flank is going to turn.
        │
        ▼
THE AFTERMATH comes back as records: dead, captured, distinguished, disgraced,
deeds. Widows, heirs, blood-debts, unrewarded heroes, ransoms unpaid.
        │
        └────► and the changed court changes the NEXT army. Loop.
```

There is no end-turn. The calendar is a set of tracks — the crown's day-book plus one
per filled seat — and the clock advances to the next completion. Against a 41-day
deadline with two seats filled you have roughly 41 crown-days and 82 officer-days, and
eleven things worth doing. You cannot do them all. That is the game.

---

## 5. The loop of a battle

Six to twelve minutes at twenty ticks a second. It never pauses. The player's loop is
five beats, running concurrently and forever:

1. **READ.** The line tells you things. Cohesion frays visibly; a unit under arrows
   spreads out; a wing about to go has a look to it. Every mechanic has a tell.
2. **CHOOSE WHERE TO SPEND VOICE.** You have as many couriers as your court earned you
   (two to six — see §6). A ride to the far wing is nine seconds. You will notice four
   problems and be able to answer two. Because orders take time to arrive, every order
   is an order about the future: you are not reacting, you are predicting.
3. **COMMIT.** Some orders lock. A charge cannot be recalled for eight seconds. The
   reserve is committed once. Exhort spends morale ceiling, permanently. The tension is
   never "do I press the button" but "is NOW the moment, given that I cannot un-press
   it and will not know for six more seconds whether it was."
4. **WATCH THE CASCADE.** Battles are not decided by attrition. One unit's morale hits
   the floor and the panic travels — panic reaches twice as far as courage — and a wing
   folds, unit by unit, while the Tide turns under the whole army. The log records why,
   term by term.
5. **PURSUE OR HOLD.** When the enemy breaks, your men want to chase. Chasing captures
   lords (ransom, leverage) and kills the running; chasing also strings your army out,
   blows its wind, and hands it to a counter-attack. Greedy captains ignore "do not
   pursue," and the court told you in advance which ones they would be.

Then the field writes politics, and you are back at court.

---

## 6. The canon of command

This section settles the largest graft: design A's sealed writs and design B's briefed
horn signals were the same idea arrived at twice, and they are now ONE mechanism.

### 6.1 One mind cannot be everywhere — the three channels

**Standing charges** (free, always in force). Every contingent always has a charge —
its job — and executes it with zero input. Hold, advance, attack a named enemy, support
a named friend, screen, guard, stand in reserve, withdraw. Set at deployment; the
battle runs to completion on charges alone.

**Standing plans** (the graft; bound in advance, instant, unchecked). A standing plan
is a conditional order: a trigger, an order, a recipient. *If enemy horse comes within
a hundred paces — brace. If you have been in the melee six seconds — fall back. When
the second horn sounds — the reserve strikes their left.* When the trigger fires, the
order installs INSTANTLY: no rider, no delay, **and no heed check — the captain agreed
in advance, while he was calm.** That is the loophole in the politics, and it is meant
to be: you cannot make a disloyal lord obey you in a crisis, but you can get him to
agree to something hypothetical at the morning briefing. A horn is simply a trigger the
player pulls by hand — three horn channels exist so a plan can be fired on judgement
rather than on measurement. The army binds **orderCapacity + 2** plans at deployment
(a number chosen for this canon — see OPEN-QUESTIONS §3); more can be bound mid-battle
by spending a courier ride and passing the captain's heed at arming time.

**Improvised orders** (dear, late, and filtered through a soul). Anything else rides a
courier at ten metres a second — out AND back, so the rider is busy twice the distance
— unless the target can see the Crown Banner, in which case the signal takes one
second. When the order lands, the captain computes his **heed** and the six-outcome
table (§6.3) decides what actually happens.

### 6.2 Courier scarcity is the court's hand on your throat

**The number of couriers IS the Host's `orderCapacity`** — the single cleanest join in
the whole graft. The court design said a vacant Marshalcy means you can direct two
contingents at once and a great Marshal six; design A said your Marshal's quality sets
your courier count. These are the same dial. Canon: `couriers = orderCapacity` (2
vacant, 4 for a seated Marshal, up to 6 for a great one), and the same number plus two
sets your standing-plan slots. A player who never filled the Marshalcy fights with two
riders and four plans, and feels it.

### 6.3 Heed and the six outcomes (design B, taken whole)

When an improvised order arrives — and only then; no per-tick re-rolling — the captain
computes a deterministic score from the contingent's court-given obedience, his craft,
the danger, his dead, his grudges, and a seeded jitter of ±8. The score picks an
interpretation, and every interpretation is visible motion, announced by the herald
with its political cause named:

| Heed | Outcome | What you see |
|---|---|---|
| ≥ 70 | **OBEY** | The order, executed with his skill. |
| 50–69 | **OBEY-HIS-WAY** | The order through his temper: a hot captain's advance arrives at a run; a careful one keeps a unit back. |
| 35–49 | **DRAG / HEDGE** | Bold tempers drag — six-tenths urgency, mysteriously last. Careful tempers hedge — the safe version, a line of retreat kept open. *"He drags his feet — the slight at the feast is not forgotten."* |
| 20–34 | **OVERREACH / HARD-HEDGE** | The glory version — charges early, presses a refused charge onto the points, pursues past the horn. Or technical compliance from outside dying range. |
| < 20 | **DEFY** | He sets your word aside and follows his own counsel — almost always "protect my own." You watch your politics fail in front of witnesses, and the ledger records it. |

Two vetoes are canon because they are the story beats the game exists for: **SUPPORT
toward a grudge-rival is refused outright** below an obedience bar (the herald: *"he
looks upon them hard-pressed, and looks away"* — and if they then break, the deed
`abandoned` goes home to court); and a **craven captain whose men waver may sound his
own withdrawal without your leave.**

An interpretation persists until a new word arrives or a shock (a quarter of his men
down, his brother's unit breaking, the Banner falling) forces him to think again.
Nothing ever waits.

### 6.4 The captain's own hand

Between your words a captain is never idle: every two seconds he may act unbidden —
brace against approaching horse, counter-charge with fresh cavalry, feed his own
reserve to a wavering friend, ride to rally his broken, or (craven) sound his own
retreat. Good captains make the army feel alive. Bad ones make it feel haunted.

---

## 7. The canon of the field

### 7.1 The four bars

- **Strength** is bodies. It falls slowly and is mostly an input to morale.
- **Morale** is will, and it is the real health bar. Armies break; they are not
  slaughtered to the man. Its **ceiling** only ever falls — casualties, exhaustion,
  a lord's death, an Exhort spent — so a mauled unit rallies, but never to full.
- **Cohesion** is the dress of the ranks. Moving, turning, running, rough ground and
  being hit all wreck it; standing still repairs it. A ragged unit charges weaker,
  braces worse, fights worse — and takes fewer arrows, because it is spread out.
  Cohesion is the invisible price of every manoeuvre.
- **Fatigue** is wind. Running, fighting, armour and slopes drain it. Tired men move
  slower, swing slower — and their morale ceiling erodes, so the counter to elite
  heavy foot is to make it chase you.

### 7.2 The counters are physics (design A, whole)

Shock is `men × mass × (speed at contact)² `. Bracing projects a refusal field —
twelve metres for pikes, seven for spears, nine for stakes — that decelerates a
charge, and the square does the rest: the worked table in `data/constants.json` runs
from 29 dead archers to 0.1 dead pikemen, a swing of nearly three hundred, with not
one bonus in it. Refusal is multiplied by the defender's cohesion and morale — a
frightened braced line is ridden over — and it is FRONT ARC ONLY, which is why pikes
need horse on their wings. Armour meets penetration on a cube, so armour is a wall,
not a slope, and armies carry hammers. Arrows care about density and nothing else.
Facing decides how much of your armour and none of your shield covers you. Every
formation is a bet, and the commander's craft is making the enemy's bets wrong.

### 7.3 The Six Seconds (design A, whole)

For the first six seconds of contact, reach rules: a spear wall beats swordsmen better
than two to one. Then the press: long weapons drop to one fighting rank and take their
crowd penalty, reach inverts to half of itself as a penalty, and short weapons gain
penetration because at grappling distance you aim at the gaps in the armour. A sidearm
is worth more than any stat: men with spear AND sword win the clash like spearmen and
survive the press like swordsmen; pikemen with belt-knives are slaughtered sixteen to
one. Spears want to hit, hurt, and fall back before the six seconds are up — which
costs an order, a courier, and disengagement blood, or one well-bound standing plan.

### 7.4 The Tide (design B, whole — and it is a reading)

Once a second, per side, the Tide is computed from the last thirty seconds of events —
units broken, captains fallen, banners taken, charges landed, ground gained — decayed
with a fifteen-second half-life and clamped to ±25. **It is never stored: delete the
events and the Tide is gone.** This is why B's version is canon — it fits law 1
exactly. Every unit's morale drifts with its side's Tide, so winning firms an army up
and losing makes it brittle, and the whole dramatic arc — probing, the press, the
crisis, the break, the rout — emerges from that one coupling. The fifteen-second
half-life is the anti-snowball: an early advantage evaporates unless pressed.

### 7.5 Rout, rally, pursuit

Morale below the floor and the unit runs, spraying panic ninety metres while courage
reaches only forty-five — panic travels twice as far as courage, and that one
asymmetry is the emotional shape of every battle. A unit rallies at most ONCE (design
B's hard rule, kept alongside A's eroding ceiling); twice-broken men are done for the
day. The army breaks on strength lost, on collapsed will, or on the Banner falling
while the day is already going badly — and then the pursuit begins, where the ransoms
are taken, the bloodlust deafens your own cavalry, and a strung-out chase is the
softest target on the field. The classic way to lose a won battle, computed rather
than scripted.

---

## 8. The canon of the court

### 8.1 The Vessel

Every house is a vessel holding one year's service: the grant of land states the
bargain in its own text — *this house holds these lands and owes 125 men for 40 days
each year.* A summons drinks from it. Drawing past the forty days is `over-called`:
named, priced, escalating, and visible before you send the letter. The vessel refills
at the new year, never on a timer. Beside it sit the other bargains — the household
(instant, absolutely yours, capped by coin), the free companies (coin into men, grudge
into every idle vassal), the town charters (men now, a fifth of the town's tax
forever), the Sworn Order (free, elite, obedient to their own master first) — and one
escape hatch, the Great Summons: everything the realm can raise, once in five years,
for a defensive cause, at a grudge to every house that is forgiven if you win and
doubled if you lose.

### 8.2 Loyalty, grievance, and the ladder

Loyalty is a reading: fifty, plus kindness (decaying by half-life), minus grudges
(which never decay — they are settled, or inherited at half by heirs). A slighted
vassal is not a number going down; he is eight named behaviours going up a ladder:
murmurs, short measure, foot-dragging, withholding his best (worst-kept-LAST — "comes
at 0.75" means the knights stayed home, not that everything shrank), faction, public
defiance (which lowers every OTHER house's obedience custom — the precedent loop),
revolt, and treachery — which is only reachable if you summoned a house you could have
read at 80+, so the betrayal is always foreseeable, always your fault, and always a
story.

### 8.3 The seats

Seven offices. Each is three things at once: a second track on the calendar (a seat is
TIME), a lever on the muster filtered through its holder (`base × competence ×
loyalty-factor`, never below half — a seat is never worse than empty, only wasted),
and a grievance machine in both directions (grant it and the passed-over sour; leave
it empty and the claimants sour slowly while the crown does the job at half effect).
The Marshal sets `orderCapacity` — your couriers and plan slots, the court's most
direct hand on the battle's controls. Seats held eight years become customary; sixteen,
hereditary in all but name. You rented time and paid in sovereignty.

### 8.4 Time, distance, food

Four seasons of ninety days, each changing march speed, wear, forage and willingness —
Highsun is the campaigning season, Harvest is the trap, Wolfmoon is the gamble that
buys surprise. Distance is arithmetic: letter days, gathering days, march days, and
the march becomes fatigue the battle inherits. A hundred men eat a sack of grain a
day, and provision days decide whether you can wait for latecomers, besiege anything,
or refuse a battle.

---

## 9. The contract between court and battle

Taken whole from the court design, and written as literal TypeScript in
`docs/WRIT-THE-COURT.md`.

- `runBattle(a: Host, b: Host, ground: Ground, seed) → { a: Aftermath, b: Aftermath }`.
  A Host describes one side and says nothing about the other.
- Four numbers carry the politics into every contingent and unit: **resolve** (will
  they die for you), **obedience** (will they carry out the tactic you issue),
  **treachery** (will they turn), **fatigue/hunger** (what the roads and the granary
  did). The battle turns them into its own model; the court never tells it how.
- **`orderCapacity`** arrives in the Host's command block and becomes couriers and
  plan slots (§6.2).
- **Quirks are the joint, and they are deliberately loose**: named, documented
  behaviours (`charges-without-orders`, `will-not-fight-beside`, `may-turn`, …) with
  an intensity and an `explains`. **The battle implements the quirks it can express
  and legally ignores the rest** — ignoring is expected, never a failure, and honoured
  quirks are reported back so the court can narrate honestly. This looseness is what
  lets the two layers be built blind to each other.
- **`absent[]` ships with the host**: every house that owed men and did not send them,
  named, with the reason and the records that caused it. An absence is a finding,
  never a silently smaller number. Half the emotional payload of a muster is in that
  list.
- The **Aftermath** hands back unit fates (five numbers that must sum to strength),
  captain fates and conduct, contingent loss shares, spoils, captives, and deeds —
  and the court absorbs it into records: blood-debts for UNFAIR losses, reward clocks
  for the distinguished, ransom clocks for the taken, succession for the slain.

---

## 10. Determinism and the replay

One seed. Integer arithmetic only inside the battle — not one floating-point number,
because a replay that disagrees in the last digit will, ten thousand ticks later,
disagree about who won. Per-unit random streams so unit update order cannot matter.
The replay log's header (seed, ruleset hash, ground, hosts, orders) reproduces the
battle byte for byte, forever, and a test proves it on every change. Every event
carries its reasons and a herald line in plain words, so the battle can be *read* as a
chronicle the day the engine works, with no pictures at all — and the engine is tuned
against text before anyone draws a single soldier.

---

## 11. What is deliberately not in the game

- No fog of war. You see everything and can touch almost nothing; command friction is
  the fog. The drama is "I can see the left collapsing and my order is forty seconds
  away," not "I wonder what is behind that hill."
- No command-point mana. Every limit is physical and can be pointed at on the field.
- No hero units, duels, spells, or player body. No experience bar (drill, veterancy
  and the morale ceiling already carry it). No hit points (strength is bodies; morale
  is the health bar).
- No pause-and-issue-orders, ever. The whole design is arranged so you never want one.

---

## 12. The eight loops, judged

Feedback loops are decided on purpose, not discovered in playtest. Verdicts:

| Loop | Verdict | The exit (always a political act) |
|---|---|---|
| **The Bleeding Roll** — lose, shrink, lose harder | Runaway. Wanted, bounded. | Additive regeneration (+6 men per holding per year); defending home makes vassals answer better; mercenaries turn coin into men; the Great Summons. |
| **The Grievance Cascade** — the unrewarded sour | Runaway. Wanted, bounded. | The Justiciar settles at scale; land won in war is the only generous currency — the way out is to win. |
| **The Overmighty Vassal** — reward the reliable until one rivals the crown | Stabilising, then a cliff. Wanted. | Split inheritances, marry the heir away, take the heir as ward, build a rival. |
| **The Scutage Trap** — take coin, hire strangers, spend no vessels | Stabilising, then hollowing. Wanted, visible. | Call the levy; after three years of coin the obligation itself rots by a tenth a year. |
| **Glory Hunger** — a won war wants another | Stabilising. Anti-snooze. | Give them a war, or spend the standing. |
| **The Harvest Loop** — summon in autumn, starve next year | Stabilising, seasonal. | Fight in Highsun, or pay knowingly. |
| **The Veteran Loop** — survivors compound | Runaway (positive). Wanted, capped. | Veterancy caps at 80; the dead rebuild raw over four years; veterans demand more. |
| **The Precedent Loop** — an unpunished refusal breeds refusals | Runaway (social). Wanted. | Attainder: strip the defiant house, restore the custom, and pay grievance across all its kin. The tyrant's bargain, priced. |

---

## 13. Where everything lives

| Artefact | Contents |
|---|---|
| `docs/KINGDOM.md` | This constitution. Wins until amended. |
| `docs/WRIT-THE-BATTLE.md` | The implementable tick: order of operations, formulas, state, replay format. |
| `docs/WRIT-THE-COURT.md` | The records, the readings, the muster arithmetic, and the Host/Aftermath contracts as literal TypeScript. |
| `docs/OPEN-QUESTIONS.md` | Every seam, every feel-chosen number, every incompatibility found in the graft. |
| `data/*.json` | The game. Every object has an `explains` for a smart twelve-year-old; all tuning constants live in ONE file, `data/constants.json`. |
