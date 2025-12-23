// post-roster.js (Node 20+; CommonJS)
const fs = require("node:fs/promises");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // ✅ matches your secret name
const ONLY_TEAM = (process.env.TEAM || "").toUpperCase().trim(); // optional: LAK

function fmt(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : "—";
}

function isBlank(v) {
  return v === undefined || v === null || `${v}`.trim() === "";
}

function charOrReal(charName, realName) {
  return isBlank(charName) ? (realName ?? "") : charName;
}

function normalizePos(pos) {
  const p = (pos ?? "").toString().toUpperCase().trim();
  // NHL roster endpoints often use L/R/C/D/G
  if (p === "L") return "LW";
  if (p === "R") return "RW";
  return p; // C, D, G, LW, RW
}

function realName(p) {
  if (!p) return "";
  // new API patterns
  if (p.fullName) return p.fullName;
  if (p.name?.default) return p.name.default;

  const first = p.firstName?.default || p.firstName || "";
  const last = p.lastName?.default || p.lastName || "";
  return `${first} ${last}`.trim();
}

async function fetchTeamRoster(teamAbbr) {
  // ✅ new NHL web API roster endpoint
  const url = `https://api-web.nhle.com/v1/roster/${teamAbbr}/current`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Roster fetch failed ${teamAbbr}: ${res.status} ${await res.text()}`);
  return res.json();
}

function rosterJsonToPlayers(rosterJson) {
  // Most commonly: forwards, defensemen, goalies (arrays)
  const groups = [];
  for (const v of Object.values(rosterJson)) {
    if (Array.isArray(v)) groups.push(v);
  }
  const flat = groups.flat();

  return flat
    .map((p) => ({
      name: realName(p),
      position: normalizePos(p.positionCode ?? p.position),
    }))
    .filter((p) => p.name);
}

function buildForwardLines(players) {
  const lws = players.filter((p) => p.position === "LW").map((p) => p.name);
  const centers = players.filter((p) => p.position === "C").map((p) => p.name);
  const rws = players.filter((p) => p.position === "RW").map((p) => p.name);

  // anyone not D/G can be used as forward fallback
  const flexForwards = players
    .filter((p) => p.position !== "D" && p.position !== "G" && !["LW", "C", "RW"].includes(p.position))
    .map((p) => p.name);

  const take = (primary, ...fallbacks) => {
    for (const src of [primary, ...fallbacks]) {
      const val = src.shift();
      if (val) return val;
    }
    return "";
  };

  const forwardLines = [];
  for (let i = 0; i < 4; i++) {
    forwardLines.push({
      LW: take(lws, centers, rws, flexForwards),
      C: take(centers, lws, rws, flexForwards),
      RW: take(rws, centers, lws, flexForwards),
    });
  }
  return forwardLines;
}

function buildDefensePairs(players) {
  const defenders = players.filter((p) => p.position === "D").map((p) => p.name);
  const spillover = players.filter((p) => p.position !== "D" && p.position !== "G").map((p) => p.name);

  const take = (primary, secondary) => primary.shift() || secondary.shift() || "";

  const pairs = [];
  for (let i = 0; i < 3; i++) {
    pairs.push({
      LD: take(defenders, spillover),
      RD: take(defenders, spillover),
    });
  }
  return pairs;
}

function buildGoalies(players) {
  const goalies = players.filter((p) => p.position === "G").map((p) => p.name);
  const skaters = players.filter((p) => p.position !== "G").map((p) => p.name);

  const take = (primary, secondary) => primary.shift() || secondary.shift() || "";

  return [{ G: take(goalies, skaters) }, { G: take(goalies, skaters) }];
}

function mergeLineEntries(baseEntry, fallbackEntry, positions) {
  const merged = {};
  for (const pos of positions) {
    merged[pos] = isBlank(baseEntry?.[pos]) ? (fallbackEntry?.[pos] ?? "") : baseEntry[pos];
  }
  return merged;
}

function mergeLineups(team, fallback = {}) {
  const mergeGroup = (base, fb, positions, targetLength) => {
    const maxLength = Math.max(targetLength, base?.length ?? 0, fb?.length ?? 0);
    const merged = [];
    for (let i = 0; i < maxLength; i++) {
      merged.push(mergeLineEntries(base?.[i] ?? {}, fb?.[i] ?? {}, positions));
    }
    return merged;
  };

  return {
    F: mergeGroup(team.F, fallback.F, ["LW", "C", "RW"], 4),
    D: mergeGroup(team.D, fallback.D, ["LD", "RD"], 3),
    G: mergeGroup(team.G, fallback.G, ["G"], 2),
  };
}

function renderTeamLineup(teamKey, team, fallbackUsed) {
  const f = team.F ?? [];
  const d = team.D ?? [];
  const g = team.G ?? [];

  const fLines = f.slice(0, 4).map((ln, i) =>
    `L${i + 1}: ${fmt(ln.LW)} — ${fmt(ln.C)} — ${fmt(ln.RW)}`
  ).join("\n") || "—";

  const dPairs = d.slice(0, 3).map((pr, i) =>
    `D${i + 1}: ${fmt(pr.LD)} — ${fmt(pr.RD)}`
  ).join("\n") || "—";

  const goalies = g.slice(0, 2).map((gg, i) =>
    `G${i + 1}: ${fmt(gg.G)}`
  ).join("\n") || "—";

  return [
    `🏒 **${teamKey} — Character Lines**`,
    fallbackUsed ? `_Filled blanks from live NHL roster_` : `_No live roster fallback used_`,
    ``,
    `**Forwards**`,
    fLines,
    ``,
    `**Defense**`,
    dPairs,
    ``,
    `**Goalies**`,
    goalies,
  ].join("\n");
}

async function postWebhook(payload) {
  if (!WEBHOOK_URL) throw new Error("Missing DISCORD_WEBHOOK_URL");
  const hookUrl = WEBHOOK_URL.includes("?") ? `${WEBHOOK_URL}&wait=true` : `${WEBHOOK_URL}?wait=true`;

  const res = await fetch(hookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
}

(async function main() {
  const rosters = JSON.parse(await fs.readFile("./rosters.json", "utf8"));

  const teamKeys = ONLY_TEAM ? [ONLY_TEAM] : Object.keys(rosters);
  if (!teamKeys.length) throw new Error("No teams found in rosters.json");

  for (const teamKey of teamKeys) {
    const baseTeam = rosters[teamKey];
    if (!baseTeam) continue;

    let fallback = null;
    try {
      const live = await fetchTeamRoster(teamKey);
      const players = rosterJsonToPlayers(live);
      fallback = {
        F: buildForwardLines(players),
        D: buildDefensePairs(players),
        G: buildGoalies(players),
      };
    } catch (e) {
      console.warn(`Live roster fetch failed for ${teamKey}:`, e.message);
      fallback = { F: [], D: [], G: [] };
    }

    const mergedRoster = mergeLineups(baseTeam, fallback);
    const usedFallback =
      JSON.stringify(mergedRoster) !== JSON.stringify(baseTeam); // coarse but fine

    const content = renderTeamLineup(teamKey, mergedRoster, usedFallback);
    await postWebhook({ username: "ROSTER BOT", content });
  }
})();
