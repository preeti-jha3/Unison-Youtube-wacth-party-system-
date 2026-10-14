import { useState } from "react";
import RoleBadge from "./RoleBadge";

export default function RoomHeader({ roomId, role, onLeave }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${location.origin}/?room=${roomId}`);
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
