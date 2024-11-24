// Define four teams and their players with skill levels (e.g., shooting, passing)
const teams = [
  {
    name: "Rangers",
    players: [
      { name: "Hunter Owens", shooting: 95, passing: 90, defense: 88, position: "Center" },
      { name: "Justin Thompson", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "RC3", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "RC4", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "RLW1", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "RLW2", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "RLW3", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "RLW4", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "Declan Thorne", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "Elias Nilsson", shooting: 90, passing: 92, defense: 80, position: "Right Wing" },
      { name: "RRW3", shooting: 90, passing: 92, defense: 80, position: "Right Wing" },
      { name: "RRW4", shooting: 90, passing: 92, defense: 80, position: "Right Wing" },
      { name: "Aiden Belanger", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "RD1B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "RD2A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "RD2B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "RD3A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "RD3B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "Bear Cohen", shooting: 10, passing: 85, defense: 95, position: "Goalie" },
    ]
  },
  {
    name: "Devils",
    players: [
      { name: "Chase Love", shooting: 92, passing: 94, defense: 82, position: "Center" },
      { name: "DC2", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "DC3", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "DC4", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "Taylor Abbott", shooting: 87, passing: 87, defense: 77, position: "Left Wing" },
      { name: "Mathis Christen", shooting: 89, passing: 91, defense: 88, position: "Left Wing" },
      { name: "DLW3", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "DLW4", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "Jayden Anderson", shooting: 91, passing: 89, defense: 79, position: "Right Wing" },
      { name: "Liam Floch", shooting: 89, passing: 90, defense: 80, position: "Right Wing" },
      { name: "Wolfgang Muller", shooting: 89, passing: 88, defense: 80, position: "Right Wing" },
      { name: "DRW4", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "Asher Wilde", shooting: 87, passing: 90, defense: 79, position: "Defense" },
      { name: "Jasper Love", shooting: 88, passing: 96, defense: 83, position: "Defense" },
      { name: "DD2A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "DD2B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "DD3A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "DD3B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "DG", shooting: 10, passing: 85, defense: 95, position: "Goalie" },
    ]
  },
  {
    name: "Islanders",
    players: [
      { name: "Oliver Cloutier", shooting: 78, passing: 77, defense: 77, position: "Center" },
      { name: "IC2", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "IC3", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "IC4", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "ILW1", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "ILW2", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "ILW3", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "ILW4", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "Aleksandr Petrov", shooting: 89, passing: 90, defense: 80, position: "Right Wing" },
      { name: "IRW2", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "IRW3", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "IRW4", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "ID1A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "ID1B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "ID2A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "ID2B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "ID3A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "ID3B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "Cruz Cohen", shooting: 10, passing: 85, defense: 95, position: "Goalie" },
    ]
  },
  {
    name: "Sabres",
    players: [
      { name: "SC1", shooting: 78, passing: 77, defense: 77, position: "Center" },
      { name: "SC2", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "SC3", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "SC4", shooting: 87, passing: 91, defense: 83, position: "Center" },
      { name: "SLW1", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "SLW2", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "SLW3", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "SLW4", shooting: 89, passing: 94, defense: 77, position: "Left Wing" },
      { name: "SRW1", shooting: 89, passing: 90, defense: 80, position: "Right Wing" },
      { name: "SRW2", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "SRW3", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "SRW4", shooting: 89, passing: 94, defense: 77, position: "Right Wing" },
      { name: "SD1A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SD1B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SD2A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SD2B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SD3A", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SD3B", shooting: 77, passing: 81, defense: 76, position: "Defense" },
      { name: "SG", shooting: 10, passing: 85, defense: 95, position: "Goalie" },
    ]
  }
];

// Validate teams
function validateHockeyLineup(team) {
  const positionCounts = team.players.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] || 0) + 1;
    return counts;
  }, {});

  return (
    positionCounts["Center"] === 4 &&
    positionCounts["Left Wing"] >= 4 &&
    positionCounts["Right Wing"] >= 4 &&
    positionCounts["Defense"] >= 6 &&
    positionCounts["Goalie"] === 1
  );
}

// Global variable for player stats
let playerStats = JSON.parse(localStorage.getItem("playerStats")) || [
  { name: "Aiden Belanger", position: "Defense", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Aleksandr Petrov", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Asher Wilde", position: "Defense", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Bear Cohen", position: "Goalie", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Chase Love", position: "Center", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Cruz Cohen", position: "Goalie", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Declan Thorne", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Elias Nilsson", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Hunter Owens", position: "Center", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Jasper Love", position: "Defense", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Jayden Anderson", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Justin Thompson", position: "Center", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Liam Floch", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Mathis Christen", position: "Left Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Oliver Cloutier", position: "Center", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Taylor Abbott", position: "Left Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
  { name: "Wolfgang Muller", position: "Right Wing", goals: 0, assists: 0, penalties: 0, injuries: [] },
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
  const baseChance = Math.random() * 100;
  switch (player.position) {
    case "Center":
    case "Left Wing":
    case "Right Wing":
      return baseChance <= player.shooting + 10; // Boost for forwards
    case "Defense":
      return baseChance <= player.shooting - 10; // Reduced chance for defensemen
    case "Goalie":
      return false; // Goalies don't shoot
    default:
      return baseChance <= player.shooting;
  }
}

// Function to simulate an assist based on passing skill
function simulateAssist(player) {
  const baseChance = Math.random() * 100;
  if (player.position === "Center") return baseChance <= player.passing + 15; // Bonus for Centers
  if (player.position === "Defense") return baseChance <= player.passing - 5; // Reduced for Defensemen
  return baseChance <= player.passing;
}

//defence
function adjustDefense(team) {
  return team.players
    .filter(player => player.position === "Defense")
    .reduce((totalDefense, player) => totalDefense + player.defense, 0);
}

function goalieSave(goalie) {
  const saveChance = Math.random() * 100;
  return saveChance <= goalie.defense; // Higher defense means better saves
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

// Function to simulate an injury 
function simulateInjury() {
  const chance = Math.random() * 100;

  // Higher chance if the player is frequently penalized or performing poorly
  const randomModifier = Math.random() > 0.5 ? 10 : -10; // Random bump for better or worse chance

  const injuryChance = chance + randomModifier;
  
  if (injuryChance <= 15) { // 15% chance of injury, but influenced by performance
    const team = getRandomItem(teams);
    const player = getRandomItem(team.players);

    let injuryType;
    if (player.position === "Defense") {
      injuryType = Math.random() > 0.5 ? "long-term" : "short-term"; // 50/50 chance for defense
    } else if (player.position === "Goalie") {
      injuryType = Math.random() > 0.7 ? "long-term" : "short-term"; // Goalies more likely for long-term injuries
    } else {
      injuryType = Math.random() > 0.6 ? "short-term" : "long-term"; // Forwards more balanced
    }

    const gamesMissed =
      injuryType === "short-term"
        ? Math.floor(Math.random() * 4) + 2  // 2-5 games for short-term injuries
        : Math.floor(Math.random() * 7) + 5; // 5-11 games for long-term injuries

    return { player: player.name, position: player.position, injuryType, gamesMissed };
  }
  return null;
}

// Function to update injury cooldown for players
function updateInjuryCooldown() {
  playerStats.forEach(player => {
    if (player.injuries.length > 0) {
      player.injuries.forEach(injury => {
        if (injury.gamesRemaining > 0) {
          injury.gamesRemaining -= 1; // Reduce cooldown
        }
      });

      // Remove fully healed injuries
      player.injuries = player.injuries.filter(injury => injury.gamesRemaining > 0);
    }
  });

  // Save updated player stats
  localStorage.setItem("playerStats", JSON.stringify(playerStats));
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
