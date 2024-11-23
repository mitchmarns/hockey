document.getElementById("simulate-button").addEventListener("click", () => {
  const result = `Team A scored ${Math.floor(Math.random() * 5)} goals!`;
  document.getElementById("simulation-result").textContent = result;
});
