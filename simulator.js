// Define four teams and their players
const teams = [
  { name: "Team A", players: ["Alice", "Bob", "Charlie"] },
  { name: "Team B", players: ["Dave", "Eve", "Frank"] },
  { name: "Team C", players: ["Grace", "Heidi", "Ivan"] },
  { name: "Team D", players: ["Jack", "Kathy", "Leo"] },
];

// Function to randomly select an item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to randomly pick two teams for the game
function pickTeams() {
  const team1Index = Math.floor(Math.random() * teams.length);
  let team2Index;
  do {
    team2Index = Math.floor(Math.random() * teams.length);
  } while (team1Index === team2Index); // Ensure different teams are selected

  return [teams[team1Index], teams[team2Index]];
}

// Simulate a game
document.getElementById("simulate-button").addEventListener("click", () => {
  // Pick two random teams
  const [team1, team2] = pickTeams();

  // Random scores
  const team1Score = Math.floor(Math.random() * 5);
  const team2Score = Math.floor(Math.random() * 5);

  // Generate random events
  const events = [];
  for (let i = 0; i < Math.max(team1Score, team2Score); i++) {
    const scoringTeam = Math.random() > 0.5 ? team1 : team2;
    const scorer = getRandomItem(scoringTeam.players);
    const assister = Math.random() > 0.5 ? getRandomItem(scoringTeam.players) : "Unassisted";
    const penalty = Math.random() > 0.8 ? `${getRandomItem(scoringTeam.players)} received a penalty` : null;

    events.push({
      team: scoringTeam.name,
      scorer: scorer,
      assist: assister,
      penalty: penalty,
    });
  }

  // Display results
  const resultDiv = document.getElementById("simulation-result");
  resultDiv.innerHTML = `
    <h2>Game Results</h2>
    <p>${team1.name}: ${team1Score} vs ${team2.name}: ${team2Score}</p>
    <h3>Event Summary</h3>
    <ul>
      ${events
        .map(
          (event) =>
            `<li>${event.team}: ${event.scorer} scored (${event.assist}) ${
              event.penalty ? `- ${event.penalty}` : ""
            }</li>`
        )
        .join("")}
    </ul>
  `;
});
