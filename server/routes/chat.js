const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const Message = require("../models/message");
const User = require("../models/user");
const auth = require("../middleware/auth");

const supabase = require("../utils/supabase");

// ======================================================
// MULTER
// ======================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

// ======================================================
// HELPERS
// ======================================================

const getIo = (req) => {
  return req.app.get("io");
};

const isSameUser = (a, b) => {
  return a.toString() === b.toString();
};

const getPublicFileUrl = (bucket, filePath) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
};

// ======================================================
// GET CONVERSATION
// ======================================================

router.get("/:userId", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user.id;

    if (isSameUser(otherId, myId)) {
      return res.status(400).json({
        message: "Cannot chat with yourself",
      });
    }

    const otherUser = await User.findById(otherId).select(
      "full_name profileImage department institution"
    );

    if (!otherUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: myId,
          receiver: otherId,
        },
        {
          sender: otherId,
          receiver: myId,
        },
      ],
    })
      .sort({
        createdAt: 1,
      })
      .populate(
        "sender",
        "full_name profileImage"
      )
      .populate(
        "receiver",
        "full_name profileImage"
      );

    // Mark incoming messages as read
    await Message.updateMany(
      {
        sender: otherId,
        receiver: myId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    res.status(200).json({
      user: otherUser,
      messages,
    });
  } catch (error) {
    console.error(
      "Get chat error:",
      error
    );

    res.status(500).json({
      message: "Failed to load chat",
      error: error.message,
    });
  }
});

// ======================================================
// GET RECENT CONVERSATIONS
// ======================================================

router.get("/", auth, async (req, res) => {
  try {
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [
        {
          sender: myId,
        },
        {
          receiver: myId,
        },
      ],
    })
      .sort({
        createdAt: -1,
      })
      .populate(
        "sender",
        "full_name profileImage"
      )
      .populate(
        "receiver",
        "full_name profileImage"
      );

    const map = new Map();

    for (const msg of messages) {
      const senderId =
        msg.sender?._id?.toString();

      const receiverId =
        msg.receiver?._id?.toString();

      const myIdString =
        myId.toString();

      const other =
        senderId === myIdString
          ? msg.receiver
          : msg.sender;

      if (!other?._id) {
        continue;
      }

      const key =
        other._id.toString();

      if (!map.has(key)) {
        map.set(key, {
          user: other,

          lastMessage:
            msg.type === "audio"
              ? "🎙️ Voice message"
              : msg.type === "file"
              ? `📎 ${msg.fileName || "File"}`
              : msg.text,

          lastMessageAt:
            msg.createdAt,

          unread:
            receiverId === myIdString &&
            !msg.read
              ? 1
              : 0,
        });
      } else if (
        receiverId === myIdString &&
        !msg.read
      ) {
        map.get(key).unread += 1;
      }
    }

    const conversations =
      Array.from(
        map.values()
      ).sort(
        (a, b) =>
          new Date(b.lastMessageAt) -
          new Date(a.lastMessageAt)
      );

    res.status(200).json(
      conversations
    );
  } catch (error) {
    console.error(
      "Inbox error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load conversations",
      error: error.message,
    });
  }
});

// ======================================================
// SEND TEXT MESSAGE
// ======================================================

router.post("/:userId", auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user.id;

    const {
      text,
      orderId,
    } = req.body;

    if (
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        message:
          "Message cannot be empty",
      });
    }

    if (isSameUser(otherId, myId)) {
      return res.status(400).json({
        message:
          "Cannot message yourself",
      });
    }

    const otherUser =
      await User.findById(
        otherId
      );

    if (!otherUser) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    const message =
      await Message.create({
        sender: myId,
        receiver: otherId,
        type: "text",
        text: text.trim(),
        order:
          orderId || null,
      });

    await message.populate(
      "sender",
      "full_name profileImage"
    );

    await message.populate(
      "receiver",
      "full_name profileImage"
    );

    const io = getIo(req);

    if (io) {
      io.to(
        otherId.toString()
      ).emit(
        "newMessage",
        message
      );
    }

    res.status(201).json({
      message: "Sent",
      data: message,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to send message",
      error: error.message,
    });
  }
});

// ======================================================
// SEND VOICE MESSAGE
// ======================================================

router.post(
  "/:userId/voice",
  auth,
  upload.single("audio"),
  async (req, res) => {
    try {
      const otherId =
        req.params.userId;

      const myId =
        req.user.id;

      if (!req.file) {
        return res.status(400).json({
          message:
            "Audio file is required",
        });
      }

      if (
        isSameUser(
          otherId,
          myId
        )
      ) {
        return res.status(400).json({
          message:
            "Cannot message yourself",
        });
      }

      const otherUser =
        await User.findById(
          otherId
        );

      if (!otherUser) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const bucket =
        process.env.SUPABASE_CHAT_BUCKET ||
        "chat-files";

      const extension =
        path.extname(
          req.file.originalname
        ) || ".webm";

      const filePath =
        `voice/${myId}/${Date.now()}${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from(bucket)
          .upload(
            filePath,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype ||
                "audio/webm",

              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          uploadError
        );

        return res.status(500).json({
          message:
            "Failed to upload audio",
        });
      }

      const audioUrl =
        getPublicFileUrl(
          bucket,
          filePath
        );

      const message =
        await Message.create({
          sender: myId,
          receiver: otherId,
          type: "audio",
          text: "",
          audioUrl,
        });

      await message.populate(
        "sender",
        "full_name profileImage"
      );

      await message.populate(
        "receiver",
        "full_name profileImage"
      );

      const io = getIo(req);

      if (io) {
        io.to(
          otherId.toString()
        ).emit(
          "newMessage",
          message
        );
      }

      res.status(201).json({
        message:
          "Voice message sent",
        data: message,
      });
    } catch (error) {
      console.error(
        "Voice upload error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send voice message",
        error: error.message,
      });
    }
  }
);

// ======================================================
// SEND FILE / IMAGE
// ======================================================

router.post(
  "/:userId/file",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const otherId =
        req.params.userId;

      const myId =
        req.user.id;

      if (!req.file) {
        return res.status(400).json({
          message:
            "File is required",
        });
      }

      if (
        isSameUser(
          otherId,
          myId
        )
      ) {
        return res.status(400).json({
          message:
            "Cannot send file to yourself",
        });
      }

      const otherUser =
        await User.findById(
          otherId
        );

      if (!otherUser) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const bucket =
        process.env.SUPABASE_CHAT_BUCKET ||
        "chat-files";

      const safeName =
        req.file.originalname
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

      const filePath =
        `files/${myId}/${Date.now()}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from(bucket)
          .upload(
            filePath,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype ||
                "application/octet-stream",

              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          uploadError
        );

        return res.status(500).json({
          message:
            "Failed to upload file",
        });
      }

      const fileUrl =
        getPublicFileUrl(
          bucket,
          filePath
        );

      const message =
        await Message.create({
          sender: myId,
          receiver: otherId,
          type: "file",
          text: "",
          fileUrl,
          fileName:
            req.file.originalname,
          fileType:
            req.file.mimetype,
          fileSize:
            req.file.size,
        });

      await message.populate(
        "sender",
        "full_name profileImage"
      );

      await message.populate(
        "receiver",
        "full_name profileImage"
      );

      const io = getIo(req);

      if (io) {
        io.to(
          otherId.toString()
        ).emit(
          "newMessage",
          message
        );
      }

      res.status(201).json({
        message:
          "File sent",
        data: message,
      });
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send file",
        error: error.message,
      });
    }
  }
);

// ======================================================
// EDIT MESSAGE
// ======================================================

router.put("/message/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const myId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== myId.toString()) {
      return res.status(403).json({
        message: "You can only edit your own messages",
      });
    }

    if (message.type !== "text") {
      return res.status(400).json({
        message: "Only text messages can be edited",
      });
    }

    message.text = text.trim();
    message.edited = true;

    await message.save();

    await message.populate(
      "sender",
      "full_name profileImage"
    );

    await message.populate(
      "receiver",
      "full_name profileImage"
    );

    const io = req.app.get("io");

    if (io) {
      io.to(message.receiver._id.toString()).emit(
        "messageUpdated",
        message
      );

      io.to(message.sender._id.toString()).emit(
        "messageUpdated",
        message
      );
    }

    return res.status(200).json({
      message: "Message updated",
      data: message,
    });
  } catch (error) {
    console.error("Edit message error:", error);

    return res.status(500).json({
      message: "Failed to edit message",
      error: error.message,
    });
  }
});
// ======================================================
// DELETE MESSAGE
// ======================================================

router.delete(
  "/message/:messageId",
  auth,
  async (req, res) => {
    try {
      const {
        messageId,
      } = req.params;

      const message =
        await Message.findById(
          messageId
        );

      if (!message) {
        return res.status(404).json({
          message:
            "Message not found",
        });
      }

      if (
        message.sender.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only delete your own messages",
        });
      }

      const receiverId =
        message.receiver.toString();

      const senderId =
        message.sender.toString();

      await message.deleteOne();

      const io = getIo(req);

      if (io) {
        io.to(receiverId).emit(
          "messageDeleted",
          {
            messageId,
          }
        );

        io.to(senderId).emit(
          "messageDeleted",
          {
            messageId,
          }
        );
      }

      res.status(200).json({
        message:
          "Message deleted",
      });
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete message",
        error: error.message,
      });
    }
  }
);

module.exports = router;