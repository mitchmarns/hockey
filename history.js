document.addEventListener("DOMContentLoaded", () => {
  const gameHistory = loadGameHistory();
  const historyDiv = document.getElementById("game-history");

  if (gameHistory.length === 0) {
    historyDiv.innerHTML = "<p>No games have been simulated yet.</p>";
    console.log("Game history is empty."); // Debugging message
  } else {
    historyDiv.innerHTML = `
      <h2>Game History</h2>
      <ul>
        ${gameHistory
          .map(
            (game) =>
              `<li>
                <strong>${game.team1} (${game.score1}) vs ${game.team2} (${game.score2})</strong><br>
                Date: ${game.date}<br>
                Events:
                <ul>
                  ${game.events
                    .map((event) => {
                      let eventText = `${event.team}: ${event.scorer} scored (${event.assist})`;
                      
                      // Append penalty if it exists
                      if (event.penalty) {
                        eventText += ` - Penalty: ${event.penalty}`;
                      }

                      // Append injury if it exists
                      if (event.injury) {
                        const injuryDetails = `${event.injury.player} is injured (${event.injury.injuryType}), missing ${event.injury.gamesMissed} games.`;
                        eventText += ` - Injury: ${injuryDetails}`;
                      }

                      // Ensure we return the HTML string
                      return `<li>${eventText}</li>`;
                    })
                    .join("")}
                </ul>
              </li>`
          )
          .join("")}
      </ul>
    `;
    console.log("Game history rendered successfully."); // Debugging message
  }
});
