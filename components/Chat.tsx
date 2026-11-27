"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Icon } from "./Icon";
import { track } from "@/lib/track";

type Msg = { role: "user" | "assistant"; content: string };

export function Chat() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { box.current?.scrollTo(0, 1e6); }, [msgs, busy]);
  useEffect(() => { if (open) inp.current?.focus(); }, [open]);

  const hello = lang === "az" ? "Salam! DataTech, tədbirlər, qoşulmaq və ya data/AI haqqında soruş." : "Hi! Ask about DataTech, events, joining, or data/AI.";
  const sugg = lang === "az" ? ["Necə qoşulum?", "Növbəti tədbir nə vaxtdır?", "Xallar necə hesablanır?"] : ["How do I join?", "When is the next event?", "How do points work?"];

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: q.trim() }];
    setMsgs(next); setText(""); setBusy(true);
    track("chat_question", { text: q.trim() });
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(-10), lang }), signal: AbortSignal.timeout(40000) });
      const j = await r.json();
      if (typeof j.left === "number") setLeft(j.left);
      setMsgs([...next, { role: "assistant", content: j.reply || j.error || "…" }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: lang === "az" ? "Bağlantı alınmadı. Bir az sonra yenidən yoxla." : "Couldn't connect. Try again in a moment." }]);
    }
    setBusy(false);
  }

  return (
    <>
      <button className="ai" type="button" onClick={() => setOpen((o) => !o)} aria-label="AI köməkçi" aria-expanded={open}><Icon name={open ? "x" : "spark"} /></button>
      <div className="chat" hidden={!open} role="dialog" aria-label="DataTech köməkçi">
        <header>
          <div className="lb-av" style={{ background: "var(--blue)", color: "#fff" }}><Icon name="spark" size={18} /></div>
          <div style={{ flex: 1 }}><b>DataTech {lang === "az" ? "köməkçi" : "assistant"}</b><small>{lang === "az" ? "Saytdakı məlumatla cavab verir" : "Answers from site content"}</small></div>
          <button type="button" className="chip" onClick={() => setOpen(false)} aria-label="Bağla" style={{ height: 32, minWidth: 32, padding: 0 }}><Icon name="x" size={16} /></button>
        </header>
        <div className="msgs" ref={box}>
          <div className="bub bot">{hello}</div>
          {msgs.map((m, i) => <div key={i} className={"bub " + (m.role === "user" ? "me" : "bot")} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>)}
          {busy && <div className="bub bot typing" aria-label={lang === "az" ? "Köməkçi yazır" : "Assistant is typing"}><i /><i /><i /></div>}
        </div>
        {msgs.length === 0 && <div className="sugg">{sugg.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}</div>}
        <div className="limit">{lang === "az" ? "Gündəlik limit" : "Daily limit"}: {left ?? 20} {lang === "az" ? "sual qalıb" : "questions left"}</div>
        <form onSubmit={(e) => { e.preventDefault(); ask(text); }}>
          <input ref={inp} id="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={lang === "az" ? "Sualını yaz..." : "Type your question..."} autoComplete="off" aria-label="Sual" maxLength={500} />
          <button className="chip" style={{ background: "var(--blue)", color: "#fff", border: 0 }} aria-label="Göndər" disabled={busy}><Icon name="send" /></button>
        </form>
      </div>
    </>
  );
}
