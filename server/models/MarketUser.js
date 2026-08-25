const mongoose = require("mongoose");

const marketUserSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone_number: {
      type: Number,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    university: {
      type: String,
      trim: true,
      required: true,
    },

    origin: {
      type: String,
      required: true,
    },

    adress: {
      type: String,
      required: true,
    },

    
    
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("marketUser", marketUserSchema);