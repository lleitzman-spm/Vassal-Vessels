// The Codex's shared hands — everything the compile, lint and query verbs need in
// common (see `docs/WRIT-THE-CODEX.md`, the ratified writ this tool answers to).
//
// WHY THIS EXISTS
// This tool is ported from LandLord's Great Book (`tools/vault/` in the sibling
// `ll-public` repo) and adapted from a property-management application to a game
// manual. The problem it solves is the same one in both places: a rulebook that is
// real but scattered — the constitution in `KINGDOM.md`, the implementable spec in
// two `WRIT-*.md` files, the actual numbers in `data/*.json`, and (once the engine
// exists) the truth in the TypeScript and the invariants only in the tests. This
// file builds the one graph the compiler, the linter and the tracer all read, so the
// three verbs can never disagree about what the Codex contains.
//
// WHAT CHANGED IN THE PORT — the mining layer, because the domain is a game, not an
// application. LandLord hand-mined a `knowledge/` directory of laws, facts, decisions
// and entities, each carrying its own declared standing and a hand-picked quote.
// Vassal Vessels has no such directory — the numbers ARE the game (KINGDOM.md law 6:
// "a number that is not in `data/` does not exist"), so this tool mines `data/*.json`
// DIRECTLY. Every object in there already carries an `explains` field written for a
// smart twelve-year-old (see `docs/KINGDOM.md` law 6), and that field becomes both the
// page's lead prose AND the quote the lint verb re-checks against the file on disk —
// the same "no quote, no object" discipline, aimed at a different kind of source.
//
// WHAT DID NOT CHANGE — the load-bearing properties of the pattern itself:
//   1. LINKS ARE FOUND, NEVER INVENTED. An edge exists only where a LITERAL identifier
//      matched — an id, a file path, an exported symbol, a declared reference field
//      (a unit's `traits: ["CanBrace"]` is exactly this: a literal id, not a guess).
//      Where a source states a kinship only in prose, there is no edge.
//   2. A test-file import is a SHARED-SOURCE COINCIDENCE, not a semantic claim (once
//      `test/` exists — it does not yet). Every such page says so on its face.
//   3. Ancestry inside a test is read by INDENTATION, not by parsing TypeScript.
//   4. Exported symbols are found by regex over `export …`. It errs toward missing an
//      edge, never toward inventing one.
//   5. A DEFAULTED standing is not a declared one, and the map counts every one.
//
// WHAT IS HONESTLY ABSENT, ON PURPOSE — this repo has no `knowledge/artifacts.json`
// equivalent (a two-axis manifest declaring every root path's kind and standing), and
// building one would mean writing into `data/` or `docs/`, which this tool does not
// own (see `docs/WRIT-THE-CODEX.md`). So there is no "undeclared path" lint check here
// — standing instead comes from three honest places: the constitution (`rule` nodes,
// always `canon`), the tree (`module`/`invariant` nodes, always `built` because their
// own existence IS the proof), and a data-backed upgrade pass (a game-data node starts
// `proposed` and is promoted to `built` only once a real module or test in the tree
// cites it — see `upgradeBuiltStanding` below). Nothing is ever hand-declared `built`.
//
// Pure Node — `node:fs`, `node:path` only. No install, ever.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CODEX = path.join(REPO, 'codex');
export const DATA_DIR = path.join(REPO, 'data');
export const GENERATOR = 'tools/codex/emit.mjs';

/** A label shorter than this is never matched literally inside a document. Game term
 *  names run shorter than the legal-document law titles the source tool was tuned for
 *  ("Shock", "Evade", "Close Order"), so the floor is lower here — but low enough that
 *  matching still means something: below this, a word is ordinary English, not a term. */
export const LABEL_MIN = 6;
/** An exported symbol shorter than this is not hunted in prose (`id`, `at`, `now`). */
export const SYMBOL_MIN = 6;

/** A symbol is only hunted in prose when its SHAPE marks it as an identifier: an inner
 *  capital (`orderCapacity`), an underscore, or sheer length. Without this, ordinary
 *  short lowercase words would tie every document to everything and mean nothing.
 *  HONEST LIMIT: a single-word lowercase export can therefore never be found in prose. */
export function isIdentifierShaped(s) {
  if (s.length < SYMBOL_MIN) return false;
  if (s.includes('_') || s.includes('$')) return true;
  if (/^[a-z]+[A-Z]/.test(s)) return true; // camelCase
  if (/^[A-Z][a-z]+[A-Z]/.test(s)) return true; // PascalCase, two words up
  return s.length >= 12;
}

/** The kinds of page the Codex holds, and the shelf each one stands on. The primary
 *  spine is the game's own vocabulary; `module`/`invariant`/`writ` remain as the
 *  source-derivation half — the road from a rule in the manual back to the code that
 *  enforces it, once that code exists.
 *
 *  KEY ORDER HERE IS THE READING ORDER. `emit.mjs`'s "Every shelf" listing and
 *  `html.mjs`'s front-page spine both walk this object in this sequence, so it is not
 *  cosmetic: the constitution, then one worked example to anchor it, then what fights
 *  (units and what beats what), then how you command it (orders, plans, the captains
 *  who carry them out), then the court that produced the army in the first place,
 *  then the numbers as reference, then build status, then the engine. A twelve-year-
 *  old reading cover to cover meets ideas in the order they need each other. */
export const TYPE_DIRS = {
  rule: 'rules',
  writ: 'writs',
  example: 'examples',
  unit: 'units',
  keyword: 'keywords',
  equipment: 'equipment',
  formation: 'formations',
  order: 'orders',
  'standing-plan': 'standing-plans',
  trait: 'traits',
  quirk: 'quirks',
  terrain: 'terrain',
  seat: 'seats',
  obligation: 'obligations',
  holding: 'holdings',
  grievance: 'grievances',
  favour: 'favours',
  answer: 'answers',
  'troop-source': 'troop-sources',
  season: 'seasons',
  // ── the operational graph ────────────────────────────────────────────────
  // Deliberately placed AFTER the entity shelves and BEFORE the numbers: a reader
  // needs the game's vocabulary before the machines that run on it will mean
  // anything, and the machines are what make the numbers matter.
  flow: 'flows',
  place: 'places',
  transition: 'transitions',
  guard: 'guards',
  token: 'tokens',
  constant: 'constants',
  module: 'modules',
  invariant: 'invariants',
  map: 'maps',
};

export const STANDINGS = ['canon', 'built', 'proposed', 'contested', 'retired', 'settled'];

/** What each standing MEANS, rendered on the face of every page. A `proposed` design
 *  sitting next to a `built` one in plain prose, dressed alike, is the exact failure
 *  this axis exists to prevent — see `docs/WRIT-THE-CODEX.md`. */
export const STANDING_BANNER = {
  canon: 'Ratified in the constitution. Wins until amended; changing it is an amendment, not an edit.',
  built: 'Implemented in code and checkable against the tree — a module or a test stands under it.',
  proposed:
    'NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.',
  contested: 'Two designs disagreed and no decision has been made. Do not act on it as settled.',
  retired: 'Superseded. Kept for history, never cited as current.',
  settled: 'Decided and closed — not open, not a finding. Do not raise it as a question.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Small hands — the file drudgery
// ─────────────────────────────────────────────────────────────────────────────

export function readText(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

export function readJson(abs) {
  const raw = readText(abs);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return { __parseError: String(err && err.message ? err.message : err) };
  }
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-operator', 'dist-ssr']);

/** Every file under `dir`, repo-relative, sorted, with the noisy places skipped. A
 *  missing directory is not an error — it returns empty, which is how `src/` and
 *  `test/` are tolerated before another hand has written a line into either. */
export function walkFiles(dir, { ext = null } = {}) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const here = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(here, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(here, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) stack.push(abs);
      } else if (e.isFile()) {
        if (ext && !ext.some((x) => e.name.endsWith(x))) continue;
        out.push(path.relative(REPO, abs));
      }
    }
  }
  return out.sort();
}

/** Whitespace-normalised, for the quote check — markdown wraps and JSON pretty-prints
 *  onto multiple lines, and a wrapped quote is still the same words in the same order.
 *  Nothing else is normalised: a quote is verbatim or it is a hallucination with a
 *  schema. */
export function normalizeWs(s) {
  return String(s == null ? '' : s)
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(s, max = 80) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/g, '') || 'page'
  );
}

export function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip line and block comments and string bodies, so a scanner sees CODE only.
 *  Lengths are preserved (everything becomes spaces) so line/column stay true. */
export function stripCommentsAndStrings(src) {
  const out = src.split('');
  let i = 0;
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      blank(i, j);
      i = j;
    } else if (c === '/' && n === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j === -1 ? src.length : j + 2;
      blank(i, j);
      i = j;
    } else if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') j += 2;
        else if (src[j] === c) break;
        else j++;
      }
      blank(i + 1, Math.min(j, src.length));
      i = Math.min(j + 1, src.length);
    } else {
      i++;
    }
  }
  return out.join('');
}

export function lineOf(src, index) {
  let n = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') n++;
  return n;
}
export const lineNumberOf = lineOf;

/** id is always `<type>:<slug>`. Edges carry a REASON so a page can say why the road
 *  exists, and a reader can judge it. */
export function makeNode(fields) {
  return {
    id: fields.id,
    type: fields.type,
    label: fields.label ?? fields.id,
    standing: STANDINGS.includes(fields.standing) ? fields.standing : 'proposed',
    standing_source: fields.standing_source ?? 'defaulted',
    summary: fields.summary ?? '',
    body: fields.body ?? '',
    source_path: fields.source_path ?? '',
    source_line: fields.source_line ?? null,
    quote: fields.quote ?? '',
    tags: fields.tags ?? [],
    edges: fields.edges ?? [], // [{ to, why, kind }]
    extra: fields.extra ?? {}, // type-specific detail, rendered on the page
    origin: fields.origin ?? 'derived', // 'mined' (data/docs) | 'derived' (the src/test tree)
  };
}

function addEdge(node, to, why, kind = 'idea') {
  if (!to || to === node.id) return;
  if (node.edges.some((e) => e.to === to && e.why === why)) return;
  node.edges.push({ to, why, kind });
}

// ─────────────────────────────────────────────────────────────────────────────
// The game-data half — data/*.json, mined directly (see the file header)
// ─────────────────────────────────────────────────────────────────────────────

/** Every data file this tool knows how to read as a plain SHELF OF ITEMS, and the node
 *  TYPE each mines into. This is not the only way a file is read — `constants.json` is
 *  a deep tree, mined by `constantNodes` below; `captains.json` holds its seven trait
 *  axes nested inside `axes.competence`/`axes.temper`, mined by `captainTraitNodes`;
 *  and `example-host.json` is one worked artefact, mined whole by `exampleHostNode`.
 *  Those three are named in `KNOWN_DATA_FILES` alongside this list, below, so the
 *  coverage audit knows about every file that IS read, however it is read.
 *
 *  A file not yet on disk is tolerated exactly like an absent `src/`: reported as a
 *  gap, never invented. As soon as a file lands (in the established `{ $schema,
 *  explains, fields, <list>: […] }` shape every present file already uses), the next
 *  compile picks it up with no code change here. */
export const DATA_SOURCES = [
  { file: 'units.json', type: 'unit' },
  { file: 'keywords.json', type: 'keyword' },
  { file: 'equipment.json', type: 'equipment' },
  { file: 'formations.json', type: 'formation' },
  { file: 'orders.json', type: 'order' },
  { file: 'standing-plans.json', type: 'standing-plan' },
  { file: 'terrain.json', type: 'terrain' },
  { file: 'quirks.json', type: 'quirk' },
  { file: 'seats.json', type: 'seat' },
  { file: 'obligations.json', type: 'obligation' },
  { file: 'holdings.json', type: 'holding' },
  { file: 'grievances.json', type: 'grievance' },
  { file: 'favours.json', type: 'favour' },
  { file: 'answers.json', type: 'answer' },
  { file: 'troop-sources.json', type: 'troop-source' },
  { file: 'seasons.json', type: 'season' },
  // The operational graph. Same generic shelf-of-items miner as everything above —
  // these are not a special case, they are simply the game's VERBS rather than its
  // nouns, and they earn their honesty from `REF_FIELDS` below plus the closure
  // checks in `lint.mjs`.
  { file: 'flows.json', type: 'flow' },
  { file: 'places.json', type: 'place' },
  { file: 'transitions.json', type: 'transition' },
  { file: 'guards.json', type: 'guard' },
  { file: 'tokens.json', type: 'token' },
];

/** Read by their OWN special-cased miners, not the generic shelf-of-items scan above
 *  — named here purely so the coverage audit (`unaccountedDataFiles`, in `buildGraph`)
 *  knows they are accounted for and does not cry gap on a file this tool reads a
 *  different way. */
const SPECIAL_CASE_DATA_FILES = ['constants.json', 'captains.json', 'example-host.json'];

/** A file present in `data/` that this tool deliberately does NOT turn into pages,
 *  with the reason on record — the alternative to silence. Empty today: every file
 *  present as of this writing is read by something. If a future file should be
 *  excluded on purpose (raw fixture data, a schema file, a generator's own scratch
 *  output), name it here with why, rather than letting the coverage audit flag it as
 *  an oversight forever. THIS IS THE ONLY LEGITIMATE WAY TO SILENCE THE AUDIT BELOW —
 *  editing `KNOWN_DATA_FILES` to just add a name with no reason defeats the point. */
export const DELIBERATELY_UNMINED_DATA = {
  // 'some-fixture.json': 'raw test fixture, not game content — never a page',
};

/** Fields on a mined item that get their own named treatment on the page rather than
 *  landing in the generic numbers table — see `renderDataExtra` in `emit.mjs`.
 *  `usedIn` is a captains.json-ism (a trait axis names where it matters instead of
 *  carrying a `rule` string) and reads the same way `rule` does. */
const SPECIAL_ITEM_FIELDS = new Set(['id', 'name', 'explains', 'readOnField', 'role', 'counteredBy', 'rule', 'usedIn']);

/** Fields whose VALUE is a literal id (or list of ids) of another mined item — the
 *  richest source of honest cross-links in the whole Codex, because a unit naming
 *  `"traits": ["CanBrace"]` is not prose that merely mentions bracing, it IS the
 *  reference. `category` is a HINT tried first when a target file has more than one
 *  shelf sharing a bare id (`"none"` means something different under `armour` than
 *  under `shields` — see `dataNodesFor`); the plain id is always tried as a fallback,
 *  and a value that resolves nowhere is dropped, never invented. Extend this table as
 *  new data files land with their own reference fields; an unlisted field is simply
 *  read as a plain value. */
const REF_FIELDS = {
  unit: {
    traits: { type: 'keyword' },
    primaryWeapon: { type: 'equipment', category: ['weapons', 'missileWeapons'] },
    sidearm: { type: 'equipment', category: 'weapons' },
    armour: { type: 'equipment', category: 'armour' },
    shield: { type: 'equipment', category: 'shields' },
    defaultFormation: { type: 'formation' },
    allowedFormations: { type: 'formation' },
    defaultQuirks: { type: 'quirk' },
  },

  // ── the operational graph's wiring ──────────────────────────────────────
  // This is the whole reason the operational graph can be trusted. A transition
  // does not DESCRIBE going from one state to another in prose — it names two
  // places by id, and if either id is not a real place the edge is never drawn and
  // `lint.mjs` fails the build. The machines are therefore found, never invented,
  // exactly like every other edge in the Codex.
  flow: { entry: { type: 'place' }, terminals: { type: 'place' } },
  place: { flow: { type: 'flow' } },
  transition: { flow: { type: 'flow' }, from: { type: 'place' }, to: { type: 'place' }, guards: { type: 'guard' } },
  // `cites` is the one reference field whose values are NOT bare ids: they are
  // dotted paths into `data/constants.json` (`battle.morale.breakThreshold`). The
  // `dotted` mode below drops the leaf and resolves the GROUP, because a constant
  // node is one page per group — see `constantNodes`. This is the edge that makes
  // the writ's claim literally true: the operational graph consumes the knowledge
  // graph, and here is the wire.
  guard: { flow: { type: 'flow' }, cites: { type: 'constant', dotted: true } },
  token: { flow: { type: 'flow' }, cites: { type: 'constant', dotted: true } },
};

/** Every array-of-objects property in a data document is a shelf of items — this is
 *  the one convention every present file already follows (`weapons`, `missileWeapons`,
 *  `armour` and `shields` all live side by side in `equipment.json`, for instance).
 *  `category` remembers which shelf an item came from, for the page and for grouping. */
function listItemsOf(doc) {
  const out = [];
  if (!doc || typeof doc !== 'object') return out;
  for (const [key, val] of Object.entries(doc)) {
    if (!Array.isArray(val)) continue;
    for (const item of val) if (item && typeof item === 'object') out.push({ item, category: key });
  }
  return out;
}

function itemExtra(item) {
  const stats = {};
  for (const [k, v] of Object.entries(item)) {
    if (SPECIAL_ITEM_FIELDS.has(k)) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) continue; // a nested shape, read honestly as absent rather than guessed at
    stats[k] = v;
  }
  return {
    stats,
    rule: typeof item.rule === 'string' ? item.rule : '',
    role: typeof item.role === 'string' ? item.role : '',
    counteredBy: typeof item.counteredBy === 'string' ? item.counteredBy : '',
    readOnField: typeof item.readOnField === 'string' ? item.readOnField : '',
    usedIn: typeof item.usedIn === 'string' ? item.usedIn : '',
  };
}

/** Best-effort line number for an item: find where its `"id"` (or `"name"`, for an
 *  item with no id) is written in the raw file. Not found is not fatal — the page just
 *  carries no line, same as any other honestly-missing coordinate. */
function findItemLine(raw, idRaw) {
  const needle = `"${String(idRaw).replace(/"/g, '\\"')}"`;
  const at = raw.indexOf(needle);
  return at === -1 ? null : lineOf(raw, at);
}

function dataNodesFor(source) {
  const abs = path.join(DATA_DIR, source.file);
  const rel = path.relative(REPO, abs);
  if (!fs.existsSync(abs)) return { nodes: [], present: false };
  const raw = readText(abs) || '';
  const doc = readJson(abs);
  if (!doc || doc.__parseError) return { nodes: [], present: true, broken: doc && doc.__parseError };

  const fields = doc.fields && typeof doc.fields === 'object' && !Array.isArray(doc.fields) ? doc.fields : null;
  const refFields = REF_FIELDS[source.type] || {};
  const items = listItemsOf(doc);
  // A file with more than one shelf (`equipment.json` holds weapons, missile weapons,
  // armour AND shields) may reuse the same bare id across shelves ON PURPOSE —
  // `"id": "none"` means something different under `armour` than under `shields`.
  // The category joins the id ONLY for a slug that actually collides, so the ordinary
  // single-shelf file (`units.json` and the like) keeps clean, short ids throughout.
  const bareSlugCategories = new Map();
  for (const { item, category } of items) {
    const idRaw = item.id ?? item.name;
    if (idRaw == null) continue;
    const slug = slugify(String(idRaw));
    if (!bareSlugCategories.has(slug)) bareSlugCategories.set(slug, new Set());
    bareSlugCategories.get(slug).add(category);
  }
  const nodes = [];
  for (const { item, category } of items) {
    const idRaw = item.id ?? item.name;
    if (idRaw == null) continue;
    const slug = slugify(String(idRaw));
    const colliding = bareSlugCategories.get(slug).size > 1;
    const id = colliding ? `${source.type}:${slugify(category)}-${slug}` : `${source.type}:${slug}`;
    const explains = typeof item.explains === 'string' ? item.explains : '';
    const refs = [];
    for (const [refKey, spec] of Object.entries(refFields)) {
      const v = item[refKey];
      const values = Array.isArray(v) ? v : v != null ? [v] : [];
      if (values.length) refs.push({ field: refKey, type: spec.type, category: spec.category, dotted: !!spec.dotted, values });
    }
    const node = makeNode({
      id,
      type: source.type,
      label: typeof item.name === 'string' ? item.name : String(idRaw),
      standing: 'proposed', // upgraded to 'built' post-stitch, only if the tree backs it
      standing_source: 'defaulted',
      summary: explains,
      source_path: rel,
      source_line: findItemLine(raw, idRaw),
      quote: explains,
      origin: 'mined',
      extra: { ...itemExtra(item), category, dataFields: fields, mined_from: rel, refs },
    });
    nodes.push(node);
  }
  return { nodes, present: true };
}

/** Resolve every stashed reference field (see `REF_FIELDS`) against the finished node
 *  set, once every data file has been mined and every id is known. A category hint is
 *  tried first (so a unit's `armour: "none"` reaches `equipment:armour-none`, not the
 *  shield of the same bare name); the plain id is always the fallback. A value that
 *  resolves nowhere is simply never wired — dropped, never invented, and left for the
 *  compiler's report to name as a stranger if something else already thought it real. */
function wireReferenceFields(nodes, byId) {
  for (const n of nodes) {
    for (const ref of n.extra && Array.isArray(n.extra.refs) ? n.extra.refs : []) {
      const cats = ref.category ? (Array.isArray(ref.category) ? ref.category : [ref.category]) : [];
      for (const rv of ref.values) {
        // A dotted path names a LEAF number; the page belongs to its group, so drop
        // the last segment. `battle.morale.breakThreshold` → `constant:battle-morale`.
        const raw = ref.dotted ? String(rv).split('.').slice(0, -1).join('.') : String(rv);
        const slug = slugify(raw);
        let target = null;
        for (const c of cats) {
          const cand = `${ref.type}:${slugify(c)}-${slug}`;
          if (byId.has(cand)) {
            target = cand;
            break;
          }
        }
        if (!target && byId.has(`${ref.type}:${slug}`)) target = `${ref.type}:${slug}`;
        if (target) addEdge(n, target, `its \`${ref.field}\` names \`${rv}\` by id`);
      }
    }
  }
}

// ── constants.json — one deep tree, not a list, so it is mined on its own terms ──

function prettifyKey(k) {
  return k
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** A `constant` node per GROUP (`battle.shock`, `court.resolveFormula`, …), not per
 *  leaf number — the group is where the design has something to SAY (`explains`, and
 *  often `chose` and a `worked` example); a bare number has nothing to say for itself.
 *  The HTML ledger (`html.mjs`) additionally flattens every leaf for a full listing. */
function constantNodes() {
  const abs = path.join(DATA_DIR, 'constants.json');
  const rel = path.relative(REPO, abs);
  if (!fs.existsSync(abs)) return { nodes: [], present: false };
  const raw = readText(abs) || '';
  const doc = readJson(abs);
  if (!doc || doc.__parseError) return { nodes: [], present: true, broken: doc && doc.__parseError };

  const nodes = [];
  for (const root of ['battle', 'court']) {
    const branch = doc[root];
    if (!branch || typeof branch !== 'object') continue;
    for (const [key, group] of Object.entries(branch)) {
      if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
      const groupPath = `${root}.${key}`;
      const numbers = [];
      let chose = '';
      let worked = null;
      for (const [k, v] of Object.entries(group)) {
        if (k === 'explains') continue;
        if (k === 'chose' && typeof v === 'string') {
          chose = v;
          continue;
        }
        if (k === 'worked' && v && typeof v === 'object' && !Array.isArray(v)) {
          worked = v;
          continue;
        }
        if (v !== null && typeof v === 'object') continue; // an unforeseen nested shape — read honestly as absent
        numbers.push({ key: k, value: v });
      }
      const at = raw.indexOf(`"${key}"`);
      const node = makeNode({
        id: `constant:${slugify(groupPath)}`,
        type: 'constant',
        label: `${root === 'battle' ? 'Battle' : 'Court'}: ${prettifyKey(key)}`,
        standing: 'proposed',
        standing_source: 'defaulted',
        summary: typeof group.explains === 'string' ? group.explains : '',
        source_path: rel,
        source_line: at === -1 ? null : lineOf(raw, at),
        quote: typeof group.explains === 'string' ? group.explains : '',
        origin: 'mined',
        // `K.<key>` and `K.<root>.<key>` are the two forms the writs actually cite
        // (`docs/WRIT-THE-BATTLE.md` drops the `battle.` root; `docs/WRIT-THE-COURT.md`
        // does not always). A plain substring match on either catches a deeper leaf
        // citation too (`K.cohesion.startBase` contains `K.cohesion`). The bare
        // `<root>.<key>` form (no `K.` prefix at all) is how `captains.json`'s `heed.k`
        // and several grievance/favour items' own `k` field cite a constant group —
        // dotted and camelCase enough that it is not ordinary prose, so it is safe to
        // hunt the same way.
        extra: { groupPath, root, key, numbers, chose, worked, kAliases: [`K.${key}`, `K.${root}.${key}`, `${root}.${key}`], mined_from: rel },
      });
      nodes.push(node);
    }
  }
  // `doc` rides along so the operational lint can resolve a guard's dotted
  // `cites` path (`battle.morale.breakThreshold`) against the real number tree.
  return { nodes, present: true, doc };
}

/** The seven trait axes a captain is made of — the "trait" node type, mined from
 *  `data/captains.json`'s `axes.competence` and `axes.temper` (see
 *  `docs/WRIT-THE-CODEX.md`: this is deliberately NOT a `data/traits.json` file, which
 *  does not exist and was never coming — the axes live nested inside `captains.json`
 *  precisely because a captain's temper is what the axes are FOR). Each axis carries
 *  `usedIn` in place of the usual `rule` string; `itemExtra` already knows to read it
 *  the same way. */
function captainTraitNodes() {
  const abs = path.join(DATA_DIR, 'captains.json');
  const rel = path.relative(REPO, abs);
  if (!fs.existsSync(abs)) return { nodes: [], present: false };
  const raw = readText(abs) || '';
  const doc = readJson(abs);
  if (!doc || doc.__parseError) return { nodes: [], present: true, broken: doc && doc.__parseError };
  const axes = doc.axes && typeof doc.axes === 'object' ? doc.axes : {};
  const groups = [
    ...(Array.isArray(axes.competence) ? axes.competence.map((a) => ({ ...a, family: 'competence' })) : []),
    ...(Array.isArray(axes.temper) ? axes.temper.map((a) => ({ ...a, family: 'temper' })) : []),
  ];
  const nodes = [];
  for (const item of groups) {
    if (!item || typeof item !== 'object' || item.id == null) continue;
    const explains = typeof item.explains === 'string' ? item.explains : '';
    nodes.push(
      makeNode({
        id: `trait:${slugify(String(item.id))}`,
        type: 'trait',
        label: typeof item.name === 'string' ? item.name : String(item.id),
        standing: 'proposed',
        standing_source: 'defaulted',
        summary: explains,
        source_path: rel,
        source_line: findItemLine(raw, item.id),
        quote: explains,
        origin: 'mined',
        extra: { ...itemExtra(item), category: item.family, mined_from: rel },
      }),
    );
  }
  return { nodes, present: true };
}

/** ONE page for the worked Host — `data/example-host.json` is not a shelf of many
 *  things, it is a single complete artefact ("every idea in this project standing in
 *  one field at once"), so it gets a single `example` node instead of being run
 *  through the generic shelf miner. Every cross-link below is a LITERAL id already
 *  present in the file: a unit instance's `typeId` names a real `unit:`, a captain's
 *  `seatId` names a real `seat:`, a `quirks[].id` names a real `quirk:`, and a
 *  contingent's `source` names a real `troop-source:`. Nothing here is guessed —
 *  where the file names something with no catalog entry (a fictional holding, a
 *  captain who exists only in this example), there is simply no edge, exactly as the
 *  rest of this tool behaves. */
function exampleHostNode() {
  const abs = path.join(DATA_DIR, 'example-host.json');
  const rel = path.relative(REPO, abs);
  if (!fs.existsSync(abs)) return { nodes: [], present: false };
  const raw = readText(abs) || '';
  const doc = readJson(abs);
  if (!doc || doc.__parseError) return { nodes: [], present: true, broken: doc && doc.__parseError };

  const about = typeof doc.$about === 'string' ? doc.$about : '';
  const id = `example:${slugify(String(doc.id || 'host'))}`;
  const node = makeNode({
    id,
    type: 'example',
    label: typeof doc.name === 'string' ? doc.name : 'The Example Host',
    standing: 'proposed',
    standing_source: 'defaulted',
    summary: about,
    source_path: rel,
    source_line: 1,
    quote: about,
    origin: 'mined',
    extra: {
      mined_from: rel,
      convention: typeof doc.$convention === 'string' ? doc.$convention : '',
      namesAreInvented: typeof doc.$namesAreInvented === 'string' ? doc.$namesAreInvented : '',
      occasion: doc.occasion || null,
      command: doc.command || null,
      contingents: Array.isArray(doc.contingents) ? doc.contingents : [],
      units: Array.isArray(doc.units) ? doc.units : [],
      captains: Array.isArray(doc.captains) ? doc.captains : [],
      supply: doc.supply || null,
      latecomers: Array.isArray(doc.latecomers) ? doc.latecomers : [],
      absent: Array.isArray(doc.absent) ? doc.absent : [],
      standing_: doc.standing || null, // suffixed: `standing` on the node itself already means the axis
      notes: Array.isArray(doc.notes) ? doc.notes : [],
    },
  });

  const seen = new Set();
  const link = (to, why) => {
    const k = to + '|' + why;
    if (seen.has(k)) return;
    seen.add(k);
    addEdge(node, to, why);
  };
  for (const u of Array.isArray(doc.units) ? doc.units : []) {
    if (u && u.typeId) link(`unit:${slugify(String(u.typeId))}`, `fields a unit of type \`${u.typeId}\``);
    for (const q of Array.isArray(u && u.quirks) ? u.quirks : []) {
      if (q && q.id) link(`quirk:${slugify(String(q.id))}`, `a unit in this host carries the quirk \`${q.id}\``);
    }
  }
  for (const c of Array.isArray(doc.contingents) ? doc.contingents : []) {
    if (c && c.source) link(`troop-source:${slugify(String(c.source))}`, `a contingent is raised by \`${c.source}\``);
    for (const q of Array.isArray(c && c.quirks) ? c.quirks : []) {
      if (q && q.id) link(`quirk:${slugify(String(q.id))}`, `a contingent in this host carries the quirk \`${q.id}\``);
    }
  }
  for (const cap of Array.isArray(doc.captains) ? doc.captains : []) {
    if (cap && cap.seatId) link(`seat:${slugify(String(cap.seatId))}`, `${cap.name || cap.id} holds the seat \`${cap.seatId}\``);
    for (const q of Array.isArray(cap && cap.quirks) ? cap.quirks : []) {
      if (q && q.id) link(`quirk:${slugify(String(q.id))}`, `${cap.name || cap.id} carries the quirk \`${q.id}\``);
    }
  }

  return { nodes: [node], present: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// The constitution's own numbered laws — mined straight from KINGDOM.md, never
// hand-copied into a separate knowledge file (there is nowhere in this repo for one
// to live that this tool owns, and copying them would be a second copy that could
// drift from the one the whole game answers to).
// ─────────────────────────────────────────────────────────────────────────────

function ruleNodes() {
  const rel = 'docs/KINGDOM.md';
  const abs = path.join(REPO, rel);
  const src = readText(abs);
  if (!src) return [];
  const section = src.match(/^## 2\. The laws\s*\n([\s\S]*?)(?=\n## )/m);
  if (!section) return [];
  const body = section[1];
  const bodyStart = src.indexOf(body);
  const items = [...body.matchAll(/^(\d+)\.\s+\*\*(.+?)\*\*/gm)];
  const nodes = [];
  for (let i = 0; i < items.length; i++) {
    const num = items[i][1];
    const title = items[i][2].replace(/\.$/, '').trim();
    const from = items[i].index;
    const to = i + 1 < items.length ? items[i + 1].index : body.length;
    const block = body.slice(from, to).trim();
    nodes.push(
      makeNode({
        id: `rule:${num}`,
        type: 'rule',
        label: `Law ${num} — ${title}`,
        standing: 'canon',
        standing_source: rel,
        // No separate summary: the law's own text (below, verbatim) IS the plain-
        // English explanation here — restating a truncated copy of it above would
        // just be the same paragraph twice.
        source_path: rel,
        source_line: lineOf(src, bodyStart + from),
        quote: block,
        origin: 'mined',
        extra: { number: Number(num) },
      }),
    );
  }
  return nodes;
}

// ─────────────────────────────────────────────────────────────────────────────
// The derived half — what src/ and test/ can prove, once they exist. Ported
// unchanged in mechanism from the sibling repo's tool: this half of the pattern is
// application-agnostic, it just reads a TypeScript tree.
// ─────────────────────────────────────────────────────────────────────────────

const CODE_EXT = ['.ts', '.tsx', '.mts', '.mjs'];

function isModuleFile(rel) {
  return !!rel && rel.startsWith('src/') && CODE_EXT.some((e) => rel.endsWith(e));
}

function exportedSymbols(src) {
  const names = new Set();
  const decl =
    /^export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = decl.exec(src))) names.add(m[1]);
  const braced = /^export\s+(?:type\s+)?\{([^}]*)\}/gm;
  while ((m = braced.exec(src))) {
    for (const part of m[1].split(',')) {
      const bits = part.trim().split(/\s+as\s+/);
      const name = (bits[1] || bits[0] || '').trim().replace(/^type\s+/, '');
      if (/^[A-Za-z_$][\w$]*$/.test(name) && name !== 'default') names.add(name);
    }
  }
  if (/^export\s+default\s+function\s*\(/m.test(src)) names.add('default');
  return [...names].sort();
}

function importSpecifiers(src) {
  const out = new Set();
  const re = /(?:^|\n)\s*(?:import|export)[\s\S]{0,300}?from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  const bare = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
  while ((m = bare.exec(src))) out.add(m[1]);
  const dyn = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dyn.exec(src))) out.add(m[1]);
  return [...out];
}

function resolveImport(fromRel, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(REPO, path.dirname(fromRel), spec);
  const tries = [base];
  for (const e of CODE_EXT) tries.push(base + e);
  for (const e of CODE_EXT) tries.push(path.join(base, 'index' + e));
  if (/\.jsx?$/.test(base)) for (const e of CODE_EXT) tries.push(base.replace(/\.jsx?$/, e));
  for (const t of tries) {
    try {
      if (fs.statSync(t).isFile()) return path.relative(REPO, t);
    } catch {
      /* keep trying */
    }
  }
  return null;
}

function leadingDoc(src) {
  const m = src.match(/^(?:﻿)?(?:\/\*\*?([\s\S]*?)\*\/|((?:\/\/[^\n]*\n){1,12}))/);
  if (!m) return '';
  const raw = m[1] || m[2] || '';
  return raw
    .split('\n')
    .map((l) => l.replace(/^\s*(\*+|\/\/)\s?/, '').trimEnd())
    .join('\n')
    .trim()
    .slice(0, 600);
}

function moduleNodeFor(rel) {
  const abs = path.join(REPO, rel);
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;
  const huge = stat.size > 2_000_000;
  const src = huge ? '' : readText(abs) || '';
  const lines = huge ? null : src.split('\n').length;
  const symbols = huge ? [] : exportedSymbols(src);
  const resolved = huge
    ? []
    : importSpecifiers(src)
        .map((s) => ({ spec: s, rel: resolveImport(rel, s) }))
        .filter((x) => x.rel);
  const imports = resolved.filter((x) => isModuleFile(x.rel));
  const assets = resolved.filter((x) => !isModuleFile(x.rel)).map((x) => x.rel);
  const node = makeNode({
    id: `module:${rel}`,
    type: 'module',
    label: rel,
    standing: 'built', // its own existence in the tree is the proof
    standing_source: 'derived',
    summary: huge
      ? `${Math.round(stat.size / 1024)} KB — too large to read; only its existence is claimed here.`
      : `${lines} lines · ${symbols.length} exported symbol${symbols.length === 1 ? '' : 's'}.`,
    source_path: rel,
    source_line: 1,
    origin: 'derived',
    extra: { lines, symbols, imports: imports.map((i) => i.rel), assets, doc: huge ? '' : leadingDoc(src), bytes: stat.size },
  });
  for (const i of imports) addEdge(node, `module:${i.rel}`, 'imported by this file');
  const twin = rel.match(/^(.*)\.d\.(m?)ts$/);
  if (twin) {
    for (const e of [`.${twin[2]}js`, `.${twin[2]}ts`, '.ts', '.mjs']) {
      const cand = twin[1] + e;
      if (cand !== rel && fs.existsSync(path.join(REPO, cand))) {
        addEdge(node, `module:${cand}`, 'the implementation this declaration file describes (same stem)');
        break;
      }
    }
  }
  return node;
}

function moduleNodes() {
  return walkFiles(path.join(REPO, 'src'), { ext: CODE_EXT })
    .map(moduleNodeFor)
    .filter(Boolean);
}

function readQuoted(src, open) {
  const q = src[open];
  let i = open + 1;
  while (i < src.length) {
    if (src[i] === '\\') i += 2;
    else if (src[i] === q) return { raw: src.slice(open + 1, i), end: i };
    else if (src[i] === '\n' && q !== '`') return null;
    else i++;
  }
  return null;
}

function unescapeJs(s) {
  return s.replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, ' ');
}

function eachName(src, from) {
  const window = src.slice(from, from + 600);
  const m = window.match(/\)\s*\(\s*(['"`])/);
  if (!m) return null;
  return readQuoted(src, from + m.index + m[0].length - 1);
}

/** One node per `it(…)` / `test(…)` in `test/*.test.ts`, once that directory exists.
 *  These are the rules the game actually ENFORCES by machine, once the engine is
 *  built — see the header's honest limits on what a test-file import edge means. */
function invariantNodes() {
  const files = walkFiles(path.join(REPO, 'test'), { ext: ['.test.ts', '.test.tsx'] });
  const nodes = [];
  for (const rel of files) {
    const src = readText(path.join(REPO, rel)) || '';
    const lines = src.split('\n');
    const direct = importSpecifiers(src)
      .map((s) => resolveImport(rel, s))
      .filter(Boolean);
    const imports = direct.filter(isModuleFile).map((r) => ({ rel: r, via: null }));
    for (const helper of direct.filter((r) => r.startsWith('test/'))) {
      const hsrc = readText(path.join(REPO, helper));
      if (!hsrc) continue;
      for (const r of importSpecifiers(hsrc).map((s) => resolveImport(helper, s)).filter(isModuleFile)) {
        if (!imports.some((i) => i.rel === r)) imports.push({ rel: r, via: helper });
      }
    }
    const stack = [];
    let seq = 0;
    let offset = 0;
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln];
      const lineStart = offset;
      offset += line.length + 1;
      const m = line.match(/^(\s*)(describe|it|test)((?:\.\w+)*)\s*\(\s*(['"`])?/);
      if (!m) continue;
      const indent = m[1].length;
      let got;
      if (m[4]) {
        got = readQuoted(src, lineStart + line.indexOf(m[4], m[1].length + m[2].length + m[3].length));
      } else if (m[3]) {
        got = eachName(src, lineStart + m[0].length - 1);
      }
      if (!got) continue;
      const raw = got.raw;
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      if (m[2] === 'describe') {
        stack.push({ indent, name: unescapeJs(raw) });
        continue;
      }
      const ancestry = stack.map((s) => s.name);
      const name = unescapeJs(raw);
      const node = makeNode({
        id: `invariant:${slugify(path.basename(rel, '.test.ts'))}-${String(++seq).padStart(3, '0')}-${slugify(name, 48)}`,
        type: 'invariant',
        label: name,
        standing: 'built',
        standing_source: 'derived',
        summary: ancestry.length ? `${ancestry.join(' › ')} — ${name}` : name,
        source_path: rel,
        source_line: ln + 1,
        quote: raw,
        origin: 'derived',
        extra: { ancestry, suite: rel, imports: imports.map((i) => i.rel) },
      });
      for (const im of imports) {
        addEdge(
          node,
          `module:${im.rel}`,
          im.via
            ? `reached by the test FILE through its helper \`${im.via}\` (shared source, not a claim about this one test)`
            : 'imported by the test FILE (shared source, not a claim about this one test)',
        );
      }
      nodes.push(node);
    }
  }
  return nodes;
}

function docTitle(src, rel) {
  const m = src.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : path.basename(rel, '.md');
}

function firstParagraph(src) {
  const body = src.replace(/^#\s+.+$/m, '');
  const blocks = body.split(/\n\s*\n/);
  for (const b of blocks) {
    const t = b.trim();
    if (!t || t.startsWith('#') || t.startsWith('|') || t.startsWith('```')) continue;
    return t;
  }
  return '';
}

/** Every doc under `docs/` becomes a `writ` page — the constitution and the two
 *  implementable specs. No longer the PRIMARY spine (the game's own vocabulary is),
 *  but still the road from a rule to the reasoning behind it. Defaults, absent any
 *  manifest: `KINGDOM.md` is canon; everything else is a spec, so `proposed` — a writ
 *  is never proof that anything works, per `docs/WRIT-THE-CODEX.md`. */
function writNodes() {
  const dir = path.join(REPO, 'docs');
  const rels = walkFiles(dir, { ext: ['.md'] });
  const nodes = [];
  for (const rel of rels) {
    const src = readText(path.join(REPO, rel)) || '';
    const base = path.basename(rel);
    const standing = base === 'KINGDOM.md' ? 'canon' : 'proposed';
    const title = docTitle(src, rel);
    const para = firstParagraph(src);
    const headings = [...src.matchAll(/^(#{2,6})\s+(.+)$/gm)].map((m) => ({ depth: m[1].length, text: m[2].trim() }));
    nodes.push(
      makeNode({
        id: `writ:${rel}`,
        type: 'writ',
        label: title,
        standing,
        standing_source: rel,
        summary: normalizeWs(para).slice(0, 300),
        source_path: rel,
        source_line: 1,
        quote: para,
        origin: 'derived',
        extra: { headings, file: rel, lines: src.split('\n').length },
      }),
    );
  }
  return nodes;
}

// ─────────────────────────────────────────────────────────────────────────────
// The literal-match pass — where every half is stitched, and only there
// ─────────────────────────────────────────────────────────────────────────────

const NOISE_LABELS = new Set(['the crown', 'the court', 'kingdom']);

/** Cross-link on LITERAL identifiers only — an id, a source path, an exported symbol,
 *  a game term's own name, a `K.<path>` constant citation. Never on prose similarity. */
function stitch(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const targets = [...byId.values()];

  const idNeedles = [];
  for (const n of targets) {
    idNeedles.push({ node: n, needle: n.id });
    for (const alias of n.extra && Array.isArray(n.extra.kAliases) ? n.extra.kAliases : []) {
      idNeedles.push({ node: n, needle: alias });
    }
  }

  // A PATH names a FILE. It resolves only to the node that IS that file — never to
  // the many items mined out of it (a citation of `data/units.json` must not fan out
  // across all eighteen units, which is exactly the fan-out the sibling tool's own
  // history warns about). Only whole-file kinds carry a path needle.
  const WHOLE_FILE_TYPES = new Set(['module', 'writ']);
  const isPathNeedle = (p) => p.includes('/') || /\.[A-Za-z0-9]+$/.test(p);
  const pathNeedles = targets
    .filter((n) => WHOLE_FILE_TYPES.has(n.type) && n.source_path && isPathNeedle(n.source_path))
    .map((n) => ({ node: n, needle: n.source_path }));

  // Labels: every game-vocabulary kind whose label is a NAME, never an invariant
  // (whose label is a whole prose sentence) and never a constant (whose label is a
  // technical group heading, not a term a writer would drop into a sentence).
  const LABEL_TYPES = new Set([
    'rule', 'unit', 'keyword', 'equipment', 'formation', 'order', 'standing-plan',
    'terrain', 'trait', 'quirk', 'seat', 'obligation', 'holding', 'season',
    'grievance', 'favour', 'answer', 'troop-source', 'example',
  ]);
  const labelNeedles = targets
    .filter((n) => LABEL_TYPES.has(n.type) && n.label && n.label.length >= LABEL_MIN && !NOISE_LABELS.has(n.label.toLowerCase()))
    .map((n) => ({ node: n, re: new RegExp(`(?:^|[^\\w-])${escapeRe(n.label)}(?:$|[^\\w-])`, 'i') }));

  // Exported symbols (once `src/` exists) and identifier-shaped constant keys
  // (`tickHz`, `orderCapacity`) — both are literal names a writ or a module might cite.
  const symbolNeedles = [];
  for (const n of targets) {
    if (n.type === 'module') {
      for (const s of n.extra.symbols || []) {
        if (!isIdentifierShaped(s)) continue;
        symbolNeedles.push({ node: n, symbol: s, re: new RegExp(`(?:^|[^\\w$])${escapeRe(s)}(?:$|[^\\w$])`) });
      }
    } else if (n.type === 'constant') {
      for (const { key } of n.extra.numbers || []) {
        if (!isIdentifierShaped(key)) continue;
        symbolNeedles.push({ node: n, symbol: key, re: new RegExp(`(?:^|[^\\w$])${escapeRe(key)}(?:$|[^\\w$])`) });
      }
    }
  }

  const scanText = (src, from, why) => {
    for (const { node, needle } of idNeedles) if (node !== from && src.includes(needle)) addEdge(from, node.id, `${why} names \`${needle}\` literally`);
    for (const { node, needle } of pathNeedles) if (node !== from && src.includes(needle)) addEdge(from, node.id, `${why} names the file \`${needle}\` by path`, 'file');
    for (const { node, re } of labelNeedles) if (node !== from && re.test(src)) addEdge(from, node.id, `${why} names "${node.label}" literally`);
    for (const { node, symbol, re } of symbolNeedles) if (node !== from && re.test(src)) addEdge(from, node.id, `${why} names \`${symbol}\``);
  };

  // Writs read the whole tree's vocabulary — this is how a law cross-links to every
  // unit, keyword and constant it names by term or by `K.<path>`.
  for (const n of targets) {
    if (n.type !== 'writ') continue;
    const src = readText(path.join(REPO, n.source_path));
    if (src) scanText(src, n, 'this writ');
  }
  // Mined game-data items read each other's prose fields (`explains`, `role`,
  // `counteredBy`, `rule`, `usedIn`) AND their own numbers table for literal names —
  // this is what turns "countered by professional soldiers" on a militia unit into an
  // actual road, when the words used are another item's own name, and it is also how
  // a grievance's bare `"k": "court.seats.passedOverPerClaimPoint"` finds its
  // constant group without a `K.` prefix in sight. `JSON.stringify` is a blunt way to
  // fold arbitrary stat values into searchable text, but every hit it produces is
  // still a literal substring match — never invented, just found in one more place.
  for (const n of targets) {
    if (n.origin !== 'mined' || n.type === 'rule') continue;
    const hay = [
      n.summary, n.extra.role || '', n.extra.counteredBy || '', n.extra.rule || '',
      n.extra.usedIn || '', n.extra.chose || '',
      n.extra.stats ? JSON.stringify(n.extra.stats) : '',
    ].join('\n');
    scanText(hay, n, 'this page');
  }
  // A rule's own text (the law, verbatim) is scanned the same way — this is the road
  // from "bracing grants no bonus" (law 5) straight to the `CanBrace` keyword page.
  for (const n of targets) {
    if (n.type !== 'rule') continue;
    scanText(n.quote, n, 'this law');
  }
  // Code names ids and constants, once `src/` exists.
  for (const n of targets) {
    if (n.type !== 'module') continue;
    const src = readText(path.join(REPO, n.source_path));
    if (!src) continue;
    for (const { node, needle } of idNeedles) {
      if (node === n || node.type === 'module' || node.type === 'invariant') continue;
      if (node.extra && node.extra.mined_from === n.source_path) continue;
      if (src.includes(needle)) addEdge(n, node.id, `this module names \`${needle}\` literally`);
    }
  }
  // A test's own name may cite an id outright.
  for (const n of targets) {
    if (n.type !== 'invariant') continue;
    const hay = `${n.label} ${n.summary}`;
    for (const { node, needle } of idNeedles) {
      if (node === n || node.type === 'invariant') continue;
      if (hay.includes(needle)) addEdge(n, node.id, `the test name cites \`${needle}\``);
    }
  }

  // Drop edges to nodes that do not exist (a reference field may name a stranger —
  // `raisedBy: ["town"]` before `holdings.json` exists, say).
  const unresolved = [];
  for (const n of targets) {
    const kept = [];
    for (const e of n.edges) {
      if (byId.has(e.to)) kept.push(e);
      else unresolved.push({ from: n.id, to: e.to });
    }
    n.edges = kept;
  }
  return unresolved;
}

/** A mined game-data node starts `proposed` (a design in `data/`, nothing reading it
 *  yet) and is promoted to `built` only when the tree itself backs the claim — a real
 *  module or a real test cites it. This is the whole reason the axis exists: nothing
 *  is ever hand-declared built, because there is no manifest here to declare it in. */
function upgradeBuiltStanding(nodes) {
  const MINED_GAME_TYPES = new Set([...DATA_SOURCES.map((s) => s.type), 'constant', 'trait', 'example']);
  for (const n of nodes) {
    if (!MINED_GAME_TYPES.has(n.type) || n.standing !== 'proposed') continue;
    const near = [...n.edges.map((e) => e.to), ...n.backlinks.map((b) => b.from)];
    if (near.some((id) => id.startsWith('module:') || id.startsWith('invariant:'))) {
      n.standing = 'built';
      n.standing_source = 'derived';
    }
  }
}

/** Every page needs a name no other page holds — collisions are broken by type, then
 *  by a slice of the id, deterministically, so two runs name the same page the same. */
export function assignPages(nodes) {
  const byName = new Map();
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  for (const n of sorted) {
    let name = String(n.label || n.id).replace(/[\[\]|#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || n.id;
    if (byName.has(name)) name = `${name} (${n.type})`;
    if (byName.has(name)) name = `${name} ${n.id.split(':').pop().slice(0, 12)}`;
    let guard = 2;
    while (byName.has(name)) name = `${name} ${guard++}`;
    byName.set(name, n);
    n.page = name;
  }
  const bySlug = new Map();
  for (const n of sorted) {
    const dir = TYPE_DIRS[n.type] || `${n.type}s`;
    let slug = slugify(n.page);
    let key = `${dir}/${slug}`;
    let guard = 2;
    while (bySlug.has(key)) key = `${dir}/${slug}-${guard++}`;
    bySlug.set(key, n);
    n.file = `codex/${key}.md`;
  }
  return byName;
}

// ─────────────────────────────────────────────────────────────────────────────
// The whole graph, in one call
// ─────────────────────────────────────────────────────────────────────────────

/** Every `.json` file this tool is capable of reading, however it reads it — the
 *  generic shelf scan (`DATA_SOURCES`) plus the three special-cased whole-file miners.
 *  Used only by the coverage audit below; nothing here decides what gets mined. */
const KNOWN_DATA_FILES = new Set([...DATA_SOURCES.map((s) => s.file), ...SPECIAL_CASE_DATA_FILES]);

/** THE FIX FOR THE FILE THAT SLIPS THROUGH SILENTLY. The old gap report only ever
 *  asked "does the file this type expects exist?" — a real, well-formed file sitting
 *  in `data/` under a name nothing was looking for passed with no comment at all,
 *  which is exactly how five files (four of them core manual content) went unmined
 *  for a whole session. This asks the question the other way round: walk `data/` on
 *  disk and account for EVERY `.json` file found. One that is neither known (mined,
 *  one way or another) nor named in `DELIBERATELY_UNMINED_DATA` with a reason is an
 *  oversight, reported loudly, and `lint` makes it fatal. */
function auditDataCoverage() {
  let files = [];
  try {
    files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return { unaccounted: [], deliberatelyUnmined: [] };
  }
  const unaccounted = [];
  const deliberatelyUnmined = [];
  for (const f of files.sort()) {
    if (KNOWN_DATA_FILES.has(f)) continue;
    if (Object.prototype.hasOwnProperty.call(DELIBERATELY_UNMINED_DATA, f)) {
      deliberatelyUnmined.push({ file: f, reason: DELIBERATELY_UNMINED_DATA[f] });
      continue;
    }
    unaccounted.push(f);
  }
  return { unaccounted, deliberatelyUnmined };
}

export function buildGraph() {
  const missingData = [];
  const brokenData = [];

  const dataResults = DATA_SOURCES.map((s) => ({ source: s, result: dataNodesFor(s) }));
  for (const { source, result } of dataResults) {
    if (!result.present) missingData.push(`data/${source.file}`);
    else if (result.broken) brokenData.push(`data/${source.file}: ${result.broken}`);
  }
  const constants = constantNodes();
  if (!constants.present) missingData.push('data/constants.json');
  else if (constants.broken) brokenData.push(`data/constants.json: ${constants.broken}`);

  const traits = captainTraitNodes();
  if (!traits.present) missingData.push('data/captains.json');
  else if (traits.broken) brokenData.push(`data/captains.json: ${traits.broken}`);

  const example = exampleHostNode();
  if (!example.present) missingData.push('data/example-host.json');
  else if (example.broken) brokenData.push(`data/example-host.json: ${example.broken}`);

  const { unaccounted: unaccountedDataFiles, deliberatelyUnmined } = auditDataCoverage();

  const srcMissing = !fs.existsSync(path.join(REPO, 'src'));
  const testMissing = !fs.existsSync(path.join(REPO, 'test'));

  const nodes = [
    ...dataResults.flatMap((r) => r.result.nodes),
    ...constants.nodes,
    ...traits.nodes,
    ...example.nodes,
    ...ruleNodes(),
    ...moduleNodes(),
    ...invariantNodes(),
    ...writNodes(),
  ];

  const byId = new Map();
  const duplicates = [];
  for (const n of nodes) {
    const seen = byId.get(n.id);
    if (!seen) byId.set(n.id, n);
    else duplicates.push(n.id);
  }
  const kept = [...byId.values()];

  wireReferenceFields(kept, byId);
  const unresolved = stitch(kept);
  const backlinks = new Map(kept.map((n) => [n.id, []]));
  for (const n of kept) for (const e of n.edges) backlinks.get(e.to).push({ from: n.id, why: e.why, kind: e.kind });
  for (const n of kept) n.backlinks = backlinks.get(n.id);

  upgradeBuiltStanding(kept);
  assignPages(kept);

  return {
    nodes: kept,
    byId,
    constantsDoc: constants.doc || null,
    missingData,
    brokenData,
    srcMissing,
    testMissing,
    unresolvedLinks: unresolved,
    duplicateIds: duplicates,
    unaccountedDataFiles,
    deliberatelyUnmined,
  };
}

export function countBy(nodes, key) {
  const out = {};
  for (const n of nodes) out[n[key]] = (out[n[key]] || 0) + 1;
  return out;
}

/** Degree = roads in plus roads out. The load-bearing nodes are the ones the rest of
 *  the game leans on, and the map names them first. */
export function degree(n) {
  return n.edges.length + (n.backlinks ? n.backlinks.length : 0);
}
