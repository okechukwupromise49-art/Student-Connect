const mongoose = require("mongoose");

const updateReportSchema = new mongoose.Schema(
  {
    update: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Update",
      required: true,
    },

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "incorrect",
        "outdated",
        "spam",
        "misleading",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "kept", "deleted"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UpdateReport", updateReportSchema);