const express = require("express");
const router = express.Router();

const SellItem = require("../models/sellItem");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { supabase } = require("../supabase/supabaseClient");
const path = require("path");

// ===============================
// CREATE ITEM
// ===============================
router.post(
  "/item",
  auth,
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { title, category, price, description, quantity } = req.body;

      // Validate required fields
      if (!title?.trim() || !category?.trim() || price === undefined || quantity === undefined) {
        return res.status(400).json({
          message: "Title, category, price and quantity are required",
        });
      }

      const parsedPrice = Number(price);
      const parsedQty = Number(quantity);

      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }

      if (isNaN(parsedQty) || parsedQty < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }

      // ===============================
      // UPLOAD FILES TO SUPABASE
      // ===============================
      const uploadedFiles = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const extension = path.extname(file.originalname);
          const fileName = `${req.user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}${extension}`;

          let fileType = "image";
          if (file.mimetype.startsWith("video/")) fileType = "video";
          else if (file.mimetype === "application/pdf") fileType = "pdf";
          else if (file.mimetype.startsWith("image/")) fileType = "image";

          const { error } = await supabase.storage
            .from("post-files")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (error) {
            console.error("Supabase upload error:", error);
            return res.status(500).json({
              message: "Failed to upload file",
              error: error.message,
            });
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("post-files").getPublicUrl(fileName);

          uploadedFiles.push({
            url: publicUrl,
            type: fileType,
            name: file.originalname,
          });
        }
      }

      // ===============================
      // CREATE ITEM
      // ===============================
      const sellItem = new SellItem({
        author: req.user.id,
        title: title.trim(),
        category: category.trim().toLowerCase(),
        price: parsedPrice,
        description: description?.trim() || "",
        quantity: parsedQty,
        files: uploadedFiles,
      });

      await sellItem.save();

      // Populate author for frontend
      await sellItem.populate("author", "full_name profileImage");

      res.status(201).json({
        message: "Item listed successfully",
        item: sellItem,
      });
    } catch (err) {
      console.error("Create market error:", err);
      res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  }
);

// ===============================
// GET ALL ITEMS
// ===============================
router.get("/items", async (req, res) => {
  try {
    const items = await SellItem.find({ quantity: { $gt: 0 } })
      .populate("author", "full_name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    console.error("Get items error:", err);
    res.status(500).json({
      message: "Failed to fetch items",
      error: err.message,
    });
  }
});

// ===============================
// GET SINGLE ITEM
// ===============================
router.get("/item/:id", async (req, res) => {
  try {
    const item = await SellItem.findById(req.params.id).populate(
      "author",
      "full_name profileImage department institution"
    );

    if (!item || item.quantity <= 0) {
      return res.status(404).json({ message: "Item not found or sold out" });
    }

    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch item",
      error: err.message,
    });
  }
});

// ===============================
// BUY ITEM (reduce quantity / auto-delete)
// ===============================
router.post("/buy/:itemId", auth, async (req, res) => {
  try {
    const buyQty = Number(req.body.quantity || 1);

    if (!buyQty || buyQty < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const item = await SellItem.findById(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent buying your own item
    if (item.author.toString() === req.user.id.toString()) {
      return res.status(400).json({
        message: "You cannot buy your own item",
      });
    }

    if (item.quantity < buyQty) {
      return res.status(400).json({
        message: `Only ${item.quantity} left in stock`,
      });
    }

    item.quantity -= buyQty;

    // Auto-delete when sold out
    if (item.quantity <= 0) {
      await item.deleteOne();

      return res.status(200).json({
        message: "Purchase successful. Item sold out and removed.",
        soldOut: true,
      });
    }

    await item.save();

    res.status(200).json({
      message: "Purchase successful",
      remainingQuantity: item.quantity,
      item,
    });
  } catch (error) {
    console.error("Buy error:", error);
    res.status(500).json({
      message: "Failed to complete purchase",
      error: error.message,
    });
  }
});

// ===============================
// DELETE OWN ITEM
// ===============================
router.delete("/item/:id", auth, async (req, res) => {
  try {
    const item = await SellItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own item",
      });
    }

    // Optional: delete files from Supabase here

    await item.deleteOne();

    res.status(200).json({
      message: "Item deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete item",
      error: err.message,
    });
  }
});

module.exports = router;