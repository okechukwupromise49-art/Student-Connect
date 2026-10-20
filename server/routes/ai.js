// routes/ai.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are Campus AI for Student Connect, a Nigerian campus app for students.
Help with: studies, exams, campus life, scholarships, career tips, and how to use the app
(messages, groups, marketplace, updates, find friends).
Be friendly, short, and practical. If unsure, say so.`;

    const chatHistory = history.slice(-10).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I'm Campus AI and ready to help." }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      message: "AI failed to respond",
      error: error.message,
    });
  }
});

module.exports = router;