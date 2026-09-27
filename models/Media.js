const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    mimeType: {
      type: String,
      required: [true, "Mime type is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);
