import { env } from "@/lib/env";
import { getGeminiClient } from "@/lib/gemini";

export function normalizeVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

export async function embedText(text: string) {
  const client = getGeminiClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: env.GEMINI_EMBEDDING_DIMENSION
      }
    });

    const values = response.embeddings?.[0]?.values;

    if (!values || values.length !== env.GEMINI_EMBEDDING_DIMENSION) {
      return null;
    }

    return normalizeVector(values);
  } catch (error) {
    console.error("[embeddings] embedText failed", {
      textPreview: text.slice(0, 120),
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return null;
  }
}
