"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SourceReference = {
  id: string;
  name: string;
  sourceType: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  similarity: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  warning?: string;
};

type ContextItem = { id: string; name: string; sourceType: string; embeddingStatus?: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [contextStatus, setContextStatus] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/chat").then((response) => response.json()),
      fetch("/api/context").then((response) => response.json()),
    ]).then(([chat, context]) => {
      setMessages(chat.messages ?? []);
      setContexts(context.contexts ?? []);
    });
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function removeContext(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from memory?`)) return;

    const response = await fetch(`/api/context/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setContextStatus("Could not remove that context.");
      return;
    }

    setContexts((current) => current.filter((item) => item.id !== id));
    setContextStatus(`${name} removed.`);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ]);
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      setMessages((current) => [
        ...current,
        response.ok
          ? { ...result.message, sources: result.sources, warning: result.warning }
          : {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: result.message ?? "Something glitched. Try again.",
            },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "The chat service is offline. Try again shortly.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="arcade-shell chat-shell">
      <div className="scanlines" />
      <header className="topbar pixel-panel">
        <Link href="/" className="brand">SYNAPSE<span>_</span></Link>
        <div className="chat-header-label">CHAT_CORE · CONTEXT ONLINE</div>
        <Link href="/" className="pixel-button small">← CONTEXT</Link>
      </header>
      <section className="chat-layout">
        <aside className="context-sidebar pixel-panel">
          <div className="section-heading"><span>LOADED_CONTEXT</span><small>{contexts.length.toString().padStart(2, "0")}</small></div>
          {contexts.length === 0 ? <p className="empty-state">Nothing loaded. Go back and add your context.</p> : contexts.map((item) => <div className="sidebar-context" key={item.id}><span className="file-icon">{item.sourceType.toUpperCase()}</span><span>{item.name}</span><small>{item.embeddingStatus === "degraded" ? "FALLBACK" : item.embeddingStatus?.toUpperCase()}</small><button className="context-delete" onClick={() => void removeContext(item.id, item.name)} aria-label={`Remove ${item.name}`}>×</button></div>)}
          {contextStatus && <p className="form-status">{contextStatus}</p>}
          <Link href="/" className="sidebar-link">+ ADD MORE CONTEXT</Link>
        </aside>
        <section className="chat-console pixel-panel">
          <div className="console-title"><span>CHAT_CORE.exe</span><span>SESSION ACTIVE</span></div>
          <div className="messages">
            {messages.length === 0 && <div className="welcome-message"><span className="big-cursor">▮</span><h1>WHAT ARE WE<br /><em>THINKING ABOUT?</em></h1><p>Your context is loaded. Ask a question, connect some dots, or start somewhere weird.</p></div>}
            {messages.map((message) => <article className={`message ${message.role}`} key={message.id}><span className="message-label">{message.role === "user" ? "YOU /" : "SYNAPSE /"}</span><p>{message.content}</p>{message.warning && <small className="message-warning">{message.warning}</small>}{message.sources && message.sources.length > 0 && <div className="source-list"><span className="source-heading">SOURCES</span>{message.sources.map((source) => <span className="source-reference" key={source.id}>{source.name} · chunk {source.chunkIndex + 1} · chars {source.startChar}-{source.endChar}</span>)}</div>}</article>)}
            {busy && <article className="message assistant"><span className="message-label">SYNAPSE /</span><p className="typing">PROCESSING<span>.</span><span>.</span><span>.</span></p></article>}
            <div ref={bottom} />
          </div>
          <form className="chat-input" onSubmit={sendMessage}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your message..." rows={2} /><button className="pixel-button" disabled={busy}>SEND ↗</button></form>
        </section>
      </section>
    </main>
  );
}
