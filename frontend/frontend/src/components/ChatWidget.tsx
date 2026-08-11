import { useEffect, useRef, useState } from "react";
import { Send, X, Headphones } from "lucide-react";

type Msg = { from: "me" | "op"; text: string; t: number };

export function ChatWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "op", text: "Hi 👋 I'm your support operator. How can I help?", t: Date.now() },
  ]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function send() {
    if (!text.trim()) return;
    const m: Msg = { from: "me", text, t: Date.now() };
    setMsgs((x) => [...x, m]);
    setText("");
    setTimeout(() => {
      setMsgs((x) => [
        ...x,
        { from: "op", text: "Got it! I'm checking your STB status now…", t: Date.now() },
      ]);
    }, 900);
  }

  if (!open) return null;
  return (
    <div className="fixed bottom-40 right-4 z-50 w-[min(360px,calc(100vw-2rem))] md:bottom-24">
      <div className="glass-strong overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between gradient-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <div>
              <div className="text-sm font-semibold">Live Support</div>
              <div className="text-[10px] opacity-80">Usually replies in a minute</div>
            </div>
          </div>
          <button onClick={onClose} className="opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto p-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "gradient-primary text-primary-foreground" : "bg-white/5 text-foreground border border-white/10"}`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button
            onClick={send}
            className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
