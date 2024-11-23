// Example teams and players
const teams = [
  {
    name: "Team A",
    players: ["Alice", "Bob", "Charlie"],
  },
  {
    name: "Team B",
    players: ["Dave", "Eve", "Frank"],
  },
];

// Function to randomly select an item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Simulate a game
document.getElementById("simulate-button").addEventListener("click", () => {
  // Random scores
  const teamAScore = Math.floor(Math.random() * 5);
  const teamBScore = Math.floor(Math.random() * 5);

  // Generate random events
  const events = [];
  for (let i = 0; i < Math.max(teamAScore, teamBScore); i++) {
    const scoringTeam = Math.random() > 0.5 ? teams[0] : teams[1];
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
    <p>${teams[0].name}: ${teamAScore} vs ${teams[1].name}: ${teamBScore}</p>
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
