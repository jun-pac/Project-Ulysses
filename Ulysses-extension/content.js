if (!window.isContentScriptLoaded) {
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;
  let timerDiv = null; // Declare timerDiv outside the functions to manage the timer properly
  let wastedTime = 0;  // Variable to store wasted time on shorts
  let regularTime = 0; // Variable to store time on regular videos

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
  
    setInterval(() => {
      // Only create timer if we're on a shorts video
      if (window.location.href.includes("/shorts/")) {
        createTimer(); // Create timer for shorts
      } else {
        // Remove the timer if we're not on a shorts video
        if (timerDiv) {
          timerDiv.remove();
          timerDiv = null; // Reset the timerDiv variable to null
        }
      }

      const video = document.querySelector("video");
      if (video && !video.paused) {
        const currentTime = Date.now();
        const increment = (currentTime - lastTime) / 1000; // Convert ms to seconds
        lastTime = currentTime;
        if(window.location.href.includes("/shorts/")){
          chrome.storage.local.get(["wastedTime"], (result) => {
            const wastedTime = (result.wastedTime || 0) + increment;
    
            // Update the timer display
            timerDiv.textContent = `You are wasting time! ${wastedTime.toFixed(2)} sec`;
    
            // Save updated wastedTime
            chrome.storage.local.set({ wastedTime });
          });
        } else {
          const regularTime = (result.regularTime || 0) + increment;
    
          // Save updated wastedTime
          chrome.storage.local.set({ regularTime });
        }
      } else {
        lastTime = Date.now(); // Update lastTime to prevent over-counting
      }
    }, 50); // Update every 50ms
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


// if (!window.isContentScriptLoaded) {
//   window.isContentScriptLoaded = true;

//   const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
//   let observer;

//   const timerDiv = document.createElement("div");

//   // Create a visible timer on the page
//   function createTimer() {
//     timerDiv.id = "shortsTimer";
//     timerDiv.style.position = "fixed";
//     timerDiv.style.bottom = "10px";
//     timerDiv.style.right = "10px";
//     timerDiv.style.backgroundColor = "black";
//     timerDiv.style.color = "white";
//     timerDiv.style.fontSize = "30px";
//     timerDiv.style.padding = "10px";
//     timerDiv.style.borderRadius = "5px";
//     timerDiv.style.zIndex = "9999";
//     document.body.appendChild(timerDiv);
//   }

//   function highlightShortsVideos() {
//     const videos = document.querySelectorAll("ytd-rich-item-renderer, ytd-video-renderer");
//     videos.forEach((video) => {
//       const linkElement = video.querySelector("a[href]");
//       if (linkElement && linkElement.href.includes("/shorts/")) {
//         video.style.backgroundColor = HIGHLIGHT_COLOR;
//       }
//     });
//   }

//   function trackWastedTime() {
//     createTimer();
  
//     let lastTime = Date.now();
  
//     setInterval(() => {
//       const video = document.querySelector("video");
//       if (video && window.location.href.includes("/shorts/") && !video.paused) {
//         const currentTime = Date.now();
//         const increment = (currentTime - lastTime) / 1000; // Convert ms to seconds
//         lastTime = currentTime;
  
//         chrome.storage.local.get(["wastedTime"], (result) => {
//           const wastedTime = (result.wastedTime || 0) + increment;
  
//           // Update the timer display
//           timerDiv.textContent = `You are wasting time! ${wastedTime.toFixed(2)} sec`;
  
//           // Save updated wastedTime
//           chrome.storage.local.set({ wastedTime });
//         });
//       } else {
//         lastTime = Date.now(); // Update lastTime to prevent over-counting
//       }
//     }, 50); // Update every 50ms
//   }


//   function initializeObserver() {
//     if (!observer) {
//       observer = new MutationObserver(() => {
//         highlightShortsVideos();
//       });

//       observer.observe(document.body, { childList: true, subtree: true });
//     }

//     // Initial runs
//     highlightShortsVideos();
//     trackWastedTime();
//   }

//   initializeObserver();
// }

