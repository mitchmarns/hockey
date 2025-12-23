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

      const lwReal = lw ? lw.name.default : "";
      const cReal = c ? c.name.default : "";
      const rwReal = rw ? rw.name.default : "";

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

      const d1Real = d1 ? d1.name.default : "";
      const d2Real = d2 ? d2.name.default : "";

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

      const gReal = gg ? gg.name.default : "";

      if (!gg) {
        blocks.push(`G${i + 1}: ${charOrReal(ch.G, gReal)} ⇐ —`);
        continue;
      }

      const sv = gg.savePctg != null ? `${Math.round(gg.savePctg * 1000) / 10}%` : "";
      const ga = gg.goalsAgainst != null ? gg.goalsAgainst : "—";
      blocks.push(`G${i + 1}: ${charOrReal(ch.G, gReal)} ⇐ ${gReal} (${sv} | GA ${ga})`);
    }

    if (!charTeam) {
      blocks.push(`_(No character roster found for this team yet — add it to rosters.json to mirror stats.)_`);
    }
  } // ✅ closes for (abbr)

  // Discord content limit is 2000 chars; keep it safe.
  let out = blocks.join("\n");
  if (out.length > 1900) out = out.slice(0, 1900) + "\n…(truncated)";
  return out;
} // ✅ closes function
