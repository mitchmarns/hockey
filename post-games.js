// post-games.js (Node 20+; CommonJS)
const fs = require("node:fs/promises");
const path = require("node:path");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Inputs
const DATE = process.env.DATE || new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const FORCE_ALL = String(process.env.FORCE_ALL || "false").toLowerCase() === "true";
const IGNORE_POSTED = String(process.env.IGNORE_POSTED || "false").toLowerCase() === "true";

const ROSTERS_PATH = path.join(process.cwd(), "rosters.json");
const POSTED_PATH = path.join(process.cwd(), "data", "posted.json");

function must(v, msg) {
  if (!v) throw new Error(msg);
  return v;
}

function isBlank(v) {
  return v === undefined || v === null || `${v}`.trim() === "";
}

function charOrReal(charName, realName) {
  const c = (charName ?? "").toString().trim();
  if (c) return c;
  const r = (realName ?? "").toString().trim();
  return r ? r : "—";
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
  const s = p.shots ?? 0;
  const h = p.hits ?? 0;
  const toi = p.toi ?? "";
  return `${g}G ${a}A ${pts}P | ${s} S | ${h} H | ${pim} PIM | TOI ${toi}`;
}

function extractSkatersFromBoxscore(box) {
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
  // Uses players who actually played (boxscore), approximates lines by TOI
  const linesByTeam = {};

  for (const [abbr, group] of Object.entries(boxSkaters)) {
    const forwardsAll = [...group.forwards].sort((a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0));
    const defenseAll = [...group.defense].sort((a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0));
    const goaliesAll = [...group.goalies].sort((a, b) => (b.toiSeconds ?? 0) - (a.toiSeconds ?? 0));

    const getPos = (p) => (p?.positionCode ?? p?.position ?? "").toString().toUpperCase().trim();

    // Forwards: bucket if possible, but NEVER leave slots empty if players remain
    const L = forwardsAll.filter((p) => getPos(p) === "L");
    const C = forwardsAll.filter((p) => getPos(p) === "C");
    const R = forwardsAll.filter((p) => getPos(p) === "R");
    const OTHER = forwardsAll.filter((p) => !["L", "C", "R"].includes(getPos(p)));

    const take = (arr) => (arr.length ? arr.shift() : null);
    const takeAny = () => take(L) || take(C) || take(R) || take(OTHER) || null;

    const F = [];
    for (let i = 0; i < 4; i++) {
      const lw = take(L) || takeAny();
      const c = take(C) || takeAny();
      const rw = take(R) || takeAny();
      F.push([lw, c, rw]);
    }

    // Defense: boxscore doesn’t give LD/RD, so we pair by TOI order
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

function renderMirroredGame({ gameId, box, rosters, realLines, boxSkaters }) {
  const awayAbbr = box.awayTeam.abbrev;
  const homeAbbr = box.homeTeam.abbrev;

  const header =
    `🏒 **${box.awayTeam.commonName.default} @ ${box.homeTeam.commonName.default}** (Game ${gameId})\n` +
    `Final: ${box.awayTeam.score}–${box.homeTeam.score}\n`;

  const blocks = [header];

  for (const abbr of [awayAbbr, homeAbbr]) {
    const teamName = boxSkaters[abbr]?.teamName ?? abbr;
    const rl = realLines[abbr];

    // Your character roster (may be missing for most teams)
    const charTeam = rosters[abbr] || null;

    blocks.push(`\n**${teamName} — Character Mirror**`);

    // Forwards
    blocks.push(`**Forwards**`);
    for (let i = 0; i < 4; i++) {
      const trio = rl?.F?.[i] ?? [null, null, null];
      const ch = charTeam?.F?.[i] ?? { LW: "", C: "", RW: "" };

      const lw = trio[0];
      const c = trio[1];
      const rw = trio[2];

      const lwReal = realName(lw);
      const cReal = realName(c);
      const rwReal = realName(rw);

      blocks.push(
        `L${i + 1}: ${charOrReal(ch.LW, lwReal)} ⇐ ${lwReal || "—"}${lw ? ` (${statLine(lw)})` : ""}\n` +
          `    ${charOrReal(ch.C, cReal)} ⇐ ${cReal || "—"}${c ? ` (${statLine(c)})` : ""}\n` +
          `    ${charOrReal(ch.RW, rwReal)} ⇐ ${rwReal || "—"}${rw ? ` (${statLine(rw)})` : ""}`
      );
    }

    // Defense
    blocks.push(`\n**Defense**`);
    for (let i = 0; i < 3; i++) {
      const pair = rl?.D?.[i] ?? [null, null];
      const ch = charTeam?.D?.[i] ?? { LD: "", RD: "" };

      const d1 = pair[0];
      const d2 = pair[1];

      const d1Real = realName(d1);
      const d2Real = realName(d2);

      blocks.push(
        `D${i + 1}: ${charOrReal(ch.LD, d1Real)} ⇐ ${d1Real || "—"}${d1 ? ` (${statLine(d1)})` : ""}\n` +
          `    ${charOrReal(ch.RD, d2Real)} ⇐ ${d2Real || "—"}${d2 ? ` (${statLine(d2)})` : ""}`
      );
    }

    // Goalies
    blocks.push(`\n**Goalies**`);
    for (let i = 0; i < 2; i++) {
      const gg = rl?.G?.[i] ?? null;
      const ch = charTeam?.G?.[i] ?? { G: "" };

      const gReal = realName(gg);

      if (!gg) {
        blocks.push(`G${i + 1}: ${charOrReal(ch.G, gReal)} ⇐ —`);
        continue;
      }

      const sv = gg.savePctg != null ? `${Math.round(gg.savePctg * 1000) / 10}%` : "";
      const ga = gg.goalsAgainst != null ? gg.goalsAgainst : "—";
      blocks.push(`G${i + 1}: ${charOrReal(ch.G, gReal)} ⇐ ${gReal} (${sv} | GA ${ga})`);
    }

    if (!charTeam) {
      blocks.push(`_(No character roster for ${abbr}; showing real players.)_`);
    }
  }

  // Discord ~2000 char limit
  let out = blocks.join("\n");
  if (out.length > 1900) out = out.slice(0, 1900) + "\n…(truncated)";
  return out;
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
      content: `🏒 HOCKEYHOOK — ${DATE}\nNo postable games found (try DATE=yesterday UTC, or FORCE_ALL=true).`,
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
    const realLines = buildRealLinesTOIFallback(boxSkaters);

    const text = renderMirroredGame({ gameId, box, rosters, realLines, boxSkaters });
    await postWebhook({ username: "HOCKEYHOOK", content: text });

    if (!IGNORE_POSTED) {
      posted.postedGameIds.push(gameId);
      await writeJson(POSTED_PATH, posted);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
