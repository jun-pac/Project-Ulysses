
if (!window.isContentScriptLoaded) {
  // Begin from here if reloaded
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let currentUrl = null;
  let currentVideoId = null;
  let isWaste = null;

  let timerDiv = null;
  let ratingDiv = null;
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
    return new URLSearchParams(window.location.search).get("v");
  }

  async function getVideoDetails() {
    // Video ID
    console.log("getVideoDetails function call");
    const videoId = getVideoId();
    currentVideoId = videoId;

    try {
      const { Youtube_apiKey } = await getStoredData(["Youtube_apiKey"]);
      console.log("Youtube_apiKey: " + Youtube_apiKey);
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${Youtube_apiKey}`;
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
      curiosity_driven: 5.0,
      humor: 5.0,
      emotional_catharsis: 5.0,
      excitement: 5.0,
      relaxation: 5.0,
      aesthetic_pleasure: 5.0,
      empowerment: 5.0,
      controversy: 5.0,
      fear_thrill: 5.0,
      romantic_aspiration: 5.0,
      social_connection: 5.0,
      intellectual_stimulation: 5.0,
      practical_knowledge: 5.0,
      sensory_stimulation: 5.0,
      empathy_compassion: 5.0,
      nostalgia: 5.0,
      achievement_focused: 5.0,
      meme_culture: 5.0,
      cultural_exploration: 5.0,
      self_expression: 5.0,
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
    const videoDetails = getVideoDetails();
    // Save rating in api key
    saveRating(videoDetails, userRating);

    // Update preference report using Deepseek API
    const { preferenceReport, deepseek_apiKey } = await getStoredData(["preferenceReport", "deepseek_apiKey"]);
    const prompt = `The current user's preference report is as follows:
  ${JSON.stringify(preferenceReport, null, 2)}
  
  Each factor in the preference report has a value between 0 and 10:
  - A value of 5 represents an average interest in that factor.
  - A value above 5 indicates a stronger preference or enjoyment of content that aligns with that factor.
  - A value below 5 indicates a lower preference or a tendency to find such content less engaging or potentially a waste.
  
  The user's preference report should be updated smoothly with small adjustments, typically less than 10% change for any factor, based on the following new video details and rating:
  
  Video Details:
  - Title: "${videoDetails.title}"
  - Channel: "${videoDetails.channel}"
  - Description: "${videoDetails.description}"
  - Length in seconds: ${videoDetails.lengthInSeconds}
  - Rating: ${userRating}
  
  Ensure that updates are proportional to the rating (e.g., higher ratings lead to larger positive adjustments for relevant factors). Return the updated preference report in JSON format.`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseek_apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    try {
      const updatedReport = JSON.parse(data.choices[0].message.content);
      return updatedReport;
    } catch (error) {
      console.error("Failed to parse API response:", data);
      return null;
    }
  }



  async function isWastingVideo() {
    if (isShortsVideo()) return true;
    const { title, channel, description, lengthInSeconds } = await getVideoDetails();
    const { preferenceReport, deepseek_apiKey } = await getStoredData(["preferenceReport", "deepseek_apiKey"]);

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
    - A video is more likely to be a wasted video if it aligns with topics or categories where the user's preference report has low values.
    - Return the result as a JSON object:
    { "is_waste": 1 } if the video is a wasted video, or { "is_waste": 0 } if it is not.`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseek_apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    try {
      const result = JSON.parse(data.choices[0].message.content);
      console.log(result);
      console.log("isWastingVideo function call. | isWaste:" + result);
      return result;
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
    // let previousIsShorts = isShortsVideo();

    setInterval(() => {
      const isShorts = isShortsVideo();

      // Reload if switched between Shorts and Regular videos.
      // if (isShorts !== previousIsShorts) {
      //   previousIsShorts = isShorts;
      //   console.log("Switching between Shorts and Regular. Reloading...");
      //   // window.location.reload();
      // }

      if (currentUrl !== window.location.href && currentVideoId !== getVideoId()) {
        currentUrl = window.location.href;
        currentVideoId = getVideoId();

        removeRatingUI();
        if (currentUrl.startsWith("https://www.youtube.com/watch") || currentUrl.startsWith("https://www.youtube.com/shorts")) {
          createRatingUI();

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



    // chrome.storage.local.set({ Youtube_apiKey: "" }, () => {
    //   console.log("API key has been saved to chrome.storage.local.");
    // });

    console.log("window.checkStorage():");
    window.checkStorage();
    window.clearStorage();
    initializePreferenceReport();

    chrome.storage.local.set({ youtube_apiKey: "" }, () => {
      console.log("YOUTUBE API key has been saved to chrome.storage.local.");
    });
    chrome.storage.local.set({ deepseek_apiKey: "" }, () => {
      console.log("DEEPSEEK API key has been saved to chrome.storage.local.");
    });
    window.checkStorage();

  }

  initializeObserver();
}

