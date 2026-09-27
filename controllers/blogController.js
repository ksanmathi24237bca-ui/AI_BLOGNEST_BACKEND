const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Comment = require("../models/Comment");
const Analytics = require("../models/Analytics");
const { getOrCreateAnalytics } = require("./analyticsController");

const POPULATE_AUTHOR = "name email profileImage";
const POPULATE_CATEGORY = "name";
const POPULATE_TAGS = "name";

/**
 * Validates that `category` (if provided) and every id in `tags` (if
 * provided) are well-formed ObjectIds that actually exist, so a blog
 * never gets saved pointing at a category/tag that doesn't exist.
 * Returns an error message string, or null if everything checks out.
 */
const validateCategoryAndTags = async (category, tags) => {
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return "Invalid category id";
    }
    const categoryExists = await Category.exists({ _id: category });
    if (!categoryExists) {
      return "Category not found";
    }
  }

  if (tags && tags.length > 0) {
    const hasInvalidId = tags.some((tagId) => !mongoose.Types.ObjectId.isValid(tagId));
    if (hasInvalidId) {
      return "Invalid tag id";
    }
    const foundTagsCount = await Tag.countDocuments({ _id: { $in: tags } });
    if (foundTagsCount !== new Set(tags).size) {
      return "One or more tags not found";
    }
  }

  return null;
};

/**
 * @desc    Create a new blog post
 * @route   POST /api/v1/blogs
 * @access  Private (Author, Admin)
 */
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, category, tags, status, scheduledAt } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Blog title is required.",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Blog content is required.",
      });
    }

    const validationError = await validateCategoryAndTags(category, tags);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (status === "scheduled" && !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "scheduledAt is required when status is 'scheduled'.",
      });
    }

    const blog = await Blog.create({
      title: title.trim(),
      content,
      excerpt: excerpt ? excerpt.trim() : "",
      coverImage: coverImage || "",
      category: category || null,
      tags: tags || [],
      author: req.user._id,
      status: status || "draft",
      scheduledAt: status === "scheduled" ? scheduledAt : null,
    });

    // Seed an empty analytics row up front so dashboards/aggregations
    // never have to special-case a brand-new blog with no Analytics doc.
    await getOrCreateAnalytics(blog._id);

    const populatedBlog = await Blog.findById(blog._id)
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS);

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: populatedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create blog.",
    });
  }
};

/**
 * @desc    Get all published blogs (pagination, search & filters)
 * @route   GET /api/v1/blogs
 * @access  Public
 * @query   page, limit, category, tag, author, search, sort=oldest|newest
 */
exports.getAllBlogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const filter = { status: "published" };

    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = req.query.category;
    }

    if (req.query.tag && mongoose.Types.ObjectId.isValid(req.query.tag)) {
      filter.tags = req.query.tag;
    }

    if (req.query.author && mongoose.Types.ObjectId.isValid(req.query.author)) {
      filter.author = req.query.author;
    }

    if (req.query.search && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim() };
    }

    const sortOption = req.query.sort === "oldest" ? { publishedAt: 1 } : { publishedAt: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", POPULATE_AUTHOR)
        .populate("category", POPULATE_CATEGORY)
        .populate("tags", POPULATE_TAGS)
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blogs.",
    });
  }
};

/**
 * @desc    Get a single blog by ID (increments its view count)
 * @route   GET /api/v1/blogs/:id
 * @access  Public — a non-published blog (draft/pending/scheduled) is
 *          only visible to its author or an admin/editor, when the
 *          request carries a valid token (route must apply `protect`
 *          for this check to have any effect; anonymous requests fall
 *          back to "not found" for anything that isn't published).
 */
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blog = await Blog.findById(id)
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS)
      .populate({
        path: "comments",
        populate: { path: "user", select: "name profileImage" },
      });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const isOwner = Boolean(req.user) && blog.author._id.toString() === req.user._id.toString();
    const isAdminOrEditor = Boolean(req.user) && ["admin", "editor"].includes(req.user.role);

    if (blog.status !== "published" && !isOwner && !isAdminOrEditor) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Track a view for everyone except the blog's own author, so an
    // author previewing their own post doesn't inflate its own count.
    await getOrCreateAnalytics(id);
    const analytics = isOwner
      ? await Analytics.findOne({ blog: id })
      : await Analytics.findOneAndUpdate({ blog: id }, { $inc: { views: 1 } }, { new: true });

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: {
        ...blog.toObject(),
        views: analytics.views,
        likes: analytics.likes,
        shares: analytics.shares,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blog.",
    });
  }
};

/**
 * @desc    Update a blog post
 * @route   PUT /api/v1/blogs/:id
 * @access  Private (the author who owns the post, or an Admin)
 */
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const isOwner = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this blog",
      });
    }

    const { title, content, excerpt, coverImage, category, tags, status, scheduledAt } = req.body;

    const validationError = await validateCategoryAndTags(category, tags);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Blog title cannot be empty.",
        });
      }
      blog.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Blog content cannot be empty.",
        });
      }
      blog.content = content;
    }

    if (excerpt !== undefined) blog.excerpt = excerpt.trim();
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (category !== undefined) blog.category = category || null;
    if (tags !== undefined) blog.tags = tags;

    if (status !== undefined) {
      if (status === "scheduled" && !scheduledAt && !blog.scheduledAt) {
        return res.status(400).json({
          success: false,
          message: "scheduledAt is required when status is 'scheduled'.",
        });
      }
      blog.status = status;
      blog.scheduledAt = status === "scheduled" ? scheduledAt || blog.scheduledAt : null;
    }

    await blog.save();

    const populatedBlog = await Blog.findById(blog._id)
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS);

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: populatedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update blog.",
    });
  }
};

/**
 * @desc    Delete a blog post (cascades its comments and analytics doc)
 * @route   DELETE /api/v1/blogs/:id
 * @access  Private (the author who owns the post, or an Admin)
 */
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const isOwner = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this blog",
      });
    }

    await Promise.all([
      Comment.deleteMany({ blog: id }),
      Analytics.deleteOne({ blog: id }),
      blog.deleteOne(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete blog.",
    });
  }
};

/**
 * @desc    Like a blog post (increments its Analytics like count)
 * @route   PATCH /api/v1/blogs/:id/like
 * @access  Private (authenticated users)
 */
exports.likeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blog = await Blog.findById(id).select("_id status");
    if (!blog || blog.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await getOrCreateAnalytics(id);
    const analytics = await Analytics.findOneAndUpdate(
      { blog: id },
      { $inc: { likes: 1 } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Blog liked successfully",
      data: { blogId: id, likes: analytics.likes },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to like blog.",
    });
  }
};

/**
 * @desc    Get blog by slug
 * @route   GET /api/v1/blogs/slug/:slug
 * @access  Public
 */
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Search blogs
 * @route   GET /api/v1/blogs/search
 * @access  Public
 */
exports.searchBlogs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const blogs = await Blog.find({
      status: "published",
      title: { $regex: keyword, $options: "i" },
    })
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS);

    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Increment blog views
 * @route   PATCH /api/v1/blogs/:id/view
 */
exports.incrementViews = async (req, res) => {
  try {
    const analytics = await Analytics.findOneAndUpdate(
      { blog: req.params.id },
      { $inc: { views: 1 } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      views: analytics.views,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Trending blogs
 * @route   GET /api/v1/blogs/trending
 */
exports.getTrendingBlogs = async (req, res) => {
  try {
    const analytics = await Analytics.find()
      .sort({ views: -1 })
      .limit(5)
      .populate({
        path: "blog",
        populate: [
          { path: "author", select: POPULATE_AUTHOR },
          { path: "category", select: POPULATE_CATEGORY },
          { path: "tags", select: POPULATE_TAGS },
        ],
      });

    return res.status(200).json({
      success: true,
      data: analytics.map((item) => item.blog).filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Latest blogs
 * @route   GET /api/v1/blogs/latest
 */
exports.getLatestBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("author", POPULATE_AUTHOR)
      .populate("category", POPULATE_CATEGORY)
      .populate("tags", POPULATE_TAGS);

    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};