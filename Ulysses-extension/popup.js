// Tracks whether stats, rated videos, and preference report are visible
let isStatsVisible = false;
let areRatedVideosVisible = false;
let isPreferenceReportVisible = false;

// Function to update the stats and graph
function updateStats() {
  chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
    const statsDiv = document.getElementById("stats");
    const wastedTime = result.wastedTime || 0; // Time spent on Shorts
    const regularTime = result.regularTime || 0; // Time spent on regular videos

    statsDiv.innerHTML = `
      <p><strong>Wasted Time on Shorts:</strong> ${wastedTime.toFixed(2)} seconds</p>
      <p><strong>Time on Regular Videos:</strong> ${regularTime.toFixed(2)} seconds</p>
    `;
  });
}

// Function to toggle stats visibility
document.getElementById("showStats").addEventListener("click", () => {
  const statsDiv = document.getElementById("stats");
  isStatsVisible = !isStatsVisible;

  statsDiv.style.display = isStatsVisible ? "block" : "none";
  const buttonText = isStatsVisible ? "Hide Stats" : "Show Stats";
  document.getElementById("showStats").textContent = buttonText;

  if (isStatsVisible) updateStats(); // Update stats when shown
});


// Function to toggle rated videos visibility
document.getElementById("showRatedVideos").addEventListener("click", () => {
  const ratedVideosDiv = document.getElementById("ratedVideos");
  areRatedVideosVisible = !areRatedVideosVisible;

  ratedVideosDiv.style.display = areRatedVideosVisible ? "block" : "none";

  const buttonText = areRatedVideosVisible ? "Hide Rated Videos" : "Show Rated Videos";
  document.getElementById("showRatedVideos").textContent = buttonText;

  if (areRatedVideosVisible) {
    // Fetch and display rated videos
    chrome.storage.local.get("videoRatings", (result) => {
      const videoRatings = result.videoRatings || {};
      const ratedVideosContent = Object.values(videoRatings)
        .map(video => {
          const ratingClass = getRatingClass(video.rating);
          return `
            <tr>
              <td style="color: #000000; font-size: 14px;">${video.channel}</td>
              <td style="color: #000000; font-size: 11px;">${video.title}</td>
              <td style="text-align: center; font-size: 18px; color: ${ratingClass.color};">${video.rating}</td>
            </tr>
          `;
        })
        .join('');
      document.getElementById("ratedVideosBody").innerHTML = ratedVideosContent;
    });
  } else {
    document.getElementById("ratedVideosBody").innerHTML = ''; // Clear the content when hidden
  }
});

// Function to determine rating color based on the rating value (1-5)
function getRatingClass(rating) {
  let color = "rgb(160,174,192)"; // Default gray for low rating
  if (rating === 5) {
    color = "rgb(56,161,105)"; // Bright green for top rating
  } else if (rating === 4) {
    color = "rgb(82,164,127)";
  } else if (rating === 3) {
    color = "rgb(108,167,148)";
  } else if (rating === 2) {
    color = "rgb(134,171,170)";
  }
  return { color };
}


// Function to toggle preference report visibility
document.getElementById("showPreferenceReport").addEventListener("click", () => {
  const preferenceReportDiv = document.getElementById("preferenceReport");
  isPreferenceReportVisible = !isPreferenceReportVisible;

  preferenceReportDiv.style.display = isPreferenceReportVisible ? "block" : "none";

  const buttonText = isPreferenceReportVisible ? "Hide Preference Report" : "Show Preference Report";
  document.getElementById("showPreferenceReport").textContent = buttonText;

  if (isPreferenceReportVisible) {
    // Fetch and display preference report as a table
    chrome.storage.local.get("preferenceReport", (result) => {
      const preferenceReport = result.preferenceReport || {};
      const preferenceReportTable = `
        <table>
          <thead>
            <tr><th>Category</th><th>Score</th></tr>
          </thead>
          <tbody>
            ${Object.entries(preferenceReport)
              .map(([key, value]) => `
                <tr>
                  <td>${key}</td>
                  <td>${value}</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      `;
      preferenceReportDiv.innerHTML = preferenceReportTable;
    });
  } else {
    preferenceReportDiv.innerHTML = ''; // Clear the content when hidden
  }
});

// Reset button logic
document.getElementById("resetButton").addEventListener("click", () => {
  chrome.storage.local.set({ wastedTime: 0, regularTime: 0 }, () => {
    console.log("Time stats have been reset.");
    updateStats(); // Immediately update the display
  });
});

// Share button logic
document.getElementById("shareButton").addEventListener("click", () => {
  const shareUrl = "https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID"; // Replace with the actual extension URL
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert("The link to download the extension has been copied to your clipboard. Share it with your friends!");
  }).catch(err => {
    console.error("Failed to copy the link: ", err);
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
document.getElementById("ratedVideos").style.display = "none"; // Hide rated videos by default
document.getElementById("preferenceReport").style.display = "none"; // Hide preference report by default
updateStats();
