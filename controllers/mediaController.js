const fs = require("fs");
const path = require("path");
const Media = require("../models/Media");

/**
 * @desc    Upload Image
 * @route   POST /api/v1/media/upload
 * @access  Private
 */
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,        // ✅ FIX
      path: `/uploads/${req.file.filename}`,
      url: `/uploads/${req.file.filename}`, // ✅ FIX
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: media,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get Uploaded Files
 * @route   GET /api/v1/media
 * @access  Public
 */
const getUploadedFiles = async (req, res) => {
  try {
    const files = await Media.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      count: files.length,
      data: files,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete Uploaded File
 * @route   DELETE /api/v1/media/:id
 * @access  Private
 */
const deleteUploadedFile = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    const filePath = path.join(__dirname, "..", media.path.replace(/^\/+/, ""));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await media.deleteOne();

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadMedia,
  getUploadedFiles,
  deleteUploadedFile,
};