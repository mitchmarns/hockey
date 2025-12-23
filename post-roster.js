// post-roster.js (Node 20, CommonJS)
const fs = require("node:fs/promises");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Optional inputs (GitHub Action can pass these)
const HOME = process.env.HOME_TEAM || "";
const AWAY = process.env.AWAY_TEAM || "";
const MODE = (process.env.MODE || "matchup").toLowerCase(); // "matchup" or "single"

function fmt(v) {
  const s = (v ?? "").toString().trim();
  return s ? s : "—";
}

function renderTeam(teamName, team) {
  const f = team.F ?? [];
  const d = team.D ?? [];
  const g = team.G ?? [];

  const fLines =
    f
      .slice(0, 4)
      .map((ln, i) => `L${i + 1}: ${fmt(ln.LW)} — ${fmt(ln.C)} — ${fmt(ln.RW)}`)
      .join("\n") || "—";

  const dPairs =
    d
      .slice(0, 3)
      .map((pr, i) => `D${i + 1}: ${fmt(pr.LD)} — ${fmt(pr.RD)}`)
      .join("\n") || "—";

  const goalies =
    g
      .slice(0, 2)
      .map((gg, i) => `G${i + 1}: ${fmt(gg.G)}`)
      .join("\n") || "—";

  return [
    `**${teamName}**`,
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
  if (!WEBHOOK_URL) {
    throw new Error("Missing DISCORD_WEBHOOK_URL (GitHub secret).");
  }

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

  // With wait=true, Discord returns JSON for the created message
  const data = await res.json();
  console.log("Posted:", { message_id: data.id, channel_id: data.channel_id });
}

(async function main() {
  const rosters = JSON.parse(await fs.readFile("./rosters.json", "utf8"));
  const teamNames = Object.keys(rosters);
  if (!teamNames.length) throw new Error("No teams found in rosters.json");

  const pickTeam = (name, fallbackIndex) =>
    name && rosters[name] ? name : teamNames[fallbackIndex];

  let content;

  if (MODE === "single") {
    const teamName = pickTeam(HOME, 0);
    content = `🏒 **Character Lines**\n\n${renderTeam(teamName, rosters[teamName])}`;
  } else {
    const homeName = pickTeam(HOME, 0);
    const awayName = pickTeam(AWAY, homeName === teamNames[0] ? 1 : 0);

    content =
      `🏒 **Matchup — Character Lines**\n\n` +
      `${renderTeam(homeName, rosters[homeName])}\n\n` +
      `vs\n\n` +
      `${renderTeam(awayName, rosters[awayName])}`;
  }

  await postWebhook({ username: "HOCKEYHOOK", content });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
