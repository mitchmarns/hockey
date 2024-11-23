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
  } while (team1Index === team2Index);

  return [teams[team1Index], teams[team2Index]];
}

// Load existing game history from localStorage
function loadGameHistory() {
  const history = localStorage.getItem("gameHistory");
  return history ? JSON.parse(history) : [];
}

// Save game history to localStorage
function saveGameToHistory(gameResult) {
  try {
    const history = loadGameHistory();
    history.push(gameResult);
    localStorage.setItem("gameHistory", JSON.stringify(history));
    console.log("Game saved successfully:", gameResult); // Debugging message
  } catch (error) {
    console.error("Error saving game to history:", error);
  }
}

// Main game simulation logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("Simulator page loaded."); // Debugging message

  const simulateButton = document.getElementById("simulate-button");
  if (!simulateButton) {
    console.error("Simulate button not found in the DOM!");
    return;
  }

  simulateButton.addEventListener("click", () => {
    console.log("Simulate button clicked."); // Debugging message

    const [team1, team2] = pickTeams();

    const team1Score = Math.floor(Math.random() * 5);
    const team2Score = Math.floor(Math.random() * 5);

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

    const gameResult = {
      team1: team1.name,
      team2: team2.name,
      score1: team1Score,
      score2: team2Score,
      events: events,
      date: new Date().toLocaleString(), // Add a timestamp
    };

    // Save the game result to localStorage
    saveGameToHistory(gameResult);

    // Display the results dynamically
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
    console.log("Game simulated and results displayed."); // Debugging message
  });
});
