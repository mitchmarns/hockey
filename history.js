// Load game history from localStorage
function loadGameHistory() {
  const history = localStorage.getItem("gameHistory");
  return history ? JSON.parse(history) : [];
}

// Display game history on the page
document.addEventListener("DOMContentLoaded", () => {
  const gameHistory = loadGameHistory();
  const historyDiv = document.getElementById("game-history");

  if (gameHistory.length === 0) {
    historyDiv.innerHTML = "<p>No games have been simulated yet.</p>";
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
                    .map(
                      (event) =>
                        `<li>${event.team}: ${event.scorer} scored (${event.assist}) ${
                          event.penalty ? `- ${event.penalty}` : ""
                        }</li>`
                    )
                    .join("")}
                </ul>
              </li>`
          )
          .join("")}
      </ul>
    `;
  }
});
