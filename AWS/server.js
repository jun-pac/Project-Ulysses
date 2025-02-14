require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser"); 
const axios = require("axios");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB Atlas
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI, {
    connectTimeoutMS: 5000,
    retryWrites: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

mongoose.set('debug', true);

// Define Schema
const UserSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  data: { type: Object, required: true }, // User data backup
});

// Define Model
const User = mongoose.model("User", UserSchema);

/* ======= 1. Store user data from extension ======= */
app.post("/save-data", async (req, res) => {
  try {
    let { uuid, data } = req.body;
    console.log("User data received: ",uuid, data);

    // Check MongoDB connection state
    const connectionState = mongoose.connection.readyState;
    if (connectionState === 0) {
      console.log("MongoDB is disconnected");
    } else if (connectionState === 1) {
      console.log("MongoDB is connected");
    } else if (connectionState === 2) {
      console.log("MongoDB is connecting");
    } else if (connectionState === 3) {
      console.log("MongoDB is disconnecting");
    }

    // Save or update user data
    const updatedUser = await User.findOneAndUpdate(
      { uuid },
      { data },
      { upsert: true, new: true }
    );
    console.log("User data saved successfully");
    res.json({ message: "User data saved successfully", uuid, user: updatedUser });
  } catch (error) {
    console.error("Error saving user data:", error.message, error.stack);
    res.status(500).json({ error: "Failed to save user data" });
  }
});

/* ======= 2. Retrieve all user data (Admin Console) ======= */
app.get("/get-users", async (req, res) => {
  try {
    // Check MongoDB connection state
    const connectionState = mongoose.connection.readyState;
    if (connectionState === 0) {
      console.log("MongoDB is disconnected");
    } else if (connectionState === 1) {
      console.log("MongoDB is connected");
    } else if (connectionState === 2) {
      console.log("MongoDB is connecting");
    } else if (connectionState === 3) {
      console.log("MongoDB is disconnecting");
    }
    
    const users = await User.find({});
    console.log("users data:", users);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

/* ======= 3. Delete user data by UUIDs ======= */
app.post("/delete-users", async (req, res) => {  
  try {
    const { uuids } = req.body;
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({ error: "Invalid UUID list" });
    }

    console.log("Deleting users with UUIDs:", uuids);

    const result = await User.deleteMany({ uuid: { $in: uuids } });

    console.log(`Deleted ${result.deletedCount} users`);
    res.json({ message: "Users deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error deleting users:", error.message, error.stack);
    res.status(500).json({ error: "Failed to delete users" });
  }
});


// YouTube API Proxy Route
app.get("/video-details", async (req, res) => {
  // console.log("req: ", req.body);
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required" });
  }

  try {
    const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,contentDetails",
        id: videoId,
        key: process.env.YOUTUBE_API_KEY,
      },
    });

    res.json(response.data);
    console.log("YouTube response successfully received", res);
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    res.status(500).json({ error: "Failed to fetch video details" });
  }
});

// OpenAI API Proxy Route
app.post("/api/chatgpt", async (req, res) => {
  try {
    console.log("req: ", req.body);
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "Messages is required" });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    res.json(response.data);
    console.log("OpenAI response successfully received", res);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to fetch response from OpenAI API" });
  }
});

// Lambda Handler
module.exports.handler = require("serverless-http")(app);
// module.exports.handler = serverless(app);
