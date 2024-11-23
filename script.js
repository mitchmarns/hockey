const teams = [
    { name: "Eagles", wins: 0, losses: 0, points: 0 },
    { name: "Sharks", wins: 0, losses: 0, points: 0 },
    { name: "Tigers", wins: 0, losses: 0, points: 0 },
    { name: "Wolves", wins: 0, losses: 0, points: 0 }
];

const restartButton = document.getElementById("restart-btn");
const teamList = document.getElementById("team-list");
const resultsList = document.getElementById("results-list");

// Load saved league state from localStorage
function loadLeagueState() {
    const savedState = JSON.parse(localStorage.getItem("hockeyLeague"));
    if (savedState) {
        savedState.forEach((team, index) => {
            teams[index].wins = team.wins;
            teams[index].losses = team.losses;
            teams[index].points = team.points;
        });
    } else {
        resetSeason();
    }
    renderTeams();
    renderResults();
}

// Save league state to localStorage
function saveLeagueState() {
    localStorage.setItem("hockeyLeague", JSON.stringify(teams));
}

// Simulate a game between two teams
function simulateGame(team1, team2) {
    const score1 = Math.floor(Math.random() * 6); // Random score between 0 and 5
    const score2 = Math.floor(Math.random() * 6);
    let result = `${team1.name} ${score1} - ${score2} ${team2.name}`;

    if (score1 > score2) {
        team1.wins++;
        team2.losses++;
        team1.points += 3; // 3 points for a win
    } else if (score1 < score2) {
        team2.wins++;
        team1.losses++;
        team2.points += 3; // 3 points for a win
    } else {
        team1.points++;
        team2.points++;
        result += " (Draw)";
    }

    return result;
}

// Run the league season (simulate all games)
function simulateSeason() {
    const gameResults = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            gameResults.push(simulateGame(teams[i], teams[j]));
        }
    }
    return gameResults;
}

// Restart the season (reset teams and game results)
function resetSeason() {
    teams.forEach(team => {
        team.wins = 0;
        team.losses = 0;
        team.points = 0;
    });

    const gameResults = simulateSeason();
    saveLeagueState();  // Save the current season to localStorage
    return gameResults;
}

// Render teams and their stats
function renderTeams() {
    teamList.innerHTML = "";
    teams.forEach(team => {
        const li = document.createElement("li");
        li.textContent = `${team.name} - Wins: ${team.wins} Losses: ${team.losses} Points: ${team.points}`;
        teamList.appendChild(li);
    });
}

// Render game results
function renderResults() {
    const gameResults = simulateSeason();
    resultsList.innerHTML = "";
    gameResults.forEach(result => {
        const li = document.createElement("li");
        li.textContent = result;
        resultsList.appendChild(li);
    });
}

// Handle restart season button click
restartButton.addEventListener("click", () => {
    const gameResults = resetSeason();
    renderResults();
    renderTeams();
});

// Initialize the page with the current season state
loadLeagueState();
