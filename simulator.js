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

  console.log("Teams picked:", teams[team1Index].name, "vs", teams[team2Index].name); // Debugging message
  return [teams[team1Index], teams[team2Index]];
}

// Function to load existing game history from localStorage
function loadGameHistory() {
  const history = localStorage.getItem("gameHistory"); // Correctly using localStorage
  console.log("Loaded game history:", history); // Debugging message
  return history ? JSON.parse(history) : [];
}

// Function to save game history to localStorage
function saveGameToHistory(gameResult) {
  try {
    const history = loadGameHistory();
    history.push(gameResult);
    localStorage.setItem("gameHistory", JSON.stringify(history)); // Correctly using localStorage
    console.log("Game saved to history:", gameResult); // Debugging message
  } catch (error) {
    console.error("Error saving game to history:", error);
  }
}

// Function to update player stats in localStorage
function updatePlayerStats(events) {
  // Load existing player stats from localStorage, or initialize with default values
  let playerStats = JSON.parse(localStorage.getItem("playerStats")) || [
    { name: "Alice", goals: 0, assists: 0, penalties: 0 },
    { name: "Bob", goals: 0, assists: 0, penalties: 0 },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0 },
    { name: "Dave", goals: 0, assists: 0, penalties: 0 },
    { name: "Eve", goals: 0, assists: 0, penalties: 0 },
    { name: "Frank", goals: 0, assists: 0, penalties: 0 },
    { name: "Grace", goals: 0, assists: 0, penalties: 0 },
    { name: "Heidi", goals: 0, assists: 0, penalties: 0 },
    { name: "Ivan", goals: 0, assists: 0, penalties: 0 },
    { name: "Jack", goals: 0, assists: 0, penalties: 0 },
    { name: "Kathy", goals: 0, assists: 0, penalties: 0 },
    { name: "Leo", goals: 0, assists: 0, penalties: 0 },
  ];

  // Update player stats based on the events from the simulation
  events.forEach(event => {
    // Update goals and assists
    if (event.scorer) {
      const scorer = playerStats.find(p => p.name === event.scorer);
      if (scorer) {
        scorer.goals += 1;
        if (event.assist !== "Unassisted") {
          const assister = playerStats.find(p => p.name === event.assist);
          if (assister) assister.assists += 1;
        }
      }
    }

    // Update penalties
    if (event.penalty) {
      const player = playerStats.find(p => p.name === event.penalty.split(' ')[0]);
      if (player) player.penalties += 1;
    }
  });

   // Save the updated player stats to localStorage
  localStorage.setItem("playerStats", JSON.stringify(playerStats));
}

// Main simulation logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("Simulator page loaded."); // Debugging message

  const simulateButton = document.getElementById("simulate-button");
  if (!simulateButton) {
    console.error("Simulate button not found in the DOM!"); // Debugging message
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

    // Update player stats from the simulation events
    updatePlayerStats(events);

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
