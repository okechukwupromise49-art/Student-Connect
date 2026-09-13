// routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const User = require("../models/user");
const auth = require("../middleware/auth");

// ===============================
// GET conversation with a user
// ===============================
router.get("/:userId", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user.id;

    if (otherId === myId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const otherUser = await User.findById(otherId).select(
      "full_name profileImage department institution"
    );

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "full_name profileImage")
      .populate("receiver", "full_name profileImage");

    // Mark messages sent TO me as read
    await Message.updateMany(
      { sender: otherId, receiver: myId, read: false },
      { $set: { read: true } }
    );

  
  
    res.status(200).json({
      user: otherUser,
      messages,
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({
      message: "Failed to load chat",
      error: error.message,
    });
  }
});

// ===============================
// SEND message
// ===============================
router.post("/:userId", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user.id;
    const { text, orderId } = req.body;

    // Check message
    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    // Prevent messaging yourself
    if (otherId === myId.toString()) {
      return res.status(400).json({
        message: "Cannot message yourself",
      });
    }

    // Check receiver exists
    const otherUser = await User.findById(otherId);

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ===============================
    // CREATE MESSAGE
    // ===============================
    const message = await Message.create({
      sender: myId,
      receiver: otherId,
      text: text.trim(),
      order: orderId || null,
    });

    // ===============================
    // POPULATE MESSAGE
    // ===============================
    await message.populate(
      "sender",
      "full_name profileImage"
    );

    await message.populate(
      "receiver",
      "full_name profileImage"
    );

    // ===============================
    // SOCKET.IO
    // ===============================
    const io = req.app.get("io");

    if (io) {
      io.to(otherId.toString()).emit(
        "newMessage",
        message
      );
    }

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(201).json({
      message: "Sent",
      data: message,
    });

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
});

// ===============================
// GET recent conversations (inbox)
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "full_name profileImage")
      .populate("receiver", "full_name profileImage");

    // Group by other user, keep latest message
    const map = new Map();

    for (const msg of messages) {
      const other =
        msg.sender._id.toString() === myId.toString()
          ? msg.receiver
          : msg.sender;

      const key = other._id.toString();

      if (!map.has(key)) {
        map.set(key, {
          user: other,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unread:
            msg.receiver._id.toString() === myId.toString() && !msg.read
              ? 1
              : 0,
        });
      } else if (
        msg.receiver._id.toString() === myId.toString() &&
        !msg.read
      ) {
        map.get(key).unread += 1;
      }
    }

    const conversations = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Inbox error:", error);
    res.status(500).json({
      message: "Failed to load conversations",
      error: error.message,
    });
  }
});

module.exports = router;