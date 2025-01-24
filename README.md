# Project Ulysses: Chrome Extension for Improving YouTube Habits

Project Ulysses is a Chrome extension designed to help users improve their YouTube viewing habits. It tracks time spent watching "wasted videos" (e.g., Shorts or videos under 3 minutes) versus regular videos, and provides users with insights and warnings to promote better time management.

## How to Use

1. Clone this repository:
    ```bash
    git clone https://github.com/jun-pac/Project-Ulysses
    ```

2. Open Chrome and navigate to the Extensions page:   
    <chrome://extensions/>

3. Enable Developer mode (toggle in the top-right corner).

4. Click Load unpacked and upload the entire Project-Ulysses/Ulysses-extension folder.

5. The extension is now ready to use!


## Currently Developed Features
1. Wasted Time Timer   
When watching wasted videos, a timer is displayed on the screen showing the accumulated "wasted time."
   
2. Highlight Wasted Videos   
On the YouTube homepage, wasted videos are visually highlighted.
   
3. Statistics Popup   
Clicking the extension icon opens a popup where users can view their stats.   
Pressing the Stats button shows a graph comparing the total time spent on wasted videos versus regular videos.
   
4. Reset Button   
The popup includes a reset button to clear all tracked time data.
   
5. Video Rating   
Users can rate the currently watched video on a scale of 1 to 5 stars.   
These ratings are saved in chrome.storage.local.
   
## Future Development Plans
1. Classification Algorithm   
Develop an algorithm to classify wasted videos based on user preferences collected during an initial survey and feedback stored in chrome.storage.local.

2. Progressive Warnings   
Adjust warning messages or visuals based on the severity of wasted time, providing greater awareness as users accumulate more wasted time.

3. Key Metric: Wasted Time Ratio   
Introduce a key metric called the "Wasted Time Ratio," which compares the time spent on wasted videos to regular videos.   
Display this metric as a time-series graph to help users monitor and improve their YouTube viewing habits over time.      

- - -
We welcome feedback and contributions to this project. Feel free to explore the code and experiment with the features. Together, let's make YouTube time more intentional and productive!