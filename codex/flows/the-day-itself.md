---
type: "flow"
id: "flow:battle"
title: "The Day Itself"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 17
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:battle"
---

# The Day Itself

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The largest machine in the game and the shortest. A battle is laid out, fought, chased down, and over. What makes it worth naming as a machine is the PURSUIT phase: once an army breaks, the rules change underneath everyone — phase one stops running, nobody is listening to orders any more, and the killing gets much cheaper. A commander who does not understand that he has crossed into a different machine will keep issuing orders into a silence, and will not find out until the day is spent.

*Verified verbatim against `data/flows.json`:17 on every lint — no quote, no object.*

## The machine

*A `one battle` moves through this, stepped every **tick**.*

```text
▶ Deploying
   └─▶ Battle Joined   — The lines start forward
· Battle Joined
   └─▶ The Pursuit   — An army comes apart  [2 guards]
   └─▶ Ended   — Both sides break contact  [1 guard]
   └─▶ Ended   — The day runs out (transition)  [1 guard]
· The Pursuit
   └─▶ Ended   — The chase burns out (transition)  [1 guard]
■ Ended
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Deploying]] | `DEPLOY` | Two armies standing still, in lines, looking at each other across ground nobody has crossed yet. | **entry** |
| [[Battle Joined]] | `BATTLE` | Everything at once, which is rather the problem. | — |
| [[The Pursuit]] | `PURSUIT` | One army in pieces running away, and the other coming apart chasing it. | — |
| [[Ended]] | `ENDED` | Quiet, and a great deal of counting. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Deploying]] | [[Battle Joined]] | the first tick of the battle | *nothing — it fires on the event alone* | none |
| [[Battle Joined]] | [[The Pursuit]] | the army check, every tick | [[The army breaks]]; [[The banner falls at the wrong moment]] | the losing army takes a further morale blow on top |
| [[Battle Joined]] | [[Ended]] | no contact anywhere, sustained | [[Nothing is happening any more]] | none |
| [[Battle Joined]] | [[Ended]] | the tick ceiling | [[The day runs out]] | both armies keep their fatigue and their dead |
| [[The Pursuit]] | [[Ended]] | the pursuit clock | [[The chase burns out]] | none |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one battle` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `battle-deploy` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `battle-ended` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/types.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export type BattlePhase = "DEPLOY" | "BATTLE" | "PURSUIT" | "ENDED";` |

*Shelf: `flows` in `data/flows.json`.*

## Modules

- [[src/battle/types.ts]] — *this page names `BattlePhase`*

## place

- [[Deploying]] — *its `entry` names `battle-deploy` by id*
- [[Ended]] — *its `terminals` names `battle-ended` by id*

## Backlinks

### guard

- [[Nothing is happening any more]] — *its `flow` names `battle` by id*
- [[The army breaks]] — *its `flow` names `battle` by id*
- [[The banner falls at the wrong moment]] — *its `flow` names `battle` by id*
- [[The chase burns out]] — *its `flow` names `battle` by id*
- [[The day runs out]] — *its `flow` names `battle` by id*

### place

- [[Battle Joined]] — *its `flow` names `battle` by id*
- [[Deploying]] — *its `flow` names `battle` by id*
- [[Ended]] — *its `flow` names `battle` by id*
- [[The Pursuit]] — *its `flow` names `battle` by id*

### token

- [[Blood Up]] — *its `flow` names `battle` by id*
- [[The Tide]] — *its `flow` names `battle` by id*

### transition

- [[An army comes apart]] — *its `flow` names `battle` by id*
- [[Both sides break contact]] — *its `flow` names `battle` by id*
- [[The chase burns out (transition)]] — *its `flow` names `battle` by id*
- [[The day runs out (transition)]] — *its `flow` names `battle` by id*
- [[The lines start forward]] — *its `flow` names `battle` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/types.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:17. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
