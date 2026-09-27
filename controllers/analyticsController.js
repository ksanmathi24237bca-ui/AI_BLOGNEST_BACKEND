const Analytics = require("../models/Analytics");
const Blog = require("../models/Blog");
const User = require("../models/User");

// Create analytics document if it doesn't exist
const getOrCreateAnalytics = async (blogId) => {
  let analytics = await Analytics.findOne({ blog: blogId });

  if (!analytics) {
    analytics = await Analytics.create({
      blog: blogId,
      views: 0,
      likes: 0,
      commentsCount: 0,
      shares: 0,
    });
  }

  return analytics;
};

// Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAnalytics = await Analytics.find();

    const totalViews = totalAnalytics.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = totalAnalytics.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = totalAnalytics.reduce(
      (sum, item) => sum + item.commentsCount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        totalUsers,
        totalViews,
        totalLikes,
        totalComments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Top Blogs
const getTopBlogs = async (req, res) => {
  try {
    const blogs = await Analytics.find()
      .sort({ views: -1 })
      .limit(5)
      .populate("blog");

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Top Authors
const getTopAuthors = async (req, res) => {
  try {
    const authors = await Blog.aggregate([
      { $group: { _id: "$author", totalBlogs: { $sum: 1 } } },
      { $sort: { totalBlogs: -1 } },
      { $limit: 5 },
    ]);

    const populated = await User.populate(authors, {
      path: "_id",
      select: "name email profileImage",
    });

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Single Blog Analytics
const getBlogAnalytics = async (req, res) => {
  try {
    const analytics = await getOrCreateAnalytics(req.params.blogId);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getOrCreateAnalytics,
  getDashboardSummary,
  getTopBlogs,
  getTopAuthors,
  getBlogAnalytics,
};