"use client";

import { useState } from "react";
import type { ChatResponse } from "@/lib/types";

const samplePrompts = [
  "What are Gengar's base stats?",
  "Find me a cute pink Pokemon associated with love",
  "Recommend a beginner-friendly grass starter from Gen 3",
  "Why was Mewtwo controversial when first introduced?"
];

type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      content: string;
      trace: ChatResponse["trace"];
      sources: string[];
    };

const starterTrace = {
  intent: "unknown",
  entitiesDetected: [],
  selectedRoute: "hybrid",
  whyThisRoute: "Submit a question to inspect the assistant's source-selection trace.",
  confidence: 0,
  fallbacksUsed: []
} as const;

export function ChatShell() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTrace, setActiveTrace] = useState<ChatResponse["trace"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt
    };

    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setError(null);
    setQuery("");

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: trimmedPrompt })
      });

      if (!result.ok) {
        const payload = (await result.json()) as { error?: string };
        throw new Error(payload.error ?? "Request failed.");
      }

      const payload = (await result.json()) as ChatResponse;
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.answer,
        trace: payload.trace,
        sources: payload.sources
      };

      setMessages((current) => [...current, assistantMessage]);
      setActiveTrace(payload.trace);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const trace = activeTrace ?? starterTrace;

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(227,74,51,0.95),rgba(147,31,52,0.96))] text-white shadow-[0_30px_80px_rgba(80,18,16,0.28)]">
          <div className="grid gap-6 px-6 py-8 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/75">
                Agentic AI Pokedex
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                A source-aware Pokemon chat built for facts, lore, and fuzzy discovery.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
                This interface is designed around the test case: the user asks in
                natural language, and the assistant chooses between structured
                lookup, semantic retrieval, or a hybrid route.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/15 bg-black/15 p-4 backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/72">Structured facts</span>
                <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  PokeAPI
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/72">Lore and narrative</span>
                <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  Bulbapedia
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-white/72">Mixed reasoning</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d1f34]">
                  Hybrid
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--shell)] shadow-[0_18px_60px_rgba(48,32,18,0.08)]">
            <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                    Chat Interface
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    Pokedex Console
                  </h2>
                </div>
                <p className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--muted)]">
                  Single-turn by design for this assignment
                </p>
              </div>
            </div>

            <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Try a prompt
              </p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setQuery(prompt);
                      void submit(prompt);
                    }}
                    className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[#fff6f2]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[28rem] flex-col gap-4 px-5 py-5 md:px-6">
              {messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center">
                  <div className="max-w-lg">
                    <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                      Ready
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                      Start with a Pokemon question
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      Ask for stats, lore, descriptive matches, or recommendations.
                      The answer and reasoning trace will appear side by side.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={
                        message.role === "user"
                          ? "ml-auto max-w-[85%] rounded-[1.5rem] rounded-br-md bg-[linear-gradient(135deg,#da5233,#c2373f)] px-5 py-4 text-white shadow-[0_12px_30px_rgba(162,55,44,0.22)]"
                          : "max-w-[92%] rounded-[1.5rem] rounded-bl-md border border-[var(--border)] bg-white px-5 py-4 text-[var(--foreground)] shadow-[0_8px_22px_rgba(47,31,16,0.08)]"
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] opacity-75">
                          {message.role === "user" ? "Trainer" : "Pokedex AI"}
                        </span>
                        {message.role === "assistant" ? (
                          <button
                            onClick={() => setActiveTrace(message.trace)}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
                          >
                            View Trace
                          </button>
                        ) : null}
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-7 md:text-[15px]">
                        {message.content}
                      </p>

                      {message.role === "assistant" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.sources.map((source) => (
                            <span
                              key={source}
                              className="rounded-full bg-[#f4eee6] px-3 py-1 text-xs text-[var(--muted)]"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {loading ? (
                    <div className="max-w-[92%] rounded-[1.5rem] rounded-bl-md border border-[var(--border)] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(47,31,16,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                        Pokedex AI
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:120ms]" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:240ms]" />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {error ? (
                <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4 md:px-6">
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <label className="mb-2 block px-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Ask a question
                </label>
                <textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-[1rem] border border-transparent bg-[#fffdf9] px-3 py-3 text-sm leading-7 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] md:text-[15px]"
                  placeholder="Ask about stats, evolution lines, lore, or describe a Pokemon by vibe..."
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[var(--muted)]">
                    Keep it natural. The router decides the source.
                  </p>
                  <button
                    onClick={() => void submit(query)}
                    disabled={loading || !query.trim()}
                    className="rounded-full bg-[linear-gradient(135deg,#da5233,#c2373f)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Thinking..." : "Ask the Pokedex"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-[#253134] bg-[#172022] p-5 text-[#f6efe4] shadow-[0_18px_60px_rgba(16,24,24,0.24)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[#efb497]">
                Reasoning Trace
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Routing Snapshot</h2>

              <div className="mt-5 grid gap-3">
                <TraceRow label="Intent" value={trace.intent} />
                <TraceRow label="Route" value={trace.selectedRoute} />
                <TraceRow
                  label="Confidence"
                  value={`${Math.round(trace.confidence * 100)}%`}
                />
              </div>

              <div className="mt-5 rounded-[1.25rem] bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#efb497]">
                  Why this route
                </p>
                <p className="mt-2 text-sm leading-7 text-[#dfd7ca]">
                  {trace.whyThisRoute}
                </p>
              </div>

              <div className="mt-4 rounded-[1.25rem] bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#efb497]">
                  Entities detected
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trace.entitiesDetected.length > 0 ? (
                    trace.entitiesDetected.map((entity) => (
                      <span
                        key={entity}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#f6efe4]"
                      >
                        {entity}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#c7bfb3]">No entity detected yet.</span>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[1.25rem] bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#efb497]">
                  Fallbacks
                </p>
                {trace.fallbacksUsed.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#dfd7ca]">
                    {trace.fallbacksUsed.map((fallback) => (
                      <li key={fallback}>{fallback}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#c7bfb3]">No fallback used.</p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-[var(--border)] bg-white/76 p-5 shadow-[0_18px_60px_rgba(48,32,18,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Scope Reminder
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li>Supports structured facts, lore, fuzzy search, and recommendations.</li>
                <li>Shows explicit routing instead of pretending to know everything from one source.</li>
                <li>Keeps the experience single-turn and lightweight for the assessment.</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1rem] bg-white/6 px-4 py-3">
      <span className="text-sm text-[#c7bfb3]">{label}</span>
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
        {value}
      </span>
    </div>
  );
}
