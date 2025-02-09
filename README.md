# Project Ulysses: Reclaim your control over YouTube.

Project Ulysses is a Chrome extension designed to help users improve their YouTube viewing habits.    

We often find ourselves drawn to videos that we know are a waste of time, lured by short-term gratification. Our tool learns your preferences and nudges you toward content you genuinely value.


## How to Use 
Try our extension [here](https://chromewebstore.google.com/detail/youtube-time-saver/hgnjolfjangenehndnflggfpddcgjdfo)!

## How to Use (For developers)

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

2. Statistics Popup   
Clicking the extension icon opens a popup where users can view their stats.   
A Stats button reveals a graph comparing wasted time vs. regular video time, allowing users to visualize their YouTube habits over time.   

3. Preference Report   
Based on a set of 20 emotional needs, the extension generates a personalized preference report for each user, helping them understand their unique viewing patterns.   
This report is further personalized through user feedback, using ChatGPT-4o-mini to adjust preferences based on input provided over time.

4. Rated Videos   
Users can rate the videos they've watched on a scale from 1 to 5 stars. These ratings are stored in chrome.storage.local and can be accessed through the popup.     
The Rated Videos section in popup displays the channel name, video title, and rating in a clean, table-like format. Ratings are color-coded with a smooth gradient ranging from gray (low ratings) to green (high ratings), making it easy for users to assess their preferences.

5. Activity Calendar   
Each day, if wasted video time stays under 10 minutes, the calendar marks it green. If it exceeds 10 minutes, it turns red. The extension tracks the longest streak of green days, encouraging users to maintain a positive viewing habit over time.

6. Interactive Onboarding Guide   
A landing page introduces first-time users to the extension¡¯s features and controls. This guided onboarding ensures users quickly understand how to track their time, interpret stats, and use the preference report effectively.



## Privacy Policy 
### Information We Collect. 
This extension collects the following data:   
- YouTube Video IDs: We track the video IDs of the content you watch to analyze viewing habits.
- Preference Report: The extension categorizes videos into 20 different types and updates your preference report based on your ratings.   
- User Data Backup: To prevent data loss during updates, we store user data on a backend server using a randomly generated UUID. This includes your viewing history and preference report.   
- Survey Responses: If you participate in surveys, your responses are collected for feature improvement and research purposes.   
- Usage Statistics: Aggregated usage data is collected to analyze trends and improve the extension's functionality.   

### How We Use the Data
- The preference report is processed using OpenAI's API to help determine whether a video is considered "wasted time" or not.   
- The collected video IDs are used locally to track user behavior and optimize recommendations.   
- User data is backed up on a backend server to prevent data loss and improve features.   
- Survey responses and usage statistics help us enhance the user experience through data-driven decisions.   

### Data Sharing
- We do not share any collected data with third parties.   
- The preference report is sent to OpenAI API for processing, but no personally identifiable information is transmitted.   
- User data stored on the backend server is anonymized using a randomly generated UUID and is not linked to any personal identifiers.   

### Data Storage & Security
- All collected data is stored locally on your device using Chrome¡¯s chrome.storage.local.
- To prevent data loss, a backup of user data is stored on a backend server. 
- The backend server only stores data under a randomly generated UUID, ensuring anonymity. No personally identifiable information is collected or stored. Data is encrypted and secured to prevent unauthorized access.

### Contact   
If you have any questions regarding this privacy policy, please contact us at skg4078@snu.ac.com.



- - -
We welcome feedback and contributions to this project. Feel free to explore the code and experiment with the features. Together, let's make YouTube time more intentional and productive!