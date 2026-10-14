import { useState } from "react";
import { parseVideoId } from "../lib/youtube";

// "1:30" or "90" -> seconds
const toSeconds = (v) => {
  const p = v.trim().split(":").map(Number);
  if (!v.trim() || p.some((n) => Number.isNaN(n) || n < 0)) return null;
  return p.length === 2 ? p[0] * 60 + p[1] : p[0];
};

// Participants can't control playback; they send requests for approval.
export default function RequestPanel({ onRequest, notice }) {
  const [url, setUrl] = useState("");
  const [time, setTime] = useState("");
  const [bad, setBad] = useState("");

  const video = () => {
    const videoId = parseVideoId(url);
    if (!videoId) return setBad("Invalid YouTube link");
    setBad(""); setUrl(""); onRequest("change_video", { videoId });
  };
  const seek = () => {
    const t = toSeconds(time);
    if (t === null) return setBad("Use a time like 1:30");
    setBad(""); setTime(""); onRequest("seek", { time: t });
  };

  return (
    <div className="reqpanel">
      <p className="muted">View only. Ask the host or a moderator to make a change:</p>
      <div className="reqrow">
        <button className="btn sm" onClick={() => onRequest("play", {})}>Request play</button>
        <button className="btn sm" onClick={() => onRequest("pause", {})}>Request pause</button>
      </div>
      <div className="reqrow">
        <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Seek to e.g. 1:30" />
        <button className="btn sm" onClick={seek}>Request seek</button>
      </div>
      <div className="reqrow">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Suggest a YouTube link" />
        <button className="btn sm" onClick={video}>Request video</button>
      </div>
      {(bad || notice) && <p className="notice">{bad || notice}</p>}
    </div>
  );
}
