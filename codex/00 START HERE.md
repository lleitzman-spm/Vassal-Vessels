# Start here — the Codex

*This is the ONLY hand-written page in the Codex. The compiler wrote it once and will
never touch it again. Everything else under `codex/` is generated and will be
overwritten on the next run — a correction made to a generated page is gone at the
next compile, and gone silently, having looked right for however long.*

**Find the source, fix the source, re-compile.** The footer of every page names its
source. This Codex is the manual that came in the case: read it cover to cover and you
should understand Vassal Vessels before ever fighting a battle.

## The four verbs

| verb | command | what it does |
|---|---|---|
| **compile** | `npm run codex` | sources → pages. Deletes and rewrites its own shelves. |
| **query** | `npm run codex:trace -- "<subject>"` | one subject across every layer at once — rule, writ, unit, keyword, equipment, formation, constant. |
| **lint** | `npm run codex:lint` | dangling links, orphans, missing quotes, standing drift, literals in guards, deferred tables. |
| **read** | `npm run codex:html` | the whole Codex as one self-contained page. |
| **fix** | *— edit a source, then compile* | there is no fix-in-place. |

## Where to change a thing

| To change… | Edit |
|---|---|
| a numbered law, a term, the canon | `docs/KINGDOM.md` — the constitution |
| the implementable formulas | `docs/WRIT-THE-BATTLE.md` or `docs/WRIT-THE-COURT.md` |
| a unit, a keyword, a weapon, a formation | the matching `data/*.json` file — never a page here |
| a governing number (a cap, a rate, a threshold) | `data/constants.json` — **never a literal in the code** |
| a state, an arrow between states, a condition on one | `data/places.json`, `data/transitions.json`, `data/guards.json` |
| what the engine actually does | the code under `src/`; then re-compile and the page follows |
| this compiler itself | `tools/codex/` — see `docs/WRIT-THE-CODEX.md` |

## Two graphs, and the difference is the whole design

The Codex is built from **two** graphs, and they do different jobs.

The **knowledge graph** is the game's nouns — units, keywords, weapons, seasons,
grudges, seats, the causes of a war. Entities and what is true about them. Queried;
carrying no state.

The **operational graph** is its verbs — flows, places, transitions, guards, tokens.
The part that executes. Open any **flow** and the whole machine is drawn for you: every
state a case can be in, every way it can move between them, and what has to be true
first.

> The operational graph is a program and the knowledge graph is its data and its type
> system. Flows do not *contain* knowledge, they *consume* it.

That consumption is literal rather than a figure of speech. Every **guard** names the
constants it reads by dotted path; the lint resolves each one against the real number
tree in `data/constants.json`; the edge to the constant's page is drawn from the
resolved identifier, never authored. A guard citing a number that is not there fails
the build, and so does a machine with a state nothing can reach.

**Here to learn the game rather than to work on it? Start at [[A Unit's Nerve]].** It
is the machine the whole battle is really about, and you can trace a unit from Steady
to Destroyed with a finger.

## Read the standing before you believe the page

Every page renders its standing on its face. `canon` is the constitution and wins until
amended. `built` is in the tree and checkable. **`proposed` is a design in `data/` that
nothing in the engine reaches, and may NEVER be cited as evidence that the game plays
this way.** `contested` means two designs disagreed and nobody has ruled.

Standing is never hand-declared — there is no manifest here to declare it in. It is
derived three ways: from the constitution, from a module or test naming the thing, and
from the shelves the engine resolves BY ID, where importing the file genuinely reaches
every row on it.

What that last rule deliberately leaves OUT is the part worth knowing. Orders and
standing-plan triggers are matched case by case, so an id can sit in `data/`, be
imported by the engine, and still do nothing at all. `ENVELOP`, `COMMIT_RESERVE`,
`AIMED_VOLLEY` and `ENEMY_ENTERS_ZONE` are exactly that today. They say `proposed`
because they are, and no amount of the file being read changes it.

→ [[Map of the Codex]]

*This page is yours. A durable hand-written note goes here, or it goes in a source.*
