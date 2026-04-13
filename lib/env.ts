import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_CLASSIFIER_MODEL: z.string().default("gpt-4.1-nano"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
});

export const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_CLASSIFIER_MODEL: process.env.OPENAI_CLASSIFIER_MODEL,
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});
