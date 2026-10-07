"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ContextItem = { id: string; name: string; sourceType: string; characterCount: number };
const extensions = ["TXT", "MD", "PDF", "DOCX"];

export default function ContextHome() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshContexts() {
    const response = await fetch("/api/context");
    if (response.ok) setContexts((await response.json()).contexts);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/context")
      .then((response) => response.json())
      .then((result) => { if (!cancelled) setContexts(result.contexts ?? []); })
      .catch(() => { if (!cancelled) setStatus("Context service is offline."); });
    return () => { cancelled = true; };
  }, []);

  async function submitContext(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!text.trim() && !form.get("file")) { setStatus("Add text or choose a file first."); return; }
    setBusy(true); setStatus("Uploading and indexing...");
    const response = await fetch("/api/context", { method: "POST", body: form });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setStatus(result.message ?? "Could not add context."); return; }
    setText(""); setName(""); if (fileInput.current) fileInput.current.value = "";
    setStatus("Context added. Your chat is ready."); await refreshContexts();
  }

  async function removeContext(id: string) { await fetch(`/api/context/${id}`, { method: "DELETE" }); await refreshContexts(); }

  return <main className="arcade-shell"><div className="scanlines" /><header className="topbar pixel-panel"><Link href="/" className="brand">SYNAPSE<span>_</span></Link><div className="topbar-status"><i /> LOCAL MODE · READY</div><Link href="/chat" className="pixel-button small">ENTER CHAT →</Link></header><section className="hero-grid"><div className="hero-copy"><p className="eyebrow">[ KNOWLEDGE ARCADE / 2000 ]</p><h1>DROP YOUR<br /><em>CONTEXT.</em></h1><p className="hero-subtitle">Load the ideas, notes, docs, and secrets you want to think with. Then jump into a chat that actually knows what you brought.</p><div className="supported-row"><span>SUPPORTED</span>{extensions.map((item) => <b key={item}>{item}</b>)}</div></div><div className="context-console pixel-panel"><div className="console-title"><span>CONTEXT_CONSOLE.exe</span><span>● ● ●</span></div><form onSubmit={submitContext}><label className="field-label" htmlFor="name">LABEL YOUR DROP</label><input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Project direction" /><label className="field-label" htmlFor="text">PASTE TEXT <span>· OR UPLOAD BELOW</span></label><textarea id="text" name="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste a note, brief, idea, or anything you want Synapse to remember..." rows={8} /><div className="dropzone" onClick={() => fileInput.current?.click()}><strong>↥ DROP FILE HERE</strong><span>.txt / .md / .pdf / .docx · max 10 MB</span><input ref={fileInput} name="file" type="file" accept=".txt,.md,.pdf,.docx" onChange={(event) => { if (event.target.files?.[0]) setStatus(`${event.target.files[0].name} ready.`); }} /></div><button className="pixel-button submit" disabled={busy}>{busy ? "INDEXING..." : "ADD TO MEMORY +"}</button>{status && <p className="form-status">{status}</p>}</form></div></section><section className="memory-strip pixel-panel"><div className="section-heading"><span>MEMORY_BANK</span><small>{contexts.length.toString().padStart(2, "0")} ITEMS LOADED</small></div>{contexts.length === 0 ? <p className="empty-state">No context loaded yet. Your brain dump starts here.</p> : <div className="memory-list">{contexts.map((item) => <div className="memory-item" key={item.id}><span className="file-icon">{item.sourceType.toUpperCase()}</span><span className="memory-name">{item.name}</span><small>{item.characterCount.toLocaleString()} CHARS</small><button onClick={() => void removeContext(item.id)} aria-label={`Remove ${item.name}`}>×</button></div>)}</div>}</section><footer><span>SYNC STATUS: <b>ONLINE</b></span><span>NO LOGIN. NO NOISE. JUST CONTEXT.</span><span>v0.2 · BUILD YOUR BRAIN</span></footer></main>;
}
