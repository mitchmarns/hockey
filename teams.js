const teams = [
  { name: "Team A", players: ["Alice", "Bob", "Charlie"] },
  { name: "Team B", players: ["Dave", "Eve", "Frank"] },
  { name: "Team C", players: ["Grace", "Heidi", "Ivan"] },
  { name: "Team D", players: ["Jack", "Kathy", "Leo"] },
];

const teamContainer = document.getElementById("team-rosters"); // Changed id to match the HTML

// Loop through the teams array and create HTML elements
teams.forEach(team => {
  const div = document.createElement("div");
  div.innerHTML = `<h2>${team.name}</h2><ul>${team.players.map(p => `<li>${p}</li>`).join('')}</ul>`;
  teamContainer.appendChild(div);
});
