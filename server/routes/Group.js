// routes/group.js
const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const auth = require("../middleware/auth");

// ===============================
// CREATE GROUP
// ===============================
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      category: category || "study",
      creator: req.user.id,
      members: [req.user.id],
      admins: [req.user.id],
    });

    await group.populate("members", "full_name profileImage");
    await group.populate("creator", "full_name profileImage");

    res.status(201).json({ message: "Group created", group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create group" });
  }
});

// ===============================
// GET MY GROUPS
// ===============================
router.get("/my", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("creator", "full_name profileImage")
      .populate("members", "full_name profileImage")
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Failed to load groups" });
  }
});

// ===============================
// GET / DISCOVER GROUPS
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("creator", "full_name profileImage")
      .populate("members", "full_name profileImage")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Failed to load groups" });
  }
});

// ===============================
// JOIN GROUP
// ===============================
router.post("/:id/join", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const alreadyMember = group.members.some(
      (id) => id.toString() === req.user.id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "Already a member" });
    }

    group.members.push(req.user.id);
    await group.save();

    await group.populate("members", "full_name profileImage");

    res.json({ message: "Joined group", group });
  } catch (error) {
    res.status(500).json({ message: "Failed to join group" });
  }
});

// ===============================
// LEAVE GROUP
// ===============================
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.members = group.members.filter(
      (id) => id.toString() !== req.user.id.toString()
    );
    group.admins = group.admins.filter(
      (id) => id.toString() !== req.user.id.toString()
    );

    await group.save();

    res.json({ message: "Left group" });
  } catch (error) {
    res.status(500).json({ message: "Failed to leave group" });
  }
});

// ===============================
// GET GROUP MESSAGES
// ===============================
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (id) => id.toString() === req.user.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Join the group to view chat" });
    }

    const messages = await GroupMessage.find({ group: req.params.id })
      .populate("sender", "full_name profileImage")
      .sort({ createdAt: 1 });

    res.json({
      group: await group.populate("members", "full_name profileImage"),
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// ===============================
// SEND GROUP MESSAGE
// ===============================
router.post("/:id/messages", auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (id) => id.toString() === req.user.id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Join the group to chat" });
    }

    const message = await GroupMessage.create({
      group: req.params.id,
      sender: req.user.id,
      text: text.trim(),
    });

    await message.populate("sender", "full_name profileImage");

    
    const io = req.app.get("io");
    if (io) {
      io.to(`group_${req.params.id}`).emit("group_message", message);
    }

    res.status(201).json({ message: "Sent", data: message });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;