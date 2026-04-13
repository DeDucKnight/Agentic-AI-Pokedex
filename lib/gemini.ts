import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY
    });
  }

  return client;
}
