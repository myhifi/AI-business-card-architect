import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCardArt(company: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional, minimalist, modern corporate logo for a company named "${company}". High-end branding, vector style, white background, clean lines, centered.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image was generated.");
}
