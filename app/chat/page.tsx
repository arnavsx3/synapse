"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type ContextItem = { id: string; name: string; sourceType: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { void Promise.all([fetch("/api/chat").then((response) => response.json()), fetch("/api/context").then((response) => response.json())]).then(([chat, context]) => { setMessages(chat.messages ?? []); setContexts(context.contexts ?? []); }); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const message = input.trim(); if (!message || busy) return;
    setInput(""); setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", content: message }]); setBusy(true);
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const result = await response.json();
    setMessages((current) => [...current, response.ok ? result.message : { id: `error-${Date.now()}`, role: "assistant", content: result.message ?? "Something glitched. Try again." }]); setBusy(false);
  }

  return <main className="arcade-shell chat-shell"><div className="scanlines" /><header className="topbar pixel-panel"><Link href="/" className="brand">SYNAPSE<span>_</span></Link><div className="chat-header-label">CHAT_CORE · CONTEXT ONLINE</div><Link href="/" className="pixel-button small">← CONTEXT</Link></header><section className="chat-layout"><aside className="context-sidebar pixel-panel"><div className="section-heading"><span>LOADED_CONTEXT</span><small>{contexts.length.toString().padStart(2, "0")}</small></div>{contexts.length === 0 ? <p className="empty-state">Nothing loaded. Go back and add your context.</p> : contexts.map((item) => <div className="sidebar-context" key={item.id}><span className="file-icon">{item.sourceType.toUpperCase()}</span><span>{item.name}</span></div>)}<Link href="/" className="sidebar-link">+ ADD MORE CONTEXT</Link></aside><section className="chat-console pixel-panel"><div className="console-title"><span>CHAT_CORE.exe</span><span>SESSION ACTIVE</span></div><div className="messages">{messages.length === 0 && <div className="welcome-message"><span className="big-cursor">▮</span><h1>WHAT ARE WE<br /><em>THINKING ABOUT?</em></h1><p>Your context is loaded. Ask a question, connect some dots, or start somewhere weird.</p></div>}{messages.map((message) => <article className={`message ${message.role}`} key={message.id}><span className="message-label">{message.role === "user" ? "YOU /" : "SYNAPSE /"}</span><p>{message.content}</p></article>)}{busy && <article className="message assistant"><span className="message-label">SYNAPSE /</span><p className="typing">PROCESSING<span>.</span><span>.</span><span>.</span></p></article>}<div ref={bottom} /></div><form className="chat-input" onSubmit={sendMessage}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your message..." rows={2} /><button className="pixel-button" disabled={busy}>SEND ↗</button></form></section></section></main>;
}
