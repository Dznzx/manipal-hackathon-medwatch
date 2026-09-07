"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "error";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Which facility needs the most urgent action right now?",
  "Why is Kundapura Taluk flagged as a regional risk?",
  "Is the Amoxicillin shortage demand-driven or supply-driven?",
];

export default function AskMedWatch() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMessages((m) => [...m, { role: "assistant", text: json.answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "error", text: err instanceof Error ? err.message : "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col h-[420px]">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Sparkles size={15} className="text-violet-400" />
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Ask MedWatch</h3>
          <p className="text-[11px] text-slate-500">AI answers grounded strictly in the current computed data — never invents numbers</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Try asking:</p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="block w-full text-left text-xs rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-3 py-2"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-sky-500/15 text-sky-100 ml-auto"
                : m.role === "error"
                ? "bg-red-500/10 text-red-300"
                : "bg-slate-800/70 text-slate-200"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 size={12} className="animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="border-t border-slate-800 p-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about facilities, risks, or recommendations…"
          className="flex-1 bg-slate-800/60 rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white px-2.5 py-1.5"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
