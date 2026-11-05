import { useEffect, useState } from "react";
import { Bot, Send, ShieldAlert, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { apiRequest } from "../lib/api.js";

const suggestedQuestions = [
  "What should I ask my pharmacist about a new medicine?",
  "How can I read the information leaflet that came with my medicine?",
  "What information should I have ready before calling my doctor?",
];

function MedicalAssistantPage() {
  const { session } = useAuth();
  const historyKey = `meditrack.chat.${session.user.id}`;
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(historyKey));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      sessionStorage.setItem(historyKey, JSON.stringify(messages));
    } catch {
      setError("Chat history could not be saved in this browser session.");
    }
  }, [historyKey, messages]);

  async function sendMessage(event, suggested = "") {
    event?.preventDefault();
    const message = (suggested || draft).trim();
    if (!message || sending) return;
    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    setDraft("");
    setSending(true);
    setError("");
    try {
      const data = await apiRequest("/api/chat/message", null, { method: "POST", body: { message, history } });
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="customer-page assistant-page">
      <div className="customer-page-heading"><div><p className="section-kicker">GENERAL HEALTH INFORMATION</p><h1>Medical assistant</h1><p>Ask general questions to help prepare for a conversation with a healthcare professional.</p></div></div>
      <div className="assistant-disclaimer"><ShieldAlert size={18} /><p>This assistant cannot diagnose, prescribe, or replace professional medical advice. For emergencies, contact local emergency services or go to an emergency department.</p></div>
      <section aria-label="Medical assistant conversation" className="assistant-chat">
        <div aria-live="polite" className="assistant-messages">
          {!messages.length && <div className="assistant-welcome"><span><Bot size={23} /></span><strong>How can I help you prepare?</strong><p>Choose a general health information question or type your own.</p></div>}
          {messages.map((message, index) => <article className={`assistant-message ${message.role}`} key={`${message.role}-${index}`}><span className="assistant-message-icon">{message.role === "assistant" ? <Bot size={16} /> : <UserRound size={16} />}</span><p>{message.content}</p></article>)}
          {sending && <p className="assistant-thinking" role="status">Preparing a response…</p>}
        </div>
        {error && <p className="dashboard-message error-message" role="alert">{error}</p>}
        {!messages.length && <div className="assistant-suggestions">{suggestedQuestions.map((question) => <button key={question} onClick={() => sendMessage(null, question)} type="button">{question}</button>)}</div>}
        <form className="assistant-composer" onSubmit={sendMessage}><label className="sr-only" htmlFor="assistant-message">Your message</label><textarea id="assistant-message" maxLength={1500} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a general health question…" rows={2} value={draft} /><button aria-label="Send message" disabled={sending || !draft.trim()} type="submit"><Send size={17} /></button></form>
        <p className="assistant-history-note">Conversation is kept in this browser session only.</p>
      </section>
    </section>
  );
}

export default MedicalAssistantPage;