
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      console.error("GEMINI_API_KEY is missing");

      return res.status(500).json({
        message: "AI is not configured. Check the backend API key.",
      });
    }

    // Load the current Google Gen AI SDK in this CommonJS backend.
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
    });

    const systemPrompt = `You are Campus AI for Student Connect,
a Nigerian campus app for students.

Help with studies, exams, campus life, scholarships, career tips,
and using the app, including messages, groups, marketplace,
updates, and finding friends.

Be friendly, practical, and concise. If you are unsure, say so.`;

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .map((item) => {
            const role =
              item?.role === "assistant" ? "AI" : "User";

            const content = String(
              item?.content || item?.text || ""
            );

            return `${role}: ${content}`;
          })
          .join("\n")
      : "";

    const fullPrompt = `${systemPrompt}

Previous conversation:
${recentHistory || "(none)"}

User: ${message.trim()}
AI:`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
    });

    const reply = result.text || "";

    if (!reply.trim()) {
      console.error("Gemini returned an empty response");

      return res.status(502).json({
        message: "The AI returned an empty response. Please try again.",
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("AI chat error:", {
      message: error?.message,
      status: error?.status,
      details: error?.details,
    });

    return res.status(500).json({
      message: "AI failed to respond. Check the backend logs.",
    });
  }
});

module.exports = router;
