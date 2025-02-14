// Tracks whether stats, rated videos, and preference report are visible
let isStatsVisible = false;
let areRatedVideosVisible = false;
let isPreferenceReportVisible = false;
let isManualVisible = false;
let shareMessageTimeout = null;


// Function to retrieve preferenceReport from Chrome Storage
function getStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

// Calendar
async function initializeCalendar() {
  const recordDiv = document.getElementById("record");
  const result = await getStorage("timeRecords");
  const timeRecords = result.timeRecords || [];
  console.log("timeRecords:", timeRecords)
  const calendar = createCalendar(timeRecords);
  recordDiv.innerHTML = ""; // Clear any previous content
  recordDiv.style.backgroundColor = "#f7fafc";
  recordDiv.style.borderRadius = "10px";
  recordDiv.appendChild(calendar); // Append new calendar
}

function toLocalISOString(time) {
  // Get timezone offset in minutes (negative means ahead of UTC, positive means behind)
  const offsetMinutes = time.getTimezoneOffset();

  // Convert to local time
  const localDate = new Date(time.getTime() - offsetMinutes * 60 * 1000);

  // Format to ISO string without 'Z'
  const isoString = localDate.toISOString().split("Z")[0];

  // Format timezone offset
  const sign = offsetMinutes > 0 ? "-" : "+";
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, "0");
  const offsetMins = String(absOffsetMinutes % 60).padStart(2, "0");

  return `${isoString}${sign}${offsetHours}:${offsetMins}`;
}


function toLocalISOString(time) {
  // Get timezone offset in minutes (negative means ahead of UTC, positive means behind)
  const offsetMinutes = time.getTimezoneOffset();

  // Convert to local time
  const localDate = new Date(time.getTime() - offsetMinutes * 60 * 1000);

  // Format to ISO string without 'Z'
  const isoString = localDate.toISOString().split("Z")[0];

  // Format timezone offset
  const sign = offsetMinutes > 0 ? "-" : "+";
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, "0");
  const offsetMins = String(absOffsetMinutes % 60).padStart(2, "0");

  return `${isoString}${sign}${offsetHours}:${offsetMins}`;
}

// Function to create a calendar table
function createCalendar(timeRecords) {
  const minWeeks = 11;
  const today = new Date();
  const startDate = new Date(2024, 1, 1); // Earliest start date (Feb 1, 2024)

  // console.log("TODAY", today);
  // Filter and sort records by date
  const filteredRecords = timeRecords
    .filter(record => new Date(record.date) >= startDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Determine the first and the last date
  const now = new Date();
  const last5AM = new Date();
  last5AM.setHours(5, 0, 0, 0);
  if (now < last5AM) {
    last5AM.setDate(last5AM.getDate() - 1);
  }
  const lastlast5AM = new Date(last5AM - 24 * 60 * 60 * 1000);
  console.log("last5AM, lastlast5AM, toLocalISOString(lastlast5AM)", last5AM, lastlast5AM, toLocalISOString(lastlast5AM));

  const firstRecordDate = filteredRecords.length > 0 ? new Date(filteredRecords[0].date) : today;
  const lastPossibleDate = new Date(toLocalISOString(lastlast5AM).split("T")[0]);
  // 0 AM in UTC+0 timezone => Use ISO string to get adequate date.
  console.log("firstRecordDate, lastPossibleDate", firstRecordDate.toISOString(), lastPossibleDate.toISOString());

  // Map to store date-based records
  const dateMap = new Map();
  let currentDate = new Date(firstRecordDate);
  console.log("currentDate: ", currentDate.toISOString());

  let streakCounter = 0;
  let maxStreak = 0;
  let todayStreak = 0;
  let dayCounter = 0;
  while (currentDate.getDay() != 0) currentDate.setDate(currentDate.getDate() - 1);
  while ((currentDate <= today || (dayCounter % 7 !== 0)) || dayCounter < minWeeks * 7) {
    const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    const existingRecord = filteredRecords.find(record => record.date === dateString);
    const record = existingRecord || { date: dateString, wastedTime: 0, regularTime: 0 };
    dateMap.set(dateString, record);
    if (firstRecordDate < currentDate && currentDate <= lastPossibleDate) {
      if (record.wastedTime >= 600) {
        streakCounter = 0;
      }
      else {
        streakCounter++;
        maxStreak = Math.max(maxStreak, streakCounter);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
    dayCounter++;
  }
  todayStreak = streakCounter;

  // Ensure at least 20 weeks (columns)
  const totalDays = Array.from(dateMap.keys()).length;
  const totalWeeks = Math.max(Math.ceil(totalDays / 7), minWeeks);

  // Create table structure
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.border = "3px solid #f7fafc";
  table.style.overflowX = "auto";
  table.style.display = "block";
  table.style.marginBottom = "5px";
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);


  // Add title
  const titleRow = document.createElement("tr");
  const titleCell = document.createElement("td");
  titleCell.colSpan = totalWeeks + 1;
  titleCell.textContent = "Activities";
  titleCell.style.fontWeight = "bold";
  titleCell.style.textAlign = "left";
  titleCell.style.fontSize = "15px";
  titleCell.style.padding = "10px";
  titleCell.style.backgroundColor = "#f7fafc";
  titleRow.appendChild(titleCell);
  tbody.appendChild(titleRow);

  dayCounter = 0;

  // Initialize rows for each day of the week
  const rows = ["", "Mon ", "", "Wed ", "", "Fri ", ""].map(label => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = label;
    labelCell.style.fontWeight = "bold";
    labelCell.style.fontSize = "10px";
    labelCell.style.padding = "0px";
    labelCell.style.textAlign = "right";
    labelCell.style.backgroundColor = "#f7fafc";
    labelCell.style.whiteSpace = "nowrap";
    row.appendChild(labelCell);
    tbody.appendChild(row);
    return row;
  });

  for (const [dateString, record] of dateMap) {
    const date = new Date(dateString);
    date.setHours(5, 0, 0, 0);
    // console.log("DS: ", dateString, date, today);

    const dayIndex = date.getDay(); // 0 (Sun) to 6 (Sat)

    // Create and append cell
    const cell = document.createElement("td");
    if (firstRecordDate < date && date <= lastPossibleDate) {
      console.log(date, record.date, today);
      cell.style.backgroundColor = getCellColor(record.wastedTime);
      cell.style.border = "3px solid #f7fafc";
      cell.style.width = "3px";
      cell.style.height = "3px";
      cell.style.tableLayout = "fixed";
      cell.title = `Date: ${record.date}\nWasted Time: ${record.wastedTime.toFixed(2)} seconds\nRegular Time: ${record.regularTime.toFixed(2)} seconds`;
    }
    else if (date >= today - 24 * 60 * 60 * 1000) {
      cell.style.backgroundColor = "lightgray";
      cell.style.border = "3px solid #f7fafc";
      cell.style.width = "3px";
      cell.style.height = "3px";
      cell.style.tableLayout = "fixed";
      cell.title = `Date: ${record.date}\nFuture date`;
    }
    else {
      cell.style.backgroundColor = "lightgray";
      cell.style.border = "3px solid #f7fafc";
      cell.style.width = "3px";
      cell.style.height = "3px";
      cell.style.tableLayout = "fixed";
      cell.title = `Date: ${record.date}\nNo data`;
    }
    rows[dayIndex].appendChild(cell);
    dayCounter++;
  }

  // Right side empty column
  for (let i = 0; i < 7; i++) {
    const rightCell = document.createElement("td");
    rightCell.style.backgroundColor = "#f7fafc";
    rightCell.style.border = "3px solid #f7fafc";
    rightCell.style.width = "3px";
    rightCell.style.height = "3px";
    rightCell.style.tableLayout = "fixed";
    rows[i].appendChild(rightCell);
  };

  // Add streak info
  // const streakRow = document.createElement("tr");
  // const streakCell = document.createElement("td");
  // streakCell.colSpan = totalWeeks + 1;
  // streakCell.innerHTML = `<p><small>Longest Streak: ${maxStreak} days <br> Including Today: ${todayStreak} days</small></p>`;
  // streakCell.style.fontWeight = "bold";
  // streakCell.style.textAlign = "center";
  // streakCell.style.padding = "2px";
  // streakCell.style.backgroundColor = "#f7fafc";
  const streakRow = document.createElement("tr");
  const streakCell = document.createElement("td");
  streakCell.colSpan = totalWeeks + 1;
  streakCell.innerHTML = `<p><small>Longest Streak: ${maxStreak} days <br> Including Today: ${todayStreak} days</small></p>`;
  streakCell.style.fontWeight = "bold";
  streakCell.style.textAlign = "center";
  streakCell.style.padding = "8px";
  streakCell.style.backgroundColor = "#f7fafc";
  streakCell.style.borderRadius = "8px";
  streakCell.style.position = "relative";

  const tooltip = document.createElement("div");
  tooltip.innerText = "Only days with less than 10 minutes \nof wasted videos count as green.\nStreak resets at 5 AM.";
  tooltip.style.position = "absolute";
  tooltip.style.bottom = "80%";
  tooltip.style.left = "50%";
  tooltip.style.textAlign = "left";
  tooltip.style.width = "200px";
  tooltip.style.transform = "translateX(-50%)";
  tooltip.style.backgroundColor = "black";
  tooltip.style.color = "white";
  tooltip.style.padding = "6px 10px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.whiteSpace = "nowrap";
  tooltip.style.opacity = "0";
  tooltip.style.transition = "opacity 0.3s ease-in-out";

  tooltip.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  tooltip.style.pointerEvents = "none";

  streakCell.appendChild(tooltip);

  streakCell.addEventListener("mouseenter", () => {
    tooltip.style.opacity = "1";
  });
  streakCell.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });

  streakRow.appendChild(streakCell);
  tbody.appendChild(streakRow);

  return table;
}


// Determine the color of the cell based on wastedTime
function getCellColor(wastedTime) {
  // return "lightgray";
  if (wastedTime < 600) {
    // (128, 128, 128) (600) -> (58, 161, 105) (0)
    const red = 128 * wastedTime / 600 + 65 * (600 - wastedTime) / 600;
    const green = 128 * wastedTime / 600 + 209 * (600 - wastedTime) / 600;
    const blue = 128 * wastedTime / 600 + 132 * (600 - wastedTime) / 600;
    return `rgb(${red}, ${green}, ${blue})`; // Green shades
  } else {
    // (128, 128, 128) (600) -> (255, 66, 66) (INF)
    const red = 255 - 127 * 600 / wastedTime;
    const green = 66 + 62 * 600 / wastedTime;
    const blue = 66 + 62 * 600 / wastedTime;
    return `rgb(${red}, ${green}, ${blue})`; // Red shades
  }
}


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
    chrome.storage.local.get(["preferenceReport", "lastChangePreferenceReport", "preferenceReportExplanation"], (result) => {
      const preferenceReport = result.preferenceReport || {};
      const lastChangePreferenceReport = result.lastChangePreferenceReport || {};
      const preferenceReportExplanation = result.preferenceReportExplanation || {};

      const preferenceReportTable = `
      <table>
        <thead>
          <tr><th>Category</th><th>Score</th></tr>
        </thead>
        <tbody>
          ${Object.entries(preferenceReport)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => {
            const change = lastChangePreferenceReport[key] || 0;
            let changeIndicator = `<span style="color:gray;">0.00</span>`;

            if (change > 0) {
              changeIndicator = `<span style="color:red;">&#11205 ${change.toFixed(2)}</span>`;
            } else if (change < 0) {
              changeIndicator = `<span style="color:blue;">&#11206 ${Math.abs(change).toFixed(2)}</span>`;
            }

            return `<tr>
                    <td class="pref-category" data-tooltip="${preferenceReportExplanation[key] || ''}">
                      ${key}
                      <div class="tooltip">${preferenceReportExplanation[key] || ''}</div>
                    </td>
                    <td>${value.toFixed(2)} <br> <small>${changeIndicator}</small></td>
                  </tr>`;
          })
          .join('')}
        </tbody>
      </table>
    `;

      preferenceReportDiv.innerHTML = preferenceReportTable;

      // Add tooltip functionality
      document.querySelectorAll(".pref-category").forEach((cell) => {
        const tooltip = cell.querySelector(".tooltip");
        cell.addEventListener("mouseenter", () => {
          tooltip.style.opacity = "1";
        });
        cell.addEventListener("mouseleave", () => {
          tooltip.style.opacity = "0";
        });
      });

    });
  } else {
    preferenceReportDiv.innerHTML = ''; // Clear the content when hidden
  }
});



// // Function to toggle preference report visibility
// document.getElementById("showManual").addEventListener("click", () => {
//   const manualDiv = document.getElementById("manual");
//   isManualVisible = !isManualVisible;

//   manualDiv.style.display = manualDiv ? "block" : "none";

//   const buttonText = isManualVisible ? "Hide Manual" : "Show Manual";
//   document.getElementById("showManual").textContent = buttonText;

//   if (isManualVisible) {
//     manualDiv.style.fontFamily = "'Arial', sans-serif";
//     manualDiv.style.fontSize = "14px";
//     manualDiv.style.lineHeight = "1.6";
//     manualDiv.style.color = "#333";
//     manualDiv.style.zIndex = "1000";
//     manualDiv.style.textAlign = "left";

//     // Manual content
//     manualDiv.innerHTML = `
//       <strong style="font-size: 16px; display: block; text-align: center; margin-bottom: 8px;"> YouTube Time Saver Manual</strong>
//       <ol style="padding-left: 16px; margin: 0;">
//           <li>Our tool learns your preferences and nudges you toward content you genuinely value.</li>
//           <li>We personalize the wasted video classifier based on your video ratings!</li>
//           <li>You can view your watch statistics, rated videos, and preference report in the popup.</li>
//           <li>To pin the extension popup for easy access: Click the extension button in the top-right corner of Chrome, then click the pin icon next to "YouTube Time Saver".</li>
//       </ol>
//   `;
//   } else {
//     manualDiv.innerHTML = ''; // Clear the content when hidden
//   }
// });



// Share button logic
document.getElementById("shareButton").addEventListener("click", () => {
  const shareUrl = "https://chromewebstore.google.com/detail/youtube-time-saver/hgnjolfjangenehndnflggfpddcgjdfo?utm_source=referral&utm_medium=share&utm_campaign=viral";
  // const shareUrl = "https://chromewebstore.google.com/detail/youtube-time-saver/hgnjolfjangenehndnflggfpddcgjdfo"; // Replace with the actual extension URL
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
initializeCalendar();


