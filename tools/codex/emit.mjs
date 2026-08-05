// COMPILE — sources into pages. The first of the Codex's four verbs
// (`docs/WRIT-THE-CODEX.md`). Run it with `node tools/codex/emit.mjs`.
//
// WHY THIS EXISTS
// Ported from LandLord's Great Book (`tools/vault/emit.mjs` in the sibling `ll-public`
// repo) and re-aimed at a game manual. The acceptance test is stated once, in
// `docs/WRIT-THE-CODEX.md`, and it is worth repeating here because it drives every
// choice in this file: a smart twelve-year-old reads the Codex cover to cover and
// understands the game before ever playing it. So every page here LEADS with its
// `explains` — the plain-English lead a human already wrote — THEN the numbers as an
// already-resolved table, THEN what it beats and what beats it, THEN the rules of the
// constitution that govern it. A generated wiki that opens with a table of contents
// and buries the explanation on page three has failed the reader it was built for.
//
// THE ONE RULE, unchanged from the sibling tool: never edit a page in the Codex.
// Every page here is generated and will be overwritten on the next run — silently,
// having looked right for however long. Find the source, fix the SOURCE, re-compile.
// The footer of every page names its source.
//
// HONEST LIMITS
//   · Most of the Codex right now is `data/*.json`, mined directly — there is no
//     hand-curated `knowledge/` layer in this repo, so every mined page's "quote" IS
//     its `explains` field, verified verbatim against the JSON on every lint.
//   · `src/` and `test/` are tolerated absent (another hand is building the engine in
//     parallel) — this compiler reports the gap rather than failing on it, and every
//     game-data page starts `proposed` until the tree actually backs it.
//   · An edge from an invariant to a module means "the test FILE imports that
//     module" — a shared-source coincidence, not a claim that this one test exercises
//     that module. This will matter once `test/` exists; it is silent today.
//
// Pure Node. No install, ever. Prints COUNTS, never page bodies — this output lands in
// an orchestrating session's context and a wall of prose there is a tax on every reader.

import fs from 'node:fs';
import path from 'node:path';
import {
  REPO,
  CODEX,
  GENERATOR,
  TYPE_DIRS,
  STANDING_BANNER,
  buildGraph,
  countBy,
  degree,
} from './lib.mjs';

const NOW = new Date().toISOString();
const MARKER = '.generated-by-emit';

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

const y = (v) => JSON.stringify(v == null ? '' : String(v));

function frontmatter(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${y(item)}`);
    } else if (typeof v === 'number') lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${y(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

function standingBanner(node) {
  const s = node.standing;
  const gloss = STANDING_BANNER[s] || '';
  const loud = s === 'proposed' || s === 'contested';
  const head = `**STANDING — ${s.toUpperCase()}${loud ? ' ⚠' : ''}**`;
  const src =
    node.standing_source === 'derived'
      ? 'Derived from the tree — the code is there to be read.'
      : node.standing_source === 'defaulted'
        ? 'NOT backed by anything in the tree yet; this is the compiler\'s default for a design in `data/` with no engine behind it.'
        : `Declared in \`${node.standing_source}\`.`;
  return `> ${head}  \n> ${gloss}  \n> *${src}*\n`;
}

const SECTION_TITLE = {
  rule: 'Rules that govern it',
  writ: 'Writs that specify it',
  example: 'Worked examples',
  unit: 'Units',
  keyword: 'Keywords',
  equipment: 'Equipment',
  formation: 'Formations',
  constant: 'Governing numbers',
  order: 'Orders',
  'standing-plan': 'Standing plans',
  terrain: 'Terrain',
  trait: 'Traits',
  quirk: 'Quirks',
  seat: 'Seats',
  obligation: 'Obligations',
  holding: 'Holdings',
  grievance: 'Grievances',
  favour: 'Favours',
  answer: 'Answers',
  'troop-source': 'Troop sources',
  season: 'Seasons',
  module: 'Modules',
  invariant: 'Invariants that enforce it',
};

/** Every link is validated before it is written. What does not resolve is downgraded
 *  to plain code text and reported — never left dangling. A dangling link is a lie
 *  that looks like a road. */
function makeLinker(validPages, report) {
  return (page, fromId) => {
    if (validPages.has(page)) return `[[${page}]]`;
    report.push({ from: fromId, page });
    return `\`${page}\``;
  };
}

const ROAD_CAP = 600;

const ROAD_ORDER = [
  'rule', 'writ', 'example', 'unit', 'keyword', 'equipment', 'formation', 'constant',
  'order', 'standing-plan', 'terrain', 'trait', 'quirk', 'seat', 'obligation',
  'holding', 'grievance', 'favour', 'answer', 'troop-source', 'season', 'module', 'invariant',
];

function collapse(pairs, byId) {
  const m = new Map();
  for (const p of pairs) {
    const t = byId.get(p.id);
    if (!t) continue;
    if (!m.has(t.id)) m.set(t.id, { target: t, whys: [] });
    const row = m.get(t.id);
    if (!row.whys.includes(p.why)) row.whys.push(p.why);
  }
  for (const row of m.values()) row.whys.sort((a, b) => a.localeCompare(b));
  return [...m.values()];
}

function renderRoads(out, node, rows, link, level, cap) {
  const byType = new Map();
  for (const r of rows) {
    if (!byType.has(r.target.type)) byType.set(r.target.type, []);
    byType.get(r.target.type).push(r);
  }
  const types = [...byType.keys()].sort((a, b) => {
    const ia = ROAD_ORDER.indexOf(a), ib = ROAD_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  for (const t of types) {
    const group = byType.get(t).sort((a, b) => a.target.page.localeCompare(b.target.page));
    out.push(`${level} ${SECTION_TITLE[t] || t}\n`);
    if (t === 'invariant' || (node.type === 'invariant' && t === 'module')) {
      out.push(
        '*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*\n',
      );
    }
    for (const r of group.slice(0, cap)) {
      const why = r.whys.length > 2 ? `${r.whys.slice(0, 2).join('; ')}; +${r.whys.length - 2} more` : r.whys.join('; ');
      out.push(`- ${link(r.target.page, node.id)} — *${why}*`);
    }
    if (group.length > cap) out.push(`- *…and ${group.length - cap} more.*`);
    out.push('');
  }
}

function renderCitations(out, node, rows, byId, link, title, note) {
  const pages = [...new Set(rows.map((r) => byId.get(r.to ?? r.from)).filter(Boolean).map((t) => t.page))].sort((a, b) =>
    a.localeCompare(b),
  );
  if (!pages.length) return;
  out.push(`## ${title}\n`);
  out.push(`*${note.join(' ')}*\n`);
  for (const p of pages.slice(0, ROAD_CAP)) out.push(`- ${link(p, node.id)}`);
  if (pages.length > ROAD_CAP) out.push(`- *…and ${pages.length - ROAD_CAP} more.*`);
  out.push('');
}

/** Fields carried on every mined item that get a fixed home on the page rather than
 *  the generic numbers table — see `itemExtra` in `lib.mjs`. */
function fmtVal(v) {
  if (Array.isArray(v)) return v.map((x) => `\`${x}\``).join(', ') || '*none*';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (v === null || v === undefined || v === '') return '*unset*';
  return `\`${v}\``;
}

/** THE RESOLVED TABLE — the game-data half of the acceptance test. Works uniformly
 *  over every mined game-vocabulary type (unit, keyword, equipment, formation, and
 *  whatever lands next in `data/`), because every one of them already follows the same
 *  house convention: scalar fields become the table, `rule`/`role`/`counteredBy`/
 *  `readOnField` get their own named section. Nothing here is type-specific by name —
 *  a new data file that follows the convention renders correctly with no code change. */
function renderDataExtra(node) {
  const e = node.extra || {};
  const out = [];
  const keys = Object.keys(e.stats || {});
  if (keys.length) {
    out.push('## The numbers\n');
    const fieldDocs = e.dataFields || {};
    out.push('| field | meaning | value |', '|---|---|---|');
    for (const k of keys) {
      out.push(`| \`${k}\` | ${fieldDocs[k] ? fieldDocs[k] : '*undocumented in the file\'s own `fields` block*'} | ${fmtVal(e.stats[k])} |`);
    }
    out.push('');
  }
  if (e.rule) out.push(`## The rule\n\n${e.rule}\n`);
  if (e.usedIn) out.push(`## Where it matters\n\n${e.usedIn}\n`);
  if (e.role || e.counteredBy) {
    out.push('## What it beats, and what beats it\n');
    if (e.role) out.push(`- **Role:** ${e.role}`);
    if (e.counteredBy) out.push(`- **Countered by:** ${e.counteredBy}`);
    out.push('');
  }
  if (e.readOnField) out.push(`## What you would see on the field\n\n> ${e.readOnField}\n`);
  if (e.category) out.push(`*Shelf: \`${e.category}\` in \`${node.source_path}\`.*\n`);
  return out.join('\n');
}

/** A cell that links when the target is a real page and falls back to plain code text
 *  when it is not (a fictional in-example name with no catalog entry, say) — the same
 *  "found, never invented" discipline as every road on every other page, just applied
 *  inside a table cell instead of a `## Section`. */
function cellLink(id, label, byId, link, fromId) {
  if (id && byId.has(id)) return link(byId.get(id).page, fromId);
  return `\`${escapeCell(label ?? id ?? '—')}\``;
}
function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|');
}

/** THE WORKED EXAMPLE — `data/example-host.json` rendered whole. Coordinator's brief:
 *  "cross-linked to every unit, captain, seat and obligation it names" — every table
 *  cell that names a unit type, a seat or a quirk links to the real page when one
 *  exists (`cellLink`) and reads as plain text when it does not (a captain who exists
 *  only in this example, an invented holding — there is no catalog entry for either,
 *  so there is no link, exactly per the "never invent a road" law). */
function renderExampleExtra(node, byId, link) {
  const e = node.extra || {};
  const out = [];
  if (e.convention) out.push(`> **Reading this file:** ${e.convention}\n`);
  if (e.namesAreInvented) out.push(`> **On the names:** ${e.namesAreInvented}\n`);

  if (e.occasion) {
    const o = e.occasion;
    out.push('## The occasion\n');
    out.push(`- **Cause:** ${o.causeName ?? '—'}${o.defending ? ' (defending)' : ''}${o.onOwnLand ? ', on its own land' : ''}`);
    out.push(`- **Legitimacy:** ${fmtVal(o.legitimacy)} · **Surprise:** ${fmtVal(o.surprise)} · **Days in the field:** ${fmtVal(o.daysInTheField)}`);
    if (Array.isArray(o.homeHoldingIds) && o.homeHoldingIds.length) out.push(`- **Home holdings:** ${o.homeHoldingIds.map((h) => `\`${h}\``).join(', ')}`);
    if (o.$explains) out.push(`\n${o.$explains}\n`);
    out.push('');
  }

  if (e.command) {
    const c = e.command;
    out.push('## Command\n');
    out.push(`- **Commander:** ${escapeCell(c.commanderId ?? '—')} · **Authority:** ${fmtVal(c.authority)} · **Order capacity:** ${fmtVal(c.orderCapacity)}`);
    if (c.$explainsOrderCapacity) out.push(`\n${c.$explainsOrderCapacity}\n`);
    if (Array.isArray(c.disputes) && c.disputes.length) {
      out.push('\n**Disputes among the chain of command:**\n');
      for (const d of c.disputes) out.push(`- ${d.aId} vs. ${d.bId}, over ${d.over} (intensity ${fmtVal(d.intensity)}) — ${d.explains ?? ''}`);
    }
    out.push('');
  }

  if (e.contingents && e.contingents.length) {
    out.push('## Contingents\n');
    out.push('| contingent | raised by | captain | present / owed | disposition |', '|---|---|---|---|---|');
    for (const c of e.contingents) {
      const src = cellLink(`troop-source:${(c.source || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, c.source, byId, link, node.id);
      out.push(`| ${escapeCell(c.name ?? c.id)} | ${src} | ${escapeCell(c.captainId ?? '—')} | ${fmtVal(c.present)} / ${fmtVal(c.owed)} | ${escapeCell(c.disposition ?? '—')} |`);
    }
    out.push('');
  }

  if (e.units && e.units.length) {
    out.push('## Units in this Host\n');
    out.push('| unit | type | kind | strength | resolve / obedience |', '|---|---|---|---|---|');
    for (const u of e.units) {
      const type = cellLink(`unit:${(u.typeId || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, u.typeId, byId, link, node.id);
      out.push(`| ${escapeCell(u.name ?? u.id)} | ${type} | ${escapeCell(u.kind ?? '—')} | ${fmtVal(u.strength)} / ${fmtVal(u.paperStrength)} | ${fmtVal(u.resolve)} / ${fmtVal(u.obedience)} |`);
    }
    out.push('');
  }

  if (e.captains && e.captains.length) {
    out.push('## Captains\n');
    out.push('| captain | seat | command / valour / wits | aggression / caution / pride / greed | loyalty / grievance |', '|---|---|---|---|---|');
    for (const c of e.captains) {
      const seat = c.seatId ? cellLink(`seat:${String(c.seatId).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, c.seatId, byId, link, node.id) : '*none*';
      out.push(
        `| ${escapeCell(c.name ?? c.id)} | ${seat} | ${fmtVal(c.command)} / ${fmtVal(c.valour)} / ${fmtVal(c.wits)} | ${fmtVal(c.aggression)} / ${fmtVal(c.caution)} / ${fmtVal(c.pride)} / ${fmtVal(c.greed)} | ${fmtVal(c.loyalty)} / ${fmtVal(c.grievance)} |`,
      );
      if (c.$explains) out.push(`  *${c.$explains}*`);
    }
    out.push('');
  }

  if (e.supply) {
    const s = e.supply;
    out.push('## Supply\n');
    out.push(`- **Provision days:** ${fmtVal(s.provisionDays)} · **Sacks:** ${fmtVal(s.sacks)} · **Forage:** ${fmtVal(s.forage)} · **Physicians:** ${fmtVal(s.physicians)}`);
    if (s.$explains) out.push(`\n${s.$explains}\n`);
    out.push('');
  }

  if (e.latecomers && e.latecomers.length) {
    out.push('## Latecomers\n');
    for (const l of e.latecomers) out.push(`- ${l.explains || `arrives ${fmtVal(l.lateDays)} day(s) late, entering at ${fmtVal(l.entersAtFraction)} strength`}`);
    out.push('');
  }

  if (e.absent && e.absent.length) {
    out.push('## Who did not come\n');
    out.push('*Every absence is a finding, never a silently smaller number — see law 4, "every reading shows its working."*\n');
    out.push('| who | answer | owed / sent | why |', '|---|---|---|---|');
    for (const a of e.absent) out.push(`| ${escapeCell(a.whoName ?? a.whoId)} | ${escapeCell(a.answer ?? '—')} | ${fmtVal(a.owed)} / ${fmtVal(a.sent)} | ${escapeCell(a.reason ?? '')} |`);
    out.push('');
  }

  if (e.standing_) {
    const s = e.standing_;
    out.push('## Where the Host stands\n');
    out.push(`- **Legitimacy:** ${fmtVal(s.legitimacy)} · **Momentum:** ${fmtVal(s.momentum)} · **Belief:** ${fmtVal(s.belief)}`);
    if (s.$explains) out.push(`\n${s.$explains}\n`);
    out.push('');
  }

  if (e.notes && e.notes.length) {
    out.push('## Notes\n');
    for (const n of e.notes) out.push(`- ${n}`);
    out.push('');
  }

  return out.join('\n');
}

function renderConstantExtra(node) {
  const e = node.extra || {};
  const out = ['## The numbers\n', '| constant | value |', '|---|---|'];
  for (const { key, value } of e.numbers || []) out.push(`| \`${e.groupPath}.${key}\` | ${fmtVal(value)} |`);
  out.push('');
  if (e.chose) out.push(`## Why this number\n\n${e.chose}\n`);
  if (e.worked) {
    out.push('## Worked example\n');
    if (typeof e.worked.explains === 'string') out.push(`${e.worked.explains}\n`);
    for (const [k, v] of Object.entries(e.worked)) {
      if (k === 'explains') continue;
      out.push(`- **${k}:** ${typeof v === 'string' ? v : fmtVal(v)}`);
    }
    out.push('');
  }
  return out.join('\n');
}

function renderExtra(node, byId, link) {
  const e = node.extra || {};
  const out = [];
  if (node.type === 'example') return renderExampleExtra(node, byId, link);
  if (node.type === 'module') {
    if (e.doc) out.push(`## What the file says of itself\n\n${e.doc.split('\n').map((l) => `> ${l}`).join('\n')}\n`);
    out.push('## Shape\n');
    out.push(`- **Lines:** ${e.lines}`);
    out.push(`- **Exported symbols (${(e.symbols || []).length}):** ${(e.symbols || []).length ? (e.symbols || []).map((s) => `\`${s}\``).join(', ') : '*none*'}`);
    if ((e.assets || []).length) {
      out.push(`- **Assets it pulls in (no page, so no road):** ${[...e.assets].sort().map((a) => `\`${a}\``).join(', ')}`);
    }
    out.push('');
    return out.join('\n');
  }
  if (node.type === 'invariant') {
    out.push('## Where it is enforced\n');
    out.push(`- **Suite:** \`${e.suite}:${node.source_line}\``);
    if ((e.ancestry || []).length) out.push(`- **Under:** ${e.ancestry.map((a) => `*${a}*`).join(' › ')}`);
    out.push('');
    return out.join('\n');
  }
  if (node.type === 'writ') {
    if ((e.headings || []).length) {
      out.push('## Outline\n');
      for (const h of e.headings.slice(0, 80)) out.push(`${'  '.repeat(Math.max(0, h.depth - 2))}- ${h.text}`);
      if (e.headings.length > 80) out.push(`- *…and ${e.headings.length - 80} more headings.*`);
      out.push('');
    }
    return out.join('\n');
  }
  if (node.type === 'rule') return ''; // the law's own text IS the page; nothing more to add
  if (node.type === 'flow') return renderFlowExtra(node, byId, link);
  if (node.type === 'constant') return renderConstantExtra(node);
  return renderDataExtra(node); // every mined game-vocabulary kind, uniformly
}

/** A FLOW PAGE DRAWS ITS MACHINE. Every other page in the Codex describes a thing;
 *  this one has to show a shape, and a list of fields is not a shape. The reader who
 *  matters here is the twelve-year-old with the manual and no game to play yet — he
 *  should be able to trace a unit from steady to destroyed with a finger.
 *
 *  Everything below is RESOLVED at compile time: the diagram is plain text and the
 *  tables carry answers, so `codex/` opens in any editor, on any machine, with no
 *  plugin and no build step (see "Every table is resolved" in the writ). Nothing here
 *  is authored — the compiler reads the flow's own places and transitions back out of
 *  the graph, which is why the picture cannot drift from the machine it describes. */
function renderFlowExtra(node, byId, link) {
  const e = node.extra || {};
  const s = e.stats || {};
  const out = [];
  const all = [...byId.values()];
  const mine = (t) => all.filter((n) => n.type === t && (n.extra?.stats?.flow ?? '') === node.id.replace(/^flow:/, ''));
  const places = mine('place');
  const arrows = mine('transition');
  const asList = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
  const placeById = new Map(places.map((p) => [p.id.replace(/^place:/, ''), p]));
  const nameOf = (bare) => placeById.get(bare)?.page ?? bare;
  const cell = (bare) => (placeById.has(bare) ? link(placeById.get(bare).page, node.id) : `\`${bare}\``);
  const entry = String(s.entry ?? '');
  const terminals = new Set(asList(s.terminals).map(String));

  if (!places.length) return renderDataExtra(node);

  // ── the diagram ──────────────────────────────────────────────────────────
  // Walked breadth-first from the entry so the order on the page is the order a
  // case actually meets the states, not the order they happen to sit in the file.
  const outFrom = new Map();
  for (const a of arrows) {
    for (const f of asList(a.extra?.stats?.from).map(String)) {
      if (!outFrom.has(f)) outFrom.set(f, []);
      outFrom.get(f).push(a);
    }
  }
  const order = [];
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || seen.has(cur) || !placeById.has(cur)) continue;
    seen.add(cur);
    order.push(cur);
    for (const a of outFrom.get(cur) || []) {
      const to = String(a.extra?.stats?.to ?? '');
      if (!seen.has(to)) queue.push(to);
    }
  }
  for (const p of places) {
    const bare = p.id.replace(/^place:/, '');
    if (!seen.has(bare)) order.push(bare); // never silently drop one; the lint says why
  }

  out.push('## The machine\n');
  out.push(`*A \`${escapeCell(String(s.carries ?? 'case'))}\` moves through this, stepped every **${escapeCell(String(s.runsEvery ?? '—'))}**.*\n`);
  out.push('```text');
  for (const bare of order) {
    const mark = bare === entry ? '▶' : terminals.has(bare) ? '■' : '·';
    out.push(`${mark} ${nameOf(bare)}`);
    const outs = outFrom.get(bare) || [];
    if (!outs.length && terminals.has(bare)) out.push('      (rests here)');
    for (const a of outs) {
      const to = String(a.extra?.stats?.to ?? '');
      const gs = asList(a.extra?.stats?.guards).length;
      out.push(`   └─▶ ${nameOf(to)}   — ${a.page}${gs ? `  [${gs} guard${gs > 1 ? 's' : ''}]` : ''}`);
    }
  }
  out.push('```\n');
  out.push('*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*\n');

  // ── the states ───────────────────────────────────────────────────────────
  out.push('## Every state it can be in\n');
  out.push('| state | in the engine | what you would see | role |', '|---|---|---|---|');
  for (const bare of order) {
    const p = placeById.get(bare);
    if (!p) continue;
    const st = p.extra?.stats?.state;
    out.push(
      `| ${cell(bare)} | ${st ? `\`${escapeCell(st)}\`` : '*no single named value in the tree yet*'} ` +
        `| ${escapeCell(p.extra?.readOnField || '—')} ` +
        `| ${bare === entry ? '**entry**' : terminals.has(bare) ? '**rests here**' : '—'} |`,
    );
  }
  out.push('');

  // ── the arrows ───────────────────────────────────────────────────────────
  if (arrows.length) {
    out.push('## Every way it can move\n');
    out.push('| from | to | on | must be true | what it costs |', '|---|---|---|---|---|');
    for (const bare of order) {
      for (const a of outFrom.get(bare) || []) {
        const st = a.extra?.stats || {};
        const gs = asList(st.guards)
          .map((g) => {
            const gn = byId.get(`guard:${String(g)}`);
            return gn ? link(gn.page, node.id) : `\`${g}\``;
          })
          .join('; ');
        out.push(
          `| ${cell(bare)} | ${cell(String(st.to ?? ''))} | ${escapeCell(String(st.on ?? '—'))} ` +
            `| ${gs || '*nothing — it fires on the event alone*'} | ${escapeCell(String(st.cost ?? '—'))} |`,
        );
      }
    }
    out.push('');
  }

  out.push(renderDataExtra(node));
  return out.join('\n');
}

function renderNode(node, byId, link) {
  const out = [];
  out.push(
    frontmatter({
      type: node.type,
      id: node.id,
      title: node.page,
      standing: node.standing,
      standing_source: node.standing_source,
      source_path: node.source_path,
      source_line: node.source_line,
      origin: node.origin,
      // NO TIMESTAMP ON A PAGE — a clock here would rewrite every file on every
      // compile, and `git diff codex/` would answer "what changed?" with
      // "everything", the exact failure byte-determinism exists to prevent. The
      // build stamp lives in `codex/maps/INDEX.md` alone, which may churn freely.
      generator: GENERATOR,
      tags: node.tags,
      aliases: [node.id],
    }),
  );
  out.push(`# ${node.page}\n`);
  out.push(standingBanner(node));

  // THE EXPLANATION LEADS. This is a manual, not a legal filing — the plain-English
  // `explains` a human already wrote comes first, full stop, before any number.
  if (node.summary) out.push(`${node.summary}\n`);

  // "NO QUOTE, NO OBJECT" stays load-bearing even though the lead prose above and the
  // verified quote are usually the same text for a mined page — showing the identical
  // paragraph twice would just be noise. Only show a separate quote block when it
  // actually differs (a writ's quote is its full first paragraph; its summary is a
  // truncation of the same, so this still collapses to the one-line note there too
  // once truncation does not occur — either way nothing is asserted twice for nothing).
  if (node.quote && node.quote !== node.summary) {
    out.push('## The source, verbatim\n');
    out.push(node.quote.split('\n').map((l) => `> ${l}`).join('\n') + '\n');
    out.push(`*Verified against \`${node.source_path}\`${node.source_line ? `:${node.source_line}` : ''} on every lint — no quote, no object.*\n`);
  } else if (node.quote) {
    out.push(`*Verified verbatim against \`${node.source_path}\`${node.source_line ? `:${node.source_line}` : ''} on every lint — no quote, no object.*\n`);
  }

  // THE NUMBERS, ALREADY RESOLVED. No table on any page here is a query — see
  // `docs/WRIT-THE-CODEX.md`'s "every table is resolved" law.
  const extra = renderExtra(node, byId, link);
  if (extra) out.push(extra);

  // WHAT IT BEATS, WHAT BEATS IT, AND WHERE IT SITS IN THE RULES — outbound roads,
  // then inbound, grouped by what stands at the far end.
  const ideaOut = node.edges.filter((e) => e.kind !== 'file');
  const fileOut = node.edges.filter((e) => e.kind === 'file');
  const ideaIn = node.backlinks.filter((b) => b.kind !== 'file');
  const fileIn = node.backlinks.filter((b) => b.kind === 'file');

  renderRoads(out, node, collapse(ideaOut.map((e) => ({ id: e.to, why: e.why })), byId), link, '##', ROAD_CAP);
  out.push('## Backlinks\n');
  if (!ideaIn.length) {
    out.push(
      '*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*\n',
    );
  } else {
    renderRoads(out, node, collapse(ideaIn.map((b) => ({ id: b.from, why: b.why })), byId), link, '###', ROAD_CAP);
  }

  renderCitations(out, node, fileIn, byId, link, 'Documents that cite this source', [
    'These name this FILE by its path. That is a citation of the source, not a claim about any',
    'one idea inside it — do not read a path citation as agreement, dependence or implementation.',
  ]);
  renderCitations(out, node, fileOut, byId, link, 'Sources this page cites', [
    'Files this page names by path. Again: a citation of the file, nothing more.',
  ]);

  out.push('---\n');
  out.push(
    `*Generated by \`${GENERATOR}\` from \`${node.source_path || '(no source on disk)'}\`${node.source_line ? `:${node.source_line}` : ''}. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (\`npm run codex\`).*`,
  );
  return out.join('\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// The map of content
// ─────────────────────────────────────────────────────────────────────────────

function renderIndex(nodes, byId, link, graph, indexPage) {
  const out = [];
  out.push(
    frontmatter({
      type: 'map',
      id: 'map:index',
      title: indexPage,
      standing: 'built',
      standing_source: 'derived',
      source_path: GENERATOR,
      generated: NOW,
      generator: GENERATOR,
      aliases: ['map:index'],
    }),
  );
  out.push(`# ${indexPage}\n`);
  out.push(
    '*Every page below is GENERATED. Never edit one — find the source named in its footer, fix that, and re-compile. The only hand-written page in the Codex is `00 START HERE.md`.*\n',
  );

  // THE DATA COVERAGE AUDIT — loud, and first, on purpose. This is the check that
  // exists because five files (four of them core manual content) once sat in `data/`
  // silently unmined, and nothing in the report said so until someone went looking by
  // hand. `npm run codex:lint` makes this fatal; here it stands at the top of the map
  // so a reader never has to scroll to find out the report is trustworthy.
  if (graph.unaccountedDataFiles.length) {
    out.push('## ⚠ DATA FILES PRESENT BUT NOT MINED — this is the failure mode to fear\n');
    out.push(
      `*${graph.unaccountedDataFiles.length} file(s) sit in \`data/\` that nothing in \`tools/codex/lib.mjs\` reads. A silent one of these is exactly how the manual once went four files short of the truth. Wire it in \`DATA_SOURCES\` (or a dedicated miner), or name it in \`DELIBERATELY_UNMINED_DATA\` with a reason — silence is the only wrong answer.*\n`,
    );
    for (const f of graph.unaccountedDataFiles) out.push(`- \`data/${f}\``);
    out.push('');
  } else {
    out.push(
      `*Data coverage: every \`.json\` file in \`data/\` is accounted for — mined, or named in \`DELIBERATELY_UNMINED_DATA\` with a reason. \`npm run codex:lint\` re-checks this on every run and fails if a new file ever slips through silently.*\n`,
    );
  }
  if (graph.deliberatelyUnmined.length) {
    out.push('**Deliberately not mined:**\n');
    for (const d of graph.deliberatelyUnmined) out.push(`- \`data/${d.file}\` — ${d.reason}`);
    out.push('');
  }

  const byType = countBy(nodes, 'type');
  const byStanding = countBy(nodes, 'standing');
  out.push('## The count\n');
  out.push('| kind | pages |', '|---|---:|');
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
    out.push(`| ${t} | ${c} |`);
  out.push(`| **all** | **${nodes.length}** |`, '');
  out.push('| standing | pages |', '|---|---:|');
  for (const [s, c] of Object.entries(byStanding).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
    out.push(`| ${s} | ${c} |`);
  out.push('');

  const defaulted = nodes.filter((n) => n.standing_source === 'defaulted');
  if (defaulted.length) {
    out.push(
      `> **${defaulted.length} page${defaulted.length === 1 ? '' : 's'} carry a DEFAULTED standing** — a design in \`data/\` with nothing in the tree behind it yet. That is the honest, expected state before the engine exists; watch this number fall as \`src/\` and \`test/\` are built.\n`,
    );
  }

  const proposed = nodes.filter((n) => n.standing === 'proposed');
  out.push('## PROPOSED — not built, and never evidence that the game plays this way ⚠\n');
  out.push(
    '*A proposed design rendered beside a built one, both in plain prose, is exactly the failure this axis exists to prevent — see `docs/WRIT-THE-CODEX.md`. These are designs. None of them is a build.*\n',
  );
  if (!proposed.length) out.push('*None.*\n');
  for (const n of proposed.sort((a, b) => a.page.localeCompare(b.page)).slice(0, 200)) {
    out.push(`- ${link(n.page, 'map:index')} — \`${n.source_path}\``);
  }
  if (proposed.length > 200) out.push(`- *…and ${proposed.length - 200} more.*`);
  out.push('');

  const contested = nodes.filter((n) => n.standing === 'contested');
  out.push('## CONTESTED — two designs disagreed, nobody has ruled\n');
  if (!contested.length) out.push('*None. (That is not the same as everything agreeing — it means nothing has been marked.)*\n');
  for (const n of contested.sort((a, b) => a.page.localeCompare(b.page))) {
    out.push(`- ${link(n.page, 'map:index')} — \`${n.source_path}\``);
  }
  out.push('');

  const retired = nodes.filter((n) => n.standing === 'retired');
  if (retired.length) {
    out.push('## RETIRED — kept for history, never cited as current\n');
    for (const n of retired.sort((a, b) => a.page.localeCompare(b.page))) out.push(`- ${link(n.page, 'map:index')}`);
    out.push('');
  }

  out.push('## Load-bearing — what the rest of the game leans on\n');
  out.push('*Ranked by roads in plus roads out. A high count means many pages would move if this one did.*\n');
  out.push('| page | kind | standing | roads |', '|---|---|---|---:|');
  for (const n of [...nodes].sort((a, b) => degree(b) - degree(a) || a.page.localeCompare(b.page)).slice(0, 30)) {
    out.push(`| ${link(n.page, 'map:index')} | ${n.type} | ${n.standing} | ${degree(n)} |`);
  }
  out.push('');

  out.push('## Ways in\n');
  const entries = [];
  const kingdom = byId.get('writ:docs/KINGDOM.md');
  if (kingdom) entries.push([kingdom, 'the constitution — it wins until amended']);
  const battle = byId.get('writ:docs/WRIT-THE-BATTLE.md');
  if (battle) entries.push([battle, 'the implementable spec of the battle']);
  const court = byId.get('writ:docs/WRIT-THE-COURT.md');
  if (court) entries.push([court, 'the implementable spec of the court']);
  const codexWrit = byId.get('writ:docs/WRIT-THE-CODEX.md');
  if (codexWrit) entries.push([codexWrit, 'the law that keeps this Codex honest']);
  for (const [n, why] of entries) out.push(`- ${link(n.page, 'map:index')} — *${why}*`);
  out.push('');

  out.push('## Every shelf\n');
  for (const [type, dir] of Object.entries(TYPE_DIRS)) {
    const count = nodes.filter((n) => n.type === type).length;
    if (!count && type !== 'map') continue;
    out.push(`- \`codex/${dir}/\` — ${count} ${type} page${count === 1 ? '' : 's'}`);
  }
  out.push('');

  const gaps = [
    ...graph.missingData.map((m) => `- **not yet authored:** \`${m}\` — nothing mined from it, and nothing invented in its place.`),
    ...(graph.srcMissing ? ["- **not yet authored:** `src/` — no engine yet, so every game-data page is `proposed` until it exists."] : []),
    ...(graph.testMissing ? ["- **not yet authored:** `test/` — no invariants yet."] : []),
    ...graph.brokenData.map((b) => `- **unreadable:** ${b}`),
  ];
  const un = [...graph.unresolvedLinks].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)).slice(0, 20);
  for (const u of un) gaps.push(`- **declared reference to a stranger:** \`${u.from}\` → \`${u.to}\` (dropped, never dangled).`);
  if (graph.unresolvedLinks.length > 20) gaps.push(`- *…and ${graph.unresolvedLinks.length - 20} more dropped references.*`);
  if (gaps.length) {
    out.push('## What the compiler could not read\n');
    out.push(...gaps);
    out.push('');
  }

  out.push('---\n');
  out.push(
    `*Generated by \`${GENERATOR}\` at ${NOW}. This is the ONLY page carrying a build time — the rest hold no clock, so \`git diff codex/\` shows what actually changed. Re-compile with \`npm run codex\`; check it with \`npm run codex:lint\`; ask it a question with \`npm run codex:trace -- "<subject>"\` — the \`--\` is npm's, not ours, and without it npm swallows the subject.*`,
  );
  return out.join('\n') + '\n';
}

const START_HERE = `# Start here — the Codex

*This is the ONLY hand-written page in the Codex. The compiler wrote it once and will
never touch it again. Everything else under \`codex/\` is generated and will be
overwritten on the next run — a correction made to a generated page is gone at the
next compile, and gone silently, having looked right for however long.*

**Find the source, fix the source, re-compile.** The footer of every page names its
source. This Codex is the manual that came in the case: read it cover to cover and you
should understand Vassal Vessels before ever fighting a battle.

## The four verbs

| verb | command | what it does |
|---|---|---|
| **compile** | \`npm run codex\` | sources → pages. Deletes and rewrites its own shelves. |
| **query** | \`npm run codex:trace -- "<subject>"\` | one subject across every layer at once — rule, writ, unit, keyword, equipment, formation, constant. |
| **lint** | \`npm run codex:lint\` | dangling links, orphans, missing quotes, standing drift, literals in guards, deferred tables. |
| **read** | \`npm run codex:html\` | the whole Codex as one self-contained page. |
| **fix** | *— edit a source, then compile* | there is no fix-in-place. |

## Where to change a thing

| To change… | Edit |
|---|---|
| a numbered law, a term, the canon | \`docs/KINGDOM.md\` — the constitution |
| the implementable formulas | \`docs/WRIT-THE-BATTLE.md\` or \`docs/WRIT-THE-COURT.md\` |
| a unit, a keyword, a weapon, a formation | the matching \`data/*.json\` file — never a page here |
| a governing number (a cap, a rate, a threshold) | \`data/constants.json\` — **never a literal in the code** |
| what the engine actually does | the code under \`src/\`, once it exists; then re-compile |
| this compiler itself | \`tools/codex/\` — see \`docs/WRIT-THE-CODEX.md\` |

## Read the standing before you believe the page

Every page renders its standing on its face. \`canon\` is the constitution and wins
until amended. \`built\` is in the tree and checkable — a module or a test stands under
it. **\`proposed\` is a design in \`data/\` with no engine reading it yet, and may NEVER
be cited as evidence that the game plays this way.** \`contested\` means two designs
disagreed and nobody has ruled. Most of the Codex is \`proposed\` right now, honestly,
because the engine has not been built yet — watch that change as \`src/\` and \`test/\`
fill in.

→ [[Map of the Codex]]

*This page is yours. A durable hand-written note goes here, or it goes in a source.*
`;

// ─────────────────────────────────────────────────────────────────────────────
// Writing — delete and rewrite the shelves this compiler owns, and nothing else
// ─────────────────────────────────────────────────────────────────────────────

function sweepShelves() {
  if (!fs.existsSync(CODEX)) return 0;
  let swept = 0;
  const owned = new Set(Object.values(TYPE_DIRS));
  for (const e of fs.readdirSync(CODEX, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const abs = path.join(CODEX, e.name);
    const isOwned = owned.has(e.name) || fs.existsSync(path.join(abs, MARKER));
    if (!isOwned) continue; // never sweep a shelf this compiler did not build
    fs.rmSync(abs, { recursive: true, force: true });
    swept++;
  }
  return swept;
}

function main() {
  const graph = buildGraph();
  const { nodes, byId } = graph;

  const indexPage = 'Map of the Codex';
  const validPages = new Set(nodes.map((n) => n.page));
  validPages.add(indexPage);
  validPages.add('Start here — the Codex');

  const downgraded = [];
  const link = makeLinker(validPages, downgraded);

  const written = [];
  for (const n of nodes) written.push([n.file, renderNode(n, byId, link)]);
  written.push([`codex/${TYPE_DIRS.map}/INDEX.md`, renderIndex(nodes, byId, link, graph, indexPage)]);

  sweepShelves();
  fs.mkdirSync(CODEX, { recursive: true });
  const dirs = new Set();
  for (const [rel, body] of written) {
    const abs = path.join(REPO, rel);
    const dir = path.dirname(abs);
    if (!dirs.has(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, MARKER), `written by ${GENERATOR}; this whole shelf is deleted and rewritten every compile\n`);
      dirs.add(dir);
    }
    fs.writeFileSync(abs, body);
  }

  const startHere = path.join(CODEX, '00 START HERE.md');
  let startHereMade = false;
  if (!fs.existsSync(startHere)) {
    fs.writeFileSync(startHere, START_HERE);
    startHereMade = true;
  }

  // ── the report: counts only ──
  const byType = countBy(nodes, 'type');
  const byStanding = countBy(nodes, 'standing');
  const edges = nodes.reduce((a, n) => a + n.edges.length, 0);
  const inbound = new Map();
  for (const [rel, body] of written) {
    for (const m of body.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
      const page = m[1].trim();
      if (!inbound.has(page)) inbound.set(page, new Set());
      inbound.get(page).add(rel);
    }
  }
  const orphans = nodes.filter((n) => {
    const froms = inbound.get(n.page);
    return !froms || ![...froms].some((f) => f !== n.file);
  }).length;

  const pad = (s, w) => String(s).padEnd(w);
  console.log(`compile — the Codex · ${NOW}`);
  if (graph.unaccountedDataFiles.length) {
    console.log(`  ⚠ UNMINED DATA  ${graph.unaccountedDataFiles.length} file(s) in data/ that nothing reads: ${graph.unaccountedDataFiles.map((f) => `data/${f}`).join(', ')}`);
    console.log('                  wire it in tools/codex/lib.mjs DATA_SOURCES, or name it in DELIBERATELY_UNMINED_DATA with a reason');
  } else {
    console.log('  data coverage   every .json file in data/ is accounted for (mined, or deliberately-unmined with a reason)');
  }
  console.log(`  pages written   ${written.length}   (${Object.keys(byType).length} kinds, ${edges} roads)`);
  console.log('  by kind        ' + Object.entries(byType).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k}=${v}`).join('  '));
  console.log('  by standing    ' + Object.entries(byStanding).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k}=${v}`).join('  '));
  console.log(`  mined / derived ${nodes.filter((n) => n.origin === 'mined').length} / ${nodes.filter((n) => n.origin === 'derived').length}`);
  console.log(`  defaulted standing ${nodes.filter((n) => n.standing_source === 'defaulted').length}`);
  console.log(`  orphan pages    ${orphans}   (nothing points at them — see \`codex:lint\`)`);
  console.log(`  links downgraded ${downgraded.length}   (unresolvable, written as plain text, never dangled)`);
  for (const d of downgraded.slice(0, 10)) console.log(`      ${pad(d.from, 40)} → ${d.page}`);
  if (graph.duplicateIds.length) console.log(`  duplicate ids   ${graph.duplicateIds.length} (first mined kept)`);
  if (graph.unresolvedLinks.length) console.log(`  dropped refs    ${graph.unresolvedLinks.length} (named a node that does not exist)`);
  for (const m of graph.missingData) console.log(`  not yet authored  ${m} — emitted nothing for it, invented nothing in its place`);
  if (graph.srcMissing) console.log('  not yet authored  src/ — no engine yet; every game-data page stands \'proposed\' until it exists');
  if (graph.testMissing) console.log('  not yet authored  test/ — no invariants yet');
  for (const b of graph.brokenData) console.log(`  UNREADABLE      ${b}`);
  if (startHereMade) console.log('  wrote           codex/00 START HERE.md (once — never overwritten again)');
  console.log(`  map             codex/${TYPE_DIRS.map}/INDEX.md`);
}

main();
