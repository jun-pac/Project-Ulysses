let isStatsVisible = false; // Tracks whether stats are visible

// Function to update the stats
function updateStats() {
  chrome.storage.local.get(["wastedTime"], (result) => {
    const statsDiv = document.getElementById("stats");
    const wastedTime = result.wastedTime || 0;
    statsDiv.innerHTML = `<p>Wasted Time on Shorts: ${wastedTime.toFixed(2)} seconds</p>`;
  });
}

// Function to toggle stats visibility
document.getElementById("showStats").addEventListener("click", () => {
  const statsDiv = document.getElementById("stats");
  isStatsVisible = !isStatsVisible; // Toggle visibility state
  statsDiv.style.display = isStatsVisible ? "block" : "none"; // Show or hide stats
  const buttonText = isStatsVisible ? "Hide Wasted Time" : "Show Wasted Time";
  document.getElementById("showStats").textContent = buttonText;
});

// Reset button logic
document.getElementById("resetButton").addEventListener("click", () => {
  chrome.storage.local.set({ wastedTime: 0 }, () => {
    console.log("Wasted time has been reset.");
    updateStats(); // Immediately update the display
  });
});

// Real-time stats updates
setInterval(() => {
  if (isStatsVisible) {
    updateStats(); // Update stats only if they are visible
  }
}, 1000);

// Initial setup
updateStats();


// // Updates stats in the popup
// function updateStats() {
//   chrome.storage.local.get(["wastedTime"], (result) => {
//     const statsDiv = document.getElementById("stats");
//     const wastedTime = result.wastedTime || 0;
//     statsDiv.innerHTML = `<p>Wasted Time on Shorts: ${wastedTime} seconds</p>`;
//   });
// }

// // Show Stats button logic
// document.getElementById("showStats").addEventListener("click", () => {
//   updateStats(); // Trigger a manual stats update
// });

// // Reset button logic
// document.getElementById("resetButton").addEventListener("click", () => {
//   chrome.storage.local.set({ wastedTime: 0 }, () => {
//     console.log("Wasted time has been reset.");
//     updateStats(); // Immediately update the display
//   });
// });

// // Initial setup to ensure stats are up to date
// updateStats();
