// stats.js

document.addEventListener("DOMContentLoaded", function() {
  // Initialize the player stats if they don't exist
  function initializePlayerStats() {
    const defaultPlayers = [
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
      { name: "Leo", goals: 0, assists: 0, penalties: 0, injuries: [] }
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

    // Clear any existing content
    statsContainer.innerHTML = ''; 

    // Check if stats are present and valid
    if (playerStats && Array.isArray(playerStats) && playerStats.length > 0) {
    playerStats.forEach(player => {
      const playerDiv = document.createElement("div");
      playerDiv.classList.add("player-stats");
        
        // Determine injury status
        let injuryStatus = "No"; // Default is "No" if no injuries exist
        if (Array.isArray(player.injuries) && player.injuries.length > 0) {
          const activeInjuries = player.injuries.filter(injury => injury.gamesRemaining > 0);
          if (activeInjuries.length > 0) {
            injuryStatus = `Yes (${activeInjuries[0].gamesRemaining} games left)`; // Show games remaining for the first active injury
          }
        }
        
        playerDiv.innerHTML = `
          <h3>${player.name}</h3>
          <p>Goals: ${player.goals}</p>
          <p>Assists: ${player.assists}</p>
          <p>Penalties: ${player.penalties}</p>
          <p>Injuries: ${injuryStatus}</p> <!-- Display 'Yes' or 'No' with games remaining -->
        `;
        statsContainer.appendChild(playerDiv);
      });
    } else {
      statsContainer.innerHTML = '<p>No player stats available.</p>';
    }
  }

  // Reset all player stats to default values (0)
  function resetPlayerStats() {
    const defaultPlayers = [
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
      { name: "Leo", goals: 0, assists: 0, penalties: 0, injuries: [] }
    ];

    // Save the default stats to localStorage
    localStorage.setItem("playerStats", JSON.stringify(defaultPlayers));

    // Reload the stats to show the reset stats
    loadPlayerStats();
  }

  // Add event listener to the reset button
  const resetButton = document.getElementById("reset-stats");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetPlayerStats();
    });
  }

  // Initialize player stats on page load and display them
  initializePlayerStats();
  loadPlayerStats();
});
