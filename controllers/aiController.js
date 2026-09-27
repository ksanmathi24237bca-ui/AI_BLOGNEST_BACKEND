const { generateContent } = require("../config/gemini");

/**
 * Strips Markdown code fences (```json ... ``` or ``` ... ```) that
 * Gemini sometimes wraps JSON responses in, then parses the result.
 * Falls back to returning the raw text under a `raw` key if the
 * response isn't valid JSON, so a formatting hiccup from the model
 * never turns into a 500 for the caller.
 * @param {string} text
 */
const parseJsonResponse = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return { raw: cleaned };
  }
};

/**
 * Rough reading time estimate based on average adult reading speed
 * (~200 words per minute).
 * @param {string} content
 */
const estimateReadingTime = (content) => {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

/**
 * @desc    Generate a full blog post from a topic
 * @route   POST /api/v1/ai/generate-blog
 * @access  Private (authenticated users)
 */
exports.generateBlog = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
      });
    }

    const prompt = `
You are an expert content writer and SEO strategist.
Generate a complete, well-structured blog post about: "${topic}".

Respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:
{
  "seoTitle": "string - an SEO-optimized blog title",
  "introduction": "string - an engaging introduction paragraph",
  "headings": ["string", "string", "..."],
  "content": "string - the full blog content, well-structured, written under the above headings",
  "conclusion": "string - a concise concluding paragraph",
  "metaDescription": "string - under 160 characters, SEO meta description",
  "keywords": ["string", "string", "..."]
}
`.trim();

    const rawResponse = await generateContent(prompt);
    const data = parseJsonResponse(rawResponse);

    return res.status(200).json({
      success: true,
      message: "Blog content generated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate blog content",
    });
  }
};

/**
 * @desc    Summarize blog content, estimate reading time, suggest tags
 * @route   POST /api/v1/ai/summarize
 * @access  Private (authenticated users)
 */
exports.summarizeBlog = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const prompt = `
You are an expert editor. Summarize the following blog content and suggest relevant tags.

Content:
"""${content}"""

Respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:
{
  "summary": "string - a concise 2-4 sentence summary",
  "suggestedTags": ["string", "string", "..."]
}
`.trim();

    const rawResponse = await generateContent(prompt);
    const data = parseJsonResponse(rawResponse);

    return res.status(200).json({
      success: true,
      message: "Blog summarized successfully",
      data: {
        summary: data.summary,
        readingTime: estimateReadingTime(content),
        suggestedTags: data.suggestedTags,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to summarize blog content",
    });
  }
};

/**
 * @desc    Generate FAQs for a topic
 * @route   POST /api/v1/ai/generate-faq
 * @access  Private (authenticated users)
 */
exports.generateFaq = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic is required",
      });
    }

    const prompt = `
You are a subject-matter expert. Generate 5 to 10 frequently asked questions
(with clear, accurate answers) about: "${topic}".

Respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:
{
  "faqs": [
    { "question": "string", "answer": "string" }
  ]
}
`.trim();

    const rawResponse = await generateContent(prompt);
    const data = parseJsonResponse(rawResponse);

    return res.status(200).json({
      success: true,
      message: "FAQs generated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate FAQs",
    });
  }
};

/**
 * @desc    Generate weather-based blog ideas and tips for a city
 * @route   POST /api/v1/ai/weatherwise
 * @access  Private (authenticated users)
 */
exports.weatherWiseIdeas = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const prompt = `
You are a lifestyle and travel content strategist. Based on the typical/current
weather conditions and climate patterns of "${city}", generate blog content ideas
and practical tips relevant to that weather.

Respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:
{
  "city": "${city}",
  "weatherSummary": "string - a brief general description of the city's typical weather/climate",
  "blogIdeas": ["string", "string", "..."],
  "tips": ["string", "string", "..."]
}
`.trim();

    const rawResponse = await generateContent(prompt);
    const data = parseJsonResponse(rawResponse);

    return res.status(200).json({
      success: true,
      message: "Weather-based blog ideas generated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate weather-based ideas",
    });
  }
};

/**
 * @desc    Generate fitness blog ideas and recommendations for a goal
 * @route   POST /api/v1/ai/fittrack
 * @access  Private (authenticated users)
 */
exports.fitTrackIdeas = async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal || !goal.trim()) {
      return res.status(400).json({
        success: false,
        message: "Goal is required",
      });
    }

    const prompt = `
You are a certified fitness content expert. Based on the fitness goal: "${goal}",
generate blog content ideas and practical recommendations to help readers pursuing
this goal.

Respond with ONLY a valid JSON object (no markdown, no commentary) in exactly this shape:
{
  "goal": "${goal}",
  "blogIdeas": ["string", "string", "..."],
  "recommendations": ["string", "string", "..."]
}
`.trim();

    const rawResponse = await generateContent(prompt);
    const data = parseJsonResponse(rawResponse);

    return res.status(200).json({
      success: true,
      message: "Fitness blog ideas generated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate fitness ideas",
    });
  }
};
