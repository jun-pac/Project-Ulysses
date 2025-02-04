
if (!window.isContentScriptLoaded) {
  // Begin from here if reloaded
  window.isContentScriptLoaded = true;

  const smallTimeInterval = 500;
  const largeTimeInterval = 3000;

  let currentUrl = null;
  let currentVideoId = null;
  let isShorts = null;
  let isWaste = null;
  let isMovie = null;
  let initialrun = null;

  let timerDiv = null;
  let ratingDiv = null;
  let buttonDiv = null;
  let ratingMessageTimeout = null;
  let shareMessageTimeout = null;

  const timeThresholds = [
    { time: 30 * 60, message: "30 minutes", suggestion: "How about a quick 5-minute stretch? You'd be amazed how much more energized you'll feel!" },
    { time: 60 * 60, message: "1 hour", suggestion: "You could knock out a chapter of that book you've been meaning to read!" },
    { time: 2 * 60 * 60, message: "2 hours", suggestion: "Consider taking a walk or spending a few minutes journaling. It can help you reset." },
    { time: 3 * 60 * 60, message: "3 hours", suggestion: "Maybe it's time to dive into that hobby you've been meaning to explore." },
    { time: 4 * 60 * 60, message: "4 hours", suggestion: "How about spending a few minutes organizing your space or planning your day?" },
    { time: 5 * 60 * 60, message: "5 hours", suggestion: "Maybe a 20-minute walk could give you a boost." },
    { time: 6 * 60 * 60, message: "6 hours", suggestion: "After six hours, perhaps a quick workout or a power nap might refresh you!" },
    { time: 7 * 60 * 60, message: "7 hours", suggestion: "A quick stretch or breathing exercises could help clear your head." },
    { time: 8 * 60 * 60, message: "8 hours", suggestion: "Maybe take a break and do something productive like cooking or organizing." }
  ];


  function createTimer() {
    if (!timerDiv) {
      // Create the main timer container
      timerDiv = document.createElement("div");
      timerDiv.id = "shortsTimer";
      timerDiv.style.position = "fixed";
      timerDiv.style.top = "45%";
      timerDiv.style.left = "80%";
      timerDiv.style.transform = "translateX(-50%)";
      timerDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      timerDiv.style.color = "white";
      timerDiv.style.fontSize = "24px";
      timerDiv.style.padding = "15px";
      timerDiv.style.borderRadius = "12px";
      timerDiv.style.zIndex = "9999";
      timerDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      timerDiv.style.boxShadow = "0px 4px 15px rgba(0, 0, 0, 0.2)";
      timerDiv.style.textAlign = "center";
      timerDiv.style.cursor = "move";
      timerDiv.style.width = "205px";

      // Create the rotating dot animation container
      const spinnerContainer = document.createElement("div");
      spinnerContainer.style.position = "relative";
      spinnerContainer.style.width = "100px";
      spinnerContainer.style.height = "100px";
      spinnerContainer.style.margin = "auto";

      // Create the dots for circular animation
      for (let i = 0; i < 16; i++) {
        const dot = document.createElement("div");
        dot.className = "loading-dot";
        dot.style.position = "absolute";
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.backgroundColor = "white";
        dot.style.borderRadius = "50%";
        dot.style.animation = `fadeInOut 2s linear infinite ${i * 0.125}s`;

        const angle = (i / 16) * 2 * Math.PI;
        const x = 47 + 55 * Math.cos(angle);
        const y = 56 + 55 * Math.sin(angle);
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        spinnerContainer.appendChild(dot);
      }

      // Create the time display inside the animation
      const timeDisplay = document.createElement("div");
      timeDisplay.id = "wastedTimeDisplay";
      timeDisplay.style.position = "absolute";
      timeDisplay.style.width = "120px";
      timeDisplay.style.top = "60%";
      timeDisplay.style.left = "50%";
      timeDisplay.style.transform = "translate(-50%, -50%)";
      timeDisplay.style.fontSize = "24px";
      timeDisplay.style.fontWeight = "bold";

      spinnerContainer.appendChild(timeDisplay);

      // Create the warning text
      const warningText = document.createElement("div");
      warningText.textContent = "You are wasting time!";
      warningText.style.marginTop = "35px";
      warningText.style.fontSize = "20px";
      warningText.style.fontWeight = "bold";

      // Append elements to the timer
      timerDiv.appendChild(spinnerContainer);
      timerDiv.appendChild(warningText);
      document.body.appendChild(timerDiv);

      // Make the timer draggable
      makeDraggable(timerDiv, "timerPosition");

      // Load saved position from storage
      chrome.storage.local.get(["timerPosition"], function (result) {
        if (result.timerPosition) {
          timerDiv.style.top = result.timerPosition.top;
          timerDiv.style.left = result.timerPosition.left;
          timerDiv.style.transform = "none";
        }
      });

      // CSS animation for rotating dots
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.0; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(styleSheet);
      chrome.storage.local.get(["wastedTime"], (result) => {
        updateWastedTimeDisplay(result.wastedTime);
      });
    }
  }

  function makeDraggable(element, storageKey) {
    let offsetX, offsetY, isDragging = false;

    element.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;

      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;

      if (newX < 0) newX = 0;
      if (newX + elementWidth > screenWidth) newX = screenWidth - elementWidth;
      if (newY < 0) newY = 0;
      if (newY + elementHeight > screenHeight) newY = screenHeight - elementHeight;

      const leftPercent = (newX / screenWidth) * 100;
      const topPercent = (newY / screenHeight) * 100;

      element.style.left = `${leftPercent}%`;
      element.style.top = `${topPercent}%`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        chrome.storage.local.set({
          [storageKey]: {
            top: element.style.top,
            left: element.style.left
          }
        });
      }
    });


    chrome.storage.local.get([storageKey], function (result) {
      if (result[storageKey]) {
        element.style.top = result[storageKey].top;
        element.style.left = result[storageKey].left;
        element.style.transform = "none";
      }
    });
  }


  // Function to update the wasted time display
  function updateWastedTimeDisplay(wastedTime) {
    const timeDisplay = document.getElementById("wastedTimeDisplay");
    if (timeDisplay) {
      if (wastedTime > 3600) {
        const hours = Math.floor(wastedTime / 3600);
        const minutes = String(Math.floor((wastedTime % 3600) / 60)).padStart(2, "0");
        const seconds = String(Math.floor(wastedTime % 60)).padStart(2, "0");
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
      } else if (wastedTime > 60) {
        const minutes = String(Math.floor(wastedTime / 60));
        // const seconds = String((wastedTime % 60).toFixed(2)).padStart(2, "0");
        const seconds = String(Math.floor(wastedTime % 60)).padStart(2, "0");
        timeDisplay.textContent = `${minutes}:${seconds}`;
      } else {
        timeDisplay.textContent = String(Math.floor(wastedTime));
      }
    }
  }




  // Remove the timer from the page
  function removeTimer() {
    if (timerDiv) {
      timerDiv.remove(); // Remove the timer from the DOM
      timerDiv = null;   // Reset the timerDiv reference
    }
  }

  // Add a rating UI for user feedback
  function createRatingUI() {
    if (ratingDiv) return;

    // Create the main rating container
    ratingDiv = document.createElement("div");
    ratingDiv.id = "ratingDiv";
    ratingDiv.style.position = "fixed";
    ratingDiv.style.top = "10%";
    ratingDiv.style.left = "80%";
    ratingDiv.style.transform = "translateX(-50%)";
    ratingDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    ratingDiv.style.boxShadow = "0px 4px 12px rgba(0, 0, 0, 0.2)";
    ratingDiv.style.padding = "20px"; // Reduced padding for a smaller box
    ratingDiv.style.borderRadius = "20px";
    ratingDiv.style.display = "flex";
    ratingDiv.style.flexDirection = "column";
    ratingDiv.style.alignItems = "center";
    ratingDiv.style.zIndex = "9999";
    ratingDiv.style.width = "320px";
    ratingDiv.style.height = "150px";

    // Add title text
    const text = document.createElement("p");
    text.textContent = "Rate this video:";
    text.style.fontSize = "20px";
    text.style.fontWeight = "bold";
    text.style.marginBottom = "15px"; // Reduced margin for compactness
    text.style.color = "#333";
    ratingDiv.appendChild(text);

    const subText = document.createElement("p");
    subText.textContent = "Ratings will be used to personalize waste video detection.";
    subText.style.fontSize = "12px";
    subText.style.textAlign = "center";
    subText.style.marginBottom = "5px"; // Reduced margin for compactness
    subText.style.color = "#666";
    ratingDiv.appendChild(subText);

    // Create stars with labels
    const starContainer = document.createElement("div");
    starContainer.style.display = "flex";
    starContainer.style.alignItems = "flex-start";
    starContainer.style.justifyContent = "center";
    starContainer.style.gap = "0px"; // Reduced gap between stars
    starContainer.style.width = "100%";

    for (let i = 1; i <= 5; i++) {
      const starWrapper = document.createElement("div");
      starWrapper.style.display = "flex";
      starWrapper.style.flexDirection = "column";
      starWrapper.style.alignItems = "center";
      starWrapper.style.margin = "0 8px"; // Reduced margin for compactness

      const starButton = document.createElement("button");
      starButton.innerHTML = "&#9733;";
      starButton.style.fontSize = "30px";
      starButton.style.color = "#D4AF37"; // Gold with a darker shade
      starButton.style.background = "none";
      starButton.style.border = "none";
      starButton.style.cursor = "pointer";
      starButton.style.transition = "transform 0.2s ease";
      starButton.onmouseover = () => {
        starButton.style.transform = "scale(1.4)";
      };
      starButton.onmouseout = () => {
        starButton.style.transform = "scale(1)";
      };

      starButton.onclick = () => {
        updatePreferenceReport(i);
        removeRatingUI();
        showRatingMessage("Thank you for rating this video!");
      };

      const label = document.createElement("p");
      label.textContent = i;
      label.style.fontSize = "14px";
      label.style.margin = "5px 0 0";
      label.style.color = "#333";

      starWrapper.appendChild(starButton);
      starWrapper.appendChild(label);
      starContainer.appendChild(starWrapper);
    }
    ratingDiv.appendChild(starContainer);

    // Rating explanation
    const explainText = document.createElement("p");
    explainText.style.marginTop = "5px";
    let spaces = "";
    for (let i = 1; i <= 53; i++) spaces = spaces + "&nbsp;";
    explainText.innerHTML = "(wasteful)" + spaces + "(beneficial)";
    explainText.style.fontSize = "12px";
    explainText.style.color = "#666";
    ratingDiv.appendChild(explainText);

    // Add to the body
    document.body.appendChild(ratingDiv);

    // Make the timer draggable
    makeDraggable(ratingDiv, "ratingPosition");

    // Load saved position from storage
    chrome.storage.local.get(["ratingPosition"], function (result) {
      if (result.ratingPosition) {
        ratingDiv.style.top = result.timerPosition.top;
        ratingDiv.style.left = result.timerPosition.left;
        ratingDiv.style.transform = "none";
      }
    });
  }

  // Show a message after rating
  function showRatingMessage(message) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.style.position = "fixed";
    messageDiv.style.top = "20%";
    messageDiv.style.left = "50%";
    messageDiv.style.transform = "translate(-50%, -50%)";
    messageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    messageDiv.style.color = "white";
    messageDiv.style.padding = "20px 30px";
    messageDiv.style.borderRadius = "10px";
    messageDiv.style.fontSize = "20px";
    messageDiv.style.zIndex = "10000";
    messageDiv.style.textAlign = "center";

    document.body.appendChild(messageDiv);

    // Delete message after 2 seconds
    if (ratingMessageTimeout) clearTimeout(ratingMessageTimeout);
    ratingMessageTimeout = setTimeout(() => {
      messageDiv.remove();
    }, 2000);
  }

  // Remove the rating UI
  function removeRatingUI() {
    if (ratingDiv) {
      ratingDiv.remove();
      ratingDiv = null;
    }
  }

  async function saveRating(videoDetails, rating) {
    try {
      const result = await getStorage("videoRatings");
      const ratings = result.videoRatings || {};
      ratings[videoDetails.videoId] = {
        title: videoDetails.title,
        channel: videoDetails.channel,
        rating,
      };

      await setStorage({ videoRatings: ratings });  // Wait for the set operation to complete
      console.log("Rating saved:", ratings[videoDetails.videoId]);

      // Now run isWastingVideo after the storage update
      if (rating !== 3) {
        // Caution!! Optimization to reduce ChatGPT API call (Need to be addressed after Wasting Decision tree re-designed.)
        isWaste = await isWastingVideo();  // This is awaited now
      }
      console.log("Updated isWaste:", isWaste);

    } catch (error) {
      console.error("Error saving rating:", error);
    }
  }


  // Show a message after click share button
  function showShareMessage(message) {
    const existingMessage = document.getElementById("shareMessageDiv");
    if (existingMessage) {
      existingMessage.remove();
      clearTimeout(shareMessageTimeout);
    }


    const shareMessageDiv = document.createElement("div");
    shareMessageDiv.id = "shareMessageDiv";
    shareMessageDiv.textContent = message;
    shareMessageDiv.style.position = "fixed";
    shareMessageDiv.style.top = "20%";
    shareMessageDiv.style.left = "50%";
    shareMessageDiv.style.transform = "translate(-50%, -50%)";
    shareMessageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    shareMessageDiv.style.color = "white";
    shareMessageDiv.style.padding = "20px 30px";
    shareMessageDiv.style.borderRadius = "10px";
    shareMessageDiv.style.fontSize = "16px";
    shareMessageDiv.style.zIndex = "10000";
    shareMessageDiv.style.textAlign = "center";

    document.body.appendChild(shareMessageDiv);

    // Delete message after 2 seconds
    if (shareMessageTimeout) clearTimeout(shareMessageTimeout);
    shareMessageTimeout = setTimeout(() => {
      shareMessageDiv.remove();
    }, 2000);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showShareMessage") {
      showShareMessage(request.message);
    }
  });

  // Function to create the popup button
  function createPopupButton() {
    // If the button already exists, do nothing
    if (buttonDiv) return;


    // Create the button container
    buttonDiv = document.createElement("div");
    buttonDiv.id = "popup-button";
    buttonDiv.style.position = "fixed";
    buttonDiv.style.top = "140px";
    buttonDiv.style.right = "120px";
    buttonDiv.style.width = "80px";
    buttonDiv.style.height = "80px";
    buttonDiv.style.borderRadius = "50%";
    buttonDiv.style.display = "flex";
    buttonDiv.style.alignItems = "center";
    buttonDiv.style.justifyContent = "center";
    buttonDiv.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    buttonDiv.style.cursor = "pointer";
    buttonDiv.style.zIndex = "1000";
    buttonDiv.style.userSelect = "none";
    buttonDiv.style.overflow = "hidden";

    // Set background image
    buttonDiv.style.backgroundImage = `url(${chrome.runtime.getURL('Transparent_ulysses.png')})`;
    buttonDiv.style.backgroundSize = "contain";
    buttonDiv.style.backgroundRepeat = "no-repeat";
    buttonDiv.style.backgroundPosition = "center";

    // Append the button to the document body
    document.body.appendChild(buttonDiv);

    // Toggle popup UI on button click
    buttonDiv.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
  }

  // Remove the rating UI
  function removePopupButton() {
    if (buttonDiv) {
      buttonDiv.remove();
      buttonDiv = null;
    }
  }



  // Function to show the warning message UI
  function showAlertMessage(timeMessage, suggestion) {
    // Create the container for the warning message
    const alertContainer = document.createElement('div');
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '10px';
    alertContainer.style.left = '50%';
    alertContainer.style.transform = 'translateX(-50%)';
    alertContainer.style.backgroundColor = '#ffcc00';
    alertContainer.style.color = '#333';
    alertContainer.style.padding = '15px';
    alertContainer.style.borderRadius = '10px';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.fontSize = '18px';
    alertContainer.style.textAlign = 'center';
    alertContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    alertContainer.style.opacity = '1';
    alertContainer.style.transition = 'opacity 1s ease-out';

    // Add the time message in larger, bold text
    const timeMessageElem = document.createElement('h2');
    timeMessageElem.textContent = `You've watched YouTube for ${timeMessage}!`;
    timeMessageElem.style.fontSize = '24px';
    timeMessageElem.style.fontWeight = 'bold';

    // Add the suggestion text
    const suggestionElem = document.createElement('p');
    suggestionElem.textContent = suggestion;

    // Append the elements to the container
    alertContainer.appendChild(timeMessageElem);
    alertContainer.appendChild(suggestionElem);

    // Append the alert container to the body
    document.body.appendChild(alertContainer);

    // Remove the alert after 5 seconds
    setTimeout(() => {
      alertContainer.style.opacity = '0'; // Fade out
      setTimeout(() => {
        alertContainer.remove(); // Remove the alert from the DOM
      }, 1000); // Wait for the fade-out transition to complete
    }, 5000); // Keep the message for 5 seconds
  }


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

  // Promisified function for chrome.storage.local.set
  function setStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }



  function truncateDescription(description, maxLength = 300) {
    return description.length > maxLength ? description.substring(0, maxLength) + "..." : description;
  }

  function parseISO8601Duration(duration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return 0;

    const hours = parseInt(matches[1] || "0", 10);
    const minutes = parseInt(matches[2] || "0", 10);
    const seconds = parseInt(matches[3] || "0", 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  function getVideoId() {
    const url = new URL(window.location.href);

    // Check if the URL is for a regular YouTube video
    if (url.hostname === "www.youtube.com" && url.pathname.startsWith("/watch")) {
      return new URLSearchParams(url.search).get("v"); // Regular video ID
    }

    // Check if the URL is for a YouTube Shorts video
    if (url.hostname === "www.youtube.com" && url.pathname.startsWith("/shorts/")) {
      // Extract videoId from the path (after "/shorts/")
      const pathParts = url.pathname.split("/shorts/");
      return pathParts[1]; // Video ID from Shorts URL
    }

    // Return null if the videoId cannot be found
    return null;
  }


  async function getVideoDetails() {
    // Video ID
    console.log("getVideoDetails function call");
    const videoId = getVideoId();
    currentVideoId = videoId;

    try {
      // const { youtube_apiKey } = await getStorage(["youtube_apiKey"]);
      // console.log("youtube_apiKey: " + youtube_apiKey);
      // const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtube_apiKey}`;
      // const response = await fetch(apiUrl);
      // if (!response.ok) {
      //   throw new Error(`API request failed with status ${response.status}`);
      // }
      const response = await fetch(`https://7r8wl7aqi9.execute-api.ap-southeast-2.amazonaws.com/dev/video-details?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch video details");
      }
      const data = await response.json();

      if (data.items.length === 0) {
        console.log("No video found for the given ID.");
        return null;
      }
      // console.log("API Response:", JSON.stringify(data, null, 2));

      const videoDetails = data.items[0].snippet;
      const videoContentDetails = data.items[0].contentDetails;
      const lengthInSeconds = parseISO8601Duration(videoContentDetails.duration);

      return {
        videoId,
        title: videoDetails.title,
        channel: videoDetails.channelTitle,
        description: truncateDescription(videoDetails.description),
        lengthInSeconds
      };
    } catch (error) {
      console.error("Error fetching video details:", error);
      return null;
    }
  }

  // Function to initialize the preference report
  function initializePreferenceReport() {
    const initialReport = {
      curiosity_driven: 3.0,
      humor: 3.0,
      emotional_catharsis: 3.0,
      excitement: 3.0,
      relaxation: 3.0,
      aesthetic_pleasure: 3.0,
      empowerment: 3.0,
      controversy: 3.0,
      fear_thrill: 3.0,
      romantic_aspiration: 3.0,
      social_connection: 3.0,
      intellectual_stimulation: 3.0,
      practical_knowledge: 3.0,
      sensory_stimulation: 3.0,
      empathy_compassion: 3.0,
      nostalgia: 3.0,
      achievement_focused: 3.0,
      meme_culture: 3.0,
      cultural_exploration: 3.0,
      self_expression: 3.0,
    };
    chrome.storage.local.get(["preferenceReport"], (result) => {
      if (result.preferenceReport) {
        console.log("Preference report already exists. Skipping initialization.");
      } else {
        chrome.storage.local.set({ preferenceReport: initialReport }, () => {
          console.log("Preference report initialized.");
        });
      }
    });
  }


  // Function to update user's preference report
  async function updatePreferenceReport(userRating) {
    const videoDetails = await getVideoDetails();
    console.log("updatePreferenceReport title : ", videoDetails.title);
    console.log("updatePreferenceReport channel : ", videoDetails.channel);
    console.log("updatePreferenceReport description : ", videoDetails.description);
    console.log("updatePreferenceReport lengthInSeconds : ", videoDetails.lengthInSeconds);

    saveRating(videoDetails, userRating);

    const { preferenceReport } = await getStorage(["preferenceReport"]);
    const prevPreferenceReport = JSON.parse(JSON.stringify(preferenceReport));

    const prompt = `The current user's preference report is as follows:
      ${JSON.stringify(preferenceReport, null, 2)}

      Each factor in the preference report has a value between 1.0 and 5.0:
      - A value of 3.0 represents an average interest in that factor.
      - A value above 3.0 indicates a stronger preference or enjoyment of content that aligns with that factor.
      - A value below 3.0 indicates a lower preference or a tendency to find such content less engaging or potentially a waste.

      Update the preference report based on the following new video details and user rating. Ensure changes are proportional to the rating (higher ratings cause larger adjustments):
      - Video Title: "${videoDetails.title}"
      - Channel: "${videoDetails.channel}"
      - Description: "${videoDetails.description}"
      - Length in seconds: ${videoDetails.lengthInSeconds}
      - User Rating: ${userRating}
      
      Respond with ONLY the updated preference report in valid JSON format without any additional explanation or text.`;

    const messages = [
      { role: "system", content: "You are an assistant designed to update user preference reports accurately based on video details and ratings." },
      { role: "user", content: prompt },
    ];

    const response = await fetch("https://7r8wl7aqi9.execute-api.ap-southeast-2.amazonaws.com/dev/api/chatgpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    try {
      console.log("raw output: ", data);
      const rawContent = data.choices[0].message.content.trim();

      // Check if the raw content is a valid JSON object without markers (start and end with {})
      let updatedReport;
      if (rawContent.startsWith("{") && rawContent.endsWith("}")) {
        // Directly parse the JSON object if it starts with "{" and ends with "}"
        updatedReport = JSON.parse(rawContent);
      } else {
        // Otherwise, extract JSON between ```json and ```
        const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          throw new Error("Failed to extract JSON content from the response.");
        }
        // Parse the extracted JSON
        updatedReport = JSON.parse(jsonMatch[1]);
      }

      console.log("Parsed Updated Report:", updatedReport);


      // Validate and update the original preference report
      for (const key in preferenceReport) {
        if (updatedReport.hasOwnProperty(key)) {
          const value = updatedReport[key];
          // Check if the value is a valid float between 1.0 and 5.0
          if (typeof value === "number") {
            preferenceReport[key] = Math.min(Math.max(value, 1.0), 5.0);
          } else {
            console.warn(`Invalid value for key "${key}": ${value}`);
          }
        } else {
          console.warn(`Key "${key}" is missing in the updated report.`);
        }
      }

      // Normalization
      let sum = 0;
      let count = 0;

      for (const key in preferenceReport) {
        sum += preferenceReport[key];
        count++;
      }
      const average = count > 0 ? sum / count : 3.0; // Default average to 3.0 if count is 0
      const deviation = average - 3.0; // Deviation from the neutral point
      console.log("Normalization... current average preference: ", average)
      // Compute adjustment value (rounded to nearest 0.1 step)
      const adjustment = Math.sign(deviation) * Math.floor(Math.abs(deviation) / 0.01) * 0.01;

      for (const key in preferenceReport) {
        let value = preferenceReport[key] - adjustment;
        preferenceReport[key] = Math.round(100 * Math.min(Math.max(value, 1.0), 5.0)) / 100;
      }

      const lastChangePreferenceReport = {};
      for (const key in preferenceReport) {
        lastChangePreferenceReport[key] = preferenceReport[key] - (prevPreferenceReport[key] || 0);
      }


      chrome.storage.local.set({ preferenceReport, lastChangePreferenceReport }, () => {
        console.log("Preference report updated.");
      });

      return null;
    } catch (error) {
      console.error("Failed to parse API response:", data);
      return null;
    }
  }

  // Function to check if a video is a waste for the user
  async function isWastingVideo() {
    // Priority: (Shorts: true, Movie: false) > (Rated video (1,2): true, (4,5): false) > (Preference Report)
    if (isShortsVideo()) return true;
    const { videoId, title, channel, description, lengthInSeconds } = await getVideoDetails();

    // Movies can't be wasting video 
    if (channel === "YouTube Movies") {
      console.log("This is a movie.");
      isMovie = true;
      return false;
    }

    isMovie = false;

    // If user rating exists in current video
    const ratings = await getStorage(["videoRatings"]) || {};
    const videoRating = ratings.videoRatings[videoId];
    if (videoRating) {
      if (videoRating.rating === 1 || videoRating.rating === 2) {
        console.log("Low rating");
        return true;
      } else if (videoRating.rating === 4 || videoRating.rating === 5) {
        console.log("High rating");
        return false;
      }
    }

    const { preferenceReport } = await getStorage(["preferenceReport"]);

    const prompt = `The user's current preference report is as follows:
      ${JSON.stringify(preferenceReport, null, 2)}

      Video details:
      - Title: "${title}"
      - Channel: "${channel}"
      - Description: "${description}"
      - Length in seconds: ${lengthInSeconds}

      Determine if this video is a "wasted video" for this user based on the preference report and the video's details.
      Rules:
      - Videos shorter than 3 minutes (180 seconds) are likely to be wasted videos.
      - Each factor in the preference report has a value between 1 and 5 (A value of 3 represents an average interest in that factor.)
      - A video is more likely to be a wasted video if it aligns with topics or categories where the user's preference report has low values.
      - Respond with ONLY the result as a JSON object:
      { "is_waste": 1 } if the video is a wasted video, or { "is_waste": 0 } if it is not.`;

    const messages = [
      { role: "system", content: "You are an assistant trained to determine if videos align with user preferences or are a waste of time." },
      { role: "user", content: prompt },
    ];

    const response = await fetch("https://7r8wl7aqi9.execute-api.ap-southeast-2.amazonaws.com/dev/api/chatgpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    try {
      console.log("raw output: ", data);
      const rawContent = data.choices[0].message.content.trim();
      let result;
      if (rawContent.startsWith("{") && rawContent.endsWith("}")) {
        // Directly parse the JSON object if it starts with "{" and ends with "}"
        result = JSON.parse(rawContent);
      } else {
        // Otherwise, extract JSON between ```json and ```
        const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          throw new Error("Failed to extract JSON content from the response.");
        }
        // Parse the extracted JSON
        result = JSON.parse(jsonMatch[1]);
      }
      console.log("processed content: ", result);

      console.log(result);
      console.log("isWastingVideo result | title: ", title, " isWaste: ", result.is_waste);
      return result.is_waste === 1;
    } catch (error) {
      console.error("Failed to parse API response:", data);
      return null;
    }
  }


  function isShortsVideo() {
    return window.location.href.includes("/shorts/");
  }


  function trackWastedTime() {
    let currentVideo = null;
    let previousIsShorts = isShortsVideo();
    let totalTime = 0;
    let smallIntervalCount = 0;
    const smallToLarge = largeTimeInterval / smallTimeInterval;

    setInterval(() => {
      if (initialrun || (currentUrl !== window.location.href && (currentVideoId !== getVideoId()))) {
        initialrun = false;
        isMovie = false; // Updated in isWasteVideo function
        currentUrl = window.location.href;
        currentVideoId = getVideoId();
        isShorts = isShortsVideo();
        removeRatingUI();


        // Reload if switched between Shorts and Regular videos.
        if (isShorts !== previousIsShorts) {
          previousIsShorts = isShorts;
          console.log("Switching between Shorts and Regular. Reloading...");
          window.location.reload();
        }

        if (currentUrl.startsWith("https://www.youtube.com/watch") || currentUrl.startsWith("https://www.youtube.com/shorts")) {
          createRatingUI();
          isWastingVideo().then((result) => {
            isWaste = result;
            console.log("Initial isWaste:", isWaste); // This will log true or false
          });
        }
      }


      if (!(currentUrl.startsWith("https://www.youtube.com/watch") || currentUrl.startsWith("https://www.youtube.com/shorts"))) {
        // Run function only on the YouTube main page
        isWaste = false;
        createPopupButton();
      }
      else {
        removePopupButton(); // remove popup button
      }

      // Only create timer if we're on a wasting video
      if (isWaste) {
        createTimer(); // Create timer for wasting video
      } else {
        removeTimer();
      }

      // Force a fresh query for the current video element
      currentVideo = document.querySelector("video");
      // console.log("Final selected video element:", currentVideo );
      console.log("isShortsVideo: " + isShorts + " | isWasteVideo: " + isWaste + " | isPlaying: " + (currentVideo && !currentVideo.paused));

      if (currentVideo && !currentVideo.paused) {
        // No Ad detection logic
        const increment = smallTimeInterval / 1000; // Convert ms to seconds
        chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
          totalTime = (result.wastedTime || 0) + (result.regularTime || 0);
          if (isWaste) {
            const wastedTime = (result.wastedTime || 0) + increment;
            updateWastedTimeDisplay(wastedTime);
            chrome.storage.local.set({ wastedTime });
          } else {
            const regularTime = (result.regularTime || 0) + increment;
            chrome.storage.local.set({ regularTime });
          }
        });


        if (smallIntervalCount === smallToLarge - 1) {
          // Check if total time exceeds any threshold and message hasn't been shown yet
          for (const threshold of timeThresholds) {
            if (totalTime >= threshold.time) {
              // Check if the message for this threshold hasn't been displayed yet
              chrome.storage.local.get([`alerted_${threshold.message}`], (alertData) => {
                if (!alertData[`alerted_${threshold.message}`]) {
                  // Display the message with the activity suggestion
                  if (!isMovie) showAlertMessage(threshold.message, threshold.suggestion);

                  // Mark this threshold as alerted to avoid showing it again
                  chrome.storage.local.set({ [`alerted_${threshold.message}`]: true });
                }
              });
            }
          }

          // Check if video has played for more than 15 seconds
          if (currentVideo.currentTime > 15) {

            removeRatingUI();  // Remove UI with fade out effect
          }

          // Reset interval count
          smallIntervalCount = 0;
        }
        else smallIntervalCount++;
      }
    }, smallTimeInterval);
  }


  function getKoreanTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const koreaTime = new Date(utc + 9 * 60 * 60000);
    return koreaTime;
  }

  function resetDailyTimeTracking() {
    chrome.storage.local.get(["lastResetTime", "regularTime", "wastedTime"], (data) => {
      const now = getKoreanTime();

      const lastResetTime = data.lastResetTime ? new Date(data.lastResetTime) : new Date(0);

      const last5AM = new Date(now);
      last5AM.setHours(5, 0, 0, 0);
      if (now < last5AM) {
        last5AM.setDate(last5AM.getDate() - 1);
      }

      // console.log("resetDailyTimeTracking called | now: ", now.toISOString(), " | last5AM: ", last5AM, " | lastResetTime:", lastResetTime);

      if (lastResetTime < last5AM) {
        const record = {
          date: last5AM.toISOString().split("T")[0],
          regularTime: data.regularTime || 0,
          wastedTime: data.wastedTime || 0,
        };

        console.log("Today's record saved!!! ", record);

        chrome.storage.local.get(["timeRecords"], (storedData) => {
          const timeRecords = storedData.timeRecords || [];
          timeRecords.push(record);
          chrome.storage.local.set({ timeRecords });
        });

        chrome.storage.local.set({ regularTime: 0, wastedTime: 0, lastResetTime: now.toISOString() });

        // Reset alerted message
        for (const threshold of timeThresholds) {
          chrome.storage.local.set({ [`alerted_${threshold.message}`]: false });
        }
      }
    });
  }


  // Chrome Storage helper functions
  window.checkStorage = () => {
    chrome.storage.local.get(null, (items) => {
      console.log("Current Storage Content:", items);
    });
  };

  window.clearStorage = () => {
    chrome.storage.local.clear(() => {
      console.log("Storage cleared.");
    });
  };

  window.removeStorageKey = (key) => {
    chrome.storage.local.remove(key, () => {
      console.log(`Removed key: ${key}`);
    });
  };


  function injectRecord(record){
    console.log("INJECTED ", record);

    chrome.storage.local.get(["timeRecords"], (storedData) => {
      const timeRecords = storedData.timeRecords || [];
      timeRecords.push(record);
      chrome.storage.local.set({ timeRecords });
    });
  }

  function initializeObserver() {
    trackWastedTime();
    setInterval(resetDailyTimeTracking, 20 * 1000);

    console.log("window.checkStorage():");
    window.checkStorage();
    initializePreferenceReport();

    initialrun = true;
    // chrome.storage.local.set({ youtube_apiKey: "" }, () => {
    //   console.log("YOUTUBE API key has been saved to chrome.storage.local.");
    // });
    // chrome.storage.local.set({ chatgpt_apiKey: "" }, () => {
    //   console.log("CHATGPT API key has been saved to chrome.storage.local.");
    // });
    // chrome.storage.local.set({ wastedTime: 1650.0 }, () => {
    //   console.log("wastedTime updated.");
    // });

    // window.removeStorageKey("ratingPosition");
    // window.removeStorageKey("timerPosition");
    // window.removeStorageKey("chatgpt_apiKey");
    // window.removeStorageKey("youtube_apiKey");


    // For test
    // showAlertMessage("3 hours", "How about spending a few minutes organizing your space or planning your day?");
    // for (const threshold of timeThresholds) {
    //   chrome.storage.local.set({ [`alerted_${threshold.message}`]: false });
    // }

    let record = { date: "2025-02-04", regularTime: 0, wastedTime: 400};
    injectRecord(record);
  }

  initializeObserver();
}