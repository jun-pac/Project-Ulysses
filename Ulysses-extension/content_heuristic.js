
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
        saveRating(i);
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
  async function saveRating(rating) {
    const videoDetails = await getVideoDetails();

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



  // function getVideoLength() {
  //   // Video Length
  //   const videoLengthElement = document.querySelector(".ytp-time-duration");
  //   return videoLengthElement ? parseTimeToSeconds(videoLengthElement.textContent) : 0;
  // }


  // function getYoutubeApiKey() {
  //   return new Promise((resolve, reject) => {
  //     chrome.storage.local.get(["youtube_apiKey"], (result) => {
  //       if (chrome.runtime.lastError) {
  //         reject(chrome.runtime.lastError);
  //       } else {
  //         resolve(result.youtube_apiKey);
  //       }
  //     });
  //   });
  // }

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

  // // Helper to convert time format to seconds
  // function parseTimeToSeconds(timeString) {
  //   const parts = timeString.split(":").map(Number);
  //   if (parts.length === 2) return parts[0] * 60 + parts[1]; // MM:SS
  //   if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  //   return 0;
  // }


  // Determine if the video is a "wasting" video
  async function isWastingVideo() {
    if (isShortsVideo()) return true;

    const { videoId, title, description, channel, lengthInSeconds } = await getVideoDetails();

    console.log(videoId + "\n" + title + "\n" + description + "\n" + channel + "\n lengthInSeconds :" + lengthInSeconds);
    console.log("isWastingVideo function call. | isWaste:" + (lengthInSeconds <= 180));
    return lengthInSeconds <= 180; // Shorts or less than 3 minutes
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


    // chrome.storage.local.set({ youtube_apiKey: "" }, () => {
    //   console.log("API key has been saved to chrome.storage.local.");
    // });

    console.log("window.checkStorage():");
    window.checkStorage();
  }

  initializeObserver();
}