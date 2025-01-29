# Project Ulysses: Chrome Extension for Improving YouTube Habits

Project Ulysses is a Chrome extension designed to help users improve their YouTube viewing habits. It tracks time spent watching "wasted videos" versus regular videos, and provides users with insights and warnings to promote better time management.    

Additionally, the extension personalizes recommendations using user feedback and preferences, helping users make more informed decisions about their video-watching habits.


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

4. Preference Report
Based on a set of 20 emotional needs, the extension generates a personalized preference report for each user, helping them understand their unique viewing patterns.   
This report is further personalized through user feedback, using ChatGPT-4o-mini to adjust preferences based on input provided over time.

5. Rated Videos
Users can rate the videos they've watched on a scale from 1 to 5 stars. These ratings are stored in chrome.storage.local and can be accessed through the popup.     
The Rated Videos section in popup displays the channel name, video title, and rating in a clean, table-like format. Ratings are color-coded with a smooth gradient ranging from gray (low ratings) to green (high ratings), making it easy for users to assess their preferences.

6. Reset Button   
The popup includes a reset button to clear all tracked time data.


## Privacy Policy 
1. Information We Collect
This extension collects the following data:   
YouTube Video IDs: We track the video IDs of the content you watch to analyze viewing habits.   
Preference Report: The extension categorizes videos into 20 different types and updates your preference report based on your ratings.

2. How We Use the Data   
The preference report is processed using OpenAI's API to help determine whether a video is considered "wasted time" or not.   
The collected video IDs are only used locally to track user behavior and are not stored on any external servers.   

3. Data Sharing   
We do not share any collected data with third parties.   
The preference report is sent to OpenAI API for processing, but we do not store any user data externally.   

4. Data Storage & Security   
All collected data is stored locally on your device using Chrome's chrome.storage.local.   
The extension does not transmit or store data on external servers, except when updating the preference report via OpenAI API.   

5. Contact   
If you have any questions regarding this privacy policy, please contact us at millipede306@gmail.com.


   
## Future Development Plans
1. Progressive Warnings   
Adjust warning messages or visuals based on the severity of wasted time, providing greater awareness as users accumulate more wasted time.

2. Key Metric: Wasted Time Ratio   
Introduce a key metric called the "Wasted Time Ratio," which compares the time spent on wasted videos to regular videos.   
Display this metric as a time-series graph to help users monitor and improve their YouTube viewing habits over time.      

- - -
We welcome feedback and contributions to this project. Feel free to explore the code and experiment with the features. Together, let's make YouTube time more intentional and productive!