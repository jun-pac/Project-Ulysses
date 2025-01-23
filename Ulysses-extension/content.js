if (!window.isContentScriptLoaded) {
  // Begin from here if reloaded
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let timerDiv = null; // Declare timerDiv outside the functions to manage the timer properly
  let ratingDiv = null; 
  let currentUrl = null;

  // Create a visible timer on the page
  function createTimer() {
    if (!timerDiv) {  // Only create the timer div if it doesn't already exist
      timerDiv = document.createElement("div");
      timerDiv.id = "shortsTimer";
      timerDiv.style.position = "fixed";
      timerDiv.style.bottom = "10px";
      timerDiv.style.right = "10px";
      timerDiv.style.backgroundColor = "black";
      timerDiv.style.color = "white";
      timerDiv.style.fontSize = "30px";
      timerDiv.style.padding = "10px";
      timerDiv.style.borderRadius = "5px";
      timerDiv.style.zIndex = "9999";
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
    const [minutes, seconds] = videoLength.split(":").map(Number);
    console.log(videoTitle + " " + videoDescription + " " + videoLength);

    return {
      videoId,
      title: videoTitle,
      description: videoDescription,
      lengthInSeconds: minutes * 60 + seconds,
    };
  }

  // Determine if the video is a "wasting" video
  function isWastingVideo() {
    const { lengthInSeconds } = getVideoDetails();
    return isShortsVideo() || lengthInSeconds <= 180; // Shorts or less than 3 minutes
  }

  // Add a rating UI for user feedback
  function createRatingUI() {
    if (ratingDiv) return; 
    ratingDiv = document.createElement("div");
    ratingDiv.id = "ratingDiv";
    ratingDiv.style.position = "fixed";
    ratingDiv.style.top = "10px";
    ratingDiv.style.right = "10px";
    ratingDiv.style.backgroundColor = "white";
    ratingDiv.style.padding = "10px";
    ratingDiv.style.border = "1px solid black";
    ratingDiv.style.borderRadius = "5px";
    ratingDiv.style.zIndex = "9999";

    const text = document.createElement("p");
    text.textContent = "Rate this video (1-5 stars):";
    ratingDiv.appendChild(text);

      for (let i = 1; i <= 5; i++) {
        const starButton = document.createElement("button");
        starButton.textContent = i;
        starButton.style.margin = "0 5px";
        starButton.onclick = () => {
          saveRating(i);
          removeRatingUI();
          alert("Thank you for rating this video!");
        };  
        ratingDiv.appendChild(starButton);
      }

      document.body.appendChild(ratingDiv);
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


  function highlightShortsVideos() {
    const videos = document.querySelectorAll("ytd-rich-item-renderer, ytd-video-renderer");
    videos.forEach((video) => {
      const linkElement = video.querySelector("a[href]");
      if (linkElement && linkElement.href.includes("/shorts/")) {
        video.style.backgroundColor = HIGHLIGHT_COLOR;
      }
    });
  }

  // function isShortsVideo() {
  //   const shortsPlayer = document.querySelector("ytd-shorts");
  //   return Boolean(shortsPlayer);
  // }

  function isShortsVideo(){
    return window.location.href.includes("/shorts/");
  }    


  function trackWastedTime() {
    let lastTime = Date.now();
    let currentVideo = null;
    let previousIsShorts = isShortsVideo();
    
    setInterval(() => {
      const isShorts = isShortsVideo();
      const isWaste = isWastingVideo();      
      
      // Only create timer if we're on a shorts video
      if (isWaste) {
        createTimer(); // Create timer for shorts
      } else {
        removeTimer();
      }

      if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        removeRatingUI();
        if(isWaste){ 
          // ******************************* Temporal Solution. Need to be addressed. *******************************
          if(currentUrl !== "https://www.youtube.com/"){
            createRatingUI();
          }
        }
      }

      if (isShorts !== previousIsShorts) {
        previousIsShorts = isShorts;
        console.log("Switching between Shorts and Regular. Reloading...");
        window.location.reload();
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
            if(wastedTime > 600){
              timerDiv.textContent = `You are wasting time! ${Math.floor(wastedTime/60)}min ${Math.floor(wastedTime-Math.floor(wastedTime/60)*60)}sec`;
            } else{
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
    }, 50); // Update every 1000ms
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

