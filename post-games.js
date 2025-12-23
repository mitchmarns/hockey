// post-games.js (Node 20+; CommonJS)
const fs = require("node:fs/promises");
const path = require("node:path");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TODAY = process.env.DATE || new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

const ROSTERS_PATH = path.join(process.cwd(), "rosters.json");
const POSTED_PATH = path.join(process.cwd(), "data", "posted.json");

function must(v, msg) {
  if (!v) throw new Error(msg);
  return v;
}

function fmt(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : "—";
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, obj) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), "utf8");
}

async function nhlScore(date) {
  const url = `https://api-web.nhle.com/v1/score/${date}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`score failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function nhlBoxscore(gameId) {
  const url = `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`boxscore failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Optional (not used in this fallback build, but kept for the next upgrade)
async function nhlShiftcharts(gameId) {
  const url = `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${gameId}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`shiftcharts failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function postWebhook(payload) {
  must(WEBHOOK_URL, "Missing DISCORD_WEBHOOK_URL (GitHub secret).");

  // wait=true returns JSON (message object) so we can log channel_id
  const hookUrl = WEBHOOK_URL.includes("?")
    ? `${WEBHOOK_URL}&wait=true`
    : `${WEBHOOK_URL}?wait=true`;

  const res = await fetch(hookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  console.log("Posted:", { message_id: data.id, channel_id: data.channel_id });
}

function extractSkatersFromBoxscore(box) {
  // Normalize boxscore to a per-team map keyed by team abbrev.
  // Each skater object includes name.default, positionCode (L/C/R/D/G), toiSeconds, goals, assists, pim, shots, hits, etc.
  const out = {};
  for (const side of ["homeTeam", "awayTeam"]) {
    const team = box[side];
    const abbr = team.abbrev;

    const f = team.playerByGameStats?.forwards ?? [];
    const d = team.playerByGameStats?.defense ?? [];
    const g = team.playerByGameStats?.goalies ?? [];

    out[abbr] = {
      teamName: team.commonName?.default ?? abbr,
      abbrev: abbr,
      forwards: f,
      defense: d,
      goalies: g,
    };
  }
  return out;
}

function buildRealLinesTOIFallback(boxSkaters) {
  // Approximate line assignment by TOI and positionCode:
  // - Take forwards, sort by TOI, distribute by position L/C/R (if available).
  // - Take defense, sort by TOI, pair in order.
  // - Take goalies, sort by TOI.
  const linesByTeam = {};

  for (const [abbr, group] of Object.entries(boxSkaters)) {
    const forwards = [...group.forwards].sort(
      (a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0)
    );
    const defense = [...group.defense].sort(
      (a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0)
    );
    const goalies = [...group.goalies].sort(
      (a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0)
    );

    // Bucket forwards by positionCode when possible
    const L = forwards.filter((p) => (p.positionCode ?? p.position) === "L");
    const C = forwards.filter((p) => (p.positionCode ?? p.position) === "C");
    const R = forwards.filter((p) => (p.positionCode ?? p.position) === "R");
    const OTHER = forwards.filter((p) => !["L", "C", "R"].includes((p.positionCode ?? p.position) || ""));

    // Helper: safely pop from array
    const take = (arr) => (arr.length ? arr.shift() : null);

    const F = [];
    for (let i = 0; i < 4; i++) {
      // Prefer one L, one C, one R per line; fill gaps from remaining pools
      const lw = take(L) || take(OTHER) || null;
      const c = take(C) || take(OTHER) || null;
      const rw = take(R) || take(OTHER) || null;

      // If still missing slots, pull from remaining forwards list not yet used
      // (This can happen if NHL position codes aren't L/C/R as expected.)
      F.push([lw, c, rw]);
    }

    const D = [];
    for (let i = 0; i < 3; i++) {
      const d1 = defense[i * 2] ?? null;
      const d2 = defense[i * 2 + 1] ?? null;
      D.push([d1, d2]);
    }

    linesByTeam[abbr] = { F, D, G: goalies.slice(0, 2) };
  }

  return linesByTeam;
}

function statLine(p) {
  if (!p) return "";
  const g = p.goals ?? 0;
  const a = p.assists ?? 0;
  const pts = p.points ?? (g + a);
  const pim = p.pim ?? 0;
  const s = p.shots ?? 0;
  const h = p.hits ?? 0;
  const toi = p.toi ?? "";
  return `${g}G ${a}A ${pts}P | ${s} S | ${h} H | ${pim} PIM | TOI ${toi}`;
}

function findRosterKeyForAbbr(rosters, abbr, boxTeamName) {
  // Your rosters.json currently uses full names for some teams.
  // Minimal mapping for your 3 teams. Expand later as you add all teams.
  const map = {
    LAK: "LOS ANGELES KINGS",
    SJS: "SAN JOSE SHARKS",
    ANA: "ANAHEIM DUCKS",
  };

  if (map[abbr] && rosters[map[abbr]]) return map[abbr];

  // Fallback: try name contains
  const keys = Object.keys(rosters);
  const upper = (boxTeamName || abbr).toUpperCase();
  return keys.find((k) => k.toUpperCase().includes(upper)) || null;
}

function renderMirroredGame({ gameId, box, rosters, realLines, boxSkaters }) {
  const awayAbbr = box.awayTeam.abbrev;
  const homeAbbr = box.homeTeam.abbrev;

  const title =
    `🏒 **${box.awayTeam.commonName.default} @ ${box.homeTeam.commonName.default}** (Game ${gameId})\n` +
    `Final: ${box.awayTeam.score}–${box.homeTeam.score}\n`;

  const blocks = [title];

  for (const abbr of [awayAbbr, homeAbbr]) {
    const teamName = boxSkaters[abbr]?.teamName ?? abbr;

    const charTeam = rosters[abbr] || null;

    const rl = realLines[abbr];

    blocks.push(`\n**${teamName} — Character Mirror**`);

    // Forwards
    blocks.push(`**Forwards**`);
    for (let i = 0; i < 4; i++) {
      const trio = rl?.F?.[i] ?? [null, null, null];
      const ch = charTeam?.F?.[i] ?? { LW: "", C: "", RW: "" };

      const lw = trio[0];
      const c = trio[1];
      const rw = trio[2];

      blocks.push(
        `L${i + 1}: ${fmt(ch.LW)} ⇐ ${lw ? lw.name.default : "—"}${lw ? ` (${statLine(lw)})` : ""}\n` +
        `    ${fmt(ch.C)} ⇐ ${c ? c.name.default : "—"}${c ? ` (${statLine(c)})` : ""}\n` +
        `    ${fmt(ch.RW)} ⇐ ${rw ? rw.name.default : "—"}${rw ? ` (${statLine(rw)})` : ""}`
      );
    }

    // Defense
    blocks.push(`\n**Defense**`);
    for (let i = 0; i < 3; i++) {
      const pair = rl?.D?.[i] ?? [null, null];
      const ch = charTeam?.D?.[i] ?? { LD: "", RD: "" };

      const d1 = pair[0];
      const d2 = pair[1];

      blocks.push(
        `D${i + 1}: ${fmt(ch.LD)} ⇐ ${d1 ? d1.name.default : "—"}${d1 ? ` (${statLine(d1)})` : ""}\n` +
        `    ${fmt(ch.RD)} ⇐ ${d2 ? d2.name.default : "—"}${d2 ? ` (${statLine(d2)})` : ""}`
      );
    }

    // Goalies
    blocks.push(`\n**Goalies**`);
    for (let i = 0; i < 2; i++) {
      const gg = rl?.G?.[i] ?? null;
      const ch = charTeam?.G?.[i] ?? { G: "" };

      if (!gg) {
        blocks.push(`G${i + 1}: ${fmt(ch.G)} ⇐ —`);
        continue;
      }

      const sv = gg.savePctg != null ? `${Math.round(gg.savePctg * 1000) / 10}%` : "";
      const ga = gg.goalsAgainst != null ? gg.goalsAgainst : "—";
      blocks.push(`G${i + 1}: ${fmt(ch.G)} ⇐ ${gg.name.default} (${sv} | GA ${ga})`);
    }

    if (!charTeam) {
      blocks.push(`_(No character roster found for this team yet — add it to rosters.json to mirror stats.)_`);
    }
  }

  // Discord content limit is 2000 chars; keep it safe.
  let out = blocks.join("\n");
  if (out.length > 1900) out = out.slice(0, 1900) + "\n…(truncated)";
  return out;
}

async function main() {
  const rosters = await readJson(ROSTERS_PATH, {});
  const posted = await readJson(POSTED_PATH, { postedGameIds: [] });

  const score = await nhlScore(TODAY);
  const games = score.games ?? [];

  // "OFF" indicates completed/final in this API.
  const finals = games.filter((g) => g.gameState === "OFF");

  console.log(`Date=${TODAY} games=${games.length} finals=${finals.length}`);

  for (const g of finals) {
    const gameId = g.id;
    if (posted.postedGameIds.includes(gameId)) continue;

    const box = await nhlBoxscore(gameId);
    const boxSkaters = extractSkatersFromBoxscore(box);

    // For now: TOI-based fallback for line assignment.
    const realLines = buildRealLinesTOIFallback(boxSkaters);

    const text = renderMirroredGame({ gameId, box, rosters, realLines, boxSkaters });
    await postWebhook({ username: "HOCKEYHOOK", content: text });

    posted.postedGameIds.push(gameId);
    await writeJson(POSTED_PATH, posted);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
