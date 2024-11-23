// Define teams and players
const teams = [
    {
        name: "Eagles",
        players: [
            { name: "John Doe", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Jane Smith", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Sam White", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Bob Brown", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false }
        ],
        wins: 0,
        losses: 0,
        points: 0
    },
    {
        name: "Sharks",
        players: [
            { name: "Max Payne", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Nina Hart", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Jake Cormier", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false },
            { name: "Sophia Lee", goals: 0, assists: 0, hits: 0, penalties: 0, injured: false }
        ],
        wins: 0,
        losses: 0,
        points: 0
    },
    // Add similar objects for Tigers and Wolves...
];

// Game controls and results containers
const restartButton = document.getElementById("restart-btn");
const gameButtonsContainer = document.getElementById("game-buttons");
const teamList = document.getElementById("team-list");
const resultsList = document.getElementById("results-list");

// Load saved league state from localStorage
function loadLeagueState() {
    const savedState = JSON.parse(localStorage.getItem("hockeyLeague"));
    if (savedState) {
        savedState.forEach((team, index) => {
            teams[index].players = team.players;
            teams[index].wins = team.wins;
            teams[index].losses = team.losses;
            teams[index].points = team.points;
        });
    } else {
        resetSeason();
    }
    renderTeams();
    renderGameButtons();
}

// Save league state to localStorage
function saveLeagueState() {
    localStorage.setItem("hockeyLeague", JSON.stringify(teams));
}

// Simulate player stats for a game
function simulatePlayerStats() {
    return {
        goals: Math.floor(Math.random() * 2), // Random goals between 0 and 1
        assists: Math.floor(Math.random() * 2), // Random assists between 0 and 1
        hits: Math.floor(Math.random() * 5), // Random hits between 0 and 4
        penalties: Math.floor(Math.random() * 3), // Random penalties (minor) between 0 and 2
        injured: Math.random() < 0.1 // 10% chance of injury
    };
}

// Simulate a game between two teams
function simulateGame(team1, team2) {
    const gameResults = [];
    const team1Score = Math.floor(Math.random() * 6);
    const team2Score = Math.floor(Math.random() * 6);
    const gameResult = {
        team1: { name: team1.name, score: team1Score, players: [] },
        team2: { name: team2.name, score: team2Score, players: [] },
        result: ''
    };

    // Simulate player stats and apply injury mechanic
    team1.players.forEach(player => {
        const stats = simulatePlayerStats();
        player.goals += stats.goals;
        player.assists += stats.assists;
        player.hits += stats.hits;
        player.penalties += stats.penalties;
        player.injured = stats.injured;
        gameResult.team1.players.push({ name: player.name, ...stats });
    });

    team2.players.forEach(player => {
        const stats = simulatePlayerStats();
        player.goals += stats.goals;
        player.assists += stats.assists;
        player.hits += stats.hits;
        player.penalties += stats.penalties;
        player.injured = stats.injured;
        gameResult.team2.players.push({ name: player.name, ...stats });
    });

    // Determine game outcome
    if (team1Score > team2Score) {
        team1.wins++;
        team2.losses++;
        team1.points += 3;
        gameResult.result = `${team1.name} wins ${team1Score}-${team2Score}`;
    } else if (team1Score < team2Score) {
        team2.wins++;
        team1.losses++;
        team2.points += 3;
        gameResult.result = `${team2.name} wins ${team2Score}-${team1Score}`;
    } else {
        team1.points++;
        team2.points++;
        gameResult.result = `Draw ${team1Score}-${team2Score}`;
    }

    saveLeagueState();
    return gameResult;
}

// Generate game buttons for each matchup
function renderGameButtons() {
    gameButtonsContainer.innerHTML = '';
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const button = document.createElement('button');
            button.textContent = `Simulate: ${teams[i].name} vs ${teams[j].name}`;
            button.onclick = () => handleGameSimulation(teams[i], teams[j]);
            gameButtonsContainer.appendChild(button);
        }
    }
}

// Handle the simulation of a game and show results
function handleGameSimulation(team1, team2) {
    const gameResult = simulateGame(team1, team2);
    renderResults(gameResult);
    renderTeams();
}

// Display game results
function renderResults(gameResult) {
    const li = document.createElement('li');
    li.textContent = gameResult.result;
    resultsList.appendChild(li);

    // Display detailed player stats
    const playerStats = document.createElement('div');
    playerStats.classList.add('player-stats');
    gameResult.team1.players.forEach(player => {
        playerStats.innerHTML += `${player.name}: Goals: ${player.goals}, Assists: ${player.assists}, Hits: ${player.hits}, Penalties: ${player.penalties}, Injured: ${player.injured ? 'Yes' : 'No'}<br>`;
    });
    playerStats.innerHTML += '<br>';
    gameResult.team2.players.forEach(player => {
        playerStats.innerHTML += `${player.name}: Goals: ${player.goals}, Assists: ${player.assists}, Hits: ${player.hits}, Penalties: ${player.penalties}, Injured: ${player.injured ? 'Yes' : 'No'}<br>`;
    });
    resultsList.appendChild(playerStats);
}

// Render the team standings
function renderTeams() {
    teamList.innerHTML = '';
    teams.forEach(team => {
        const li = document.createElement('li');
        li.textContent = `${team.name} - Wins: ${team.wins} Losses: ${team.losses} Points: ${team.points}`;
        teamList.appendChild(li);
    });
}

// Reset the season (clear stats and start fresh)
function resetSeason() {
    teams.forEach(team => {
        team.players.forEach(player => {
            player.goals = 0;
            player.assists = 0;
            player.hits = 0;
            player.penalties = 0;
            player.injured = false;
        });
        team.wins = 0;
        team.losses = 0;
        team.points = 0;
    });
    saveLeagueState();
    renderTeams();
    renderGameButtons();
}

// Restart season when the button is clicked
restartButton.addEventListener('click', () => {
    resetSeason();
});

// Initialize the page with the current season state
loadLeagueState();
