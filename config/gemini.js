const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  // Fail loudly at startup rather than on first AI request
  console.warn(
    "[gemini.js] GEMINI_API_KEY is not set in .env — AI routes will fail until it is configured."
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default model used across all AI features.
// Centralized here so it can be swapped/upgraded in one place.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * Returns a configured Gemini generative model instance.
 * @param {Object} [options]
 * @param {string} [options.modelName] - override the default model
 * @param {Object} [options.generationConfig] - override generation config
 */
const getGeminiModel = (options = {}) => {
  const { modelName = MODEL_NAME, generationConfig = {} } = options;

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
      ...generationConfig,
    },
  });
};

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Kept here (not in controllers) so retry/error-handling logic
 * for the AI provider stays in one reusable place.
 * @param {string} prompt
 * @param {Object} [options] - forwarded to getGeminiModel
 * @returns {Promise<string>}
 */
const generateContent = async (prompt, options = {}) => {
  const model = getGeminiModel(options);
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
};

module.exports = {
  genAI,
  getGeminiModel,
  generateContent,
};
