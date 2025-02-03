// Tracks whether stats, rated videos, and preference report are visible
let isStatsVisible = false;
let areRatedVideosVisible = false;
let isPreferenceReportVisible = false;
let shareMessageTimeout = null;

function printFormatTime(time) {
  if (time > 3600) {
    const hours = Math.floor(time / 3600);
    const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
    const seconds = String(Math.floor(time % 60)).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } else if (time > 60) {
    const minutes = String(Math.floor(time / 60));
    const seconds = String(Math.floor(time % 60)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  } else {
    return String(Math.floor(time)).padStart(2, "0");
  }
}

function updateStats() {
  chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
    const wastedTime = result.wastedTime || 0; // Time spent on Shorts
    const regularTime = result.regularTime || 0; // Time spent on regular videos
    const totalTime = wastedTime + regularTime;

    // Set the text content and colors
    const wastedTimeColor = "rgb(255, 66, 66)"; // More vivid red for wasted time
    const regularTimeColor = "rgb(56, 161, 105)"; // More vivid green for regular time

    document.getElementById("wastedTimeText").textContent = printFormatTime(wastedTime);
    document.getElementById("regularTimeText").textContent = printFormatTime(regularTime);
    document.getElementById("totalTimeText").textContent = printFormatTime(totalTime);

    // Set the labels with vivid colors
    document.getElementById("wastedTimeLabel").innerHTML = `<span style="color:${wastedTimeColor}; font-weight: bold;">Wasted Videos</span>`;
    document.getElementById("regularTimeLabel").innerHTML = `<span style="color:${regularTimeColor}; font-weight: bold;">Regular Videos</span>`;

    // Draw the pie chart
    drawPieChart(wastedTime, regularTime, wastedTimeColor, regularTimeColor);
  });
}

// Function to draw a pie chart with thinner border and smaller size
function drawPieChart(wastedTime, regularTime, wastedTimeColor, regularTimeColor) {
  const canvas = document.getElementById("pieChart");
  const ctx = canvas.getContext("2d");

  // Add a small value to avoid zero division
  wastedTime = wastedTime || 1;
  regularTime = regularTime || 1;

  // Calculate the total time for pie chart
  const total = wastedTime + regularTime;

  // Define the angles for the slices
  const wastedAngle = (wastedTime / total) * 2 * Math.PI;
  const regularAngle = (regularTime / total) * 2 * Math.PI;

  // Clear the canvas before drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the wasted time slice (Red)
  ctx.beginPath();
  ctx.moveTo(100, 100); // Move to center of smaller pie chart
  ctx.arc(100, 100, 85, 0, wastedAngle); // Draw the arc for wasted time
  ctx.fillStyle = wastedTimeColor; // More vivid red color
  ctx.fill();

  // Draw the regular time slice (Green)
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.arc(100, 100, 85, wastedAngle, wastedAngle + regularAngle); // Draw the arc for regular time
  ctx.fillStyle = regularTimeColor; // More vivid green color
  ctx.fill();

  // Optional: No border or thin border around the pie chart
  // ctx.beginPath();
  // ctx.arc(100, 100, 85, 0, 2 * Math.PI);
  // ctx.lineWidth = 2; // Thin border width
  // ctx.strokeStyle = "#000000"; // Black border (can be removed if not needed)
  // ctx.stroke();
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


// // Reset button logic
// document.getElementById("resetButton").addEventListener("click", () => {
//   chrome.storage.local.set({ wastedTime: 0, regularTime: 0 }, () => {
//     console.log("Time stats have been reset.");
//     updateStats(); // Immediately update the display
//   });
// });


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
        .sort((a, b) => b.rating - a.rating)
        .map(video => {
          const ratingClass = getRatingClass(video.rating);
          return `
            <tr>
              <td style="color: #000000; font-size: 11px;">${video.title}</td>
              <td style="color: #000000; font-size: 11px;">${video.channel}</td>
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
          .sort((a, b) => b[1] - a[1])
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



// Share button logic
document.getElementById("shareButton").addEventListener("click", () => {
  const shareUrl = "https://chromewebstore.google.com/detail/youtube-time-saver/hgnjolfjangenehndnflggfpddcgjdfo"; // Replace with the actual extension URL
  // const shareUrl = "https://github.com/jun-pac/Project-Ulysses";
  navigator.clipboard.writeText(shareUrl).then(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "showShareMessage", message: "The link has been copied to your clipboard. Share it with your friends!" });
    });
  }).catch(err => {
    console.error("Failed to copy the link: ", err);
  });
});

// Real-time stats updates
setInterval(() => {
  if (isStatsVisible) {
    updateStats();
  }
}, 1000); // Update every 100ms

// Initial setup
document.getElementById("stats").style.display = "none"; // Hide stats by default
document.getElementById("ratedVideos").style.display = "none"; // Hide rated videos by default
document.getElementById("preferenceReport").style.display = "none"; // Hide preference report by default
updateStats();
