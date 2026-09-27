const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Blog = require("../models/Blog");

/**
 * @desc    Create Comment
 * @route   POST /api/v1/comments
 * @access  Private
 */
const createComment = async (req, res) => {
  try {
    const { blog, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blog)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const blogExists = await Blog.findById(blog);

    if (!blogExists) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const comment = await Comment.create({
      blog,
      user: req.user._id,
      comment: content,
      status: "approved",
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "name email profileImage"
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get Comments by Blog
 * @route   GET /api/v1/comments/blog/:blogId
 * @access  Public
 */
const getCommentsByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({
      blog: blogId,
      status: "approved",
    })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update Comment
 * @route   PUT /api/v1/comments/:id
 * @access  Private
 */
const updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    comment.comment = content;
    await comment.save();

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete Comment
 * @route   DELETE /api/v1/comments/:id
 * @access  Private
 */
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
};