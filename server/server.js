const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const userLimits = {};
const MAX_REQUESTS_PER_DAY = 5;

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not defined in the .env file.");
  process.exit(1);
}

app.post('/explain', async (req, res) => {
  const prompt = req.body.prompt;
  const userId = req.headers['x-client-id'];

  // Validate request
  if (!prompt || !userId) {
    return res.status(400).json({ result: "Missing prompt or userId" });
  }

  // Sanitize and truncate the prompt
  const sanitizedPrompt = prompt.replace(/\s+/g, ' ').trim();
  const truncatedPrompt = sanitizedPrompt.slice(0, 300);

  // Implement rate-limiting logic
  const today = new Date().toISOString().slice(0, 10);
  userLimits[userId] = userLimits[userId] || {};
  userLimits[userId][today] = userLimits[userId][today] || 0;

  if (userLimits[userId][today] >= MAX_REQUESTS_PER_DAY) {
    return res.status(429).json({ result: "⛔ You've reached the 5 explanations/day limit." });
  }

  try {
    // Send request to Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: truncatedPrompt }]
            }
          ]
        })
      }
    );

    const data = await geminiRes.json();
    console.log("🔍 Full Gemini response:", JSON.stringify(data, null, 2));

    // Extract generated content
    const text = data?.candidates?.[0]?.content;

    if (!text) {
      return res.json({ result: "⚠️ Gemini response missing. Try a different theme or shorter content." });
    }

    userLimits[userId][today]++;
    res.json({ result: text });
  } catch (err) {
    // Handle server or API errors
    console.error("❌ Server error:", err);
    res.status(500).json({ result: "❌ Server error. Try again later." });
  }
});

// Start the server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));