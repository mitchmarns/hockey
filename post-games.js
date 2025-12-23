// post-games.js 

const fs = require("node:fs/promises");
const path = require("node:path");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Inputs
const DATE = process.env.DATE || new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const FORCE_ALL = String(process.env.FORCE_ALL || "false").toLowerCase() === "true";
const IGNORE_POSTED = String(process.env.IGNORE_POSTED || "false").toLowerCase() === "true";

const ROSTERS_PATH = path.join(process.cwd(), "rosters.json");
const POSTED_PATH = path.join(process.cwd(), "data", "posted.json");

// -------------------- utils --------------------
function isBlank(v) {
  return v === undefined || v === null || `${v}`.trim() === "";
}

function titleize(s) {
  return (s ?? "")
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

// -------------------- NHL calls --------------------
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

async function nhlPlayByPlay(gameId) {
  const url = `https://api-web.nhle.com/v1/gamecenter/${gameId}/play-by-play`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`play-by-play failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// -------------------- Discord webhook (forum threads + embeds) --------------------
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
  for (let attempt = 0; attempt < 6; attempt++) {
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
      retryAfterMs = Math.ceil((j.retry_after ?? 1) * 1000) + 200;
    } catch {
      retryAfterMs = 1000;
    }
    await sleep(retryAfterMs);
  }

  throw new Error("Discord webhook failed: too many rate limits.");
}

// -------------------- Boxscore helpers (for name + char mapping) --------------------
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

function toiToSeconds(toi) {
  const s = (toi ?? "").toString().trim();
  const m = s.match(/^(\d+):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function playerIdOf(p) {
  return p?.playerId ?? p?.id ?? p?.player?.id ?? null;
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

// TOI-based approximation of lines (only used to map real IDs -> your roster slots)
function buildRealLinesTOIFallback(boxSkaters) {
  const linesByTeam = {};

  for (const [abbr, group] of Object.entries(boxSkaters)) {
    const forwardsAll = [...(group.forwards ?? [])].sort((a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi));
    const defenseAll = [...(group.defense ?? [])].sort((a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi));
    const goaliesAll = [...(group.goalies ?? [])].sort((a, b) => toiToSeconds(b.toi) - toiToSeconds(a.toi));

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

// Build real-name lookup: playerId -> "First Last"
function buildRealNameMap(boxSkaters) {
  const map = new Map();

  const add = (p) => {
    const id = playerIdOf(p);
    if (!id) return;
    const nm = realName(p);
    if (nm) map.set(id, nm);
  };

  for (const grp of Object.values(boxSkaters)) {
    for (const p of grp.forwards ?? []) add(p);
    for (const p of grp.defense ?? []) add(p);
    for (const p of grp.goalies ?? []) add(p);
  }

  return map;
}

// Map: playerId -> { name, isChar }
function buildCharMapForGame({ rosters, realLines, awayAbbr, homeAbbr }) {
  const map = new Map();

  const addIf = (playerObj, charName) => {
    const c = (charName ?? "").toString().trim();
    if (!c) return;
    const id = playerIdOf(playerObj);
    if (!id) return;
    map.set(id, { name: c, isChar: true });
  };

  const applyTeam = (abbr) => {
    const charTeam = rosters?.[abbr];
    const rl = realLines?.[abbr];
    if (!charTeam || !rl) return;

    // Forwards
    for (let i = 0; i < 4; i++) {
      const trio = rl.F?.[i] ?? [null, null, null];
      const ch = charTeam.F?.[i] ?? { LW: "", C: "", RW: "" };
      addIf(trio[0], ch.LW);
      addIf(trio[1], ch.C);
      addIf(trio[2], ch.RW);
    }

    // Defense
    for (let i = 0; i < 3; i++) {
      const pair = rl.D?.[i] ?? [null, null];
      const ch = charTeam.D?.[i] ?? { LD: "", RD: "" };
      addIf(pair[0], ch.LD);
      addIf(pair[1], ch.RD);
    }

    // Goalies
    for (let i = 0; i < 2; i++) {
      const g = rl.G?.[i] ?? null;
      const ch = charTeam.G?.[i] ?? { G: "" };
      addIf(g, ch.G);
    }
  };

  applyTeam(awayAbbr);
  applyTeam(homeAbbr);

  return map;
}

function fmtPlayerNameById(playerId, charMap, realMap) {
  if (!playerId) return "—";
  const ch = charMap?.get(playerId);
  if (ch?.name) return `**${ch.name}**`;
  const rn = realMap?.get(playerId);
  return rn || "—";
}

// -------------------- Play-by-play parsing --------------------
function extractPlays(pbp) {
  const plays =
    pbp?.plays ??
    pbp?.gamecenter?.plays ??
    pbp?.liveData?.plays?.allPlays ??
    [];

  // Ensure chronological order
  return [...plays].sort((a, b) => {
    const ao = a?.sortOrder ?? a?.eventId ?? a?.about?.eventIdx ?? 0;
    const bo = b?.sortOrder ?? b?.eventId ?? b?.about?.eventIdx ?? 0;
    return ao - bo;
  });
}

function playTypeKey(pl) {
  return (pl?.typeDescKey ?? pl?.result?.eventTypeId ?? "").toString().toLowerCase().trim();
}

function periodNumber(pl) {
  return pl?.periodDescriptor?.number ?? pl?.about?.period ?? null;
}

function timeInPeriod(pl) {
  // Prefer timeInPeriod; fallback to periodTime
  return (pl?.timeInPeriod ?? pl?.about?.periodTime ?? "").toString();
}

function strengthTag(details) {
  const raw = (details?.situationCode ?? details?.strength ?? details?.strengthCode ?? details?.eventStrength ?? details?.scoringStrength ?? "")
    .toString()
    .toLowerCase()
    .trim();

  // Common-ish codes (varies): "pp", "sh", "ev", "ps", "5v4", "4v5", "5v5"
  if (!raw) return "";

  if (raw === "pp" || raw.includes("power")) return "PP";
  if (raw === "sh" || raw.includes("short")) return "SH";
  if (raw === "ev" || raw.includes("even")) return "EV";
  if (raw === "ps" || raw.includes("penaltyshot")) return "PS";

  // If it's like "5v4"
  if (/^\d+v\d+$/.test(raw)) return raw.toUpperCase();

  return raw.toUpperCase();
}

function teamAbbrFromPlay(pl, box, awayAbbr, homeAbbr) {
  const d = pl?.details ?? pl?.result ?? {};
  const ab =
    d.eventOwnerTeamAbbrev ??
    d.teamAbbrev ??
    d.penaltyTeamAbbrev ??
    d.scoringTeamAbbrev ??
    null;

  if (ab) return ab.toString().toUpperCase().trim();

  // Sometimes there's a team id
  const tid = d.eventOwnerTeamId ?? d.teamId ?? d.ownerTeamId ?? d.scoringTeamId ?? null;
  const awayId = box?.awayTeam?.id ?? null;
  const homeId = box?.homeTeam?.id ?? null;
  if (tid && awayId && tid === awayId) return awayAbbr;
  if (tid && homeId && tid === homeId) return homeAbbr;

  return "";
}

function scoreAfterPlay(pl, box) {
  const d = pl?.details ?? pl?.result ?? {};
  const a = d.awayScore ?? d.goalsAway ?? pl?.awayScore ?? null;
  const h = d.homeScore ?? d.goalsHome ?? pl?.homeScore ?? null;
  if (a != null && h != null) return `${a}–${h}`;

  // last fallback: box final
  const fa = box?.awayTeam?.score;
  const fh = box?.homeTeam?.score;
  if (fa != null && fh != null) return `${fa}–${fh}`;

  return "";
}

// --- goal extraction (robust-ish)
function goalPlayersFromDetails(d) {
  const scorer =
    d.scoringPlayerId ??
    d.scorerPlayerId ??
    d.scorerId ??
    d.playerId ??
    null;

  const a1 =
    d.assist1PlayerId ??
    d.assistOnePlayerId ??
    d.primaryAssistPlayerId ??
    null;

  const a2 =
    d.assist2PlayerId ??
    d.assistTwoPlayerId ??
    d.secondaryAssistPlayerId ??
    null;

  return { scorer, a1, a2 };
}

function shotTypeFromDetails(d) {
  return titleize(d.shotType ?? d.shotTypeDescKey ?? d.shotTypeCode ?? d.scoringShotType ?? "");
}

// --- penalty extraction (robust-ish)
function penaltyPlayersFromDetails(d) {
  const committed =
    d.committedByPlayerId ??
    d.penaltyPlayerId ??
    d.playerId ??
    d.servedByPlayerId ?? // sometimes (bench minor)
    null;

  const drawn =
    d.drawnByPlayerId ??
    d.drawnBy ??
    d.victimPlayerId ??
    d.againstPlayerId ??
    null;

  return { committed, drawn };
}

function penaltyLabelFromDetails(d) {
  // descKey is usually best (e.g. hooking, tripping)
  return titleize(d.descKey ?? d.typeCode ?? d.penaltyType ?? d.penaltyName ?? "Penalty");
}

function penaltyMinsFromDetails(d) {
  return d.duration ?? d.penaltyMinutes ?? d.minutes ?? null;
}

// Build period -> [strings] with goals+penalties in play order
function buildPlayByPlayByPeriod({ plays, box, awayAbbr, homeAbbr, charMap, realMap }) {
  const periods = new Map(); // key -> { label, lines: [] }

  const pushLine = (per, line) => {
    const key = per ?? "Other";
    if (!periods.has(key)) {
      const label =
        key === "OT" ? "Overtime" :
        key === "SO" ? "Shootout" :
        typeof key === "number" ? `Period ${key}` : `${key}`;
      periods.set(key, { label, lines: [] });
    }
    periods.get(key).lines.push(line);
  };

  // Track score ourselves so it doesn't spam final score everywhere
  let curAway = 0;
  let curHome = 0;

  for (const pl of plays) {
    const key = playTypeKey(pl);
    const d = pl?.details ?? pl?.result ?? {};

    const perNum = periodNumber(pl);
    let perKey = perNum;

    const periodType = (pl?.periodDescriptor?.periodType ?? pl?.about?.periodType ?? "")
      .toString()
      .toUpperCase();

    if (periodType === "OT") perKey = "OT";
    if (periodType === "SO") perKey = "SO";

    const time = timeInPeriod(pl) || "—";
    const abbr = teamAbbrFromPlay(pl, box, awayAbbr, homeAbbr);
    const teamPrefix = abbr ? `**${abbr}** ` : "";

    // ✅ ONLY real GOALS (avoid shot-on-goal)
    const isGoal =
      key === "goal" ||
      (key.includes("goal") && !key.includes("shot") && !key.includes("shot-on-goal") && !key.includes("shotongoal"));

    // ✅ ONLY real PENALTIES
    const isPenalty = key === "penalty" || key.includes("penalty");

    if (isGoal) {
      // update score (prefer feed score if present)
      if (d.awayScore != null && d.homeScore != null) {
        curAway = Number(d.awayScore);
        curHome = Number(d.homeScore);
      } else {
        if (abbr === awayAbbr) curAway += 1;
        else if (abbr === homeAbbr) curHome += 1;
      }

      const { scorer, a1, a2 } = goalPlayersFromDetails(d);

      const scorerName = fmtPlayerNameById(scorer, charMap, realMap);
      const a1Name = a1 ? fmtPlayerNameById(a1, charMap, realMap) : "";
      const a2Name = a2 ? fmtPlayerNameById(a2, charMap, realMap) : "";

      const tag = strengthTag(d);
      const tagTxt = tag ? ` (${tag})` : "";

      const shot = shotTypeFromDetails(d);
      const shotTxt = shot ? ` — ${shot}` : "";

      const scoreTxt = `  •  Score: ${curAway}–${curHome}`;

      const assists = [a1Name, a2Name].filter((x) => x && x !== "—");
      const assistsTxt = assists.length ? `\n↳ Assists: ${assists.join(", ")}` : "";

      // If somehow scorer is missing, don't post junk
      if (scorerName === "—") continue;

      pushLine(
        perKey,
        `🥅 **${time}** ${teamPrefix}${scorerName}${tagTxt}${shotTxt}${scoreTxt}${assistsTxt}`
      );
      continue;
    }

    if (isPenalty) {
      const { committed, drawn } = penaltyPlayersFromDetails(d);
      const commName = fmtPlayerNameById(committed, charMap, realMap);

      const label = penaltyLabelFromDetails(d);
      const mins = penaltyMinsFromDetails(d);
      const minsTxt = mins != null ? ` (${mins})` : "";

      const drawnName = drawn ? fmtPlayerNameById(drawn, charMap, realMap) : "";
      const drawnTxt = drawnName && drawnName !== "—" ? `\n↳ Drawn by: ${drawnName}` : "";

      // If no player attached, skip the generic "—: Penalty" spam
      if (commName === "—") continue;

      pushLine(
        perKey,
        `🟨 **${time}** ${teamPrefix}${commName}: **${label}**${minsTxt}${drawnTxt}`
      );
      continue;
    }
  }

  // order: 1,2,3,OT,SO,Other
  const orderedKeys = [...periods.keys()].sort((a, b) => {
    const rank = (x) => {
      if (x === 1) return 1;
      if (x === 2) return 2;
      if (x === 3) return 3;
      if (x === "OT") return 90;
      if (x === "SO") return 95;
      if (typeof x === "number") return 80 + x;
      return 999;
    };
    return rank(a) - rank(b);
  });

  return orderedKeys.map((k) => ({ key: k, ...periods.get(k) }));
}

function chunkEmbedsForDiscord(embeds) {
  // Discord allows up to 10 embeds per message
  const chunks = [];
  for (let i = 0; i < embeds.length; i += 10) chunks.push(embeds.slice(i, i + 10));
  return chunks;
}

function chunkDescriptionLines(lines, maxLen = 3800) {
  // Keep safe under 4096; reserve a little.
  const out = [];
  let cur = [];

  let curLen = 0;
  for (const ln of lines) {
    const addLen = ln.length + 2; // newline spacing
    if (curLen + addLen > maxLen && cur.length) {
      out.push(cur);
      cur = [];
      curLen = 0;
    }
    cur.push(ln);
    curLen += addLen;
  }
  if (cur.length) out.push(cur);
  return out;
}

// -------------------- embeds --------------------
function headerEmbed({ gameId, box }) {
  const away = box.awayTeam.commonName.default;
  const home = box.homeTeam.commonName.default;
  const score = `${box.awayTeam.score}–${box.homeTeam.score}`;
  return {
    title: `🏒 ${away} @ ${home}`,
    description: `**Final:** ${score}\n**Game:** ${gameId}\n**Date (UTC):** ${DATE}`,
  };
}

function periodEmbeds({ periodLabel, lines }) {
  if (!lines || !lines.length) {
    return [{
      title: `${periodLabel}`,
      description: "_No goals or penalties recorded._",
    }];
  }

  const chunks = chunkDescriptionLines(lines, 3800);
  return chunks.map((group, idx) => ({
    title: idx === 0 ? `${periodLabel}` : `${periodLabel} (cont.)`,
    description: group.join("\n\n"), // extra spacing for readability
  }));
}

// -------------------- game filtering --------------------
function isFinalGame(g) {
  const s = (g.gameState || g.gameStatus || "").toString().toUpperCase();
  const id = g.gameStateId ?? g.gameStatusId ?? null;
  if (["OFF", "FINAL"].includes(s)) return true;
  if (id === 7) return true;
  return false;
}

// -------------------- main --------------------
async function main() {
  const rosters = await readJson(ROSTERS_PATH, {});
  const posted = await readJson(POSTED_PATH, { postedGameIds: [] });

  const score = await nhlScore(DATE);
  const games = score.games ?? [];
  const candidates = FORCE_ALL ? games : games.filter(isFinalGame);

  console.log(`Date=${DATE} games=${games.length} candidates=${candidates.length} FORCE_ALL=${FORCE_ALL} IGNORE_POSTED=${IGNORE_POSTED}`);

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
    const pbp = await nhlPlayByPlay(gameId);

    const awayAbbr = box.awayTeam.abbrev;
    const homeAbbr = box.homeTeam.abbrev;

    // Build maps so PBP player IDs can display as character names
    const boxSkaters = extractSkatersFromBoxscore(box);
    const realLines = buildRealLinesTOIFallback(boxSkaters);
    const realMap = buildRealNameMap(boxSkaters);
    const charMap = buildCharMapForGame({ rosters, realLines, awayAbbr, homeAbbr });

    // Build play-by-play grouped by period
    const plays = extractPlays(pbp);
    const byPeriod = buildPlayByPlayByPeriod({ plays, box, awayAbbr, homeAbbr, charMap, realMap });

    // 1) Create forum thread with header embed
    const threadName = `${DATE} • ${box.awayTeam.commonName.default} @ ${box.homeTeam.commonName.default} • ${gameId}`;
    const created = await postWebhook({
      username: "HOCKEYHOOK",
      threadName,
      embeds: [headerEmbed({ gameId, box })],
    });

    // Forum webhook response: channel_id is usually the created thread/channel
    const threadId = created?.channel_id || created?.id;
    console.log("Created thread:", { threadId, gameId });

    // 2) Build all period embeds, then post in batches of 10
    const allEmbeds = [];
    for (const per of byPeriod) {
      const embeds = periodEmbeds({ periodLabel: per.label, lines: per.lines });
      allEmbeds.push(...embeds);
    }

    // If absolutely nothing was captured (rare), post a single embed
    if (!allEmbeds.length) {
      allEmbeds.push({ title: "Play By Play", description: "_No goals or penalties found in feed._" });
    }

    const embedBatches = chunkEmbedsForDiscord(allEmbeds);
    for (const batch of embedBatches) {
      await postWebhook({
        username: "HOCKEYHOOK",
        threadId,
        embeds: batch,
      });
      await sleep(300);
    }

    if (!IGNORE_POSTED) {
      posted.postedGameIds.push(gameId);
      await writeJson(POSTED_PATH, posted);
    }

    await sleep(600); // pause between games
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
