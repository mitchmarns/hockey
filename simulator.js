// Define four teams and their players with skill levels (e.g., shooting, passing)
const teams = [
  {
    name: "Team A",
    players: [
      { name: "Alice", shooting: 80, passing: 70, defense: 60 },
      { name: "Bob", shooting: 70, passing: 80, defense: 65 },
      { name: "Charlie", shooting: 75, passing: 60, defense: 75 },
    ]
  },
  {
    name: "Team B",
    players: [
      { name: "Dave", shooting: 65, passing: 75, defense: 70 },
      { name: "Eve", shooting: 80, passing: 85, defense: 50 },
      { name: "Frank", shooting: 70, passing: 60, defense: 80 },
    ]
  },
  {
    name: "Team C",
    players: [
      { name: "Grace", shooting: 60, passing: 80, defense: 75 },
      { name: "Heidi", shooting: 70, passing: 60, defense: 70 },
      { name: "Ivan", shooting: 75, passing: 70, defense: 60 },
    ]
  },
  {
    name: "Team D",
    players: [
      { name: "Jack", shooting: 80, passing: 60, defense: 65 },
      { name: "Kathy", shooting: 60, passing: 70, defense: 80 },
      { name: "Leo", shooting: 65, passing: 75, defense: 70 },
    ]
  }
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

// Function to simulate a player's chance of scoring based on their shooting skill
function simulateShooting(player) {
  const chance = Math.random() * 100;
  return chance <= player.shooting;
}

// Function to simulate an assist based on passing skill
function simulateAssist(player) {
  const chance = Math.random() * 100;
  return chance <= player.passing;
}

// Function to simulate a penalty (randomly) for any player, not necessarily the scorer
function simulatePenalty() {
  const chance = Math.random() * 100;
  if (chance <= 20) { // 20% chance of a penalty
    const team = getRandomItem(teams);
    const player = getRandomItem(team.players);
    return `${player.name} received a penalty`;
  }
  return null;
}

// Function to simulate an injury (randomly) for any player
function simulateInjury() {
  const chance = Math.random() * 100;
  if (chance <= 10) { // 10% chance of injury
    const team = getRandomItem(teams);
    const player = getRandomItem(team.players);
    const injuryType = Math.random() > 0.5 ? 'short-term' : 'long-term';
    return `${player.name} injuryType: ${injuryType}`;
  }
  return null;
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
  let playerStats = JSON.parse(localStorage.getItem("playerStats")) || [
    { name: "Alice", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Bob", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Dave", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Eve", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Frank", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Grace", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Heidi", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Ivan", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Jack", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Kathy", goals: 0, assists: 0, penalties: 0, injuries: 0 },
    { name: "Leo", goals: 0, assists: 0, penalties: 0, injuries: 0 },
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
      const playerName = event.penalty.split(' ')[0];
      const player = playerStats.find(p => p.name === event.penalty.split(' ')[0]);
      if (player) player.penalties += 1;
    }

    // Update injuries
    if (event.injury) {
      const player = playerStats.find(p => p.name === event.injury.player);
      if (player) {
        player.injuries.push(event.injury.injuryType); // Store injury type
      }
    }
  });


   // Save the updated player stats to localStorage
  localStorage.setItem("playerStats", JSON.stringify(playerStats));
}

// Main simulation logic
document.addEventListener("DOMContentLoaded", () => {
  const simulateButton = document.getElementById("simulate-button");
  if (!simulateButton) return;

  simulateButton.addEventListener("click", () => {
    const [team1, team2] = pickTeams();

    const team1Score = Math.floor(Math.random() * 5);
    const team2Score = Math.floor(Math.random() * 5);

    const events = [];
    for (let i = 0; i < Math.max(team1Score, team2Score); i++) {
      const scoringTeam = Math.random() > 0.5 ? team1 : team2;
      const scorer = getRandomItem(scoringTeam.players);
      const assister = Math.random() > 0.5 ? getRandomItem(scoringTeam.players) : "Unassisted";
      const penalty = simulatePenalty();
      const injury = simulateInjury();

      events.push({
        team: scoringTeam.name,
        scorer: scorer.name,
        assist: assister === "Unassisted" ? "Unassisted" : assister.name, 
        penalty: penalty,
        injury: injury
      });
    }

    const gameResult = {
      team1: team1.name,
      team2: team2.name,
      score1: team1Score,
      score2: team2Score,
      events: events,
      date: new Date().toLocaleString(),
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
                event.penalty ? `- ${event.penalty}` : ""}
                ${event.injury ? `- ${event.injury}` : ""}
              </li>`
          )
          .join("")}
      </ul>
    `;
    console.log("Game simulated and results displayed."); // Debugging message
  });
});
