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
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

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

    // Save or update user data
    const updatedUser = await User.findOneAndUpdate(
      { uuid },
      { data },
      { upsert: true, new: true }
    );
    console.log("User data saved successfully");
    res.json({ message: "User data saved successfully", uuid, user: updatedUser });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ error: "Failed to save user data" });
  }
});

/* ======= 2. Retrieve all user data (Admin Console) ======= */
app.get("/get-users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
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
