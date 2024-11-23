// Define the teams and their players
const teams = [
  { name: "Team A", players: ["Alice", "Bob", "Charlie"] },
  { name: "Team B", players: ["Dave", "Eve", "Frank"] },
  { name: "Team C", players: ["Grace", "Heidi", "Ivan"] },
  { name: "Team D", players: ["Jack", "Kathy", "Leo"] },
];

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  const teamContainer = document.getElementById('team-rosters');
  
  if (teamContainer) {
    // Loop through each team and create a display for it
    teams.forEach(team => {
      const div = document.createElement('div');
      div.classList.add('team-roster');
      div.innerHTML = `
        <h2>${team.name}</h2>
        <ul>
          ${team.players.map(player => `<li>${player}</li>`).join('')}
        </ul>
      `;
      teamContainer.appendChild(div);
    });
  } else {
    console.error('Container with id "team-rosters" not found!');
  }
});  // <-- Make sure this closing parenthesis and curly brace are here
