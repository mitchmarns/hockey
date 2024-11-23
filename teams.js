const teams = [
  { name: "Team A", players: ["Player 1", "Player 2"] },
  { name: "Team B", players: ["Player 3", "Player 4"] },
];

const teamContainer = document.getElementById("teams");

teams.forEach(team => {
  const div = document.createElement("div");
  div.innerHTML = `<h2>${team.name}</h2><ul>${team.players.map(p => `<li>${p}</li>`).join('')}</ul>`;
  teamContainer.appendChild(div);
});
