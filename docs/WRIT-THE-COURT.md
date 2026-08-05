# WRIT — THE COURT

The implementable specification of the realm layer: the records, the readings computed
over them, the calendar, the muster arithmetic, and the two contracts — `Host` and
`Aftermath` — that join the court to the battle. The contracts are given as literal,
commented TypeScript; everything here is pure, headless, deterministic code with no
DOM, no rendering, no I/O. Constants are referenced as `K.<path>` and live in
`data/constants.json` under the `court` key.

The two laws this layer answers to before all others:

- **Records in, readings out** (law 1). The whole game state is a founding book
  adopted once plus an append-only list of acts. Nothing else is ever written. Removal
  of a record IS revocation, and every reading recomputes around the hole without
  complaint.
- **The muster never rolls dice** (law 2). Given the records, what stands at the
  mustering place is determined arithmetic. The only uncertainty is hidden information
  — and discovery is itself a record.

---

## 0. Shared primitives

```ts
/** The version of the Host/Aftermath contract. Bumped on any breaking change.
 *  A battle engine SHOULD refuse a major version it does not know and SHOULD
 *  tolerate an unknown minor (minors only ever add optional fields). */
export type ContractVersion = `${number}.${number}.${number}`;
export const CONTRACT: ContractVersion = '1.0.0';

/** 0..100. The one scale for every judgement in this contract, so a battle engine
 *  never has to ask "out of what?". Consumers may clamp. */
export type Score = number;

/** 0..1. Proportions, chances, positions-through-a-battle. */
export type Fraction = number;

/** Whole men. Never fractional — a levy is people. */
export type Men = number;

export type Crowns = number;   // the realm's coin
export type Sacks = number;    // grain; a host eats one sack per hundred men per day
export type Leagues = number;  // distance; foot makes eight a day on a good summer road

export type SeasonId = 'seedtime' | 'highsun' | 'harvest' | 'wolfmoon';

/** The calendar. Four seasons of ninety days. `absolute` is days since the founding —
 *  the only field arithmetic should compare, since it needs no calendar rules. */
export interface Stamp { year: number; season: SeasonId; day: number; absolute: number; }

/** A number that shows its working (law 4). EVERY reading this layer produces
 *  returns one of these rather than a bare number. A player who asks "why did this
 *  house send 68 and not 90?" must be able to see the seven terms that made it and
 *  click through to the seven records that caused them.
 *  `terms` sum to `value` before clamping; `clampedFrom` is set when clamping moved
 *  it, so a table can honestly say "this would be 118, but loyalty stops at 100." */
export interface Tally { value: number; terms: Term[]; clampedFrom?: number; }

export interface Term {
  label: string;      // short, for a table: "Passed over for the Marshalcy"
  explains: string;   // the twelve-year-old's sentence
  value: number;
  /** The acts this term was folded from. This is what makes "removal of a record IS
   *  revocation" tangible: strike these ids and the term vanishes. */
  fromActIds: string[];
}

/** A named, documented behaviour attached to a unit, contingent or captain.
 *
 *  QUIRKS ARE THE JOINT BETWEEN THE TWO LAYERS AND THEY ARE DELIBERATELY LOOSE.
 *  The court knows WHY a contingent will charge without orders; it has no business
 *  knowing how the battle expresses a charge. So it emits a named string from the
 *  documented vocabulary (`data/captains.json → quirks`), an explanation, an
 *  intensity, and an optional target.
 *
 *  THE CONTRACT WITH THE BATTLE ENGINE, STATED PLAINLY:
 *    · Implement the quirks you can express. IGNORE the rest — ignoring is legal and
 *      expected, not a failure.
 *    · Never crash on an unknown id. New quirks will appear in later minors.
 *    · If you implement one, list it in `Aftermath.quirksHonoured`, so the court can
 *      narrate causes it knows were real instead of inventing them. */
export interface Quirk {
  id: string;          // e.g. 'charges-without-orders'
  explains: string;    // for the manual
  intensity: Score;    // 20 is a tendency; 90 is a certainty
  targetId?: string;   // some quirks point at someone
}
```

---

## 1. The records

Every political change is one of these. Append-only. Nothing else is ever written.

```ts
/** Every act carries these. `at` IS the calendar: the clock is
 *  max(acts.map(a => a.at.absolute)), so time advances only because something was
 *  done. There is no end-turn (law 3). */
export interface ActBase {
  id: string;
  at: Stamp;
  /** 'crown' for the player, 'world' for the seeded world clock (harvests, raids,
   *  deaths, the enemy's movements), or a house id when a vassal acted alone. */
  by: 'crown' | 'world' | string;
  /** Which track it occupied and for how long — the crown's day-book or a seat's.
   *  Absent for world acts, which cost nobody anything. */
  track?: { seatId: string | 'crown'; days: number };
  note?: string;
}

// ── The land and the bond ──────────────────────────────────────────────────

/** THE FOUNDING RECORD OF EVERY OBLIGATION. Granting land IS the contract, and the
 *  terms live in the record — so regranting with better terms is the cleanest way in
 *  the game to buy soldiers, and it is permanent. */
export interface Enfeoff extends ActBase {
  kind: 'enfeoff';
  holdingId: string;
  houseId: string;
  owedMen: Men;      // the servitium: men owed each year...
  owedDays: number;  // ...for this many days. Classically 40.
}

/** Hostile seizure of a house's land. (An enfeoffment is revoked honestly by
 *  REMOVING its record; attainder is the different, louder thing.) */
export interface Attaint extends ActBase { kind: 'attaint'; houseId: string; holdingIds: string[]; }

export interface Homage extends ActBase { kind: 'homage'; captainId: string; houseId: string; }

// ── The court ──────────────────────────────────────────────────────────────

export interface Invest extends ActBase { kind: 'invest'; seatId: string; captainId: string; }

/** Naming a commander for one campaign — required whenever the Marshalcy is vacant,
 *  and a fresh slight to everyone passed over, every single war. */
export interface NameCommander extends ActBase { kind: 'name-commander'; campaignId: string; captainId: string; }

export interface Betroth extends ActBase { kind: 'betroth'; aId: string; bId: string; }
export interface Wed     extends ActBase { kind: 'wed';     aId: string; bId: string; }

/** A vassal's heir taken into the crown's household. Suppresses treachery by 30
 *  while held; sours after three years; and if the ward dies in your care it is the
 *  worst grievance in the game, spreading to every kinsman. The strongest and most
 *  dangerous instrument in the court. */
export interface Ward extends ActBase { kind: 'ward'; captainId: string; houseId: string; }

// ── Settling and souring ───────────────────────────────────────────────────

/** Settles grievance. Each method has its own rate and its own cost
 *  (data/acts entries in data/obligations.json and data/grievances.json);
 *  'justice' is the strong one and creates a fresh grievance in whoever is punished. */
export interface Amends extends ActBase {
  kind: 'amends';
  houseId: string;
  method: 'wergild' | 'apology' | 'justice' | 'gift' | 'grant' | 'judgement';
  settles: { grievanceActId: string; points: number }[];
  crowns?: Crowns;
}

export interface Feast   extends ActBase { kind: 'feast';   crowns: Crowns; invitedHouseIds: string[]; }
export interface Tourney extends ActBase { kind: 'tourney'; crowns: Crowns; }

// ── The muster ─────────────────────────────────────────────────────────────

export interface Proclaim extends ActBase {
  kind: 'proclaim';
  campaignId: string;
  causeId: string;
  defending: boolean;
  /** Blessed by the Chaplain — the only road to the Sworn Order, and worth
   *  10 × the Chaplain's effect in legitimacy. */
  blessed: boolean;
}

export interface Summon extends ActBase {
  kind: 'summon';
  campaignId: string;
  calledIds: string[];        // houses, companies, towns, orders
  musteringPlaceId: string;
  standBy: Stamp;             // the day the host must stand
  /** The Great Summons: the whole strength of the land instead of the quotas.
   *  Defensive causes only, once in five years; every house earns beyond-the-bond 15
   *  — forgiven entirely on victory, doubled on defeat. */
  great: boolean;
}

export interface AcceptScutage extends ActBase { kind: 'accept-scutage'; houseId: string; campaignId: string; crowns: Crowns; }
export interface Charter extends ActBase { kind: 'charter'; holdingId: string; libertyShare: Fraction; }
export interface Contract extends ActBase { kind: 'contract'; companyId: string; men: Men; crowns: Crowns; seasons: number; }
export interface Provision extends ActBase { kind: 'provision'; sacks: Sacks; crowns: Crowns; }
export interface Pay extends ActBase { kind: 'pay'; toId: string; crowns: Crowns; }
export interface Tax extends ActBase { kind: 'tax'; holdingIds: string[]; extraordinary: boolean; }
export interface March extends ActBase {
  kind: 'march';
  campaignId: string;
  toPlaceId: string;
  forced: boolean;   // 1.5× speed, +6 fatigue a day, 1% attrition a day
}

// ── Knowing ────────────────────────────────────────────────────────────────

/** Discovery is a RECORD, not a flag. Until the crown has learned of a grievance it
 *  does not appear in the crown's own reading of a house — the ONLY uncertainty in
 *  this layer, and the reason the Spymaster's seat is worth men. "I did not know" is
 *  a fact in the book, not an excuse. */
export interface Learn extends ActBase {
  kind: 'learn';
  aboutActIds: string[];
  through: 'spymaster' | 'feast' | 'herald' | 'betrayal' | 'plain-sight';
}

// ── The world's own hand — the only dice in this layer, from a seeded clock ─

export interface Harvest    extends ActBase { kind: 'harvest';    holdingId: string; quality: Fraction; }
export interface Raid       extends ActBase { kind: 'raid';       holdingId: string; menLost: Men; ravaged: boolean; }
export interface Pestilence extends ActBase { kind: 'pestilence'; holdingId: string; severity: Score; }
export interface Death      extends ActBase { kind: 'death';      captainId: string; cause: string; }
export interface Birth      extends ActBase { kind: 'birth';      captainId: string; houseId: string; }

/** The Crown's Gate: something has arrived and must be ANSWERED (days, and a favour
 *  or a grievance) or TURNED AWAY (free — and a grievance, which is exactly why
 *  turning petitions away is on the grievance list). The engine of live contested
 *  choice between wars. */
export interface Petition extends ActBase { kind: 'petition'; fromId: string; aboutId?: string; asks: string; }
export interface AnswerPetition extends ActBase { kind: 'answer-petition'; petitionActId: string; granted: boolean; }

/** The battle's report, absorbed — one record per fact. Emitted by absorb() (§5). */
export interface AftermathRecord extends ActBase {
  kind:
    | 'casualty' | 'blood-debt' | 'distinguished' | 'disgraced' | 'slain'
    | 'captured' | 'ransom-paid' | 'defected' | 'plunder' | 'banner-taken'
    | 'holding-lost' | 'holding-ravaged' | 'legitimacy' | 'glory-hunger';
  battleId: string;
  subjectId: string;
  amount?: number;
}

export type Act =
  | Enfeoff | Attaint | Homage
  | Invest | NameCommander | Betroth | Wed | Ward
  | Amends | Feast | Tourney
  | Proclaim | Summon | AcceptScutage | Charter | Contract | Provision | Pay | Tax | March
  | Learn
  | Harvest | Raid | Pestilence | Death | Birth | Petition | AnswerPetition
  | AftermathRecord;

/** The whole game state, and there is nothing else. */
export interface Chronicle {
  founding: FoundingBook;  // houses, holdings, captains, seats — adopted exactly once
  acts: Act[];             // append-only; the ONLY mutable thing
  seed: string;            // the world clock's die
}
```

### The founding book and its records

```ts
export interface FoundingBook {
  founding: Stamp;
  crown: { houseId: string; coffer: Crowns; granary: Sacks; household: RollEntry[] };
  houses: HouseRecord[];
  holdings: HoldingRecord[];
  captains: CaptainRecord[];
  seats: SeatRecord[];
}

/** NOTE WHAT IS NOT ON THIS RECORD: loyalty, grievance, standing, willingness.
 *  All four are readings. The compile-time guard below enforces it. */
export interface HouseRecord { id: string; name: string; lordCaptainId: string; heirCaptainId?: string; }

export interface HoldingRecord {
  id: string;
  name: string;
  typeId: string;                        // a row in data/holdings.json
  provinceId: string;
  /** Distance to each mustering place, so march days are arithmetic, not a
   *  pathfind. Keyed by mustering place id. */
  leaguesTo: Record<string, Leagues>;
  road: 'highway' | 'track' | 'path';
}

export interface CaptainRecord {
  id: string; name: string; houseId: string | null; born: number;
  command: Score; valour: Score; wits: Score;
  aggression: Score; caution: Score; pride: Score; greed: Score;
  /** How badly they want each seat, 0..5. Feeds passed-over and unseated. */
  claims: Record<string, number>;
}

export interface SeatRecord { id: string; name: string; base: Record<string, number>; }

/** One line of a muster roll: a named unit type and how many men of it. */
export interface RollEntry { unitTypeId: string; men: Men; garrisonHeld: Men; }
```

### The guards the compiler holds

```ts
type Assert<T extends true> = T;

/** A HOUSE STORES NO STANDING. Loyalty is a reading over the act list; the moment
 *  someone hangs a loyalty field on the record, two sources of truth exist and one
 *  of them starts lying. Add any of these keys and this line stops compiling. */
export type HOUSE_STORES_NO_STANDING = Assert<
  Extract<keyof HouseRecord, 'loyalty' | 'grievance' | 'standing' | 'willingness'> extends never
    ? true : false
>;

/** A HOST IS NEVER STORED. It is read fresh from the chronicle every time. If
 *  Chronicle ever grows a host key, someone has cached a reading, and the next bug
 *  is a host that disagrees with the records that made it. */
export type CHRONICLE_STORES_NO_HOST = Assert<
  Extract<keyof Chronicle, 'host' | 'hosts' | 'muster' | 'loyalties'> extends never
    ? true : false
>;
```

---

## 2. The readings

```ts
// ── Legibility first ───────────────────────────────────────────────────────

/** WHAT AN ACT WOULD COST, BEFORE YOU DO IT. The single function that makes "every
 *  choice is a trade with a named price" true rather than aspirational. Pure; a UI
 *  is expected to call it on hover. Day and coin costs per act kind, and which track
 *  each sits on, are in `K.court.actDays`. */
export function readPrice(c: Chronicle, proposed: Act, at: Stamp): Price;

export interface Price {
  days: number;
  track: 'crown' | string;
  crowns: Crowns;
  sacks: Sacks;
  /** The grudges this will create, named and weighted, BEFORE you commit. */
  grievances: { houseId: string; kind: string; weight: number; explains: string }[];
  favours:    { houseId: string; kind: string; weight: number; explains: string }[];
  /** What it does to the muster if you called the host tomorrow. The killer
   *  feature: "+36 men this season, −9 next year." */
  musterDelta: { men: Men; explains: string };
}

// ── The court ──────────────────────────────────────────────────────────────

export function readCalendar(c: Chronicle): Calendar;
export function readTracks(c: Chronicle, at: Stamp): Track[];
export function readHouse(c: Chronicle, houseId: string, at: Stamp): HouseReading;
export function readLoyalty(c: Chronicle, houseId: string, at: Stamp): Tally;
export function readGrievances(c: Chronicle, houseId: string, at: Stamp): Grievance[];
export function readFavours(c: Chronicle, houseId: string, at: Stamp): Favour[];
export function readClaim(c: Chronicle, houseId: string, seatId: string, at: Stamp): Tally;
export function readSeat(c: Chronicle, seatId: string, at: Stamp): SeatReading;
export function readCabals(c: Chronicle, at: Stamp): Cabal[];

/** The crown's own view: hidden terms omitted unless a Learn record covers them.
 *  readLoyalty is the truth; this is what the player is entitled to see. With a
 *  Spymaster seated the two converge. */
export function readAsCrown<T>(c: Chronicle, reading: T, at: Stamp): T;

// ── The land ───────────────────────────────────────────────────────────────

export function readHolding(c: Chronicle, holdingId: string, at: Stamp): HoldingReading;
/** The named units this holding can raise TODAY — after casualties, raids, garrison
 *  duty and regeneration. What a player reads off the map. */
export function readMusterRoll(c: Chronicle, holdingId: string, at: Stamp): RollEntry[];
export function readCoffer(c: Chronicle, at: Stamp): Tally;
export function readGranary(c: Chronicle, at: Stamp): Tally;

// ── The muster ─────────────────────────────────────────────────────────────

/** The vessel: what a house owes this year and how much has been drawn. */
export function readVessel(c: Chronicle, houseId: string, year: number): Vessel;

export interface Vessel {
  houseId: string;
  owedMen: Men;
  capacityDays: number;   // 40, from the enfeoffment
  drawnDays: number;
  daysLeft: number;
  beyond: number;         // summonses past the vessel this year — each a named price
}

/** ONE HOUSE'S ANSWER, FULLY ITEMISED. No dice: given the records, determined. */
export function readAnswer(c: Chronicle, campaignId: string, houseId: string, at: Stamp): AnswerReading;

export interface AnswerReading {
  houseId: string;
  willingness: Tally;      // the arithmetic, term by term (data/answers.json)
  answer: AnswerKind;
  owed: Men;
  sending: Men;
  /** Which units, worst-kept-LAST: a short answer sheds in DESCENDING order of
   *  quality, so "0.75" means the knights stayed home, not that everything shrank. */
  units: { unitId: string; sent: boolean; why: string }[];
  lateDays: number;
  captainId: string;       // may be a deputy, and a lesser man
  scutageOffered: Crowns | null;
}

export type AnswerKind =
  | 'more-than-owed' | 'in-full' | 'near-full' | 'short' | 'late-and-short'
  | 'deputy' | 'scutage' | 'token' | 'refusal' | 'turncoat';

/** "IF I CALLED THE HOST TODAY, WHAT WOULD STAND?" Free to look at, always current,
 *  and the screen the player lives on. One fused gauge with every absence named and
 *  every unspent lever priced. */
export function readForecast(
  c: Chronicle, at: Stamp, opts: { musteringPlaceId: string; defending: boolean },
): Forecast;

export interface Forecast {
  men: Men;
  byHouse: AnswerReading[];
  absent: Absence[];
  standsOn: Stamp;                          // earliest day a host of this size stands there
  levers: { act: Act; price: Price }[];     // the player's move list
}

/** THE HOST ITSELF. Reads the whole thing out of the records and hands it to the
 *  battle. Pure: same chronicle, same day → byte-identical host, every time. */
export function readHost(c: Chronicle, campaignId: string, at: Stamp): Host;

// ── The turn of the world ──────────────────────────────────────────────────

/** Advances the seeded world clock to `to`, returning the acts it appends —
 *  harvests, raids, deaths, births, petitions, the enemy's own movements. The ONLY
 *  dice in this layer, and they never touch the muster arithmetic directly; they
 *  only write records the arithmetic then reads. */
export function turnTheWorld(c: Chronicle, to: Stamp): Act[];
```

### Supporting reading shapes

```ts
export interface Grievance {
  actId: string;           // the record that caused it
  kind: string;            // a row in data/grievances.json
  houseId: string;
  weight: number;          // after cooling (20% off after ten years) and inheritance (heirs take half)
  raw: number;
  since: Stamp;
  settledBy: string[];     // Amends act ids that have chipped at it
  explains: string;
  /** False until a Learn record covers it. The crown's readings omit unknown
   *  grievances; the truth includes them. */
  known: boolean;
}

export interface Favour {
  actId: string;
  kind: string;            // a row in data/favours.json
  houseId: string;
  standing: number;        // the part that does not fade while the thing is still true
  fading: number;          // the decayed remainder (half-life per kind)
  halfLifeYears: number;
  explains: string;
}

export interface Cabal { houseIds: string[]; since: Stamp; binding: Score; known: boolean; }

export interface HouseReading {
  house: HouseRecord;
  loyalty: Tally;          // 50 + favours (decayed) + kinship − grievances, clamped 0..100
  grievances: Grievance[];
  favours: Favour[];
  vessel: Vessel;
  holdings: HoldingReading[];
  marchable: Men;
  band: string;            // Devoted | True | Dutiful | Cool | Sullen | Estranged | Defiant
}

export interface SeatReading {
  seat: SeatRecord;
  holderCaptainId: string | null;
  since: Stamp | null;
  /** base × (competence/100) × (0.5 + loyalty/200); 0.5 × base when vacant. A seat
   *  is never worse than empty, only wasted. */
  effect: Tally;
  tenure: 'granted' | 'customary' | 'hereditary' | 'vacant';  // 8 years; 16 years
  revocationGrievance: number;
  claimants: { captainId: string; claim: number; grievance: number }[];
}

export interface HoldingReading {
  holding: HoldingRecord;
  state: 'held' | 'wardship' | 'vacant' | 'contested';   // read, never stored
  houseId: string | null;
  coinPerSeason: Tally;
  grainPerSeason: Tally;
  roll: RollEntry[];
  marchDays: Record<string, number>;
  ravagedUntil: Stamp | null;
}

export interface Calendar {
  now: Stamp;
  /** Deadlines the player can see: enemy muster days, ransom clocks, reward clocks,
   *  charter riot windows, the turn of the year. */
  deadlines: { id: string; at: Stamp; daysLeft: number; explains: string }[];
}

export interface Track {
  id: 'crown' | string;
  name: string;
  holderCaptainId: string | null;   // null = a track you do not have
  occupied: { actId: string; until: Stamp }[];
  freeOn: Stamp;
}
```

---

## 3. The muster arithmetic

The exact pipeline `readAnswer` and `readHost` implement. Every constant lives in
`data/constants.json → court` and every table in `data/answers.json`.

1. **Willingness** per house = a Tally of: loyalty (itself a Tally) · the cause
   (`(legitimacy − 50) × 0.4`, ±20) · defending home (+25 within 20 leagues, +12
   within 50) · heir-is-ward (+20) · Chancellor's summons (+8) · kinship · a dry
   vessel (−15/−25/−35) · the season (0 / −8 / −15 / −20) · faction fellows already
   refusing (−5 each) · war weariness (−3 per battle in two years, cap −12) ·
   mercenaries preferred (−4 per campaign left out, cap −16) · distant muster (−5
   beyond 60 leagues).
2. **Answer**: the willingness thresholds in `data/answers.json` pick one of the nine
   answers (more-than-owed 95 … turncoat below 3), giving a fraction, late days, and
   sometimes a deputy or coin.
3. **Which men**: `sends = min(owed × fraction, marchable)`. Willing houses (in-full
   or better) fill the quota from their BEST units downward; unwilling ones from the
   CHEAPEST upward, so "0.75" means the knights stayed home. Garrison-held men
   (`data/holdings.json`, reduced 25% by a Constable) never march.
4. **Distance**: `letterDays = leagues / courierRate` (25/day, faster with a
   Chancellor) + `gatherDays` (3–10 by holding) + `marchDays = leagues / (8 or 12) /
   roadFactor / seasonSpeed`. March becomes fatigue at `dailyWear × season wear`,
   less `restRecoveryPerDay` for days in camp. A house later than the stand-by day
   becomes a **latecomer** with `lateDays` and `entersAtFraction`.
5. **The four political numbers**, folded per contingent and inherited per unit
   (formulas in `K.court.resolveFormula / obedienceFormula / treacheryFormula`):
   - `resolve` = 20 + 0.5·loyalty + 0.2·(legitimacy − 50) + 15 if defending home
     + 0.1·veterancy − 0.3·hunger − 0.15·grievance − 25 if an unpaid mercenary.
   - `obedience` = 25 + 0.35·loyalty + 0.35·commanderAuthority + 10 if the captain is
     of the commander's house − 0.3·grievance − 0.1·pride − 20 if the captain is the
     commander's rival. (The Sworn Order clamps to 55, whatever the sum.)
   - `treachery` = max(0, (grievance − 40) × 1.5) + 12 per unpaid season + 10 for
     kinship across the line − 30 if the heir is the crown's ward − 0.2·loyalty.
     At 60+ the contingent also carries the `may-turn` quirk.
   - `fatigue`/`hunger` from the roads and the granary, as above.
6. **Command**: `orderCapacity` = 2 if the Marshalcy is vacant, else 4 + 1 per 25
   competence above 50; `authority` = 40 + 40 × the Marshal's effect + standing/5,
   +10 if the commander is the crown's blood. The battle turns `orderCapacity` into
   couriers and plan slots (`docs/WRIT-THE-BATTLE.md` §2.3) — this is the court's most
   direct hand on the battle's controls.
7. **Supply**: `provisionDays = sacks / (men/100)`, drained faster where forage is
   poor. A host with two days of food cannot besiege, cannot wait for latecomers, and
   cannot refuse a battle.
8. **Absences**: every called house, company, town or order that did not stand is an
   `Absence` — named, with its answer, the numbers owed and sent, the plain reason,
   and the grievance records that caused it. An absence is a FINDING, never a
   silently smaller number; it is never swallowed, never dropped, never counted as
   zero. Half the emotional payload of a muster is in this list.

---

## 4. The Host — what the court hands the battle

```ts
/** The shape of the whole contract:
 *    runBattle(a: Host, b: Host, ground: Ground, seed: string) => { a: Aftermath; b: Aftermath }
 *  A Host describes exactly ONE side and says nothing about the other. The court
 *  builds the enemy's host through the same function, so the battle never needs two
 *  shapes and never needs to know which side is the player's. */
export interface Host {
  contract: ContractVersion;
  id: string;
  name: string;            // as a herald would cry it: "the Host of Aldmarch"
  side: string;            // two hosts with the same side are allies
  /** The RNG seed for everything the battle rolls. Same hosts + ground + seed MUST
   *  produce the same battle. Derived deterministically from the act log. */
  seed: string;
  /** When this host was read out of the records. A host is a READING, not a stored
   *  object — read it a day later and it differs. */
  mustered: Stamp;

  occasion: Occasion;
  command: Command;
  contingents: Contingent[];  // politics attaches HERE; units inherit
  units: Unit[];              // flat, so an engine iterates without walking a tree
  captains: Captain[];        // everyone named above, including the commander
  supply: Supply;
  latecomers: Latecomer[];
  /** WHO DID NOT COME, AND WHY. Never a silently smaller number. */
  absent: Absence[];
  standing: HostStanding;
  notes: string[];            // free text for a report; never parsed
}

export interface Occasion {
  causeId: string;
  causeName: string;
  /** Defending ground this host holds. Already folded into every resolve below —
   *  the battle must NOT apply it again; it is given for the battle's own reasons
   *  (deployment, victory conditions, flavour). */
  defending: boolean;
  /** The fighting is on land these men are FROM (not the same as defending). */
  onOwnLand: boolean;
  homeHoldingIds: string[];   // units whose home is here fight for their own roofs
  legitimacy: Score;          // already inside resolve; given for flavour
  /** 0..1. How little the enemy expected this. A winter march buys up to 0.5.
   *  The battle owns what surprise DOES; the court only says how much there is. */
  surprise: Fraction;
  daysInTheField: number;
}

export interface Command {
  /** The captain commanding. Never the player: THERE IS NO PLAYER CHARACTER. If the
   *  Marshalcy is vacant this is whoever the crown named for the campaign — a naming
   *  that was itself a slight, already in the numbers below. */
  commanderId: string;
  /** How far the host defers to him. Already inside each unit's obedience; given
   *  separately for host-wide effects (rally range, relay speed). */
  authority: Score;
  /** HOW MANY CONTINGENTS CAN BE GIVEN A TACTIC AT ONE TIME.
   *  The court's most direct hand on the battle's controls: vacant Marshalcy 2, a
   *  good Marshal 4, a great one 6. The canonical battle engine spends it as courier
   *  count and standing-plan slots; an engine with no such notions may ignore it. */
  orderCapacity: number;
  /** Who defers to whom. Engines that model sub-commands may use it; others ignore. */
  chain: { captainId: string; defersTo: string | null }[];
  /** Two captains who will not cooperate, and how badly. An engine may express this
   *  as refused support, a morale gap when adjacent, or not at all. */
  disputes: { aId: string; bId: string; over: 'precedence' | 'the-van' | 'plunder' | 'blood';
              intensity: Score; explains: string }[];
  /** Promised the place of honour. If the battle does not put him in the van, report
   *  it in Aftermath.honours and the court will record the slight honestly. */
  vanPromisedTo: string | null;
}

export type ContingentSource =
  | 'feudal-levy' | 'household' | 'mercenary' | 'town-militia' | 'sworn-order' | 'allied';

export type Disposition = 'eager' | 'willing' | 'dutiful' | 'sullen' | 'mutinous';

export interface Contingent {
  id: string;
  name: string;               // "the men of Thornbury", "the Company of the Long Road"
  source: ContingentSource;
  houseId?: string;
  houseName?: string;
  captainId: string;
  unitIds: string[];

  /** WILLINGNESS TO DIE FOR YOU. The most political number in the contract. The
   *  battle turns it into whatever morale model it has. */
  resolve: Score;
  /** WILL THEY CARRY OUT A TACTIC YOU ISSUE. Where an ungranted seat and an unpaid
   *  wergild become something the player feels in their hands mid-fight. The
   *  canonical engine feeds it into the heed score. */
  obedience: Score;
  /** PROPENSITY TO TURN. Above 60 likely, never certain; the battle decides when and
   *  how. The court guarantees the player COULD have read this before summoning
   *  (with a Spymaster) — so a defection is never unfair. */
  treachery: Score;
  /** How well these men hold together — same district, same lord, years of service.
   *  Low cohesion breaks in pieces; high cohesion breaks all at once. */
  cohesion: Score;
  /** Men of one fellowship are neighbours in life. The battle may reward adjacency,
   *  or ignore it. */
  fellowship: string;

  paid: boolean;              // mercenaries only:
  arrears: Crowns;            // each unpaid season adds 12 treachery, −8 resolve

  owed: Men;                  // 0 for sources that owe nothing
  present: Men;               // the gap between these two is this contingent's story
  disposition: Disposition;
  quirks: Quirk[];
  story: string;              // one sentence a herald could say
}

export type TroopKind = 'foot' | 'horse' | 'shot' | 'engine';
export type ReachBand = 'melee' | 'missile' | 'both';
export type WeightBand = 'light' | 'medium' | 'heavy';

export interface Unit {
  id: string;
  /** ALWAYS NAMED FOR ITS HOME: "the Spears of Millrow". Not decoration — it is how
   *  a player knows that losing a holding lost this exact wing. */
  name: string;
  story: string;
  contingentId: string;
  /** THE LAND THIS UNIT IS OF. Lose the holding and this named wing stops existing
   *  at the next muster. */
  homeHoldingId: string;
  homeHoldingName: string;
  typeId: string;             // a row in data/units.json — the battle reads its full
                              // physical sheet there (weapons, mass, refusal, traits)
  kind: TroopKind;            // coarse vocabulary so ANY engine can map it
  reach: ReachBand;
  weight: WeightBand;

  paperStrength: Men;         // owed on paper vs marched: visible failure, show it
  strength: Men;

  drill: Score;               // authoritative over the type sheet's baseline
  veterancy: Score;           // caps at 80
  equipment: Score;
  armour: Score;              // authoritative over the type sheet's baseline

  fatigue: Score;             // ON ARRIVAL — what the roads did; the court's fault
  hunger: Score;              // 0 well fed; climbs 8 a day once the granary is empty

  resolve: Score;             // inherited from the contingent, then adjusted per unit
  obedience: Score;
  treachery: Score;

  fellowship: string;
  marchSpeed: Leagues;        // an honest relative ordering an engine may reuse
  quirks: Quirk[];
}

export interface Captain {
  id: string;
  name: string;
  houseId?: string;
  houseName?: string;
  seatId: string | null;      // a seated man expects the place of honour

  // Competence
  command: Score;             // how well he handles men; feeds authority and heed
  valour: Score;              // personal courage; rally, presence, capture resistance
  wits: Score;                // cunning; ambush plans, reading ground, extra plan slot at 70+

  // Temper — what he does when nobody is telling him anything. These four make an
  // unattended battle read like a story.
  aggression: Score;          // advances, counter-charges, overreaches
  caution: Score;             // withdraws to save his men; hedges
  pride: Score;               // how badly he takes an insult; claims the van
  greed: Score;               // breaks off to plunder; ignores the rein

  // Politics — READINGS from the act log at the moment of muster. The battle uses
  // them; it never computes them.
  loyalty: Score;
  grievance: Score;
  standing: Score;            // how loudly his death, glory or disgrace echoes at court

  rivals: { captainId: string; intensity: Score }[];
  kin: { captainId: string; degree: 'blood' | 'marriage' | 'ward' }[];
  wounded: boolean;
  age: number;
  record: { battlesFought: number; battlesWon: number; timesDistinguished: number; timesFled: number };
  quirks: Quirk[];
}

export interface Supply {
  /** Days the host can stand before hunger begins: sacks / (men/100). THE GRANARY IS
   *  A WAR MECHANIC: two provision days means no siege, no waiting, no refusing
   *  battle. */
  provisionDays: number;
  sacks: Sacks;
  forage: Fraction;           // what the land gives back: 1.2 harvest, 0.4 winter
  baggageCarts: number;       // an engine may model the train as a capturable prize
  physicians: number;         // tilts dead toward wounded; the battle decides
  payArrears: Crowns;         // already inside mercenary treachery; given to narrate
}

export interface Latecomer {
  unitIds: string[];
  contingentId: string;
  lateDays: number;           // the court's truth
  /** A battle-relative hint: 0 = present from the first minute, 1 = after everything
   *  is decided. CONTRACT: an engine with no reinforcement concept SHOULD treat any
   *  value above 0 as absent and report those units present:false,
   *  didNotEngage:true. Legal, expected, handled. */
  entersAtFraction: Fraction;
  explains: string;
}

export interface Absence {
  whoId: string;
  whoName: string;
  kind: 'house' | 'company' | 'town' | 'order';
  answer: AnswerKind;
  owed: Men;
  sent: Men;
  reason: string;             // short: "Refused the summons."
  explains: string;           // the twelve-year-old's version, naming the cause
  /** The grievance records behind it — clickable, revocable: the direct road from a
   *  missing wing to the decision that lost it. */
  grievanceActIds: string[];
}

export interface HostStanding {
  legitimacy: Score;          // already inside resolve; repeated for narration
  momentum: number;           // −3..+3, recent victories and defeats
  belief: Score;              // does this host think it will win?
}

/** The battle owns terrain entirely. This is only what the court knows about where
 *  the fight is. The battle generates its real field from this plus the seed. */
export interface Ground {
  id: string;
  name: string;
  holdingId: string | null;   // whose land, if anyone's — decides onOwnLand
  season: SeasonId;
  features: string[];         // coarse hints: 'ford' | 'wood' | 'ridge' | 'marsh' | 'road' | 'mud'
}
```

---

## 5. The Aftermath — what the battle hands back

```ts
/** Everything here becomes records in the chronicle; nothing about it is stored as
 *  state. Rule for the battle engine: fill what your model knows. Optional fields
 *  may be null or omitted and the court computes a defensible substitute. Required:
 *  units, captains, contingents, outcome, heldTheField. */
export interface Aftermath {
  contract: ContractVersion;
  hostId: string;
  battleId: string;
  at: Stamp;

  outcome: 'victory' | 'costly-victory' | 'draw' | 'defeat' | 'rout';
  /** Who was left standing on the ground. This, not outcome, decides who takes the
   *  wounded, the baggage and the captives. */
  heldTheField: boolean;
  hours: number;

  units: UnitFate[];
  captains: CaptainFate[];
  contingents: ContingentFate[];
  spoils: Spoils;
  ground: GroundResult;

  /** Named moments — the chronicle's memory. These become the lines a player reads
   *  three years later when deciding whether to trust a man. Emit generously. */
  deeds: Deed[];

  /** If the battle names fault, the court uses its judgement; if null, the court
   *  computes blame from conduct and casualties. Neither side is forced to care
   *  about the other's model. */
  blame?: { captainId: string; share: Fraction; reason: string }[] | null;
  glory?: { captainId: string; share: Fraction; reason: string }[] | null;

  /** Which promised honours were kept — so the court records slights honestly
   *  instead of guessing. */
  honours?: { captainId: string; promised: string; kept: boolean }[];

  /** Which quirks the engine actually implemented this battle — so the court
   *  narrates causes it knows were real, and dead-weight vocabulary is visible. */
  quirksHonoured?: string[];
  notes: string[];
}

export interface UnitFate {
  unitId: string;
  present: boolean;           // false: a latecomer the engine chose not to model
  didNotEngage?: boolean;
  /** These five MUST sum to the unit's strength at muster. The court asserts it; a
   *  mismatch is a contract violation, logged loudly, never silently reconciled. */
  dead: Men;
  wounded: Men;
  captured: Men;
  deserted: Men;
  survived: Men;
  brokeAt: Fraction | null;   // 0..1 through the battle; null if it never broke
  defected: boolean;
  /** The receipt for the political layer's work: a player who granted the Marshalcy
   *  can see it in this ratio. */
  ordersGiven: number;
  ordersObeyed: number;
  veterancyGained: number;    // 0..40; the court adds it, capped at 80
}

export interface CaptainFate {
  captainId: string;
  fate: 'unhurt' | 'wounded' | 'maimed' | 'captured' | 'slain';
  /** The word the court will use about him for the next ten years. */
  conduct: 'distinguished' | 'steady' | 'faltered' | 'fled' | 'defected' | 'did-not-engage';
  ordersGiven: number;
  ordersObeyed: number;
  menLost: Men;               // feeds blood-debt against his house
  deedIds: string[];
}

export interface ContingentFate {
  contingentId: string;
  /** Losses as a share of the men who stood. The court compares this to the
   *  host-wide share: blood-debt is about UNFAIR losses, not losses. */
  lossShare: Fraction;
  defected: boolean;
  plunderSeized: Crowns;      // what greed took before anything was shared out
}

export interface Spoils {
  plunder: Crowns;
  banners: { name: string; takenByCaptainId: string | null }[];
  captives: Captive[];        // ours to ransom — each a ransom clock
  ourPeopleTaken: Captive[];  // each an unransomed grievance ticking at 3 a season
  baggageLost: boolean;
}

export interface Captive { captainId: string; name: string; houseId?: string; ransom: Crowns; }

export interface GroundResult {
  holdingIdsHeld: string[];
  holdingIdsLost: string[];
  ravaged: string[];          // burnt or stripped: half yield for a year
  advanceStopped: boolean;    // some defeats do the job
}

export interface Deed {
  id: string;
  kind: string;               // 'held-the-ford' | 'abandoned' | 'turned-cloak' | ...
  captainId?: string;
  unitId?: string;
  atFraction: Fraction;
  tale: string;               // one sentence, past tense, for the chronicle
}
```

### How the Aftermath becomes the next muster

```ts
/** THE HINGE OF THE WHOLE GAME. Turns a battle report into acts on the chronicle,
 *  which the next muster reads. Pure: same aftermath, same acts. It emits, in order:
 *
 *   1. Casualty per unit — the men leave that holding's roll and regenerate at
 *      +6/year, ADDITIVE, so a small holding is not also a slow one.
 *   2. BloodDebt per contingent whose lossShare exceeded the host's by more than 10
 *      points — 1 grievance per 5 points of excess, cap 25. EXCESS, not loss: a
 *      house that bled with everyone else has no claim.
 *   3. Distinguished / Disgraced per captain from conduct. Distinguished starts a
 *      one-year clock: reward him inside it or 'unrewarded' (10) lands automatically.
 *   4. Slain → succession: the heir takes the holding at half the father's loyalty,
 *      inherits half his grievance, and gains a fresh 'avenge' grievance if the
 *      death reads as avoidable.
 *   5. Captured → a ransom clock. Paying is coin plus +18 loyalty; not paying is
 *      'unransomed', +3 a season, cap 30. Four years is a house lost.
 *   6. Defected → the house is at war with you; its holdings stop yielding; its
 *      roads close (+4 days for every house beyond it).
 *   7. Plunder, ransoms held, holdings lost or ravaged, banners taken.
 *   8. Legitimacy: victory +8, rout −12, a war concluded without battle −4.
 *   9. GloryHunger: after a victory the host expects another war within the year; an
 *      idle Highsun costs the crown 4 standing.
 *
 *  Everything above is a RECORD. Strike any of them and the next muster's arithmetic
 *  changes accordingly — which is what makes this a chronicle, not a save file. */
export function absorb(chronicle: Chronicle, aftermath: Aftermath): Act[];
```

---

## 6. Worked example (compressed)

The realm of **Aldmarch**: six houses owing 445 men, two of seven seats filled, the
enemy at a ford in 41 days. The forecast with nothing done: 393 vassals stand (the
richest house comes short by 22 because its lady was passed over for the Stewardship
— her marines stay at the quay; the frontier house sends 10 of 50 riders because no
Constable relieves its walls; the Sworn Order's 60 sit in their abbey because no
Chaplain blessed the cause), plus 150 household and 130 town militia: **673 men,
order capacity 2.** Three legible plays: grant the Marshalcy (+2 order slots, one
house up, its rival down — net −3 men, +2 slots); pay a 200-crown wergild (+13 men);
charter a town (+130 poor spears, a fifth of its tax forever). Do all three and the
host is 813 with 4 slots — and one new grudge with a long memory, which is next
year's problem, dated. Every number above falls out of `data/constants.json`,
`data/answers.json` and the records; none of it is rolled.
