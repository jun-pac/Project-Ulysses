
if (!window.isContentScriptLoaded) {
  // Begin from here if reloaded
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let currentUrl = null;
  let currentVideoId = null;
  let isWaste = null;
  let initialrun = null;

  let timerDiv = null;
  let ratingDiv = null;
  let manualDiv = null;
  let buttonDiv = null;
  let ratingMessageTimeout = null;

  // Create a visible timer on the page
  function createTimer() {
    if (!timerDiv) {  // Only create the timer div if it doesn't already exist
      timerDiv = document.createElement("div");
      timerDiv.id = "shortsTimer";
      timerDiv.style.position = "fixed";
      timerDiv.style.top = "35%";
      timerDiv.style.right = "10px";
      timerDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      timerDiv.style.color = "white";
      timerDiv.style.fontSize = "30px";
      timerDiv.style.padding = "15px 25px";
      timerDiv.style.borderRadius = "12px";
      timerDiv.style.zIndex = "9999";
      timerDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      timerDiv.style.boxShadow = "0px 4px 15px rgba(0, 0, 0, 0.2)";
      timerDiv.style.width = "auto";

      document.body.appendChild(timerDiv);
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
    ratingDiv.style.right = "10px";
    ratingDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    ratingDiv.style.boxShadow = "0px 4px 12px rgba(0, 0, 0, 0.2)";
    ratingDiv.style.padding = "15px"; // Reduced padding for a smaller box
    ratingDiv.style.borderRadius = "20px";
    ratingDiv.style.display = "flex";
    ratingDiv.style.flexDirection = "column";
    ratingDiv.style.alignItems = "center";
    ratingDiv.style.zIndex = "9999";
    ratingDiv.style.width = "auto";

    // Add title text
    const text = document.createElement("p");
    text.textContent = "Rate this video:";
    text.style.fontSize = "24px";
    text.style.fontWeight = "bold";
    text.style.marginBottom = "15px"; // Reduced margin for compactness
    text.style.color = "#333";
    ratingDiv.appendChild(text);

    // Create stars with labels
    const starContainer = document.createElement("div");
    starContainer.style.display = "flex";
    starContainer.style.alignItems = "flex-start";
    starContainer.style.justifyContent = "center";
    starContainer.style.gap = "8px"; // Reduced gap between stars
    starContainer.style.width = "100%";

    for (let i = 1; i <= 5; i++) {
      const starWrapper = document.createElement("div");
      starWrapper.style.display = "flex";
      starWrapper.style.flexDirection = "column";
      starWrapper.style.alignItems = "center";
      starWrapper.style.margin = "0 6px"; // Reduced margin for compactness

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

      const subLabel = document.createElement("p");
      subLabel.style.fontSize = "12px";
      subLabel.style.margin = "2px 0 0";
      subLabel.style.color = "#666";

      // Add "wasteful" and "beneficial" under the first and last stars
      if (i === 1) subLabel.textContent = "(wasteful)";
      if (i === 5) subLabel.textContent = "(beneficial)";

      starWrapper.appendChild(starButton);
      starWrapper.appendChild(label);
      if (i === 1 || i === 5) starWrapper.appendChild(subLabel);
      starContainer.appendChild(starWrapper);
    }
    ratingDiv.appendChild(starContainer);

    // Add to the body
    document.body.appendChild(ratingDiv);
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


  // Remove the timer from the page
  function removeRatingUI() {
    if (ratingDiv) {
      ratingDiv.remove(); // Remove the timer from the DOM
      ratingDiv = null;   // Reset the timerDiv reference
    }
  }


  // Save the rating to chrome.storage
  function saveRating(videoDetails, rating) {
    chrome.storage.local.get(["videoRatings"], (result) => {
      const ratings = result.videoRatings || {};
      ratings[videoDetails.videoId] = {
        title: videoDetails.title,
        channel: videoDetails.channel,
        rating,
      };
      chrome.storage.local.set({ videoRatings: ratings }, () => {
        console.log("Rating saved:", ratings[videoDetails.videoId]);
      });
    });
  }

  // Function to create the manual button
  function createManualButton() {
    // If the button already exists, do nothing
    if (buttonDiv) return;

    // Create the button container
    buttonDiv = document.createElement("div");
    buttonDiv.id = "manual-button";
    buttonDiv.style.position = "fixed";
    buttonDiv.style.bottom = "20px";
    buttonDiv.style.right = "20px";
    buttonDiv.style.width = "50px";
    buttonDiv.style.height = "50px";
    buttonDiv.style.backgroundColor = "#007AFF"; // Blue color for visibility
    buttonDiv.style.color = "white";
    buttonDiv.style.borderRadius = "50%";
    buttonDiv.style.display = "flex";
    buttonDiv.style.alignItems = "center";
    buttonDiv.style.justifyContent = "center";
    buttonDiv.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    buttonDiv.style.cursor = "pointer";
    buttonDiv.style.fontSize = "14px";
    buttonDiv.style.fontWeight = "bold";
    buttonDiv.style.zIndex = "1000";
    buttonDiv.style.userSelect = "none";
    buttonDiv.innerText = "i"; // Info icon

    // Append the button to the document body
    document.body.appendChild(buttonDiv);

    // Toggle manual UI on button click
    buttonDiv.addEventListener("click", () => {
      if (manualDiv) {
        removeManualUI();
      } else {
        createManualUI();
      }
    });
  }

  // Remove the timer from the page
  function removeManualButton() {
    if (manualDiv) {
      removeManualUI();
    }
    if (buttonDiv) {
      buttonDiv.remove(); // Remove the timer from the DOM
      buttonDiv = null;   // Reset the timerDiv reference
    }
  }

  // Function to create and display the manual UI
  function createManualUI() {
    if (manualDiv) return;

    // Create the manual container
    manualDiv = document.createElement("div");
    manualDiv.id = "ulysses-manual";
    manualDiv.style.position = "fixed";
    manualDiv.style.bottom = "70px";
    manualDiv.style.right = "20px";
    manualDiv.style.width = "320px";
    manualDiv.style.padding = "15px";
    manualDiv.style.backgroundColor = "white";
    manualDiv.style.borderRadius = "12px";
    manualDiv.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    manualDiv.style.fontFamily = "'Arial', sans-serif";
    manualDiv.style.fontSize = "14px";
    manualDiv.style.lineHeight = "1.6";
    manualDiv.style.color = "#333";
    manualDiv.style.zIndex = "1000";
    manualDiv.style.transition = "opacity 0.3s ease-in-out";
    manualDiv.style.opacity = "0";
    manualDiv.style.textAlign = "left";

    // Manual content
    manualDiv.innerHTML = `
      <strong style="font-size: 16px; display: block; text-align: center; margin-bottom: 8px;"> YouTube Time Saver Manual</strong>
      <ol style="padding-left: 16px; margin: 0;">
          <li>This service helps you avoid wasting time by showing warnings for wasted videos.</li>
          <li>We personalize the wasted video classifier based on your video ratings!</li>
          <li>You can view your watch statistics, rated videos, and preference report in the popup.</li>
          <li>To pin the extension popup for easy access: Click the extension button in the top-right corner of Chrome, then click the pin icon next to "YouTube Time Saver".</li>
      </ol>
      <div style="text-align: center; margin-top: 10px;">
          <button id="closeManualBtn" style="
              padding: 6px 12px;
              font-size: 12px;
              color: white;
              background-color: #ff5c5c;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
          ">Close</button>
      </div>
  `;

    // Append the manual to the document body
    document.body.appendChild(manualDiv);

    // Smooth fade-in effect
    setTimeout(() => {
      manualDiv.style.opacity = "1";
    }, 50);

    // Close button functionality
    document.getElementById("closeManualBtn").addEventListener("click", removeManualUI);
  }

  // Function to remove the manual UI
  function removeManualUI() {
    if (manualDiv) {
      manualDiv.style.opacity = "0";
      setTimeout(() => {
        if (manualDiv) {
          manualDiv.remove();
          manualDiv = null;
        }
      }, 300);
    }
  }

  // Function to retrieve preferenceReport and apiKeys from Chrome Storage
  function getStoredData(keys) {
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
      const { youtube_apiKey } = await getStoredData(["youtube_apiKey"]);
      console.log("youtube_apiKey: " + youtube_apiKey);
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtube_apiKey}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
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

    const { preferenceReport, chatgpt_apiKey } = await getStoredData(["preferenceReport", "chatgpt_apiKey"]);
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


    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chatgpt_apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: "You are an assistant designed to update user preference reports accurately based on video details and ratings." },
          { role: "user", content: prompt },
        ],
      }),
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
      console.log("Normalization... current average preference: ",average)
      // Compute adjustment value (rounded to nearest 0.1 step)
      const adjustment = Math.sign(deviation) * Math.floor(Math.abs(deviation) / 0.01) * 0.01;

      for (const key in preferenceReport) {
        let value = preferenceReport[key] - adjustment;
        preferenceReport[key] = Math.round(100*Math.min(Math.max(value, 1.0), 5.0))/100;
      }

      chrome.storage.local.set({ preferenceReport }, () => {
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
    if (isShortsVideo()) return true;

    const { title, channel, description, lengthInSeconds } = await getVideoDetails();
    console.log("isWastingVideo title : ", title);
    console.log("isWastingVideo channel : ", channel);
    console.log("isWastingVideo description : ", description);
    console.log("isWastingVideo lengthInSeconds : ", lengthInSeconds);

    const { preferenceReport, chatgpt_apiKey } = await getStoredData(["preferenceReport", "chatgpt_apiKey"]);

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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chatgpt_apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: "You are an assistant trained to determine if videos align with user preferences or are a waste of time." },
          { role: "user", content: prompt },
        ],
      }),
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

  function highlightShortsVideos() {
    const videos = document.querySelectorAll("ytd-rich-item-renderer, ytd-video-renderer");
    videos.forEach((video) => {
      const linkElement = video.querySelector("a[href]");
      if (linkElement && linkElement.href.includes("/shorts/")) {
        video.style.backgroundColor = HIGHLIGHT_COLOR;
      }
    });
  }


  function trackWastedTime() {
    let lastTime = Date.now();
    let currentVideo = null;
    let previousIsShorts = isShortsVideo();

    setInterval(() => {
      const isShorts = isShortsVideo();

      // Reload if switched between Shorts and Regular videos.
      if (isShorts !== previousIsShorts) {
        previousIsShorts = isShorts;
        console.log("Switching between Shorts and Regular. Reloading...");
        window.location.reload();
      }


      if (initialrun || (currentUrl !== window.location.href && (isShorts || currentVideoId !== getVideoId()))) {
        initialrun = false;
        currentUrl = window.location.href;
        currentVideoId = getVideoId();

        removeRatingUI();
        if (currentUrl.startsWith("https://www.youtube.com/watch") || currentUrl.startsWith("https://www.youtube.com/shorts")) {
          createRatingUI();
          removeManualButton(); // remove manual button

          if (isShorts) {
            isWaste = true;
          } else {
            isWastingVideo().then((result) => {
              isWaste = result;
              console.log("Updated isWaste:", isWaste); // This will log true or false
            });
          }
        }
        else {
          isWaste = false;

          // Run function only on the YouTube main page
          createManualButton();
        }
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
        const currentTime = Date.now();
        const increment = (currentTime - lastTime) / 1000; // Convert ms to seconds
        lastTime = currentTime;

        if (isWaste) {
          chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
            const wastedTime = (result.wastedTime || 0) + increment;
            const regularTime = (result.regularTime || 0);
            if (wastedTime > 600) {
              timerDiv.textContent = `You are wasting time! ${Math.floor(wastedTime / 60)}min ${Math.floor(wastedTime - Math.floor(wastedTime / 60) * 60)}sec`;
            } else {
              timerDiv.textContent = `You are wasting time! ${wastedTime.toFixed(2)}sec`;
            }
            chrome.storage.local.set({ wastedTime });
          });
        } else {
          chrome.storage.local.get(["regularTime"], (result) => {
            const regularTime = (result.regularTime || 0) + increment;
            chrome.storage.local.set({ regularTime });
          });
        }
      } else {
        lastTime = Date.now(); // Update lastTime to prevent over-counting
      }
    }, 100); // Update every 1000ms
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






  function initializeObserver() {
    if (!observer) {
      observer = new MutationObserver(() => {
        highlightShortsVideos();
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Initial runs
    highlightShortsVideos();
    trackWastedTime();


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

  }
  initializeObserver();
}