
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

    // Try the primary model, then fall back to other supported models.
const modelNames = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
];

let reply = "";
let lastError = null;

for (const modelName of modelNames) {
  // Allow two attempts per model.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const result = await model.generateContent(fullPrompt);

      reply = result?.response?.text?.() || "";

      if (!reply.trim()) {
        throw new Error("Gemini returned an empty response");
      }

      console.log(`Campus AI responded using ${modelName}`);

      break;
    } catch (error) {
      lastError = error;

      const status = Number(
        error?.status || error?.response?.status
      );

      const errorMessage = String(error?.message || "");

      const temporaryError =
        [429, 500, 502, 503, 504].includes(status) ||
        /UNAVAILABLE|high demand|temporarily unavailable/i.test(
          errorMessage
        );

      const missingModel =
        status === 404 ||
        /model.*not found|model.*unsupported/i.test(
          errorMessage
        );

      console.error(
        `Campus AI: ${modelName}, attempt ${attempt + 1}, status ${status || "unknown"}:`,
        errorMessage
      );

      // Do not retry errors such as invalid credentials.
      if (!temporaryError && !missingModel) {
        throw error;
      }

      // Retry temporary failures once after a short delay.
      if (temporaryError && attempt === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1200)
        );
      } else {
        // Try the next model.
        break;
      }
    }
  }

  if (reply.trim()) {
    break;
  }
}

if (!reply.trim()) {
  throw lastError || new Error("All Gemini models failed");
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
