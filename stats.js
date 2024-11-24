// stats.js

document.addEventListener("DOMContentLoaded", function() {
  // Initialize the player stats if they don't exist
  function initializePlayerStats() {
    const defaultPlayers = [
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

      // Debugging log
      console.log(player);
        
        playerDiv.innerHTML = `
          <h3>${player.name} (${player.position})</h3>
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
