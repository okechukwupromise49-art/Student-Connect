const express = require("express");
const router = express.Router();

const Update = require("../models/update");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { supabase } = require("../supabase/supabaseClient");
const path = require("path");

// ===============================
// CREATE UPDATE
// ===============================
router.post(
  "/",
  auth,
  upload.single("image"), // matches FormData field name "image"
  async (req, res) => {
    try {
      const { title, body, category, pinned } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Title is required",
        });
      }

      // Need at least text or image
      if ((!body || !body.trim()) && !req.file) {
        return res.status(400).json({
          message: "Add some text or an image",
        });
      }

      let imageUrl = null;

      // Upload image to Supabase (optional)
      if (req.file) {
        const extension = path.extname(req.file.originalname);
        const fileName = `updates/${req.user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}${extension}`;

        const { error } = await supabase.storage
          .from("post-files")
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          return res.status(500).json({
            message: "Failed to upload image",
            error: error.message,
          });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-files").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const update = await Update.create({
        title: title.trim(),
        body: body?.trim() || "",
        category: category || "general",
        pinned: pinned === "true" || pinned === true,
        image: imageUrl,
        author: req.user.id,
      });

      await update.populate("author", "full_name profileImage");

      return res.status(201).json({
        message: "Update created successfully",
        update,
      });
    } catch (error) {
      console.error("Create update error:", error);
      return res.status(500).json({
        message: "Failed to create update",
        error: error.message,
      });
    }
  }
);

// ===============================
// GET ALL UPDATES
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    const updates = await Update.find()
      .populate("author", "full_name profileImage")
      .sort({ pinned: -1, createdAt: -1 });

    res.status(200).json(updates);
  } catch (error) {
    console.error("Get updates error:", error);
    res.status(500).json({
      message: "Failed to fetch updates",
      error: error.message,
    });
  }
});

// ===============================
// DELETE UPDATE
// ===============================
router.delete("/:id", auth, async (req, res) => {
  try {
    const update = await Update.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ message: "Update not found" });
    }

    // Only author can delete (or add admin later)
    if (update.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await update.deleteOne();

    res.status(200).json({ message: "Update deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete update",
      error: error.message,
    });
  }
});

module.exports = router;