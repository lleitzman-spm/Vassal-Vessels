# Contributing to Vassal Vessels

Newcomers are welcome, arguments are welcome, and the best first contribution is usually not
code. Read `docs/OPEN-QUESTIONS.md`, find something you think is wrong, and say why — that file
exists because a design with hidden seams rots, and an outside reader spots seams faster than
the person who made them.

---

## Setting up

```
git clone <this repository>
cd vv-public
npm install
```

Node 20 or newer. There are no other dependencies, no build step, no database, no services, no
environment variables and nothing to configure. If a change to this project would require any
of those, that is worth a conversation before it is worth a pull request.

```
npm test              # the whole suite, including the determinism tests
npm run build         # type-check only; nothing is emitted
npm run leakcheck     # refuses credentials and personal data
```

All three must pass. `npm run leakcheck` also runs on every pull request and cannot be skipped.

---

## Read these first

1. **`docs/KINGDOM.md`** — the constitution. Eleven numbered laws. Every mechanic in the
   repository must be able to point at the law it serves, and the constitution wins until it is
   amended.
2. **`CLAUDE.md`** — the three laws of working here (headless, deterministic, and the Codex is
   the design document) and the design values that decide arguments the laws do not.
3. **`docs/WRIT-THE-BATTLE.md`** and **`docs/WRIT-THE-COURT.md`** — the implementable detail.

You do not have to agree with all of it. You do have to know which part you are disagreeing
with, and say so in the pull request.

---

## The house voice

Everything written here — `explains` fields, comments, commit messages, documentation, pull
request descriptions — is in plain-English medieval. That means:

**Recognisable words, never glossary flavour.**

- Say **muster**, **summons**, **grudge**, **wergild**, **the vessel**, **the van**, **the
  rein**. Real words a reader can guess from context and look up in a dictionary if they want
  to.
- Do not invent vocabulary. If a term needs a glossary entry before anybody can understand it,
  it is the wrong term. No *aetheric resonance*, no *Command Points*, no *Tier 2 Unlocks*, no
  *Valour Tokens*.
- Write for a smart twelve-year-old with the manual open. Short sentences. Concrete nouns. Say
  the consequence out loud.

Good:

> Braced spears do not get a bonus against horses. They take the *speed* out of the charge, and
> because damage is the square of the speed left at contact, taking most of the speed away
> takes almost all of the damage away. Then the spears kill the stalled horses at leisure.

Bad:

> `refusalBase` applies a deceleration modifier to charging units within `refusalRangeMm`,
> scaled by the defender's cohesion and morale coefficients.

The second one is not wrong. It just fails the only test this project has.

---

## What a good change looks like

**A good data change**

- Every object it adds carries an `explains` written for the twelve-year-old, and a
  `readOnField` saying how a watcher could tell the thing is happening. A mechanic that cannot
  fill `readOnField` is cut, not shipped invisible.
- Every number is real. No placeholders, no `0`-means-todo, no `// tune later`. If the number
  was chosen on feel — which is fine and honest — it still gets a real value **and** a line in
  `docs/OPEN-QUESTIONS.md` saying so.
- Tuning numbers and shared formula constants go in `data/constants.json`; a row's own facts
  (a weapon's reach, a holding's income) stay on the row. The rule is written out in that
  file's `whereNumbersLive` note.
- Valid JSON, two-space indent, no trailing commas, keys in a deliberate reading order —
  identity, then numbers, then `explains` last — because these files are read by people.

**A good code change**

- The writ came first. If an implementer would have to guess, fix `docs/WRIT-THE-BATTLE.md` or
  `docs/WRIT-THE-COURT.md` in the same pull request and say that you did.
- No floating-point numbers anywhere inside the battle simulation. Not in state, not in an
  intermediate, not in a constant. Integer division is floor, everywhere, without exception.
  This is what makes a replay a proof rather than a recording.
- No DOM, no canvas, no rendering, no timers, no `Math.random`, no `Date.now`. The engine is
  headless and the front end stays out of mind.
- Stored replays still reproduce byte for byte. If your change makes one diverge, that is
  either a bug you have just found or a rules change you must declare — it is never noise.
- State is computed from records, never stored. If you find yourself caching a reading, stop:
  there are now two sources of truth and one of them is about to start lying.

**A good pull request**

- Says what it changes and which law or open question it serves.
- Is small. Several small ones beat one large one, always.
- Updates `docs/OPEN-QUESTIONS.md` if it opens a seam, and moves a question out of that file
  into the writ if it genuinely closes one. Do not close a question by deleting it.

---

## The standing rule: nothing real, ever

**No real personal data and no credential may enter this repository. Not once, not in a test
fixture, not in a comment, not commented out, not in a commit message, not "temporarily".**

This repository is public and open to contributors, so the guarantee has to be continuous
rather than a promise somebody made once. `npm run leakcheck` runs on every pull request and
refuses:

- e-mail addresses that are not at a documentation domain (`example.com`, `example.org`,
  `example.net`, `.test`, `.invalid`, `.localhost`)
- API keys, tokens, JSON Web Tokens, private key blocks, cloud access key ids
- error-reporting ingest URLs, database project hosts, identity-wall team domains
- telephone numbers outside the `555-01xx` range that fiction is allowed to use

Use `somebody@example.com` and `555-0147`. If you need a name, invent one — every person,
house, holding and realm in this game is fictional and is meant to be obviously so.

Two things worth knowing about that tool:

- **It is a net, not a proof.** It knows shapes, never a list of real values, because a file
  enumerating the exact strings you are hiding *is* the leak, committed and searchable, and
  every fork keeps a copy. A determined leak in an unfamiliar shape will pass it. A reviewer
  still reads the diff.
- **It does not clear binaries.** A picture can carry a place name in its pixels and an
  elevation file can carry coordinates in its header; both pass every text scan ever written.
  The tool lists binaries and requires a human to have opened them. Please do not add binaries
  without a good reason.

If a secret ever does get committed, say so immediately and **rotate it**. Removing it from the
working tree does not remove it from the history, and the history is public.

---

## Reporting a problem

Open an issue. A rules question ("does a defected unit's men count as deserted?") is as welcome
as a bug — most of this project's real problems are rules questions in disguise, and several of
them are already written down in `docs/OPEN-QUESTIONS.md` waiting for somebody to argue.

By contributing you agree that your work is licensed under this repository's MIT licence.
