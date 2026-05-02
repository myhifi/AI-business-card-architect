import { GoogleGenAI, Type } from "@google/genai";
import { BusinessCard } from "../types/card";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateCardData(name: string, profession: string): Promise<Partial<BusinessCard>> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Design a professional business card identity for a person named "${name}" who works as a "${profession}".
    Generate a realistic company name if one isn't implied. 
    Provide a short, impactful professional catchphrase.
    Pick a professional theme (light or dark) and a hex accent color that suits the industry.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          company: { type: Type.STRING },
          catchphrase: { type: Type.STRING },
          theme: { 
            type: Type.STRING,
            enum: ["light", "dark"]
          },
          accentColor: { type: Type.STRING, description: "A hex code like #2563eb" }
        },
        required: ["jobTitle", "company", "catchphrase", "theme", "accentColor"]
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return {
      ...data,
      name: name,
      phones: [] 
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to generate business card details.");
  }
}

export async function suggestSmartTheme(jobTitle: string): Promise<{ accentColor: string; theme: "light" | "dark" }> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Suggest a professional color scheme for a business card for the profession: "${jobTitle}". 
    Return an accent color hex code and preferred base theme (light or dark).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          accentColor: { type: Type.STRING, description: "Hex code" },
          theme: { type: Type.STRING, enum: ["light", "dark"] }
        },
        required: ["accentColor", "theme"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function checkInputQuality(name: string, profession: string): Promise<{
  nameSuggestion?: string;
  professionSuggestion?: string;
  isPerfect: boolean;
}> {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Analyze this business card input: Name: "${name}", Profession: "${profession}". 
    Look for typos, capitalization issues, or ways to make the profession sound more professional (e.g. "coder" -> "Software Engineer").
    If the name looks like a name but has poor capitalization, suggest a fix.
    Only return suggestions if there is a meaningful improvement to be made.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nameSuggestion: { type: Type.STRING },
          professionSuggestion: { type: Type.STRING },
          isPerfect: { type: Type.BOOLEAN }
        },
        required: ["isPerfect"]
      }
    }
  });

  return JSON.parse(response.text);
}
