// Thin wrapper around Groq's OpenAI-compatible chat completions endpoint.
// Used only as a natural-language layer on top of MedWatch's deterministic
// forecasting/clustering/redistribution engine — the AI never computes risk
// numbers itself, it only explains or narrates numbers the heuristic engine
// already produced. That keeps the core system auditable while still giving
// a real AI-powered interface on top of it.

const GROQ_MODEL = "openai/gpt-oss-120b";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(messages: ChatMessage[], maxTokens = 700): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq API returned an unexpected response shape.");
  }
  return content;
}
