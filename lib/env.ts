import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envLocalPath = resolve(process.cwd(), ".env.local");

if (existsSync(envLocalPath)) {
  const contents = readFileSync(envLocalPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().min(1).optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional());

const envSchema = z.object({
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: optionalString,
  GEMINI_QUERY_ANALYZER_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_BULBAPEDIA_MODEL: z
    .string()
    .default("gemini-2.5-flash-lite-preview-09-2025"),
  GEMINI_ANSWER_COMPILER_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  GEMINI_EMBEDDING_DIMENSION: z.coerce.number().int().positive().default(1536),
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString
});

export const env = envSchema.parse({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_QUERY_ANALYZER_MODEL:
    process.env.GEMINI_QUERY_ANALYZER_MODEL ?? process.env.GEMINI_MODEL,
  GEMINI_BULBAPEDIA_MODEL:
    process.env.GEMINI_BULBAPEDIA_MODEL ?? process.env.GEMINI_MODEL,
  GEMINI_ANSWER_COMPILER_MODEL:
    process.env.GEMINI_ANSWER_COMPILER_MODEL ?? process.env.GEMINI_MODEL,
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL,
  GEMINI_EMBEDDING_DIMENSION: process.env.GEMINI_EMBEDDING_DIMENSION,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});
