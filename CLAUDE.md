# Working on Vassal Vessels

Read `docs/KINGDOM.md` first. It is the constitution: the code implements it, and it wins
until it is amended. Then `docs/WRIT-THE-BATTLE.md` and `docs/WRIT-THE-COURT.md` for the
implementable detail, and `docs/OPEN-QUESTIONS.md` for every seam that is still open.

---

## The three laws

### 1. The front end stays out of mind

There is no front end and there is not going to be one for a while. The engine is headless:
no DOM, no canvas, no rendering, no frame loop, no assets, no colours. It takes data in and
writes a log out.

This is not a phase we are in. It is a rule about *how decisions get made*, and it has one
sharp edge:

> **A design decision made for display reasons is made wrong.**

If the answer to "why is it built this way?" is "so it can be drawn", "so it fits on a
screen", "so the animation looks right", or "so the player can see it" — stop. The right
version of that sentence is "so it can be *read*": every mechanic must have a tell that a
human could describe in words, recorded in its data as `readOnField`. A tell is a fact about
the simulation. A pixel is not.

The reward for the rule is that the whole game can be tuned against text, by reading the
herald lines out of a replay log, before anybody draws a single soldier — and a design that
survives that is a design that was never propped up by its own artwork.

### 2. The simulation is deterministic, and the replay is the proof

One seed in; the same battle out, byte for byte, forever, on any machine and any runtime.

- **Integers only inside the battle.** Not one floating-point number — not in state, not in
  an intermediate, not in a constant. Floats disagree in the last digit on different
  machines, and a battle that disagrees in the last digit will, ten thousand ticks later,
  disagree about who won.
- **Per-unit random streams**, so units may be updated in any order and produce the same
  battle. There is a test for exactly this, and it iterates in reverse.
- **The log is side-effect free.** Turning logging off must not change one value.
- Determinism is not a feature that can be traded away for performance. It is what makes the
  replay a proof rather than a recording, and the replay is how every argument about this
  game gets settled.

If a change makes a stored replay diverge, that is either a bug you just found or a rules
change you must declare. It is never noise.

### 3. The Codex is the design document, and the twelve-year-old is the test

`data/*.json` is not configuration extracted from the code. It is the game, written down,
and the code implements it.

Every object in `data/` carries an `explains` written in plain English for a smart
twelve-year-old reading a manual. That is this repository's acceptance test:

> **A kid reads the Codex and understands the game before ever playing it.**

Which means, concretely:

- **A number that is not in `data/` does not exist.** If a rule has a number in it and the
  number is in a `.ts` file, that is a bug.
- Numbers are real. There are no placeholders, no `TODO: tune`, no `0.5 // ?`. If a number
  was chosen on feel, it still gets a real value *and* a line in `docs/OPEN-QUESTIONS.md`
  saying it was chosen on feel.
- `explains` says what the thing *does to the player*, not what the field is called. "Braced
  spears take the speed out of a charge, and shock is the square of the speed" is an
  explanation. "Refusal base value" is a label.
- Every mechanic carries a `readOnField` — how a watcher can tell it is happening. An element
  that cannot fill that field is cut, not shipped invisible.

---

## The design values

These decide arguments that the laws do not.

- **Legibility over realism.** Where the honest medieval answer and the readable answer
  differ, take the readable one and say so. The game is trying to teach how a battle works,
  not to be one.
- **Counters are physical, never arbitrary.** There is no counter chart and there will never
  be one. Seven physical facts — mass, closing speed, density, facing, bracing, reach, armour
  by arc — and every counter is a consequence you can watch happen. If a proposed mechanic
  needs a bonus table, it is the wrong mechanic.
- **Morale is the real health bar.** Strength is bodies and it is mostly an *input*. Armies
  break; they are not slaughtered to the man. Anything that makes casualties the point is
  pulling against the whole design.
- **An order that is always correct is not a decision.** Every order carries four prices — a
  rider, a difficulty, a lock, and a real cost in wind or neatness or nerve. If you can think
  of no reason not to give it, it needs a price or it needs deleting.
- **Nothing makes the player wait.** No turns, no pause-and-issue-orders, no end-turn button.
  Every unit always has a standing job it will do with zero input, so the battle finishes with
  or without you, and the court's clock only moves because something was done.
- **Records in, readings out.** State is never stored; it is computed from an append-only list
  of records. Removing a record IS revocation. Loyalty, willingness, the Tide, a holding's
  state — all readings, none of them fields. The moment something is stored *and* derived,
  there are two sources of truth and one of them starts lying.
- **Every reading shows its working.** A number the court produces is a tally of named terms,
  each pointing at the records that made it. An event the battle logs carries its own reasons.
  "Why did I lose?" is printed, never guessed.
- **Disobedience is a verb, never a null.** A captain who will not obey does something visible
  instead, and the herald says why in plain words that name the political cause.

---

## The voice

Plain-English medieval. Recognisable words, never glossary flavour.

- Say **muster**, **summons**, **grudge**, **wergild**, **the vessel**, **the van** — real
  words a reader can guess from context.
- Do not invent vocabulary. If a term needs a glossary entry to be understood, it is the wrong
  term. There is no *aetheric resonance*, no *Command Point*, no *Tier 2 Unlock*.
- Write for the twelve-year-old in comments, in commit messages, in `explains` fields, and in
  docs. Short sentences. Concrete nouns. Say the consequence out loud: "and then the spears
  kill the stalled horses."
- Numbers in prose are spelled the way a person would say them: "nine metres a second", "a
  quarter of its will", "two hundred and ninety times less".

---

## Where things live

| Path | What it is |
|---|---|
| `docs/KINGDOM.md` | The constitution. Wins until amended. |
| `docs/WRIT-THE-BATTLE.md` | The implementable tick: order of operations, formulas, state, replay format. |
| `docs/WRIT-THE-COURT.md` | Records, readings, the muster arithmetic, and the `Host`/`Aftermath` contracts as literal TypeScript. |
| `docs/OPEN-QUESTIONS.md` | Every seam, every feel-chosen number, every incompatibility. Grow it; do not tidy it. |
| `data/constants.json` | Every tuning number in the game. Read its `whereNumbersLive` note before adding one. |
| `data/*.json` | The Codex: units, equipment, formations, keywords, orders, standing plans, terrain, captains, quirks, and the whole court. |
| `data/example-host.json` | A complete worked `Host` to build against. |
| `src/`, `test/` | The implementation and its tests. |
| `tools/leakcheck.mjs` | Refuses to let a credential or a real person into a public repo. |

---

## Rules of the road

- **This repository is public.** No real person, company, place or credential, ever — not in
  code, not in test fixtures, not in a comment, not in a commit message. Every name in this
  game is invented and obviously so. `npm run leakcheck` enforces the shapes it can catch and
  is a net, not a proof: a reviewer still reads the diff.
- **Change the writ before you change the code.** If an implementer would have to guess, the
  writ is wrong. Fix the writ, then implement it.
- **Amend the constitution deliberately.** A rule that contradicts `docs/KINGDOM.md` is a bug
  in the code *or* an amendment to the constitution, and you have to say which.
- **Do not "fix" the data toward realism.** The Codex is tuned for legibility. A number that
  looks historically wrong may be doing a job; check `explains` and `docs/OPEN-QUESTIONS.md`
  before correcting it.
- **Keep the two layers ignorant of each other.** The court hands over a `Host` and gets an
  `Aftermath` back. The battle never computes politics; the court never tells the battle how
  to fight. Quirks are the loose joint between them, and looseness there is the point.
- Valid JSON, two-space indent, no trailing commas. Keys in a deliberate reading order —
  identity, then numbers, then `explains` — because these files are read by people.

---

## Commands

```
npm test              # the test suite, including the determinism tests
npm run build         # type-check only; no emit
npm run leakcheck     # refuse credentials and personal data; must pass before any pull request
```
