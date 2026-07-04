const { OpenAI } = require("openai");
const User = require("../../../packages/database/src/models/User");
const prompt = require("../prompt");

const MODELS_WITHOUT_TEMPERATURE = new Set([
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'o3',
  'o4-mini'
]);

async function analyzeImage(imageUrl, userId) {
  try {
    if (!imageUrl || !userId) {
      throw new Error("Both imageUrl and userId are required.");
    }

    const user = await User.findById(userId)
      .select("openAiPreferenceModel openAiPreferenceTemperature")
      .lean();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = user?.openAiPreferenceModel ?? "gpt-4o-mini";

    const payload = {
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    };

    if (!MODELS_WITHOUT_TEMPERATURE.has(model)) {
      payload.temperature = user?.openAiPreferenceTemperature ?? 0.7;
    }

    const response = await client.chat.completions.create(payload);

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
}

module.exports = {
  analyzeImage,
};