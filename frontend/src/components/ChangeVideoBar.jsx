import { useState } from "react";
import { parseVideoId } from "../lib/youtube";

export default function ChangeVideoBar({ onChange }) {
  const [url, setUrl] = useState("");
  const [bad, setBad] = useState(false);
  const submit = () => {
    const id = parseVideoId(url);
    setBad(!id);
    if (!id) return;
    onChange(id);
    setUrl("");
  };
  return (
    <div className="changebar">
      <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={bad ? "Invalid YouTube link" : "Paste a YouTube link to change video"} />
      <button className="btn primary" onClick={submit}>Play</button>
    </div>
  );
}
