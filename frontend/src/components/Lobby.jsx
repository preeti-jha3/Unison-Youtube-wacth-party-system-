import { useState } from "react";

export default function Lobby({ onCreate, onJoin, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room") || "");
  const [tab, setTab] = useState(code ? "join" : "create");

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
          <label>Room code
            <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onJoin(code, name)} placeholder="ABC123" />
          </label>
          <button className="btn primary" onClick={() => onJoin(code, name)}>Join room</button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
