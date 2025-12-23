// post-games.js (Node 20+; CommonJS) — Forum threads + Embeds + one-name slots
const fs = require("node:fs/promises");
const path = require("node:path");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Inputs
const DATE = process.env.DATE || new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const FORCE_ALL = String(process.env.FORCE_ALL || "false").toLowerCase() === "true";
const IGNORE_POSTED = String(process.env.IGNORE_POSTED || "false").toLowerCase() === "true";

const ROSTERS_PATH = path.join(process.cwd(), "rosters.json");
const POSTED_PATH = path.join(process.cwd(), "data", "posted.json");

function isBlank(v) {
  return v === undefined || v === null || `${v}`.trim() === "";
}

function charOrReal(charName, realName) {
  const c = (charName ?? "").toString().trim();
  if (c) return c;
  const r = (realName ?? "").toString().trim();
  return r ? r : "—";
}

function toiToSeconds(toi) {
  const s = (toi ?? "").toString().trim();
  const m = s.match(/^(\d+):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Webhook execute:
 * - forum: provide thread_name (create new forum post/thread) OR thread_id (post inside it)
 * - supports embeds
 */
async function postWebhook({ content = "", embeds = [], username = "HOCKEYHOOK", threadId = "", threadName = "" }) {
  if (!WEBHOOK_URL) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const url = new URL(WEBHOOK_URL);
  url.searchParams.set("wait", "true");
  if (threadId) url.searchParams.set("thread_id", threadId);

  const body = { username };
  if (!isBlank(content)) body.content = content;
  if (embeds && embeds.length) body.embeds = embeds;
  if (!isBlank(threadName)) body.thread_name = threadName; // forum-only

  // Rate-limit retry loop (handles 429 from Discord)
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status !== 429) {
      if (!res.ok) throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
      return res.json();
    }

    // 429: obey retry_after (seconds)
    let retryAfterMs = 1000;
    try {
      const j = await res.json();
      retryAfterMs = Math.ceil((j.retry_after ?? 1) * 1000) + 150;
    } catch {
      retryAfterMs = 1000;
    }
    await sleep(retryAfterMs);
  }

  throw new Error("Discord webhook failed: too many rate limits.");
}

function realName(p) {
  if (!p) return "";
  if (p.name && typeof p.name === "object") {
    if (p.name.default) return p.name.default;
    const any = Object.values(p.name).find((v) => typeof v === "string" && v.trim());
    if (any) return any;
  }
  const first = p.firstName?.default || p.firstName || "";
  const last = p.lastName?.default || p.lastName || "";
  return `${first} ${last}`.trim();
}

function statLine(p) {
  if (!p) return "";
  const g = p.goals ?? 0;
  const a = p.assists ?? 0;
  const pts = p.points ?? (g + a);
  const pim = p.pim ?? 0;
  const sog = p.sog ?? p.shots ?? 0;
  const hits = p.hits ?? 0;
  const toi = p.toi ?? "";
  return `${g}-${a}-${pts} | ${sog} SOG | ${hits} H | ${pim} PIM | ${toi}`;
}

/**
 * ✅ IMPORTANT:
 * Players are under box.playerByGameStats.awayTeam/homeTeam (not nested in box.awayTeam)
 */
function extractSkatersFromBoxscore(box) {
  const out = {};
  for (const side of ["awayTeam", "homeTeam"]) {
    const teamInfo = box[side];
    const stats = box.playerByGameStats?.[side] || {};
    const abbr = teamInfo?.abbrev || side.toUpperCase();

    out[abbr] = {
      teamName: teamInfo?.commonName?.default ?? abbr,
      abbrev: abbr,
      forwards: stats.forwards ?? [],
      defense: stats.defense ?? [],
      goalies: stats.goalies ?? [],
    };
  }
  return out;
}

// TOI-based approximation of lines
function buildRealLinesTOIFallback(boxSkaters) {
  const linesByTeam = {};

  for (const [abbr, group] of Object.entries(boxSkaters)) {
    const forwardsAll = [...(group.forwards ?? [])].sort(
      (a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi)
    );
    const defenseAll = [...(group.defense ?? [])].sort(
      (a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi)
    );
    const goaliesAll = [...(group.goalies ?? [])].sort(
      (a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi)
    );

    const getPos = (p) => (p?.position ?? p?.positionCode ?? "").toString().toUpperCase().trim();

    const L = forwardsAll.filter((p) => getPos(p) === "L" || getPos(p) === "LW");
    const C = forwardsAll.filter((p) => getPos(p) === "C");
    const R = forwardsAll.filter((p) => getPos(p) === "R" || getPos(p) === "RW");
    const OTHER = forwardsAll.filter((p) => !["L", "LW", "C", "R", "RW"].includes(getPos(p)));

    const take = (arr) => (arr.length ? arr.shift() : null);
    const takeAny = () => take(L) || take(C) || take(R) || take(OTHER) || null;

    const F = [];
    for (let i = 0; i < 4; i++) {
      const lw = take(L) || takeAny();
      const c = take(C) || takeAny();
      const rw = take(R) || takeAny();
      F.push([lw, c, rw]);
    }

    const D = [];
    for (let i = 0; i < 3; i++) {
      const d1 = defenseAll[i * 2] ?? null;
      const d2 = defenseAll[i * 2 + 1] ?? null;
      D.push([d1, d2]);
    }

    linesByTeam[abbr] = { F, D, G: goaliesAll.slice(0, 2) };
  }

  return linesByTeam;
}

function clip(s, max) {
  const str = (s ?? "").toString();
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function teamEmbed({ teamName, abbr, rosters, rl }) {
  const charTeam = rosters[abbr] || null;

  const fields = [];

  // --- Forwards: L1-L4 (two-column)
  for (let i = 0; i < 4; i++) {
    const trio = rl?.F?.[i] ?? [null, null, null];
    const ch = charTeam?.F?.[i] ?? { LW: "", C: "", RW: "" };

    const lw = trio[0], c = trio[1], rw = trio[2];

    const lwName = charOrReal(ch.LW, realName(lw));
    const cName  = charOrReal(ch.C,  realName(c));
    const rwName = charOrReal(ch.RW, realName(rw));

    const val =
      `• **LW:** ${lwName}${lw ? ` — ${statLine(lw)}` : ""}\n` +
      `• **C:** ${cName}${c ? ` — ${statLine(c)}` : ""}\n` +
      `• **RW:** ${rwName}${rw ? ` — ${statLine(rw)}` : ""}`;

    fields.push({ name: `L${i + 1}`, value: val || "—", inline: true });
  }

  // spacer so Defense starts on a new row (Discord trick)
  fields.push({ name: "\u200B", value: "\u200B", inline: false });

  // --- Defense: D1-D3 (two-column-ish)
  for (let i = 0; i < 3; i++) {
    const pair = rl?.D?.[i] ?? [null, null];
    const ch = charTeam?.D?.[i] ?? { LD: "", RD: "" };

    const d1 = pair[0], d2 = pair[1];

    const d1Name = charOrReal(ch.LD, realName(d1));
    const d2Name = charOrReal(ch.RD, realName(d2));

    const val =
      `• **LD:** ${d1Name}${d1 ? ` — ${statLine(d1)}` : ""}\n` +
      `• **RD:** ${d2Name}${d2 ? ` — ${statLine(d2)}` : ""}`;

    fields.push({ name: `D${i + 1}`, value: val || "—", inline: true });
  }

  fields.push({ name: "\u200B", value: "\u200B", inline: false });

  // --- Goalies (single field)
  const gLines = [];
  for (let i = 0; i < 2; i++) {
    const gg = rl?.G?.[i] ?? null;
    const ch = charTeam?.G?.[i] ?? { G: "" };
    const gName = charOrReal(ch.G, realName(gg));

    if (!gg) {
      gLines.push(`• **G${i + 1}:** ${gName}`);
      continue;
    }

    const sv = gg.savePctg != null ? `${Math.round(gg.savePctg * 1000) / 10}%` : "—";
    const ga = gg.goalsAgainst != null ? gg.goalsAgainst : "—";
    gLines.push(`• **G${i + 1}:** ${gName} — SV% ${sv} | GA ${ga}`);
  }

  if (!charTeam) gLines.push(`\n_No character roster for ${abbr}; showing real players._`);

  fields.push({ name: "Goalies", value: gLines.join("\n") || "—", inline: false });

  return {
    title: `${teamName}`,
    fields,
  };
}

function headerEmbed({ gameId, box }) {
  const away = box.awayTeam.commonName.default;
  const home = box.homeTeam.commonName.default;
  const score = `${box.awayTeam.score}–${box.homeTeam.score}`;

  return {
    title: `🏒 ${away} @ ${home}`,
    description: `**Final:** ${score}\n**Game:** ${gameId}\n**Date (UTC):** ${DATE}`,
  };
}

function isFinalGame(g) {
  const s = (g.gameState || g.gameStatus || "").toString().toUpperCase();
  const id = g.gameStateId ?? g.gameStatusId ?? null;
  if (["OFF", "FINAL"].includes(s)) return true;
  if (id === 7) return true;
  return false;
}

async function main() {
  const rosters = await readJson(ROSTERS_PATH, {});
  const posted = await readJson(POSTED_PATH, { postedGameIds: [] });

  const score = await nhlScore(DATE);
  const games = score.games ?? [];
  const candidates = FORCE_ALL ? games : games.filter(isFinalGame);

  console.log(
    `Date=${DATE} games=${games.length} candidates=${candidates.length} FORCE_ALL=${FORCE_ALL} IGNORE_POSTED=${IGNORE_POSTED}`
  );

  if (candidates.length === 0) {
    await postWebhook({
      username: "HOCKEYHOOK",
      embeds: [{ title: `🏒 HOCKEYHOOK — ${DATE}`, description: "No postable games found." }],
    });
    return;
  }

  for (const g of candidates) {
    const gameId = g.id;

    if (!IGNORE_POSTED && posted.postedGameIds.includes(gameId)) {
      console.log(`Skip already posted gameId=${gameId}`);
      continue;
    }

    const box = await nhlBoxscore(gameId);
    const boxSkaters = extractSkatersFromBoxscore(box);

    // log counts
    for (const [abbr, grp] of Object.entries(boxSkaters)) {
      console.log(`${gameId} ${abbr}: F=${grp.forwards.length} D=${grp.defense.length} G=${grp.goalies.length}`);
    }

    const realLines = buildRealLinesTOIFallback(boxSkaters);

    const awayAbbr = box.awayTeam.abbrev;
    const homeAbbr = box.homeTeam.abbrev;

    // 1) Create forum thread with starter embed (header)
    const threadName = `${DATE} • ${box.awayTeam.commonName.default} @ ${box.homeTeam.commonName.default} • ${gameId}`;
    const created = await postWebhook({
      username: "HOCKEYHOOK",
      threadName,
      embeds: [headerEmbed({ gameId, box })],
    });

    const threadId = created?.channel_id || created?.id; // forum post/thread id (varies by response)
    console.log("Created thread:", { threadId });

    // 2) Post team embeds inside the thread (clean + avoids 2000-char truncation)
    const awayTeamName = boxSkaters[awayAbbr]?.teamName ?? awayAbbr;
    const homeTeamName = boxSkaters[homeAbbr]?.teamName ?? homeAbbr;

    await postWebhook({
      username: "HOCKEYHOOK",
      threadId: threadId,
      embeds: [teamEmbed({ teamName: awayTeamName, abbr: awayAbbr, rosters, rl: realLines[awayAbbr] })],
    });

    await sleep(250); // small spacing to reduce rate-limit risk

    await postWebhook({
      username: "HOCKEYHOOK",
      threadId: threadId,
      embeds: [teamEmbed({ teamName: homeTeamName, abbr: homeAbbr, rosters, rl: realLines[homeAbbr] })],
    });

    if (!IGNORE_POSTED) {
      posted.postedGameIds.push(gameId);
      await writeJson(POSTED_PATH, posted);
    }

    // small pause between games
    await sleep(350);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
