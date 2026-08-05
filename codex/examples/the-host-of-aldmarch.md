---
type: "example"
id: "example:host-aldmarch-1187-cald"
title: "The Host of Aldmarch"
standing: "proposed"
standing_source: "defaulted"
source_path: "data/example-host.json"
source_line: 1
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "example:host-aldmarch-1187-cald"
---

# The Host of Aldmarch

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *NOT backed by anything in the tree yet; this is the compiler's default for a design in `data/` with no engine behind it.*

A COMPLETE Host, exactly as the court hands one to the battle. This is the opening position of the realm of Aldmarch with nothing done about it: forty-one days of politics unspent, six hundred and seventy-three men, and no Marshal. It is here so that an engine builder has a real artefact to build against instead of a description, and so that a reader can see every idea in this project standing in one field at once. Every number is derived from data/constants.json and the tables beside it, and every one of them can be checked by hand.

*Verified verbatim against `data/example-host.json`:1 on every lint — no quote, no object.*

> **Reading this file:** Keys prefixed with a dollar sign are commentary for the manual and are NOT part of the Host contract. Everything else is. A parser may drop every $-key and lose nothing but the explanation.

> **On the names:** Aldmarch, its houses, its holdings and every person in it are fictional and are meant to be obviously so.

## The occasion

- **Cause:** The crossing at Cald (defending), on its own land
- **Legitimacy:** `50` · **Surprise:** `0` · **Days in the field:** `3`
- **Home holdings:** `millrow`, `harrowgate`, `thornbury-town`, `bannerwood-manor`, `oakhold`

A defensive war on Thornbury's and Bannerwood's own doorsteps — worth twenty-five points of willingness to those two houses and twelve to everybody else, and it is already inside every number below. The cause is UNBLESSED, because the Chaplaincy has been empty for a year, so legitimacy is a flat fifty and the Sworn Order did not come.


## Command

- **Commander:** payne-holt · **Authority:** `52` · **Order capacity:** `2`

TWO. The Marshalcy is empty, so the crown named its own household captain and can direct two contingents at a time and bind four standing plans. A seated Marshal would make that four riders and six plans; Bertrand Stormmarch would make it five and seven. This single number is what an unfilled seat costs the player in their own hands, in the middle of a fight.


**Disputes among the chain of command:**

- bertrand-stormmarch vs. aldric-bannerwood, over precedence (intensity `55`) — Both of them want the empty Marshalcy and each thinks the other is a fool. Put their men side by side and neither will move to save the other.

## Contingents

| contingent | raised by | captain | present / owed | disposition |
|---|---|---|---|---|
| The Household | [[The Household (troop-source)]] | payne-holt | `150` / `0` | eager |
| The men of Thornbury | [[The feudal levy]] | mavis-thornbury | `125` / `125` | willing |
| The men of Bannerwood | [[The feudal levy]] | aldric-bannerwood | `90` / `90` | willing |
| The men of Greyfen | [[The feudal levy]] | ysolde-greyfen | `68` / `90` | sullen |
| The men of the Wold | [[The feudal levy]] | hoel-of-the-wold | `53` / `70` | dutiful |
| The men of Stormmarch | [[The feudal levy]] | bertrand-stormmarch | `30` / `40` | sullen |
| The men of Ashfell | [[The feudal levy]] | cateline-ashfell | `27` / `30` | dutiful |
| The Highhall levy | [[The town militia]] | odo-larkfield | `130` / `0` | dutiful |

## Units in this Host

| unit | type | kind | strength | resolve / obedience |
|---|---|---|---|---|
| The Crown Banner | [[The Crown Banner]] | foot | `40` / `40` | `80` / `92` |
| The Household Guard | [[Household Guard]] | foot | `110` / `110` | `76` / `88` |
| The Spears of Millrow | [[Levy Spearmen]] | foot | `60` / `60` | `72` / `60` |
| The Bows of Millrow | [[Bowmen]] | shot | `20` / `20` | `70` / `60` |
| The Men-at-arms of Harrowgate | [[Men-at-Arms]] | foot | `25` / `40` | `74` / `64` |
| The Crossbows of Harrowgate | [[Crossbowmen]] | shot | `20` / `30` | `72` / `62` |
| The Men-at-arms of Oakhold | [[Men-at-Arms]] | foot | `25` / `40` | `72` / `58` |
| The Crossbows of Oakhold | [[Crossbowmen]] | shot | `20` / `30` | `70` / `56` |
| The Spears of Bannerwood | [[Levy Spearmen]] | foot | `45` / `60` | `68` / `55` |
| The Bows of Greyfen | [[Bowmen]] | shot | `20` / `20` | `41` / `47` |
| The Spears of Greyfen | [[Levy Spearmen]] | foot | `48` / `60` | `41` / `47` |
| The Foresters of the Weald | [[Foresters]] | shot | `53` / `60` | `53` / `56` |
| The Riders of Coldgate | [[March Riders]] | horse | `10` / `50` | `50` / `49` |
| The Knights of Riding Hollow | [[Knights]] | horse | `20` / `40` | `48` / `45` |
| The Pick-men of Deepcut | [[Pick-men]] | foot | `27` / `40` | `44` / `53` |
| The Spears of Highhall | [[Militia Spears]] | foot | `100` / `120` | `56` / `72` |
| The Crossbows of Highhall | [[Crossbowmen]] | shot | `30` / `40` | `57` / `72` |

## Captains

| captain | seat | command / valour / wits | aggression / caution / pride / greed | loyalty / grievance |
|---|---|---|---|---|
| Ser Payne Holt | [[The Steward]] | `62` / `70` / `55` | `45` / `60` / `30` / `20` | `95` / `0` |
  *A landless household captain given the Stewardship and now the command as well, because there is no Marshal. Loyal to the point of embarrassment and merely competent — and the great lords all know it, which is exactly why the host's authority is fifty-two.*
| Lord Mavis Thornbury | *none* | `55` / `45` / `60` | `25` / `75` / `40` / `35` | `68` / `10` |
| Lord Aldric Bannerwood | *none* | `72` / `80` / `50` | `70` / `30` / `75` / `45` | `61` / `5` |
| Lady Ysolde Greyfen | *none* | `50` / `40` / `85` | `30` / `65` / `60` / `55` | `44` / `20` |
  *Wits eighty-five and a grudge of twenty. She is the cleverest person in this host and she is here under protest, and both facts will be visible before the battle is a minute old.*
| Ser Hoel of the Wold | *none* | `58` / `60` / `70` | `40` / `55` / `50` / `25` | `55` / `5` |
| Ser Bertrand Stormmarch | *none* | `78` / `85` / `65` | `80` / `35` / `85` / `20` | `44` / `10` |
  *The best soldier in the realm, at obedience forty-seven, because you have passed him over for the Marshalcy five years running. Everything good about this host and everything dangerous about it are the same man.*
| Lady Cateline Ashfell | *none* | `40` / `35` / `75` | `20` / `70` / `65` / `15` | `51` / `14` |
| Odo Larkfield | *none* | `45` / `50` / `40` | `35` / `60` / `20` / `10` | `80` / `0` |
  *Captain of Highhall's watch. Not a lord, not a soldier, and entirely reliable inside twenty miles of his own gate.*

## Supply

- **Provision days:** `24` · **Sacks:** `180` · **Forage:** `0.7` · **Physicians:** `2`

Six hundred and seventy-three men eat 6.7 sacks a day, and seedtime forage of 0.7 means the countryside gives back almost nothing — so a hundred and eighty sacks is twenty-four days. Enough to fight, not enough to besiege, and just enough to wait two days for the Knights of Riding Hollow.


## Latecomers

- Bertrand Stormmarch came short and late — sixty-two leagues and a grudge about the empty Marshalcy. His twenty heavy knights, the only heavy horse in the realm outside your household, arrive a quarter of the way through the fighting. An engine that does not model reinforcements should treat them as absent and say so in the report.

## Who did not come

*Every absence is a finding, never a silently smaller number — see law 4, "every reading shows its working."*

| who | answer | owed / sent | why |
|---|---|---|---|
| House Greyfen | short | `90` / `68` | Came short: twenty-two men held back, including all fifty marines. |
| House Wold | short | `70` / `53` | Came short and two days late. |
| House Stormmarch | short | `40` / `30` | Came short and two days late; forty men remain on the frontier wall. |
| House Ashfell | near-full | `30` / `27` | Came near full. |
| The Sworn Order | refusal | `60` / `0` | The cause is not blessed. |
| Thornbury Town | refusal | `130` / `0` | No charter has been signed. |

## Where the Host stands

- **Legitimacy:** `50` · **Momentum:** `0` · **Belief:** `48`

Belief forty-eight: they are not sure they will win. Six hundred and seventy-three men against an estimated seven to nine hundred, no Marshal, and the man commanding is a household captain rather than a great lord.


## Notes

- 673 men present at the first minute; 693 once the Knights of Riding Hollow arrive.
- Order capacity 2: two riders and four standing plans. The Marshalcy has been empty for five years.
- Every absence in this host was a decision, and every one of them can be priced before it is made. See data/answers.json.
- Three legible plays would change this field: grant the Marshalcy (+2 riders, +2 plans, one house up and its rival down, net minus three men); pay a 200-crown wergild to Greyfen (+13 men); charter Thornbury Town (+130 poor spears and a fifth of its tax, forever). Do all three and 673 becomes 813 with four riders — and one new grudge with a long memory, which is next year's problem, dated.

## Units

- [[Bowmen]] — *fields a unit of type `bowmen`*
- [[Crossbowmen]] — *fields a unit of type `crossbowmen`*
- [[Foresters]] — *fields a unit of type `foresters`*
- [[Household Guard]] — *fields a unit of type `household-guard`*
- [[Knights]] — *fields a unit of type `knights`*
- [[Levy Spearmen]] — *fields a unit of type `spearmen`*
- [[March Riders]] — *fields a unit of type `march-riders`*
- [[Men-at-Arms]] — *fields a unit of type `men-at-arms`*
- [[Militia Spears]] — *fields a unit of type `militia-spears`*
- [[Pick-men]] — *fields a unit of type `pick-men`*
- [[The Crown Banner]] — *fields a unit of type `crown-banner`*

## Quirks

- [[Boastful]] — *Ser Bertrand Stormmarch carries the quirk `boastful`*
- [[Breaks Early]] — *a contingent in this host carries the quirk `breaks-early`; a unit in this host carries the quirk `breaks-early`*
- [[Cautious With His Own]] — *a contingent in this host carries the quirk `cautious-with-his-own`; Lord Mavis Thornbury carries the quirk `cautious-with-his-own`*
- [[Charges Without Orders]] — *a contingent in this host carries the quirk `charges-without-orders`; a unit in this host carries the quirk `charges-without-orders`; +2 more*
- [[Claims the Place of Honour]] — *a contingent in this host carries the quirk `claims-the-van`; Lord Aldric Bannerwood carries the quirk `claims-the-van`; +1 more*
- [[Fighting For Their Own Roofs]] — *a contingent in this host carries the quirk `holds-to-the-last-on-own-land`*
- [[First to Plunder]] — *a unit in this host carries the quirk `first-to-plunder`*
- [[Mud-Wise]] — *Ser Hoel of the Wold carries the quirk `mud-wise`*
- [[Veterans]] — *a contingent in this host carries the quirk `veterans-know-the-ground`; a unit in this host carries the quirk `veterans-know-the-ground`*
- [[Will Not Fight Beside]] — *a contingent in this host carries the quirk `will-not-fight-beside`*
- [[Will Not Leave the Province]] — *a contingent in this host carries the quirk `will-not-leave-the-province`; a unit in this host carries the quirk `will-not-leave-the-province`*
- [[Will Not Stand in Line]] — *a contingent in this host carries the quirk `will-not-stand-in-line`; a unit in this host carries the quirk `will-not-stand-in-line`*

## Seats

- [[The Steward]] — *Ser Payne Holt holds the seat `steward`*

## Troop sources

- [[The feudal levy]] — *a contingent is raised by `feudal-levy`*
- [[The Household (troop-source)]] — *a contingent is raised by `household`*
- [[The town militia]] — *a contingent is raised by `town-militia`*

## Backlinks

### Writs that specify it

- [[WRIT — THE COURT]] — *this writ names "The Host of Aldmarch" literally*

---

*Generated by `tools/codex/emit.mjs` from `data/example-host.json`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
