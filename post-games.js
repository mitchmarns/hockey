// post-games.js (Node 20+; CommonJS)
const fs = require("node:fs/promises");
const path = require("node:path");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const TODAY = process.env.DATE || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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

async function nhlShiftcharts(gameId) {
  // Some clients need a User-Agent; NHL’s stats endpoints can be picky.
  const url = `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${gameId}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`shiftcharts failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function discordPayload(text) {
  return { content: text };
}

async function postWebhook(payload) {
  must(WEBHOOK_URL, "Missing DISCORD_WEBHOOK_URL (GitHub secret).");

  const hookUrl = WEBHOOK_URL.includes("?")
    ? `${WEBHOOK_URL}&wait=true`
    : `${WEBHOOK_URL}?wait=true`;

  const res = await fetch(hookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log("Posted:", { message_id: data.id, channel_id: data.channel_id });
}

function extractSkatersFromBoxscore(box) {
  // box.playerByGameStats.[home|away]Team -> { forwards[], defense[], goalies[] }
  // Each entry has playerId, name, position, toi, goals, assists, pim, shots, hits, etc.
  // We'll normalize into a simple map by team abbrev.
  const out = {};
  for (const side of ["homeTeam", "awayTeam"]) {
    const team = box[side];
    const abbr = team.abbrev;

    const f = team.playerByGameStats?.forwards ?? [];
    const d = team.playerByGameStats?.defense ?? [];
    const g = team.playerByGameStats?.goalies ?? [];

    out[abbr] = {
      teamName: team.commonName?.default ?? abbr,
      forwards: f,
      defense: d,
      goalies: g,
    };
  }
  return out;
}

function buildRealLines({ boxSkaters, shiftJson }) {
  // TODO: implement “same line” inference using overlap seconds from shiftcharts.
  // For v1 fallback, just sort by TOI and chunk:
  const linesByTeam = {};

  for (const [abbr, group] of Object.entries(boxSkaters)) {
    const forwards = [...group.forwards].sort((a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0));
    const defense = [...group.defense].sort((a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0)
