"use client";

import { useState } from "react";
import type { ChatResponse } from "@/lib/types";

const samplePrompts = [
  "What are Gengar's base stats?",
  "Find me a cute pink Pokemon associated with love",
  "Why was Mewtwo controversial when first introduced?"
];

export function ChatShell() {
  const [query, setQuery] = useState(samplePrompts[0]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(prompt: string) {
    setLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: prompt })
      });

      if (!result.ok) {
        const payload = (await result.json()) as { error?: string };
        throw new Error(payload.error ?? "Request failed.");
      }

      const payload = (await result.json()) as ChatResponse;
      setResponse(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              Leverate Take Home
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Agentic AI Pokedex
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Ask for hard facts, fuzzy vibes, or deep lore. The assistant decides
              which source to trust and shows why.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
            Routing modes: <strong>pokeapi</strong>, <strong>bulbapedia</strong>,{" "}
            <strong>hybrid</strong>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-4">
            <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
              Ask a question
            </label>
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rows={6}
              className="w-full resize-none rounded-[1.25rem] border border-[var(--border)] bg-[#fffdf9] px-4 py-3 text-base outline-none transition focus:border-[var(--accent)]"
              placeholder="Ask about Pokemon stats, lore, vibes, recommendations..."
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => submit(query)}
                disabled={loading || !query.trim()}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask the Pokedex"}
              </button>

              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setQuery(prompt);
                    void submit(prompt);
                  }}
                  className="rounded-full border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--foreground)]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#1f2526] p-4 text-[#f5efe5]">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-[#f6b89d]">
              Reasoning Trace
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[#e5ded0]">
              {JSON.stringify(response?.trace ?? null, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-white/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
        <p className="mb-3 text-sm uppercase tracking-[0.22em] text-[var(--accent-strong)]">
          Answer
        </p>
        <div className="prose max-w-none text-base leading-8 text-[var(--foreground)]">
          {response ? (
            <>
              <p>{response.answer}</p>
              <p className="text-sm text-[var(--muted)]">
                Sources used: {response.sources.join(", ")}
              </p>
            </>
          ) : (
            <p className="text-[var(--muted)]">
              The answer panel will populate once the first query is submitted.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
