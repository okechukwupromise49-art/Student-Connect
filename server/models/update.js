const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      trim: true,
      default: "",
    },

    // school | scholarship | career | news | general
    category: {
      type: String,
      enum: ["school", "scholarship", "career", "news", "general"],
      default: "general",
    },

    // Image URL from Supabase (optional)
    image: {
      type: String,
      default: null,
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Update", updateSchema);