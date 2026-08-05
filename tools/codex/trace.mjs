// TRACE — one subject across every layer at once.
// `node tools/codex/trace.mjs "<subject>"`   (see `docs/WRIT-THE-CODEX.md`)
//
// THROUGH NPM THE `--` IS REQUIRED — npm eats everything after the script name unless
// you separate it, so the subject silently vanishes and you get the usage banner:
//     npm run codex:trace -- "can brace"        ✔ the subject reaches this tool
//     npm run codex:trace "can brace"           ✘ npm keeps it; trace sees no argument
// Called directly (`node tools/codex/trace.mjs "can brace"`) no separator is needed.
//
// WHY THIS EXISTS
// Ported unchanged in purpose from the sibling repo's `tools/vault/trace.mjs`: this is
// the verb that replaces grepping. Grep finds a string. It does not tell you that the
// unit you are reading already has a LAW governing it, a KEYWORD it carries, an
// EQUIPMENT choice it makes, a FORMATION it can hold, and a GOVERNING NUMBER that sets
// exactly how hard it hits. One subject, every layer, one screen.
//
// HOW IT MATCHES — literals only, same as the compiler:
//   ids · labels · exported symbols · source paths · summaries · verbatim quotes.
// Never prose similarity. A hit is a hit because a word is really there.
//
// HONEST LIMITS
//   · It ranks by how many LAYERS a subject touches, so a subject that is only a unit
//     name will rank below one that also has a law and a keyword. That is deliberate
//     — the wide answer is the one you came for — but a narrow, correct hit can sit
//     below a broad, looser one. Both are printed.
//   · The "connected" rows are ONE HOP from a direct hit along a found edge. They are
//     neighbours, not matches.
//   · It re-derives the graph from the tree on every run and does NOT read the
//     compiled pages, so it is never stale — but it will not know about a page you
//     hand-wrote.
//
// Pure Node. No install, ever.

import fs from 'node:fs';
import path from 'node:path';
import { REPO, buildGraph, degree, escapeRe, normalizeWs } from './lib.mjs';

/** A page with more roads than this is a HUB — `docs/KINGDOM.md` touches nearly
 *  everything. Its neighbours tell you nothing about your subject, so trace does not
 *  walk out of one. HONEST LIMIT: a genuine neighbour reachable only through a hub
 *  will not be shown. */
const HUB_DEGREE = 40;

const LAYERS = [
  ['rule', 'LAWS that govern it'],
  ['writ', 'WRITS that specify it'],
  ['unit', 'UNITS'],
  ['keyword', 'KEYWORDS'],
  ['equipment', 'EQUIPMENT'],
  ['formation', 'FORMATIONS'],
  ['constant', 'GOVERNING NUMBERS'],
  ['order', 'ORDERS'],
  ['standing-plan', 'STANDING PLANS'],
  ['terrain', 'TERRAIN'],
  ['trait', 'TRAITS'],
  ['quirk', 'QUIRKS'],
  ['seat', 'SEATS'],
  ['obligation', 'OBLIGATIONS'],
  ['holding', 'HOLDINGS'],
  ['season', 'SEASONS'],
  ['module', 'MODULES that implement it'],
  ['invariant', 'INVARIANTS that enforce it'],
];

const LOUD = { proposed: 'PROPOSED — not built', contested: 'CONTESTED', retired: 'RETIRED' };

function scoreNode(node, terms) {
  const fields = [
    [node.id, 10, 'id'],
    [node.label, 8, 'label'],
    [(node.extra.symbols || []).join(' '), 7, 'exported symbol'],
    [node.source_path, 5, 'path'],
    [node.summary, 3, 'summary'],
    [node.quote, 2, 'quote'],
    [node.body, 2, 'body'],
    [(node.extra.role || '') + ' ' + (node.extra.counteredBy || '') + ' ' + (node.extra.rule || ''), 3, 'game text'],
    [(node.extra.ancestry || []).join(' '), 3, 'suite'],
    [(node.extra.headings || []).map((h) => h.text).join(' '), 2, 'heading'],
  ];
  let total = 0;
  const hitTerms = new Set();
  const why = new Set();
  for (const t of terms) {
    let best = 0;
    let bestWhy = '';
    for (const [text, weight, name] of fields) {
      if (!text) continue;
      const hay = String(text).toLowerCase();
      if (!t.re.test(hay)) continue;
      if (weight > best) {
        best = weight;
        bestWhy = name;
      }
    }
    if (best) {
      total += best;
      hitTerms.add(t.raw);
      why.add(bestWhy);
    }
  }
  return { total, matched: hitTerms.size, why: [...why] };
}

function excerpt(node, terms) {
  const pools = [node.summary, node.quote, node.body, node.extra.role, node.extra.counteredBy, node.extra.rule].filter(Boolean);
  for (const p of pools) {
    const flat = normalizeWs(p);
    for (const t of terms) {
      const i = flat.toLowerCase().indexOf(t.plain);
      if (i === -1) continue;
      const from = Math.max(0, i - 40);
      return (from ? '…' : '') + flat.slice(from, from + 130) + (flat.length > from + 130 ? '…' : '');
    }
  }
  return normalizeWs(node.summary || node.label).slice(0, 130);
}

function main() {
  const subject = process.argv.slice(2).filter((a) => !a.startsWith('--')).join(' ').trim();
  if (!subject) {
    console.log('trace — one subject across every layer of the Codex');
    console.log('  usage: node tools/codex/trace.mjs "<subject>"');
    console.log('  e.g.:  node tools/codex/trace.mjs "can brace"');
    console.log('         node tools/codex/trace.mjs militia-spears');
    console.log('         node tools/codex/trace.mjs data/units.json');
    process.exit(2);
  }
  const wide = process.argv.includes('--all');
  const cap = wide ? 40 : 8;

  const terms = subject
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, plain: raw.toLowerCase(), re: new RegExp(escapeRe(raw.toLowerCase()), 'i') }));

  const graph = buildGraph();
  const scored = [];
  for (const n of graph.nodes) {
    const s = scoreNode(n, terms);
    if (s.matched) scored.push({ node: n, ...s });
  }
  const full = scored.filter((s) => s.matched === terms.length);
  const direct = full.length ? full : scored;
  direct.sort((a, b) => b.total - a.total || a.node.id.localeCompare(b.node.id));

  if (!direct.length) {
    console.log(`trace "${subject}" — nothing in the Codex names it.`);
    console.log('  Nothing found is a real answer: no law, no unit, no keyword, no equipment, no constant.');
    console.log('  Before you build it, that means there is no prior art AND no permission. Check `docs/KINGDOM.md`.');
    process.exit(0);
  }

  const directIds = new Set(direct.map((d) => d.node.id));
  const near = new Map();
  let hubsSkipped = 0;
  for (const d of direct.slice(0, 12)) {
    if (degree(d.node) > HUB_DEGREE) {
      hubsSkipped++;
      continue;
    }
    for (const e of d.node.edges) if (!directIds.has(e.to)) near.set(e.to, { via: d.node, why: e.why });
    for (const b of d.node.backlinks) if (!directIds.has(b.from)) near.set(b.from, { via: d.node, why: b.why });
  }

  const layersHit = new Set(direct.map((d) => d.node.type));
  console.log(`trace "${subject}"`);
  console.log(
    `  ${direct.length} direct hit${direct.length === 1 ? '' : 's'} across ${layersHit.size} layer${layersHit.size === 1 ? '' : 's'}` +
      `  ·  ${near.size} one hop away` +
      (hubsSkipped ? `  ·  ${hubsSkipped} hub page(s) not walked out of` : '') +
      (full.length ? '' : '  ·  no page holds every word — showing partial matches'),
  );

  const warnings = direct.filter((d) => LOUD[d.node.standing]);
  if (warnings.length) {
    console.log('');
    console.log('  ⚠ READ THE STANDING BEFORE YOU ACT');
    for (const w of warnings.slice(0, 6)) {
      console.log(`      ${LOUD[w.node.standing]} — ${w.node.label.slice(0, 84)}  (${w.node.source_path})`);
    }
    if (warnings.length > 6) console.log(`      …and ${warnings.length - 6} more`);
  }

  const known = new Set(LAYERS.map(([t]) => t));
  const extraTypes = [...new Set(direct.map((d) => d.node.type))].filter((t) => !known.has(t)).map((t) => [t, t.toUpperCase()]);

  for (const [type, title] of [...LAYERS, ...extraTypes]) {
    const rows = direct.filter((d) => d.node.type === type);
    const hops = [...near.entries()]
      .map(([id, v]) => ({ node: graph.byId.get(id), ...v }))
      .filter((h) => h.node && h.node.type === type);
    if (!rows.length && !hops.length) continue;
    console.log(`\n  ${title}  (${rows.length}${hops.length ? ` + ${hops.length} near` : ''})`);
    for (const r of rows.slice(0, cap)) {
      const where = r.node.source_path ? `${r.node.source_path}${r.node.source_line ? `:${r.node.source_line}` : ''}` : '—';
      const flag = LOUD[r.node.standing] ? ` [${r.node.standing.toUpperCase()}]` : '';
      console.log(`    · ${r.node.label.slice(0, 96)}${flag}`);
      console.log(`        ${where}   (${r.node.standing}, matched on ${r.why.join('+')})`);
      const ex = excerpt(r.node, terms);
      if (ex && ex !== r.node.label) console.log(`        ${ex}`);
      if (r.node.file && fs.existsSync(path.join(REPO, r.node.file))) console.log(`        page: ${r.node.file}`);
    }
    if (rows.length > cap) console.log(`    · …and ${rows.length - cap} more direct hit(s) — re-run with --all`);
    const nearCap = wide ? 12 : 3;
    for (const h of hops.slice(0, nearCap)) {
      console.log(`    ~ ${h.node.label.slice(0, 88)}   (near: ${h.why})`);
    }
    if (hops.length > nearCap) console.log(`    ~ …and ${hops.length - nearCap} more one hop away`);
  }

  const missing = LAYERS.filter(([t]) => !layersHit.has(t) && graph.nodes.some((n) => n.type === t)).map(([t]) => t);
  if (missing.length) {
    console.log(`\n  NO ${missing.map((m) => m.toUpperCase()).join(', ')} NAMES this subject (some may still stand one hop away, marked ~).`);
    if (missing.includes('invariant')) console.log('      Nothing in the test suite enforces it — a change here breaks no test.');
    if (missing.includes('constant')) console.log('      No governing number in `data/constants.json` is tied to it.');
    if (missing.includes('rule')) console.log('      No ratified law in `docs/KINGDOM.md` governs it; you are on open ground.');
  }
  console.log('');
}

main();
