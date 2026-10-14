import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import { loadYT } from "../lib/youtube";

// Owns the YouTube player. `state` = latest sync_state from the server.
export default function VideoPlayer({ state, canControl }) {
  const player = useRef(null);
  const ignore = useRef(false);   // true while applying a remote update (prevents echo)
  const latest = useRef(state);
  const lastT = useRef(0);
  const playing = useRef(false);
  const canRef = useRef(canControl);
  canRef.current = canControl;

  const apply = (s) => {
    const p = player.current;
    if (!p || typeof p.loadVideoById !== "function") return;
    ignore.current = true;
    if (p.getVideoData?.().video_id !== s.videoId) p.loadVideoById(s.videoId, s.currentTime);
    else if (Math.abs(p.getCurrentTime() - s.currentTime) > 1.5) p.seekTo(s.currentTime, true);
    s.playState === "playing" ? p.playVideo() : p.pauseVideo();
    playing.current = s.playState === "playing";
    lastT.current = s.currentTime;
    setTimeout(() => (ignore.current = false), 1500);
  };

  useEffect(() => { latest.current = state; apply(state); }, [state]);

  useEffect(() => {
    loadYT().then(() => {
      player.current = new window.YT.Player("yt", {
        width: "100%", height: "100%", videoId: latest.current.videoId,
        playerVars: { rel: 0 },
        events: {
          onReady: () => apply(latest.current),
          onStateChange: (e) => {
            if (ignore.current || !canRef.current) return;
            if (e.data === 1) { playing.current = true; socket.emit("play", {}); }
            if (e.data === 2) { playing.current = false; socket.emit("pause", {}); }
          },
        },
      });
    });
    // YouTube has no "seeked" event, so detect jumps by polling once a second
    const tick = setInterval(() => {
      const p = player.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const t = p.getCurrentTime();
      const expected = lastT.current + (playing.current ? 1 : 0);
      if (!ignore.current && canRef.current && Math.abs(t - expected) > 1.5) socket.emit("seek", { time: t });
      lastT.current = t;
    }, 1000);
    return () => { clearInterval(tick); player.current?.destroy?.(); player.current = null; };
  }, []);

  return (
    <div className="stage">
      <div id="yt" />
      {!canControl && <div className="lock" />}
    </div>
  );
}
