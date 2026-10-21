
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

    // Initialize the Google Gen AI SDK.
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
    });

    const systemPrompt = `
You are Campus AI for Student Connect,
a Nigerian campus app for students.

Help with studies, exams, campus life, scholarships,
career tips, and using the app, including messages,
groups, marketplace, updates, and finding friends.

Be friendly, practical, and concise.
If you are unsure, say so.
`;

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

    // Try the primary model and then fallback models.
    const modelNames = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ];

    let reply = "";
    let lastError = null;

    for (const modelName of modelNames) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          // Correct API for @google/genai.
          const result = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
          });

          // Correct response format for @google/genai.
          reply = result?.text || "";

          if (!reply.trim()) {
            throw new Error(
              `Empty response from ${modelName}`
            );
          }

          console.log(
            `Campus AI responded using ${modelName}`
          );

          break;
        } catch (error) {
          lastError = error;

          const status = Number(
            error?.status || error?.code || 0
          );

          const errorMessage = String(
            error?.message || ""
          );

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
            `Campus AI error: ${modelName}, attempt ${
              attempt + 1
            }, status ${status || "unknown"}:`,
            errorMessage
          );

          // Invalid API keys and other permanent errors
          // should not be retried against every model.
          if (!temporaryError && !missingModel) {
            throw error;
          }

          // Retry temporary failures once.
          if (temporaryError && attempt === 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1200)
            );
          } else {
            // Move to the next model.
            break;
          }
        }
      }

      if (reply.trim()) {
        break;
      }
    }

    if (!reply.trim()) {
      throw lastError || new Error(
        "All Gemini models failed"
      );
    }

    return res.json({ reply });
  } catch (error) {
    console.error("AI chat error:", {
      message: error?.message,
      status: error?.status || error?.code,
    });

    const status = Number(
      error?.status || error?.code || 0
    );

    const temporaryError =
      [429, 500, 502, 503, 504].includes(status) ||
      /UNAVAILABLE|high demand|temporarily unavailable/i.test(
        String(error?.message || "")
      );

    if (temporaryError) {
      return res.status(503).json({
        message:
          "Campus AI is busy right now. Please try again shortly.",
      });
    }

    return res.status(500).json({
      message:
        "AI failed to respond. Check the backend logs.",
    });
  }
});

module.exports = router;
