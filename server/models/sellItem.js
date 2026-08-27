const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "pdf"],
      required: true,
    },
    name: {
      type: String,
    },
  },
  { _id: false }
);

const sellItemSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      required: true,
    },

    category: {
      type: String,
      trim: true,
      default: "other",
      // examples: study, electronics, fashion, beauty, food, other
    },

    price: {
      type: Number, // better as Number for sorting/calculations
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    files: {
      type: [fileSchema],
      default: [],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SellItem", sellItemSchema);