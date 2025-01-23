if (!window.isContentScriptLoaded) {
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let timerDiv = null; // Declare timerDiv outside the functions to manage the timer properly

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
  
    setInterval(() => {
      const isWaste = isShortsVideo();
  
      // Only create timer if we're on a shorts video
      if (isWaste) {
        createTimer(); // Create timer for shorts
      } else {
        removeTimer(); 
      }
  
      // Force a fresh query for the current video element
      currentVideo = document.querySelector("ytd-player").querySelector("video");
      // console.log("Final selected video element:", currentVideo );
      console.log("isShortsVideo: " + isWaste + " | isPlaying: " + (currentVideo && !currentVideo.paused));
  
      if (currentVideo && !currentVideo.paused) {
        const currentTime = Date.now();
        const increment = (currentTime - lastTime) / 1000; // Convert ms to seconds
        lastTime = currentTime;
  
        if (isWaste) {
          chrome.storage.local.get(["wastedTime", "regularTime"], (result) => {
            const wastedTime = (result.wastedTime || 0) + increment;
            const regularTime = (result.regularTime || 0);
            timerDiv.textContent = `You are wasting time! ${wastedTime.toFixed(2)} / ${regularTime.toFixed(2)}sec`;
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
}

