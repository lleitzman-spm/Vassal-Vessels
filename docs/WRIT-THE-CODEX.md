# Writ of the Codex — the living manual, and the law that keeps it honest

*Ported from LandLord's Great Book (`tools/vault/` and `docs/WRIT-THE-GREAT-BOOK.md` in
the sibling `ll-public` repository) and re-aimed at a game manual. Binds this repo's own
tooling under `tools/codex/`. The pattern is proven there; what follows names what
stayed identical, what changed because the domain changed, and why.*

## Why this exists

A game manual that scatters its own truth across a constitution, two implementable
writs, and a pile of hand-edited JSON is exactly the kind of document that drifts: a
number changes in `data/constants.json` and the sentence describing it in some other
file quietly stops being true, and nobody notices until a reader — or a builder — acts
on the stale one. The Codex is the fix: one generated, backlinked, searchable
projection of everything `data/*.json`, `docs/KINGDOM.md` and (once it exists) the
engine itself already know, with every claim carrying the source it came from and the
standing it holds.

**The acceptance test, stated once and worth repeating everywhere:** a smart
twelve-year-old reads the Codex cover to cover and understands Vassal Vessels before
ever playing it. Every design choice below serves that test. A page that opens with a
table of contents and buries the plain-English explanation on page three has failed the
reader it exists for.

## The one rule that matters

**Never edit a page in the Codex. Every page is generated and will be overwritten.**

The pages look like a wiki and are not one — they are a VIEW. The artifacts are
`docs/KINGDOM.md`, the two `WRIT-THE-*.md` specs, and `data/*.json`; once the engine
exists, `src/**` and `test/**` join them. The compiler deletes and rewrites its own
shelves on every run. A correction made to a page is gone at the next build, and gone
*silently*, having looked right for however long.

So: **find the source, fix the source, re-compile.** The footer of every page names its
source.

| To change… | Edit |
|---|---|
| a numbered law, a term, the canon | `docs/KINGDOM.md` — the constitution |
| the implementable formulas | `docs/WRIT-THE-BATTLE.md` or `docs/WRIT-THE-COURT.md` |
| a unit, a keyword, a weapon, a formation, an order… | the matching `data/*.json` file |
| a governing number (a cap, a rate, a threshold) | `data/constants.json` — **never a literal in the code** |
| what the engine actually does | the code under `src/`, once it exists; then re-compile |
| this compiler itself | `tools/codex/` |

Exactly one file inside the Codex is hand-written and safe to edit: **`00 START
HERE.md`**. The compiler writes it once and never touches it again.

## The node types — the game's vocabulary, not an application's

The Great Book's primary spine was `module` / `surface` / `invariant` / `writ` /
`artifact` — the shape of a TypeScript application. A game manual's spine is the game's
own vocabulary instead. The Codex mines, directly, every array-of-objects shelf in each
`data/*.json` file (every present file already follows one convention: `{ $schema,
explains, fields?, <shelf>: […] }`), plus `docs/KINGDOM.md`'s own numbered laws, plus two
files read a different way (below):

| type | mined from | shelf |
|---|---|---|
| `rule` | `docs/KINGDOM.md` §2, "The laws" — each numbered law, verbatim | `codex/rules/` |
| `writ` | `docs/*.md` — whole-document pages, the road from a rule to its reasoning | `codex/writs/` |
| `example` | `data/example-host.json` — ONE worked Host, mined whole, not as a shelf | `codex/examples/` |
| `unit` | `data/units.json` | `codex/units/` |
| `keyword` | `data/keywords.json` | `codex/keywords/` |
| `equipment` | `data/equipment.json` (weapons, missile weapons, armour, shields) | `codex/equipment/` |
| `formation` | `data/formations.json` | `codex/formations/` |
| `terrain` | `data/terrain.json` | `codex/terrain/` |
| `order` | `data/orders.json` (charges, orders, pursuit policies) | `codex/orders/` |
| `standing-plan` | `data/standing-plans.json` | `codex/standing-plans/` |
| `trait` | `data/captains.json`'s `axes.competence` + `axes.temper` — NOT a `data/traits.json`, which does not exist and is not coming | `codex/traits/` |
| `quirk` | `data/quirks.json` | `codex/quirks/` |
| `seat` | `data/seats.json` | `codex/seats/` |
| `obligation` | `data/obligations.json` | `codex/obligations/` |
| `holding` | `data/holdings.json` | `codex/holdings/` |
| `grievance` | `data/grievances.json` | `codex/grievances/` |
| `favour` | `data/favours.json` | `codex/favours/` |
| `answer` | `data/answers.json` | `codex/answers/` |
| `troop-source` | `data/troop-sources.json` | `codex/troop-sources/` |
| `season` | `data/seasons.json` | `codex/seasons/` |
| `constant` | `data/constants.json` — one page per GROUP, not per number | `codex/constants/` |
| `module` / `invariant` | `src/**` / `test/**`, once they exist | `codex/modules/`, `codex/invariants/` |

A file not yet on disk is not an error — it is **reported as a gap** (the compiler's
count says so; `npm run codex:lint` says so) and nothing is invented in its place. As
soon as a file lands in the established shape, the next compile mines it with **no code
change** in `tools/codex/` — this table names every shelf the compiler already knows how
to read, not the ones authored yet.

## The data coverage audit — the fix for the file that slips through silently

Early in this port, the gap check above asked only one direction of question: *"does the
file THIS TYPE expects exist?"* A real, well-formed file sitting in `data/` under a name
nothing was looking for passed with no comment at all — which is exactly how five files,
four of them core manual content (`grievances.json`, `favours.json`, `answers.json`,
`troop-sources.json`), went completely unmined for a whole session, and a fifth
(`example-host.json`) sat unread alongside them. The gap report was technically correct
and substantively misleading: it never lied, it just never asked about anything it
had not already decided to look for.

`tools/codex/lib.mjs`'s `auditDataCoverage` asks the question the other way round: walk
`data/` **on disk** and account for every `.json` file found, against `KNOWN_DATA_FILES`
(every file `DATA_SOURCES` mines as a shelf, plus the three read a different way —
`constants.json`, `captains.json`, `example-host.json`). A file that is neither known nor
named in `DELIBERATELY_UNMINED_DATA` (empty today — nothing is currently excluded on
purpose) is an **oversight**, and it is reported LOUDLY: first in the compiler's own
stdout, then at the very top of `codex/maps/INDEX.md` (before even the page counts), and
`npm run codex:lint` makes it **fatal**, not a warning — the exact failure mode this
mechanism exists to kill is a permanent gap that trains a reader to stop reading the
report. The only legitimate way to silence it is to name the file in
`DELIBERATELY_UNMINED_DATA` with a reason on record.

## Reading it cover to cover — the front page has an order

The acceptance test says "cover to cover," and cover-to-cover implies a sequence, not a
pile of type-buckets sorted by page count. Both `codex/maps/INDEX.md`'s "Every shelf"
listing and `renders/CODEX.html`'s front page walk the shelves in one fixed narrative
order (`TYPE_DIRS`' own key order in `tools/codex/lib.mjs` — reordering that object is
the single lever that reorders both):

1. **The Rules** — the constitution's numbered laws, and the two implementable writs.
2. **A Worked Example** — the single `example` page, so a reader meets the rules once,
   filled in, before the catalog below breaks them apart into a hundred small pieces.
3. **Units, and What Beats What** — units, keywords, equipment, formations, terrain.
4. **Command** — orders, standing plans, the captains' trait axes, and quirks.
5. **The Court** — seats, obligations, holdings, grievances, favours, answers, troop
   sources, seasons: what produced the army before the first letter was ever sent.
6. **Reference** — the governing numbers, as an appendix, not a lead.
7. **Build Status** — contested and merely-proposed pages: what to distrust, named.
8. **The Engine** — modules and invariants: the code, once it exists.

The HTML front page renders this as visible chapter breaks (a numeral, a title, a
one-line orientation), not just a sequence of same-weight `<h2>`s — the order has to be
*seen*, not merely be true in the markup underneath it.

## The standing axis — unchanged in meaning, re-derived in mechanism

`docs/KINGDOM.md` itself sets the vocabulary: *"for a game the useful ones are `canon`
(in the constitution), `built` (implemented and tested), `proposed` (designed, not
built) and `contested` (the designs disagreed)."* **A `proposed` rule must never be
mistakable for a `built` one — that distinction is the whole reason the axis exists**,
and every page renders it as a loud banner, never just a quiet chip.

The Great Book derived standing from a hand-declared `knowledge/artifacts.json`
manifest. This repo has no such manifest — `tools/codex/` does not own `data/` or
`docs/` to add one to, and inventing a declaration file nobody asked for would be
exactly the kind of unrequested addition this writ forbids. So standing here comes from
three places, all derivable, none hand-declared:

- **`canon`** — the constitution's own numbered laws, mined straight from
  `docs/KINGDOM.md` §2. Nothing else is ever `canon`.
- **`built`** — `module` and `invariant` pages, because their own existence in the tree
  IS the proof; and any game-data page (`unit`, `keyword`, `constant`, …) that a real
  module or a real test cites BY ID — the promotion happens automatically, in
  `upgradeBuiltStanding` (`tools/codex/lib.mjs`), the moment the tree backs the claim.
  Nothing is ever hand-declared `built`.
- **`proposed`** — every game-data page's default, honestly, until the tree backs it.
  Most of the Codex is `proposed` right now, because the engine (`src/`) is still being
  built in parallel with this Codex. Watch that number fall as `src/` and `test/` fill
  in — a shrinking PROPOSED count is the map's own progress bar.
- **`contested`** — reserved for two designs that disagreed and no decision resolved it.
  `docs/KINGDOM.md` already resolved every graft between design A and design B it
  records, so nothing mines to `contested` today; the check exists for when something
  does.

## No quote, no object — aimed at JSON instead of prose

Every object in `data/*.json` already carries an `explains` field written for a smart
twelve-year-old (`docs/KINGDOM.md` law 6). That field is **both** the page's lead prose
**and** the quote `npm run codex:lint` re-reads the JSON file to verify, whitespace-
normalised, on every run. A quote that does not appear verbatim is not a weak claim —
it is a hallucination with a schema, and it is fatal.

The constitution's numbered laws are quoted the same way, straight out of
`docs/KINGDOM.md` — never hand-copied into a second file that could drift from the one
the whole game answers to.

## Links are found, never invented — and `data/*.json` gives the richest ones yet

Edges come from literal identifiers only: an id, a file path, an exported symbol, a
game term's own name — and, new in this port, **declared reference fields**. A unit
naming `"traits": ["CanBrace"]` is not prose that merely mentions bracing, it IS the
reference; `tools/codex/lib.mjs`'s `REF_FIELDS` table wires `traits`, `primaryWeapon`,
`sidearm`, `armour`, `shield`, `defaultFormation`, `allowedFormations` and
`defaultQuirks` straight into honest edges, with no guessing. `docs/WRIT-THE-BATTLE.md`
and `docs/WRIT-THE-COURT.md`'s own `K.<path>` citations of `data/constants.json` are
matched the same way. Where a source states a kinship only in prose, there is still no
edge — the literal-match discipline is unchanged from the sibling tool.

This is also why a unit page satisfies the acceptance test directly: read about
spearmen, click **Can Brace**, click through to the law that makes bracing matter,
click sideways to **Knights** (also braceable) and to the **Close Order** formation —
every one of those is a found edge, never an authored one.

## Every table is resolved — no page needs a plugin

Unchanged, and non-negotiable: `npm run codex:lint` fails fatally on any fenced
`dataview` / `dataviewjs` / `query` / `tasks` / `chart` / `dbfolder` block. A manual
that needs a plugin installed to show its unit tables is not a manual. Every numeric
table this Codex ever shows — a unit's stat block, a constant group's governing
numbers, the flattened ledger — is written out by the compiler as an answer, not left
as a query for a reader's plugin to evaluate.

## Tolerating a repo still being built, and saying so

`src/` and `test/` do not exist yet as of this writing — another hand is building the
engine in parallel with this Codex. That is tolerated exactly like an absent
`data/*.json` file: the compiler reports the gap on every run (`not yet authored
src/ …`) rather than failing, and it will start mining `module`/`invariant` pages the
moment code and tests land, with no code change here.

## What did NOT carry over from the Great Book, and why

The sibling tool's lint also validated every root path on disk against a hand-declared
two-axis manifest (`knowledge/artifacts.json`) — kind and standing per path, catching
both an undeclared path and a declaration pointing at nothing. This repo has no such
manifest, `tools/codex/` does not own a place to put one honestly, and standing here is
already fully accounted for by the three mechanisms above. So that check was dropped
rather than faked — a lint that always prints "SKIPPED" teaches nobody anything, and a
manifest invented just to satisfy a check would itself be an unrequested addition. If
this repo ever wants that exact guarantee back, the honest way to add it is a manifest
owned by whoever owns `data/` and `docs/`, not a file smuggled in under `tools/codex/`.

## The four verbs

| verb | command | what it does |
|---|---|---|
| **compile** | `npm run codex` | sources → pages. Deletes and rewrites its own shelves. |
| **query** | `npm run codex:trace -- "<subject>"` | one subject across every layer at once — law, unit, keyword, equipment, formation, constant. |
| **lint** | `npm run codex:lint` | dangling links, orphans, missing quotes, standing drift, literals in guards, deferred tables. |
| **read** | `npm run codex:html` | the whole Codex as one self-contained page, `renders/CODEX.html`. |
| **fix** | *— edit a source, then compile* | there is no fix-in-place. |

`renders/` is gitignored on purpose — a stale render must never be mistaken for the
current manual.

## The HTML reader

`npm run codex:html` binds every compiled page, plus a full flattening of
`data/constants.json`, into one self-contained `renders/CODEX.html`: zero external
requests, zero external resource references (verified by `npm run codex:check`, which
opens the render in headless chromium — see its own header for why it degrades to a
clear NOT RUN message rather than a hard failure when `playwright-core` is not
installed, which is this repo's normal state). Full-text search, resolving wikilinks,
computed backlinks, a local-graph view in inline SVG, filter by type and standing,
deep-linkable, theme-aware in both light and dark. Re-titled and re-accented for a war
manual (an oxblood banner-red, `#7a1f1f`) rather than LandLord's leather brown.

## Naming, so nothing collides

- **the vault** (Supabase) and **the chronicle** (the event log) belong to LandLord, a
  different repository entirely — this game has neither; it is headless, offline, and
  carries no secrets, ever (see `tools/leakcheck.mjs` and `.gitignore`).
- The generated wiki is **the Codex** here, exactly as `docs/WRIT-THE-GREAT-BOOK.md`
  names it: *"The Codex is the manual that came in the case."*
