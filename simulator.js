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
    let gamesMissed = 
      injuryType === 'short-term' 
      ? Math.floor(Math.random() * 3) + 1 
      : Math.floor(Math.random() * 6) + 5; // Short-term: 1-3 games, Long-term: 5-10 games
    return { player: player.name, injuryType, gamesMissed };
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
    { name: "Alice", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Bob", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Dave", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Eve", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Frank", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Grace", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Heidi", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Ivan", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Jack", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Kathy", goals: 0, assists: 0, penalties: 0, injuries: [] },
    { name: "Leo", goals: 0, assists: 0, penalties: 0, injuries: [] },
  ];

  // Update player stats based on the events from the simulation
  events.forEach(event => {
    
    // Skip players with injuries still active
    const isInjured = playerStats.some(p => p.name === event.scorer && p.injuries.some(injury => injury.gamesRemaining > 0));
    if (isInjured) return; // Skip the event if the player is injured
    
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
      const playerName = event.penalty.match(/^(\w+)/)?.[1]; // Extract the first word (player name)
      const player = playerStats.find((p) => p.name === playerName);
      if (player) player.penalties += 1;
    }

    // Update injuries and their countdown
    if (event.injury) {
      const { player, injuryType, gamesMissed } = event.injury; // Destructure for clarity
      const injuredPlayer = playerStats.find((p) => p.name === player);
      if (injuredPlayer) {
        injuredPlayer.injuries.push({ type: injuryType, gamesMissed, gamesRemaining: gamesMissed });
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

    // Update injury countdown and remove fully recovered injuries
playerStats.forEach(player => {
  player.injuries = player.injuries.filter(injury => {
    if (injury.gamesRemaining > 0) {
      injury.gamesRemaining -= 1;
      return true; // Keep the injury
    }
    return false; // Remove injury if recovered
  });
});


    // Save the updated player stats after injury countdown
    localStorage.setItem("playerStats", JSON.stringify(playerStats));

    const team1Score = Math.floor(Math.random() * 5);
    const team2Score = Math.floor(Math.random() * 5);

    const events = [];
    for (let i = 0; i < Math.max(team1Score, team2Score); i++) {
      const scoringTeam = Math.random() > 0.5 ? team1 : team2;
      const scorer = getRandomItem(scoringTeam.players);
      const assister = Math.random() > 0.5 ? getRandomItem(scoringTeam.players) : "Unassisted";
      const penalty = simulatePenalty();
      const injury = simulateInjury();

      // Ensure neither scorer nor assister are injured
if (
  playerStats.some(p => p.name === scorer.name && p.injuries.some(i => i.gamesRemaining > 0)) ||
  (assister !== "Unassisted" && playerStats.some(p => p.name === assister.name && p.injuries.some(i => i.gamesRemaining > 0)))
) {
  continue;  // Skip if the player is injured
}

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
          .map((event) => {
              // Create the main text for each event
              let eventText = `${event.team}: ${event.scorer} scored (${event.assist})`;

              // If there is a penalty, append it
          if (event.penalty) {
            eventText += ` - Penalty: ${event.penalty}`;
          }
              
              // If there is an injury, append it
          if (event.injury) {
          const injuryDetails = `${event.injury.player} is injured (${event.injury.injuryType}), missing ${event.injury.gamesMissed} games.`;
          eventText += ` - Injury: ${injuryDetails}`;
        }
              // Return the formatted event item
          return `<li>${eventText}</li>`;
        }
          )
          .join("")}
      </ul>
    `;
    console.log("Game simulated and results displayed."); // Debugging message
  });
});
