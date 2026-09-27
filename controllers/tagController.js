const mongoose = require("mongoose");
const Tag = require("../models/Tag");

// CREATE TAG
const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag name is required.",
      });
    }

    const existing = await Tag.findOne({ name: name.trim() });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists.",
      });
    }

    const tag = await Tag.create({
      name: name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL TAGS
const getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Tags fetched successfully",
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET TAG BY ID
const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid tag ID.",
      });
    }

    const tag = await Tag.findById(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tag fetched successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE TAG
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid tag ID.",
      });
    }

    const existing = await Tag.findOne({
      name: name.trim(),
      _id: { $ne: id },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Tag already exists.",
      });
    }

    const tag = await Tag.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tag updated successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE TAG
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid tag ID.",
      });
    }

    const tag = await Tag.findByIdAndDelete(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
};