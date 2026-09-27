const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: [true, "Blog reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    comment: {
      type: String,
      required: [true, "Comment text is required"],
      minlength: [2, "Comment must be at least 2 characters long"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "spam"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Helpful for fetching all approved comments of a blog quickly
commentSchema.index({ blog: 1, status: 1 });

module.exports = mongoose.model("Comment", commentSchema);
