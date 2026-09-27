const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blog author is required"],
    },

    status: {
      type: String,
      enum: ["draft", "pending", "published", "scheduled"],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------- Indexes -------------------- */

blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ author: 1 });
blogSchema.index({ title: "text", content: "text" });

/* -------------------- Slug Generator -------------------- */

const slugify = (text = "") =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* -------------------- Auto Generate Slug -------------------- */

// ✅ Mongoose 9 version (NO next())
blogSchema.pre("save", async function () {
  if (!this.isModified("title")) return;

  const base = slugify(this.title);
  let candidate = base;
  let suffix = 1;

  const Blog = this.constructor;

  while (await Blog.findOne({ slug: candidate, _id: { $ne: this._id } })) {
    suffix++;
    candidate = `${base}-${suffix}`;
  }

  this.slug = candidate;
});

/* -------------------- Published Date -------------------- */

// ✅ Mongoose 9 version (NO next())
blogSchema.pre("save", function () {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

/* -------------------- Virtual Comments -------------------- */

blogSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "blog",
  match: { status: "approved" },
});

blogSchema.set("toJSON", { virtuals: true });
blogSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Blog", blogSchema);