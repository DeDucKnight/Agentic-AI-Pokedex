import { NextResponse } from "next/server";
import { z } from "zod";
import { runPokedexPipeline } from "@/lib/pokedex/router";

const requestSchema = z.object({
  query: z.string().min(1, "Query is required.")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = requestSchema.parse(body);
    const result = await runPokedexPipeline(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/chat] POST failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
