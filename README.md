# Vassal Vessels

> **You do not command an army. You command the few men who will still listen to you — and
> who those men are was decided at court, months ago, by you.**

Vassal Vessels is two games wired together so tightly that neither makes sense alone.

**The court is a game of days.** A war is declared and with it a date: *the enemy stands at
the ford in 41 days.* Every act of governance — a summons, a seat granted, a grudge settled, a
company hired — costs days off that number, and what shows up at the muster is arithmetic you
could do in your head. No dice. Ever.

**The battle is a game of minutes.** Six to twelve minutes of continuous simulation that never
pauses and never waits. You watch a line of real physics — mass, speed, reach, fear — and you
steer it through three slow, crude, dangerous levers: plans you bound before the fighting,
riders who take nine seconds to cross the field, and a banner that is your voice and can be
taken from you.

The wire between them is the whole point. Every political fact becomes a number on the field.
The seat you never granted is two riders you do not have. The wergild you never paid is a wing
that comes short. The grudge you never learned of is a contingent that turns its coat at the
worst possible moment — foreseeably, because you could have read it, which makes it your
fault, which makes it a story.

---

## The loop of a season

```
A WAR IS DECLARED — and with it a DAY. Visible from the first moment; it never moves.
        │
        ▼
YOU SPEND THE DAYS. Every act costs days off the deadline, on the crown's own track or
on a filled seat's track. A seat you never granted is a hand you do not have.
        │
        ▼
THE HOST STANDS (or does not). Pure arithmetic: this house owed 90 and sent 68, because
you passed its lady over for the Stewardship two winters ago. Every absence is named,
with its reason, and the records that caused it.
        │
        ▼
THE BATTLE. Your politics ride into it inside every unit: how many men, how tired, how
willing, whether they will carry out the order you send, and whether the man on your
right flank is going to turn.
        │
        ▼
THE AFTERMATH comes back as records: dead, captured, distinguished, disgraced, deeds.
Widows, heirs, blood-debts, unrewarded heroes, ransoms unpaid.
        │
        └────► and the changed court changes the NEXT army. Loop.
```

There is no end-turn button. The calendar is a set of tracks — the crown's day-book plus one
for every filled seat — and the clock advances to the next thing that finishes. Against a
41-day deadline with two seats filled you have about 41 crown-days and 82 officer-days, and
eleven things worth doing. You cannot do them all. That is the game.

## The loop of a battle

Twenty ticks a second, and it never pauses.

1. **Read the line.** Cohesion frays visibly. A unit under arrows spreads out. A wing about to
   go has a look to it. Every mechanic has a tell.
2. **Choose where to spend your voice.** You have as many riders as your Marshal is worth —
   two if you never appointed one, six if he is great. A ride to the far wing is nine seconds.
   You will notice four problems and be able to answer two, and because orders take time to
   arrive, *every order is an order about the future*.
3. **Commit.** A charge cannot be recalled for eight seconds. The reserve is spent once.
   Shouting at a wing costs it courage it can never get back. The tension is never "do I press
   the button" — it is "is NOW the moment, given that I cannot un-press it and will not know
   for six more seconds whether it was".
4. **Watch the cascade.** Battles are not decided by attrition. One unit's morale hits the
   floor and the panic travels — and panic reaches twice as far as courage — and a wing folds,
   unit by unit, while the Tide turns under the whole army.
5. **Pursue, or hold.** When the enemy breaks, your men want to chase. Chasing captures lords
   and kills the running; chasing also strings your army out, blows its wind, and hands it to a
   counter-attack. Greedy captains ignore "hold the rein", and the court told you in advance
   which ones they would be.

## One rule, so you can see the shape of it

Bracing gives no bonus. A braced spear line projects a **refusal field** — twelve metres deep
for pikes, seven for spears — that takes the *speed* out of a charge before it arrives. Shock
damage is the **square** of the speed left at contact. So fifty knights at a full gallop kill
twenty-nine men in the instant they hit loose archers, and one tenth of a man against braced
pikes. That is a swing of nearly three hundred to one, with not a single bonus in it.

And refusal is multiplied by the defending unit's morale and cohesion. The *same* braced
spears, frightened and ragged, are ridden straight over — ten men dead instead of one. Morale
is not bolted onto combat. It lives inside the counter.

---

## There is deliberately no front end

None. No renderer, no window, no sprites, no colours. This is on purpose, and it is written
down as the first law in [`CLAUDE.md`](CLAUDE.md):

> A design decision made for display reasons is made wrong.

The engine is headless and deterministic. It takes a `Host` for each side, a description of the
ground, and one seed; it writes a replay log. Every event in that log carries its reasons *and*
a **herald** line in plain words, so a battle can be read as a chronicle with no pictures at
all:

```
Ser Bertrand Stormmarch drags his feet. He has not forgotten the slight,
and it was not a small one.
The Spears of Millrow set their points before the rider could have reached them.
Lord Mavis Thornbury looks upon them hard-pressed, and looks away.
```

The whole game can be tuned against text before anybody draws a soldier — and a design that
survives that was never propped up by its own artwork. A renderer can be built later, by
anybody, against a log format that will not move.

## The Codex

`data/*.json` is not configuration extracted from the code. **It is the game**, written down,
and the code implements it. Every object in it carries a plain-English `explains` field written
for a smart twelve-year-old reading a manual — that is this project's acceptance test, and a
number that is not in `data/` does not exist.

Start anywhere; they are meant to be read straight through.

| File | What it tells you |
|---|---|
| `data/units.json` | Every kind of soldier, what beats it, and why |
| `data/equipment.json` | Weapons, armour and shields — and why you cannot cut a knight |
| `data/formations.json` | Every shape is a bet; the craft is making the enemy's bets wrong |
| `data/orders.json` | The standing jobs, the improvised orders, and the four prices each one carries |
| `data/standing-plans.json` | Foresight as a resource: the plan that fires with no rider and no argument |
| `data/terrain.json` | Why mud quarters a cavalry charge, and the three reasons to take the hill |
| `data/captains.json` | The six things a captain can do with your order, and how the herald announces each |
| `data/quirks.json` | The named behaviours the court hands to the battle |
| `data/seats.json`, `obligations.json`, `holdings.json`, `grievances.json`, `favours.json`, `answers.json`, `seasons.json`, `troop-sources.json` | The court |
| `data/constants.json` | Every tuning number in the game, in one file |
| `data/example-host.json` | A complete worked army — 673 men, no Marshal, and every absence named |

## The documents

| Document | What it is |
|---|---|
| [`docs/KINGDOM.md`](docs/KINGDOM.md) | The constitution. Eleven laws, and it wins until amended. |
| [`docs/WRIT-THE-BATTLE.md`](docs/WRIT-THE-BATTLE.md) | The implementable tick: thirteen phases, every formula, the replay format. |
| [`docs/WRIT-THE-COURT.md`](docs/WRIT-THE-COURT.md) | The records, the readings, and the `Host`/`Aftermath` contracts as literal TypeScript. |
| [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) | Every seam and every number chosen on feel. Start here if you want to argue with something. |

## Running it

```
git clone <this repository>
cd vv-public
npm install

npm test              # the suite, including the determinism tests
npm run build         # type-check only, no emit
npm run leakcheck     # refuses credentials and personal data; runs on every pull request
```

Node 20 or newer. No other dependencies, no build step, no database, nothing to configure.

## Where it came from

Three designs were written independently against the same brief — two for the battle, blind to
each other, and one for the realm and the court — and then grafted into one game. The two
battle designs converged, without knowing it, on the same spine: real time, no turns, orders
that travel at a rider's speed and land on a captain who may or may not obey. Where they
diverged, `docs/KINGDOM.md` records which branch was taken and why, and
`docs/OPEN-QUESTIONS.md` records what was given up. The joins are meant to be visible.

## Contributing

Yes, please — see [`CONTRIBUTING.md`](CONTRIBUTING.md). The house voice is plain-English
medieval, and the bar for any change is that a twelve-year-old with the manual open could
follow it. The most useful thing you can do right now is read `docs/OPEN-QUESTIONS.md`,
disagree with something in it, and say why.

MIT licensed. Every person, house, holding and realm in this repository is invented.
