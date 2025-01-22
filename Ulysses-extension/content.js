if (!window.isContentScriptLoaded) {
  window.isContentScriptLoaded = true;

  const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
  let observer;

  const timerDiv = document.createElement("div");

  // Create a visible timer on the page
  function createTimer() {
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
    createTimer();
  
    let lastTime = Date.now();
  
    setInterval(() => {
      const video = document.querySelector("video");
      if (video && window.location.href.includes("/shorts/") && !video.paused) {
        const currentTime = Date.now();
        const increment = (currentTime - lastTime) / 1000; // Convert ms to seconds
        lastTime = currentTime;
  
        chrome.storage.local.get(["wastedTime"], (result) => {
          const wastedTime = (result.wastedTime || 0) + increment;
  
          // Update the timer display
          timerDiv.textContent = `You are wasting time! ${wastedTime.toFixed(2)} sec`;
  
          // Save updated wastedTime
          chrome.storage.local.set({ wastedTime });
        });
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

//   function highlightShortsVideos() {
//     const videos = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer');
//     videos.forEach((video) => {
//       const linkElement = video.querySelector('a[href]');
//       if (linkElement && linkElement.href.includes('/shorts/')) {
//         video.style.backgroundColor = HIGHLIGHT_COLOR;
//       }
//     });
//   }

//   function trackWastedTime() {
//     let lastTime = 0;
//     const timerDiv = document.createElement("div");
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

//     setInterval(() => {
//       const video = document.querySelector("video");
//       if (video && window.location.href.includes("/shorts/")) {
//         const currentTime = Math.floor(video.currentTime);
//         if (currentTime > lastTime) {
//           const increment = currentTime - lastTime;
//           chrome.storage.local.get(["wastedTime"], (result) => {
//             const wastedTime = (result.wastedTime || 0) + increment;
//             chrome.storage.local.set({ wastedTime });
//           });
//           lastTime = currentTime;
//         }
//         timerDiv.textContent = `You are wasting time! ${currentTime} seconds`;
//       } else {
//         timerDiv.textContent = ""; // Clear timer when not in Shorts
//       }
//     }, 1000);
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


// ==================================================================================
// if (!window.isContentScriptLoaded) {
//   window.isContentScriptLoaded = true;
//   const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";

//   function highlightShortsVideos() {
//     const videos = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer');
//     videos.forEach((video) => {
//       const linkElement = video.querySelector('a[href]'); 
//       if (linkElement && linkElement.href.includes('/shorts/')) {
//         video.style.backgroundColor = HIGHLIGHT_COLOR;
//       }
//     });
//   }

//   function trackWastedTime() {
//     let lastTime = 0;
//     setInterval(() => {
//       const video = document.querySelector('video');
//       if (video && window.location.href.includes('/shorts/')) {
//         const currentTime = Math.floor(video.currentTime); // Currently played time
//         if (currentTime > lastTime) {
//           const increment = currentTime - lastTime;
//           chrome.storage.local.get(["wastedTime"], (result) => {
//             const wastedTime = (result.wastedTime || 0) + increment;
//             chrome.storage.local.set({ wastedTime });
//           });
//           lastTime = currentTime;
//         }
//       }
//     }, 1000);
//   }
  


//   const observer = new MutationObserver(() => {
//     highlightShortsVideos();
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
//   highlightShortsVideos();
//   trackWastedTime();

// }
