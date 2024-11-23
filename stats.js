// player_stats.js

// Initialize the player stats if they don't exist
function initializePlayerStats() {
  const defaultPlayers = [
    { name: "Alice", goals: 0, assists: 0, penalties: 0 },
    { name: "Bob", goals: 0, assists: 0, penalties: 0 },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0 },
    { name: "Dave", goals: 0, assists: 0, penalties: 0 }
  ];

  // Check if player stats already exist in localStorage
  if (!localStorage.getItem("playerStats")) {
    localStorage.setItem("playerStats", JSON.stringify(defaultPlayers));
  }
}

// Load and display player stats from localStorage
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

// Reset all player stats to default values (0)
function resetPlayerStats() {
  const defaultPlayers = [
    { name: "Alice", goals: 0, assists: 0, penalties: 0 },
    { name: "Bob", goals: 0, assists: 0, penalties: 0 },
    { name: "Charlie", goals: 0, assists: 0, penalties: 0 },
    { name: "Dave", goals: 0, assists: 0, penalties: 0 }
  ];

  // Save the default stats to localStorage
  localStorage.setItem("playerStats", JSON.stringify(defaultPlayers));

  // Reload the stats to show the reset stats
  loadPlayerStats();
}

// Add event listener to the reset button
document.getElementById("reset-stats").addEventListener("click", () => {
  resetPlayerStats();
});

// Initialize player stats on page load and display them
document.addEventListener("DOMContentLoaded", () => {
  initializePlayerStats();
  loadPlayerStats();
});
