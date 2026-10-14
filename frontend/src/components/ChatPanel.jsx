import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages, meId, onSend }) {
  const [text, setText] = useState("");
  const box = useRef(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [messages]);

  const send = () => { if (text.trim()) { onSend(text); setText(""); } };
  return (
    <aside className="panel chat">
      <h3>Chat</h3>
      <div className="msgs" ref={box}>
        {messages.length === 0 && <p className="muted">No messages yet</p>}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.userId === meId ? "me" : ""}`}><b>{m.username}</b>{m.text}</div>
        ))}
      </div>
      <div className="chatrow">
        <input value={text} maxLength={300} placeholder="Say something..." onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn sm" onClick={send}>Send</button>
      </div>
    </aside>
  );
}