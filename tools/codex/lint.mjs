// LINT — every way the Codex can quietly rot, in one command.
// `node tools/codex/lint.mjs [--strict]`   (see `docs/WRIT-THE-CODEX.md`)
//
// WHY THIS EXISTS
// Ported from LandLord's Great Book (`tools/vault/lint.mjs` in the sibling `ll-public`
// repo). That tool exists because three "beta blockers" sat marked open in a status
// doc for five sessions after they were closed, built and deployed — nobody re-checked
// because checking meant reading the code and comparing it to the prose by eye. This
// command is that eye, and it never gets tired. Here it re-derives the evidence
// against `data/*.json` and the constitution instead of a hand-mined knowledge layer,
// but the discipline is the same: builders return counts, this re-checks the counts.
//
// WHAT IT LOOKS FOR
//   1. DANGLING LINKS  — a wikilink with no target. Fatal: a road that goes nowhere.
//   2. ORPHANS         — a page nothing points at. Checked HERE AND NOWHERE ELSE, and
//                        it matters most: a dangling link gets caught because it looks
//                        broken; an orphan never looks like anything.
//   3. QUOTES          — every `source_path` is re-read off disk and its `quote` must
//                        appear verbatim, whitespace-normalised. For a mined page that
//                        quote IS the `explains` field of the JSON object it came
//                        from — NO QUOTE, NO OBJECT: a quote that does not appear is
//                        not a weak claim, it is a hallucination with a schema.
//   4. STANDING DRIFT  — anything `proposed` whose own text claims it is done;
//                        anything `built` with no module or invariant beneath it (the
//                        thing itself, for a module/invariant, needs nothing under
//                        it — its own existence in the tree IS the proof); anything
//                        `retired` that names no successor.
//   5. LITERALS IN GUARDS — a governing number typed into a `src/` comparison instead
//                        of read from `data/constants.json` via a `constant:` id
//                        named nearby. A bare number has nowhere to put "varies by
//                        formation", so whoever writes each site picks a value and
//                        the drift is invisible.
//   6. EVERY TABLE IS RESOLVED — no fenced `dataview`/`query`/`tasks`/`chart` block.
//                        A manual that needs a plugin installed to show its unit
//                        tables is not a manual; this is the least negotiable check
//                        in the whole tool.
//
// WHAT THE SIBLING TOOL CHECKS THAT THIS ONE DOES NOT, AND WHY
// The original also validated every root path on disk against a hand-declared
// `knowledge/artifacts.json` manifest (kind + standing per path). This repo has no
// such manifest, and this tool does not own `data/` or `docs/` to add one — inventing
// a declaration file just to satisfy that check would be exactly the kind of
// unrequested addition `docs/WRIT-THE-CODEX.md` forbids. Standing here comes from
// three honest, ownerless places instead: the constitution (`canon`), the tree
// (`built`, because a module or test's own existence is the proof), and a data-backed
// upgrade pass with no manual declaration anywhere (see `upgradeBuiltStanding` in
// `lib.mjs`). So there is nothing here to check a manifest AGAINST.
//
// HONEST LIMITS
//   · The literal scan reads shapes, not meaning. It blanks comments and strings
//     first, so it will not flag a number in prose — but it cannot tell a threshold
//     from a loop bound. It is a WARNING: a wall of red on an empty `src/` helps
//     nobody, and the count is the debt's size, not a verdict.
//   · The "claims it is done" scan is word-spotting. Read every hit; some are innocent.
//   · Orphan-hunting counts a link in a Backlinks section as a road, because a reader
//     can walk it — but reports those separately, since nothing DELIBERATELY put it
//     there.
//
// Exit 0 on warnings, 1 on fatal findings. `--strict` makes everything fatal.
// Pure Node. No install, ever.

import fs from 'node:fs';
import path from 'node:path';
import {
  REPO,
  CODEX,
  buildGraph,
  readText,
  walkFiles,
  normalizeWs,
  slugify,
  stripCommentsAndStrings,
} from './lib.mjs';

const STRICT = process.argv.includes('--strict');
const findings = { fatal: [], warn: [] };
const say = (level, check, msg) => findings[STRICT ? 'fatal' : level].push({ check, msg });
const fatal = (check, msg) => findings.fatal.push({ check, msg });
const warn = (check, msg) => say('warn', check, msg);

/** Numbers that govern nothing: an empty count, a single step, a not-found, a
 *  percentage whole. Everything else in a guard is a decision somebody made in
 *  silence. */
const HARMLESS = new Set(['0', '1', '-1', '100', '0.0', '1.0']);

// ─────────────────────────────────────────────────────────────────────────────
// Reading the Codex off disk (never from the compiler's memory — the pages are
// what a reader actually gets)
// ─────────────────────────────────────────────────────────────────────────────

function parseFrontmatter(src) {
  if (!src.startsWith('---')) return {};
  const end = src.indexOf('\n---', 3);
  if (end === -1) return {};
  const out = {};
  let key = null;
  for (const line of src.slice(4, end).split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) {
      (out[key] = Array.isArray(out[key]) ? out[key] : []).push(unq(item[1]));
      continue;
    }
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    key = m[1];
    out[key] = m[2].trim() === '' ? [] : unq(m[2]);
  }
  return out;
}

function unq(s) {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    try {
      return JSON.parse(s.replace(/^'|'$/g, '"'));
    } catch {
      return s.slice(1, -1);
    }
  }
  return s;
}

function loadCodexPages() {
  if (!fs.existsSync(CODEX)) return [];
  return walkFiles(CODEX, { ext: ['.md'] }).map((rel) => {
    const src = readText(path.join(REPO, rel)) || '';
    const fm = parseFrontmatter(src);
    const h1 = (src.match(/^#\s+(.+)$/m) || [])[1];
    const title = fm.title || h1 || path.basename(rel, '.md');
    const names = new Set([title]);
    for (const a of Array.isArray(fm.aliases) ? fm.aliases : fm.aliases ? [fm.aliases] : []) names.add(a);
    if (fm.id) names.add(fm.id);
    return { rel, src, fm, title, names, type: fm.type || 'page' };
  });
}

/** Pull every wikilink out of a page, remembering the heading it stood under — a link
 *  in a Backlinks section is a road a reader can walk, but nothing DELIBERATELY put it
 *  there. */
function linksOf(page) {
  const out = [];
  let heading = '';
  let inBacklinks = false;
  for (const line of page.src.split('\n')) {
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) {
      heading = h[2].trim();
      if (h[1].length === 2) inBacklinks = /^(backlinks|documents that cite this source)$/i.test(heading);
    }
    for (const m of line.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
      out.push({ target: m[1].trim(), heading, backRoad: inBacklinks });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 + 2 — dangling links and orphans
// ─────────────────────────────────────────────────────────────────────────────

function checkLinksAndOrphans(pages) {
  const byName = new Map();
  for (const p of pages) for (const n of p.names) if (!byName.has(n)) byName.set(n, p);

  const inbound = new Map(pages.map((p) => [p.rel, { hard: new Set(), back: new Set() }]));
  let dangling = 0;
  for (const p of pages) {
    for (const l of linksOf(p)) {
      const target = byName.get(l.target);
      if (!target) {
        dangling++;
        fatal('dangling', `${p.rel} → [[${l.target}]] resolves to nothing`);
        continue;
      }
      if (target.rel === p.rel) continue;
      inbound.get(target.rel)[l.backRoad ? 'back' : 'hard'].add(p.rel);
    }
  }

  const byRule = (rel) => /^codex\/maps\/INDEX\.md$/.test(rel) || /^codex\/00 START HERE\.md$/.test(rel);
  const orphans = [];
  const backOnly = [];
  const unpointed = [];
  for (const p of pages) {
    if (byRule(p.rel)) continue;
    const inb = inbound.get(p.rel);
    const hard = [...inb.hard].filter((r) => !byRule(r));
    const back = [...inb.back].filter((r) => !byRule(r));
    if (!hard.length && !back.length) orphans.push(p);
    else if (!hard.length) backOnly.push(p);
    const after = p.src.split(/^## Backlinks$/m)[1];
    if (after !== undefined && !/^- \[\[/m.test(after.split(/^## /m)[0])) unpointed.push(p);
  }
  const byType = (list) => {
    const m = {};
    for (const p of list) m[p.type] = (m[p.type] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ') || 'none';
  };
  if (orphans.length) {
    warn('orphans', `${orphans.length} page(s) nothing points at — ${byType(orphans)}`);
    for (const p of orphans.slice(0, 25)) warn('orphans', `    ${p.rel}`);
    if (orphans.length > 25) warn('orphans', `    …and ${orphans.length - 25} more`);
  }
  if (backOnly.length) {
    warn('orphans', `${backOnly.length} page(s) reachable ONLY through a Backlinks section — ${byType(backOnly)}`);
  }
  if (unpointed.length) {
    warn('orphans', `${unpointed.length} page(s) whose Backlinks section is EMPTY — nothing in the Codex points at the idea — ${byType(unpointed)}`);
  }
  return { dangling, orphans: orphans.length, backOnly: backOnly.length, unpointed: unpointed.length, pages: pages.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 — no quote, no object
// ─────────────────────────────────────────────────────────────────────────────

function checkQuotes(graph) {
  const cache = new Map();
  const readNorm = (rel) => {
    if (!cache.has(rel)) {
      const src = readText(path.join(REPO, rel));
      cache.set(rel, src === null ? null : normalizeWs(src));
    }
    return cache.get(rel);
  };
  let checked = 0;
  let failed = 0;
  let unsourced = 0;
  for (const n of graph.nodes) {
    if (!n.quote) {
      if (n.origin === 'mined') {
        unsourced++;
        fatal('quote', `${n.id} carries no quote — no quote, no object`);
      }
      continue;
    }
    if (!n.source_path) {
      failed++;
      fatal('quote', `${n.id} quotes something but names no source_path`);
      continue;
    }
    const hay = readNorm(n.source_path);
    if (hay === null) {
      failed++;
      fatal('quote', `${n.id} cites \`${n.source_path}\`, which is not on disk`);
      continue;
    }
    checked++;
    if (!hay.includes(normalizeWs(n.quote))) {
      failed++;
      fatal('quote', `${n.id} — quote not found in \`${n.source_path}\`: "${normalizeWs(n.quote).slice(0, 90)}…"`);
    }
  }
  return { checked, failed, unsourced };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 — standing drift
// ─────────────────────────────────────────────────────────────────────────────

const DONE_WORDS =
  /\b(is (?:now )?(?:built|shipped|live|done|deployed|implemented|complete)|was (?:built|shipped|deployed|implemented)|has shipped|already (?:built|shipped|live)|verified end-to-end|BUILT ✅|DONE ✅)\b/i;

/** Which `data/*.json` files the tree actually pulls in, read back off the module
 *  pages' own recorded imports. Memoised: it is asked once per `built` page. */
let _importedData = null;
function importedDataFiles(graph) {
  if (_importedData) return _importedData;
  _importedData = new Set();
  for (const n of graph.nodes) {
    if (n.type !== 'module') continue;
    for (const a of (n.extra && n.extra.assets) || []) {
      const m = String(a).match(/data\/[\w-]+\.json$/);
      if (m) _importedData.add(path.basename(m[0]));
    }
  }
  return _importedData;
}

function checkStanding(graph) {
  const out = { claimsDone: 0, unbacked: 0, noSuccessor: 0 };
  for (const n of graph.nodes) {
    const text = `${n.summary}\n${n.body}\n${n.quote}`;
    if (n.standing === 'proposed' && DONE_WORDS.test(text)) {
      out.claimsDone++;
      warn('standing', `${n.id} is PROPOSED but its own text claims it is done — "${(text.match(DONE_WORDS) || [''])[0]}" (${n.source_path})`);
    }
    // A module or an invariant IS the thing — its existence in the tree is the whole
    // proof, and it needs nothing under it.
    //
    // THE SECOND WAY TO BE BUILT. `upgradeBuiltStanding` also promotes a shelf the
    // engine resolves BY ID, because no module ever names the string `spearmen` — the
    // id travels in the data. Such a page records WHY on the node, and the branch
    // below re-derives that reason from the module pages' own recorded imports rather
    // than trusting the flag.
    //
    // BE HONEST ABOUT WHAT THIS CATCHES: today, nothing. The promotion is itself
    // guarded by the same import check, so a shelf wrongly listed as id-resolved never
    // reaches `built` at all — it stays `proposed`, and this branch is unreachable.
    // It was written expecting to catch a bad `ID_LOOKUP_SHELVES` entry and it cannot;
    // that entry is a claim about HOW the engine consumes a shelf (resolved by id, or
    // matched case by case like `orders.json`), and no scan can settle that. A human
    // adding a shelf there is making a judgement no tool will check for them.
    //
    // It stays as a structural guard, for the same reason the branch below it does: if
    // a future hand adds a third route to `built` that sets `standing_why` without
    // proving the import, this catches it on the first run.
    const isThingItself = n.type === 'module' || n.type === 'invariant';
    if (n.standing === 'built' && !isThingItself) {
      const near = [...n.edges.map((e) => e.to), ...n.backlinks.map((b) => b.from)];
      let backed = near.some((id) => id.startsWith('module:') || id.startsWith('invariant:'));
      if (!backed && n.standing_why) {
        const from = n.extra && n.extra.mined_from ? path.basename(n.extra.mined_from) : '';
        backed = from ? [...importedDataFiles(graph)].includes(from) : false;
        if (!backed) {
          out.unbacked++;
          warn(
            'standing',
            `${n.id} claims BUILT because "${n.standing_why}", but nothing in \`src/\` imports \`${from || '(no source file)'}\` — the reason is not evidence`,
          );
        }
        continue;
      }
      if (!backed) {
        out.unbacked++;
        warn('standing', `${n.id} is BUILT but no module or invariant stands under it — what is the claim checkable against?`);
      }
    }
    if (n.standing === 'retired') {
      const named = /supersed|replaced by|successor/i.test(text) || n.edges.length > 0;
      if (!named) {
        out.noSuccessor++;
        warn('standing', `${n.id} is RETIRED and names no successor — history with no forwarding address`);
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 — literals in guards
// ─────────────────────────────────────────────────────────────────────────────

const OP = /(?<![=!<>+\-*/%&|^])(<=|>=|===|!==|==|!=|<|>)(?![=>])/g;
const NUM_AFTER = /^\s*(-?\d+(?:\.\d+)?)(?![\w.])/;
const NUM_BEFORE = /(?<![\w.$])(-?\d+(?:\.\d+)?)\s*$/;

function checkLiterals(graph) {
  // Not hardcoded to a `domain/` subdirectory the way the sibling tool is — this
  // repo's own layout under `src/` is still being decided in parallel, so the whole
  // tree is read once it exists, and reads as empty (0 sites) honestly before it does.
  const files = walkFiles(path.join(REPO, 'src'), { ext: ['.ts', '.tsx', '.mjs'] }).filter(
    (f) => !f.endsWith('.d.ts') && !f.endsWith('.d.mts'),
  );
  const knownConstants = new Set(graph.nodes.filter((n) => n.type === 'constant').map((n) => n.id));
  const sites = [];
  for (const rel of files) {
    const raw = readText(path.join(REPO, rel)) || '';
    const rawLines = raw.split('\n');
    const code = stripCommentsAndStrings(raw);
    const codeLines = code.split('\n');
    for (let i = 0; i < codeLines.length; i++) {
      const line = codeLines[i];
      OP.lastIndex = 0;
      let m;
      while ((m = OP.exec(line))) {
        const after = line.slice(m.index + m[1].length).match(NUM_AFTER);
        const before = line.slice(0, m.index).match(NUM_BEFORE);
        for (const hit of [after, before]) {
          if (!hit) continue;
          const lit = hit[1];
          if (HARMLESS.has(lit)) continue;
          const near = rawLines.slice(Math.max(0, i - 2), i + 3).join('\n');
          const cited = near.match(/constant:[a-z0-9-]+/i) || near.match(/K\.[A-Za-z][\w.]*/);
          if (cited) {
            if (knownConstants.size && cited[0].startsWith('constant:') && !knownConstants.has(cited[0])) {
              warn('literals', `${rel}:${i + 1} cites \`${cited[0]}\`, which is not a known constant group`);
            }
            continue;
          }
          sites.push({ rel, line: i + 1, lit, text: rawLines[i].trim().slice(0, 96) });
          break;
        }
      }
    }
  }
  if (sites.length) {
    const byFile = {};
    for (const s of sites) byFile[s.rel] = (byFile[s.rel] || 0) + 1;
    const worst = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
    warn('literals', `${sites.length} numeric literal(s) in comparisons under src/ with no \`constant:\`/\`K.\` reference nearby, across ${worst.length} file(s).`);
    warn('literals', `    worst offenders: ${worst.slice(0, 6).map(([f, c]) => `${f} (${c})`).join(', ')}`);
    for (const s of sites.slice(0, 12)) warn('literals', `    ${s.rel}:${s.line}  ${s.lit}   ${s.text}`);
    if (sites.length > 12) warn('literals', `    …and ${sites.length - 12} more`);
  }
  return { sites: sites.length, files: new Set(sites.map((s) => s.rel)).size };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 — every table is resolved. No page may depend on a plugin to have content.
//
// The Codex is a folder of ordinary markdown, so pointing Obsidian at it works with
// no build and no install — that is only true while the pages carry ANSWERS. A fenced
// `dataview`/`query`/`tasks`/`chart` block is deferred evaluation by a reader's
// plugin: the compiler has already worked out the same thing to build the page, so
// writing the query instead is strictly less work and strictly worse — it renders as
// a grey code block for anyone without the plugin, and a manual that needs a plugin
// installed to show its unit tables is not a manual. This was true by habit before it
// was a rule; this check exists because habit is not a guarantee.
// ─────────────────────────────────────────────────────────────────────────────

function checkResolvedTables(pages) {
  const DEFERRED = /^```\s*(dataview|dataviewjs|query|tasks|chart|dbfolder)\b/gim;
  let offenders = 0;
  for (const p of pages) {
    DEFERRED.lastIndex = 0;
    const m = p.src.match(DEFERRED);
    if (!m) continue;
    offenders++;
    fatal(
      'resolved',
      `${p.rel} defers ${m.length} table(s) to a plugin (${[...new Set(m.map((s) => s.replace(/^```\s*/, '').trim()))].join(', ')}) — the compiler must write the answer instead`,
    );
  }
  return { offenders };
}

/** EVERY NUMBER ON EVERY PAGE MUST SAY WHAT IT MEANS.
 *
 *  The acceptance test is a twelve-year-old reading the Codex cover to cover and
 *  understanding the game before ever playing it. A table cell reading
 *  "*undocumented in the file's own `fields` block*" is that test failing in
 *  public: the manual printing a number and admitting it does not know what the
 *  number is for. There were 722 of them across 177 pages, which is not an
 *  oversight anybody could have seen — no single page looked wrong, and a reader
 *  hitting one simply concludes the Codex is thin and stops trusting it.
 *
 *  FATAL, deliberately. This is the knowledge graph's equivalent of the closure
 *  check on the operational side: cheap to satisfy when a field is added, and
 *  impossible to satisfy retroactively once a hundred have piled up. A field the
 *  COMPILER synthesises rather than reads (`family`, on a trait) is documented by
 *  the miner that invents it — a field this tool invents is a field it explains. */
function checkFieldDocs(graph) {
  let undocumented = 0;
  const byFile = {};
  for (const n of graph.nodes) {
    const e = n.extra || {};
    const stats = e.stats;
    if (!stats || !e.mined_from) continue;
    const docs = e.dataFields || {};
    for (const k of Object.keys(stats)) {
      if (docs[k]) continue;
      undocumented++;
      const where = `${e.mined_from} → \`${k}\``;
      (byFile[where] = byFile[where] || []).push(n.id);
    }
  }
  for (const [where, ids] of Object.entries(byFile)) {
    fatal(
      'fields',
      `${where} appears on ${ids.length} page(s) with no entry in the file's own \`fields\` block — ` +
        `the manual is printing a number it cannot explain (e.g. ${ids[0]})`,
    );
  }
  return { undocumented, fields: Object.keys(byFile).length };
}

// ── the operational graph ───────────────────────────────────────────────────
//
// THE KNOWLEDGE GRAPH'S HONESTY LAW IS "no quote, no object". THIS IS ITS
// OPERATIONAL TWIN, and it is three questions a state machine can be asked that
// prose never can:
//
//   1. CLOSURE.  Can a case actually get into every place, and out of every place
//      that is not a declared terminal? A place nothing reaches is a state the
//      game can never be in — a rule written for a situation that cannot arise.
//      A place nothing leaves that was not MEANT to trap the case is worse: it is
//      a machine that swallows things. Neither looks broken from the page. Both
//      are exactly the operational form of an orphan, and orphans never look like
//      anything.
//
//   2. NUMBERS.  Does every guard cite a constant that is really there? A guard is
//      a condition, and a condition nobody can put a value to is a wish. This is
//      the wire from the operational graph into the knowledge graph, and a wire
//      that goes nowhere is worse than no wire, because it reads as rigour.
//
//   3. BELONGING.  Does every arrow stay inside its own machine, and does every
//      flow's declared entry and terminal really belong to it? A transition that
//      silently crosses from one machine into another is how two designs get
//      quietly welded into one nobody has read end to end.
//
// All three are FATAL. The operational graph's entire claim on a reader's trust
// is that it was checked rather than drawn.
function checkOperational(graph) {
  const nodes = graph.nodes;
  const by = (t) => nodes.filter((n) => n.type === t);
  const flows = by('flow');
  const places = by('place');
  const transitions = by('transition');
  const guards = by('guard');
  const tokens = by('token');
  if (!flows.length) return { flows: 0, places: 0, transitions: 0, unreachable: 0, dead: 0, badCites: 0, strayArrows: 0 };

  const item = (n) => (n.extra && n.extra.stats) || {};
  const placeIds = new Set(places.map((p) => p.id));
  const flowIds = new Set(flows.map((f) => f.id));
  const guardIds = new Set(guards.map((g) => g.id));
  const asList = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
  const pid = (raw) => `place:${slugify(String(raw))}`;
  const fid = (raw) => `flow:${slugify(String(raw))}`;
  const gid = (raw) => `guard:${slugify(String(raw))}`;

  // ── 1. closure, per flow ──────────────────────────────────────────────────
  const into = new Map(); // place id → count of arrows arriving
  const outOf = new Map(); // place id → count of arrows leaving
  let strayArrows = 0;
  for (const t of transitions) {
    const s = item(t);
    const flow = fid(s.flow);
    const tos = asList(s.to).map(pid);
    const froms = asList(s.from).map(pid);
    for (const p of [...tos, ...froms]) {
      if (!placeIds.has(p)) {
        fatal('operational', `${t.id} names \`${p.replace(/^place:/, '')}\`, which is not a declared place`);
      }
    }
    for (const p of tos) into.set(p, (into.get(p) || 0) + 1);
    for (const p of froms) outOf.set(p, (outOf.get(p) || 0) + 1);
    // 3. belonging — an arrow must stay inside its own machine.
    for (const p of [...tos, ...froms]) {
      const place = graph.byId.get(p);
      if (!place) continue;
      const placeFlow = fid(item(place).flow);
      if (placeFlow !== flow) {
        strayArrows++;
        fatal(
          'operational',
          `${t.id} is in ${flow} but touches ${p}, which belongs to ${placeFlow} — an arrow may not cross machines`,
        );
      }
    }
    for (const g of asList(s.guards).map(gid)) {
      if (!guardIds.has(g)) fatal('operational', `${t.id} names guard \`${g.replace(/^guard:/, '')}\`, which does not exist`);
    }
    if (!flowIds.has(flow)) fatal('operational', `${t.id} belongs to \`${s.flow}\`, which is not a declared flow`);
  }

  let unreachable = 0;
  let dead = 0;
  for (const f of flows) {
    const s = item(f);
    const entry = pid(s.entry);
    const terminals = new Set(asList(s.terminals).map(pid));
    if (!placeIds.has(entry)) fatal('operational', `${f.id} enters at \`${s.entry}\`, which is not a declared place`);
    for (const t of terminals) {
      if (!placeIds.has(t)) fatal('operational', `${f.id} names terminal \`${t.replace(/^place:/, '')}\`, which is not a declared place`);
    }
    const mine = places.filter((p) => fid(item(p).flow) === f.id);
    if (!mine.length) {
      fatal('operational', `${f.id} is a machine with no places — nothing can move through it`);
      continue;
    }
    for (const p of mine) {
      if (p.id !== entry && !(into.get(p.id) > 0)) {
        unreachable++;
        fatal('operational', `${p.id} is UNREACHABLE — it is not ${f.id}'s entry and no transition arrives at it`);
      }
      if (!terminals.has(p.id) && !(outOf.get(p.id) > 0)) {
        dead++;
        fatal('operational', `${p.id} is a DEAD END — it is not a declared terminal of ${f.id} and no transition leaves it`);
      }
      // A place declared terminal that nevertheless has a way out is a design that
      // says one thing and does another; the page would tell a reader it is the end.
      if (terminals.has(p.id) && outOf.get(p.id) > 0) {
        fatal('operational', `${p.id} is declared a terminal of ${f.id} but a transition leaves it`);
      }
    }
  }

  // ── 2. every guard cites a number that is really there ────────────────────
  const leafExists = (dotted) => {
    let cur = graph.constantsDoc;
    for (const seg of String(dotted).split('.')) {
      if (!cur || typeof cur !== 'object' || !(seg in cur)) return false;
      cur = cur[seg];
    }
    return cur !== null && typeof cur !== 'object';
  };
  let badCites = 0;
  for (const n of [...guards, ...tokens]) {
    const cites = asList(item(n).cites);
    if (!cites.length) {
      badCites++;
      fatal('operational', `${n.id} cites no constant at all — a condition nobody can put a value to is a wish`);
      continue;
    }
    for (const c of cites) {
      if (!leafExists(c)) {
        badCites++;
        fatal('operational', `${n.id} cites \`${c}\`, which is not a real number in data/constants.json`);
      }
    }
  }

  return {
    flows: flows.length,
    places: places.length,
    transitions: transitions.length,
    unreachable,
    dead,
    badCites,
    strayArrows,
  };
}

function main() {
  const graph = buildGraph();
  const pages = loadCodexPages();
  if (!pages.length) {
    console.log('lint — the Codex');
    console.log('  no pages on disk. Compile first: `npm run codex`.');
    process.exit(1);
  }

  const links = checkLinksAndOrphans(pages);
  const quotes = checkQuotes(graph);
  const standing = checkStanding(graph);
  const literals = checkLiterals(graph);
  const resolved = checkResolvedTables(pages);
  const op = checkOperational(graph);
  const fields = checkFieldDocs(graph);

  for (const b of graph.brokenData) fatal('data', `unreadable: ${b}`);
  for (const u of graph.unresolvedLinks) {
    warn('data', `declared reference to a stranger: ${u.from} → ${u.to} (dropped by the compiler, never dangled)`);
  }
  for (const m of graph.missingData) warn('data', `not yet authored: ${m} — that part of the game is simply not written yet`);
  if (graph.srcMissing) warn('data', 'not yet authored: src/ — no engine yet, so no module can back a "built" claim');
  if (graph.testMissing) warn('data', 'not yet authored: test/ — no invariants yet');
  // FATAL, not a warning: this is the exact check that exists because five files —
  // four of them core manual content (grievances, favours, answers, troop sources) —
  // once sat in `data/` completely unmined, and the report said nothing about any of
  // them. A file present on disk that nothing reads and nothing has named as
  // deliberate is not debt to note for later, it is the report lying by omission.
  for (const f of graph.unaccountedDataFiles) {
    fatal('coverage', `data/${f} is present but nothing mines it, and it is not named in DELIBERATELY_UNMINED_DATA — wire it or explain it`);
  }

  console.log('lint — the Codex' + (STRICT ? '   [--strict: every finding is fatal]' : ''));
  console.log(
    `  data coverage    ${graph.unaccountedDataFiles.length === 0 ? 'every .json file in data/ is mined or explicitly excused' : `${graph.unaccountedDataFiles.length} file(s) UNACCOUNTED — see FATAL below`}` +
      (graph.deliberatelyUnmined.length ? `  ·  ${graph.deliberatelyUnmined.length} deliberately unmined` : ''),
  );
  console.log(`  pages            ${links.pages}`);
  console.log(`  dangling links   ${links.dangling}`);
  console.log(`  orphans          ${links.orphans} unreachable  ·  ${links.unpointed} with an EMPTY Backlinks section (nothing points at the idea)  ·  ${links.backOnly} reachable only through a reverse listing`);
  console.log(`  quotes           ${quotes.checked} checked, ${quotes.failed} failed, ${quotes.unsourced} mined objects with no quote at all`);
  console.log(
    `  resolved tables  ${resolved.offenders === 0 ? 'every page carries answers, not queries — no plugin needed to read the Codex' : `${resolved.offenders} page(s) defer a table to a reader's plugin`}`,
  );
  console.log(
    `  standing drift   ${standing.claimsDone} proposed-but-claims-done, ${standing.unbacked} built-with-nothing-under-it, ${standing.noSuccessor} retired-with-no-successor`,
  );
  console.log(`  literals in guards ${literals.sites} site(s) across ${literals.files} file(s) — WARNING, informational until src/ has a shape`);
  console.log(
    fields.undocumented === 0
      ? '  field meanings   every number on every page says what it is for'
      : `  field meanings   ${fields.undocumented} cell(s) across ${fields.fields} field(s) with no explanation — see FATAL below`,
  );
  console.log(
    op.flows === 0
      ? '  operational      no flows declared — the operational graph is not built'
      : `  operational      ${op.flows} machines, ${op.places} places, ${op.transitions} arrows  ·  ` +
          `${op.unreachable} unreachable, ${op.dead} dead-end, ${op.strayArrows} crossing machines, ${op.badCites} guard(s) citing a number that is not there` +
          (op.unreachable + op.dead + op.strayArrows + op.badCites === 0 ? '  — every machine is closed and every guard has a number' : ''),
  );

  const groups = {};
  for (const f of findings.fatal) (groups[f.check] = groups[f.check] || []).push(f.msg);
  const wgroups = {};
  for (const f of findings.warn) (wgroups[f.check] = wgroups[f.check] || []).push(f.msg);

  if (findings.fatal.length) {
    console.log(`\nFATAL (${findings.fatal.length})`);
    for (const [check, msgs] of Object.entries(groups)) {
      console.log(`  ${check} — ${msgs.length}`);
      for (const m of msgs.slice(0, 20)) console.log(`    ${m}`);
      if (msgs.length > 20) console.log(`    …and ${msgs.length - 20} more`);
    }
  }
  if (findings.warn.length) {
    console.log(`\nWARN (${findings.warn.length})`);
    for (const [check, msgs] of Object.entries(wgroups)) {
      console.log(`  ${check} — ${msgs.length}`);
      for (const m of msgs.slice(0, 20)) console.log(`    ${m}`);
      if (msgs.length > 20) console.log(`    …and ${msgs.length - 20} more`);
    }
  }
  if (!findings.fatal.length && !findings.warn.length) console.log('\nThe Codex is sound.');

  process.exit(findings.fatal.length ? 1 : 0);
}

main();
