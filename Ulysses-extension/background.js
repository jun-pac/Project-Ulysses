chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com")) {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ["content.js"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Script execution failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Content script injected successfully!");
        }
      }
    );
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    chrome.action.openPopup();
  }
});
