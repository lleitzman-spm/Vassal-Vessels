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
| what the engine actually does | the code under `src/`, once it exists; then re-compile |
| this compiler itself | `tools/codex/` — see `docs/WRIT-THE-CODEX.md` |

## Read the standing before you believe the page

Every page renders its standing on its face. `canon` is the constitution and wins
until amended. `built` is in the tree and checkable — a module or a test stands under
it. **`proposed` is a design in `data/` with no engine reading it yet, and may NEVER
be cited as evidence that the game plays this way.** `contested` means two designs
disagreed and nobody has ruled. Most of the Codex is `proposed` right now, honestly,
because the engine has not been built yet — watch that change as `src/` and `test/`
fill in.

→ [[Map of the Codex]]

*This page is yours. A durable hand-written note goes here, or it goes in a source.*
