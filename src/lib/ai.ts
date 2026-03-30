import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeImage(base64Image: string, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg",
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

export async function readText(base64Image: string) {
  return analyzeImage(
    base64Image,
    "Extract all the text in this image clearly and concisely. If it's a menu, organize it logically by categories. Do not describe the image, just read the text. If there is no text, say 'No text found'."
  );
}

export async function describeScene(base64Image: string) {
  return analyzeImage(
    base64Image,
    "Describe the surroundings in this image in simple, clear sentences. Highlight any important elements like entrances, exits, or potential obstacles. Keep it concise, under 3 sentences if possible. If there are people, mention them briefly."
  );
}
