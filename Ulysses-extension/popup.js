// Tracks whether stats are visible
let isStatsVisible = false;

// Function to update the stats and graph
function updateStats() {
  chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
    const statsDiv = document.getElementById("stats");
    const graphContainer = document.getElementById("graphContainer");

    const wastedTime = result.wastedTime || 0; // Time spent on Shorts
    const regularTime = result.regularTime || 0; // Time spent on regular videos

    // Calculate graph heights (scale within 0 to 100%)
    const maxTime = 900; // Cap at 0.25 hour for scaling
    const wastedGraphHeight = (wastedTime / (maxTime + wastedTime)) * 100;
    const regularGraphHeight = (regularTime / (maxTime + regularTime)) * 100;

    // Update graph
    graphContainer.innerHTML = `
      <div class="bar wasted" style="height: ${wastedGraphHeight}%;"></div>
      <div class="bar regular" style="height: ${regularGraphHeight}%;"></div>
    `;

    // Update text below the graph
    statsDiv.innerHTML = `
      <p><strong>Wasted Time on Shorts:</strong> ${wastedTime.toFixed(2)} seconds</p>
      <p><strong>Time on Regular Videos:</strong> ${regularTime.toFixed(2)} seconds</p>
    `;
  });
}

// Function to toggle stats visibility
document.getElementById("showStats").addEventListener("click", () => {
  const statsDiv = document.getElementById("stats");
  const graphContainer = document.getElementById("graphContainer");
  isStatsVisible = !isStatsVisible;

  statsDiv.style.display = isStatsVisible ? "block" : "none";
  graphContainer.style.display = isStatsVisible ? "flex" : "none"; // Show or hide graph
  const buttonText = isStatsVisible ? "Hide Stats" : "Show Stats";
  document.getElementById("showStats").textContent = buttonText;

  if (isStatsVisible) updateStats(); // Update stats when shown
});

// Reset button logic
document.getElementById("resetButton").addEventListener("click", () => {
  chrome.storage.local.set({ wastedTime: 0, regularTime: 0 }, () => {
    console.log("Time stats have been reset.");
    updateStats(); // Immediately update the display
  });
});

// Real-time stats updates
setInterval(() => {
  if (isStatsVisible) {
    updateStats();
  }
}, 100); // Update every 100ms

// Initial setup
document.getElementById("stats").style.display = "none"; // Hide stats by default
document.getElementById("graphContainer").style.display = "none"; // Hide graph by default
updateStats();


