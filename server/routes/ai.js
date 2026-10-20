// routes/ai.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({
        message: "AI is not configured (missing API key)",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try flash first; fallback model if needed
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const systemPrompt = `You are Campus AI for Student Connect, a Nigerian campus app for students.
Help with: studies, exams, campus life, scholarships, career tips, and how to use the app
(messages, groups, marketplace, updates, find friends).
Be friendly, short, and practical. If unsure, say so.`;

    // Safer than startChat: build one prompt
    const recent = (Array.isArray(history) ? history : [])
      .slice(-8)
      .map((h) => {
        const role = h.role === "assistant" ? "AI" : "User";
        const content = h.content || h.text || "";
        return `${role}: ${content}`;
      })
      .join("\n");

    const fullPrompt = `${systemPrompt}

Previous conversation:
${recent || "(none)"}

User: ${String(message).trim()}
AI:`;

    const result = await model.generateContent(fullPrompt);
    const reply = result?.response?.text?.() || "";

    if (!reply.trim()) {
      return res.status(500).json({ message: "Empty AI response" });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);

    // Helpful client message
    const msg = error?.message || "AI failed to respond";

    return res.status(500).json({
      message: "AI failed to respond",
      error: msg,
    });
  }
});

module.exports = router;