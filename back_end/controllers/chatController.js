const systemInstruction = [
  "You are MediTrack's general health information assistant.",
  "You do not diagnose conditions, prescribe medicines, recommend doses, or replace a clinician.",
  "Give general, cautious health information and encourage users to consult a qualified healthcare professional for personal advice.",
  "If a user describes an emergency or potentially life-threatening symptoms, tell them to contact local emergency services or go to an emergency department immediately.",
  "Do not claim certainty. Do not instruct users to start, stop, or change prescription medicines.",
].join(" ");

async function sendMessage(req, res, next) {
  try {
    const { message, history = [] } = req.body || {};
    if (typeof message !== "string" || !message.trim() || message.length > 1500) {
      return res.status(400).json({ message: "Enter a message of up to 1,500 characters." });
    }
    if (!process.env.LLM_API_KEY) {
      return res.status(503).json({ message: "The medical assistant is not configured. Please contact the site administrator." });
    }

    const safeHistory = Array.isArray(history) ? history.slice(-10).flatMap((entry) => {
      if (!entry || !["user", "assistant"].includes(entry.role) || typeof entry.content !== "string") return [];
      return [{ role: entry.role, content: entry.content.slice(0, 1200) }];
    }) : [];
    const endpoint = process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemInstruction },
          ...safeHistory,
          { role: "user", content: message.trim() },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Medical assistant provider returned status", response.status);
      return res.status(502).json({ message: "The medical assistant could not respond right now." });
    }
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({ message: "The medical assistant returned an empty response." });
    }
    return res.json({ reply: reply.trim() });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ message: "The medical assistant took too long to respond. Please try again." });
    }
    return next(error);
  }
}

module.exports = { sendMessage };