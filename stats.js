// stats.js

// Initialize the player stats if they don't exist
function initializePlayerStats() {
  const defaultPlayers = [
    { name: "Alice", goals: 0, assists: 0, penalties: 0 },
    { name: "Bob", goals: 0, assists: 0, penalties: 0 },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0 },
    { name: "Dave", goals: 0, assists: 0, penalties: 0 }
  ];

  if (!localStorage.getItem("playerStats")) {
    localStorage.setItem("playerStats", JSON.stringify(defaultPlayers));
  }
}

// Load player stats from localStorage
function loadPlayerStats() {
  const statsContainer = document.getElementById("stats-container");
  const playerStats = JSON.parse(localStorage.getItem("playerStats"));
  
  statsContainer.innerHTML = ''; // Clear existing content

  playerStats.forEach(player => {
    const playerDiv = document.createElement("div");
    playerDiv.classList.add("player-stats");
    playerDiv.innerHTML = `
      <h3>${player.name}</h3>
      <p>Goals: ${player.goals}</p>
      <p>Assists: ${player.assists}</p>
      <p>Penalties: ${player.penalties}</p>
    `;
    statsContainer.appendChild(playerDiv);
  });
}

// Update the stats of a player
function updatePlayerStats(playerName, goals, assists, penalties) {
  const playerStats = JSON.parse(localStorage.getItem("playerStats"));

  const player = playerStats.find(p => p.name === playerName);
  if (player) {
    player.goals += parseInt(goals);
    player.assists += parseInt(assists);
    player.penalties += parseInt(penalties);

    // Save the updated stats to localStorage
    localStorage.setItem("playerStats", JSON.stringify(playerStats));
  } else {
    console.error(`Player ${playerName} not found`);
  }

  loadPlayerStats(); // Reload stats to reflect the updates
}

// Form submission to update player stats
document.getElementById("update-stats-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const playerName = document.getElementById("player-name").value;
  const goals = document.getElementById("goals").value;
  const assists = document.getElementById("assists").value;
  const penalties = document.getElementById("penalties").value;

  updatePlayerStats(playerName, goals, assists, penalties);
  document.getElementById("update-stats-form").reset(); // Reset form after submission
});

// Initialize player stats on page load and display them
document.addEventListener("DOMContentLoaded", () => {
  initializePlayerStats();
  loadPlayerStats();
});
