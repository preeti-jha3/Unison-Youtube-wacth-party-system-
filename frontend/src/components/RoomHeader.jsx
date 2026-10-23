import { useState } from "react";
import RoleBadge from "./RoleBadge";

export default function RoomHeader({ roomId, role, onLeave }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const link = `${window.location.origin}/?room=${roomId}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
    }
    if (!ok) window.prompt("Copy this link:", link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="header">
      <h1 className="logo">UNISON</h1>
      <div className="header-mid">
        <span className="code">{roomId}</span>
        <button className="btn sm" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
      </div>
      <div className="header-right">
        <RoleBadge role={role} />
        <button className="btn sm danger" onClick={onLeave}>Leave</button>
      </div>
    </header>
  );
}
