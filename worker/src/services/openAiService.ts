import { OpenAI } from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { User } from "../../../packages/database/src/models/user/User.js";
import { prompt } from "../prompt.js";

const MODELS_WITHOUT_TEMPERATURE: Set<string> = new Set([
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'o3',
  'o4-mini'
]);

export async function analyzeImage(imageUrl: string, userId: string): Promise<string | object | null> {
  try {
    if (!imageUrl || !userId) {
      throw new Error("Both imageUrl and userId are required.");
    }

    const user = await User.findById(userId)
      .select("openAiPreferenceModel openAiPreferenceTemperature")
      .lean();

    const client: OpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model: string = user?.openAiPreferenceModel ?? "gpt-4o-mini";

    const payload: ChatCompletionCreateParamsNonStreaming = {
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

    const firstChoice = response.choices[0];

    if (!firstChoice) {
      throw new Error("No choices returned from OpenAI API.");
    }

    return firstChoice.message.content;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
}
