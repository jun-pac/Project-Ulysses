
if (!window.isContentScriptLoaded) {
  // Begin from here if reloaded
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let currentUrl = null;
  let isWaste = null;
  let videoCheckInterval = null;

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
  function saveRating(rating) {
    const videoDetails = getVideoDetails();

    chrome.storage.local.get(["videoRatings"], (result) => {
      const ratings = result.videoRatings || {};
      ratings[videoDetails.videoId] = {
        title: videoDetails.title,
        description: videoDetails.description,
        rating,
      };
      chrome.storage.local.set({ videoRatings: ratings }, () => {
        console.log("Rating saved:", ratings[videoDetails.videoId]);
      });
    });
  }





  // Fetch video details
  function getVideoDetails() {
    const videoTitleElement =
      document.querySelector("h1.title") || document.querySelector(".title");
    const videoDescriptionElement =
      document.querySelector("#description") ||
      document.querySelector("#meta-contents") ||
      document.querySelector(".content");
    const videoLengthElement = document.querySelector(".ytp-time-duration");
    const videoId = new URLSearchParams(window.location.search).get("v");

    const videoTitle = videoTitleElement
      ? videoTitleElement.textContent.trim()
      : "Unknown Title";
    const videoDescription = videoDescriptionElement
      ? videoDescriptionElement.textContent.trim()
      : "No Description";
    const videoLength = videoLengthElement
      ? videoLengthElement.textContent
      : "0:00";

    // Handle hours, minutes, and seconds
    const timeParts = videoLength.split(":").map(Number);
    let lengthInSeconds;

    if (timeParts.length === 3) {
      // Format: HH:MM:SS
      const [hours, minutes, seconds] = timeParts;
      lengthInSeconds = hours * 3600 + minutes * 60 + seconds;
    } else if (timeParts.length === 2) {
      // Format: MM:SS
      const [minutes, seconds] = timeParts;
      lengthInSeconds = minutes * 60 + seconds;
    } else {
      console.error("Unexpected video length format:", videoLength);
      return null;
    }
    // console.log(videoTitle + " " + videoDescription + " " + videoLength + " | lengthInSeconds :" + lengthInSeconds);

    return {
      videoId,
      title: videoTitle,
      description: videoDescription,
      lengthInSeconds,
    };
  }

  // Determine if the video is a "wasting" video
  function isWastingVideo() {
    if (isShortsVideo()) return true;
    const { lengthInSeconds } = getVideoDetails();
    console.log("isWastingVideo function call. lengthInSeconds: " + lengthInSeconds + " | isWaste:" + isWaste);
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
    let previousIsShorts = isShortsVideo();

    setInterval(() => {
      const isShorts = isShortsVideo();

      // Reload if switched between Shorts and Regular videos.
      if (isShorts !== previousIsShorts) {
        previousIsShorts = isShorts;
        console.log("Switching between Shorts and Regular. Reloading...");
        window.location.reload();
      }

      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        removeRatingUI();
        if (currentUrl.startsWith("https://www.youtube.com/watch") || currentUrl.startsWith("https://www.youtube.com/shorts")) {
          createRatingUI();

          if (isShorts) {
            isWaste = isWastingVideo();
          } else {
            // Check if video is fully loaded, and check if it is wasting video.
            clearInterval(videoCheckInterval);
            videoCheckInterval = setInterval(() => {
              const video = document.querySelector("video");
              // const isAd = document.querySelector("div#ad-container") || document.querySelector("iframe[src*='ad']");
              const { lengthInSeconds } = getVideoDetails();
              // ================ Temporal solution. Need to be addressed. ================ 
              const isAd = lengthInSeconds === 15;  

              if (video && !isAd && video.readyState === 4 && video.currentTime > 0) {
                clearInterval(videoCheckInterval);
                console.log("Video is fully loaded and not an ad." + " paused: " + video.paused + " | video.currentTime: " + video.currentTime);
                isWaste = isWastingVideo();
              }
            }, 250);

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
  }

  initializeObserver();


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

}

