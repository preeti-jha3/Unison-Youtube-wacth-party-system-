import { useState } from "react";

// Accepts either a plain code (ABC123) or a full link (https://.../?room=ABC123)
function extractCode(value) {
  const v = value.trim();
  try {
    const room = new URL(v).searchParams.get("room");
    if (room) return room.toUpperCase().slice(0, 6);
  } catch {
    // not a URL, treat as plain code
  }
  return v.toUpperCase().slice(0, 6);
}

export default function Lobby({ onCreate, onJoin, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room") || "");
  const [tab, setTab] = useState(code ? "join" : "create");

  const join = () => onJoin(extractCode(code), name);

  return (
    <main className="lobby">
      <h1 className="logo">UNISON</h1>
      <p className="tag">Watch YouTube together. Everyone in sync.</p>
      <label>Your name
        <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha" />
      </label>
      <div className="tabs">
        <button className={`tab ${tab === "create" ? "on" : ""}`} onClick={() => setTab("create")}>Create room</button>
        <button className={`tab ${tab === "join" ? "on" : ""}`} onClick={() => setTab("join")}>Join room</button>
      </div>
      {tab === "create" ? (
        <>
          <p className="muted">You will be the Host with full control. Share the code or link with friends.</p>
          <button className="btn primary" onClick={() => onCreate(name)}>Create room</button>
        </>
      ) : (
        <>
          <label>Room code or link
            <input value={code} onChange={(e) => setCode(extractCode(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && join()} placeholder="ABC123 or paste link" />
          </label>
          <button className="btn primary" onClick={join}>Join room</button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
