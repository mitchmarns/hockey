const teams = [
  { name: "Team A", players: ["Player 1", "Player 2"] },
  { name: "Team B", players: ["Player 3", "Player 4"] },
  { name: "Team C", players: ["Grace", "Heidi", "Ivan"] },
  { name: "Team D", players: ["Jack", "Kathy", "Leo"] }
];

const teamContainer = document.getElementById("teams");

teams.forEach(team => {
  const div = document.createElement("div");
  div.innerHTML = `<h2>${team.name}</h2><ul>${team.players.map(p => `<li>${p}</li>`).join('')}</ul>`;
  teamContainer.appendChild(div);
});

// Function to render the team rosters
function renderTeamRosters() {
  const rostersContainer = document.getElementById('team-rosters');
  if (!rostersContainer) {
    console.error("Could not find the rosters container in the DOM.");
    return;
  }
