import { useEffect, useState } from "react";
import { socket } from "./lib/socket";
import Lobby from "./components/Lobby";
import RoomHeader from "./components/RoomHeader";
import VideoPlayer from "./components/VideoPlayer";
import ChangeVideoBar from "./components/ChangeVideoBar";
import ParticipantList from "./components/ParticipantList";
import RolePermissions from "./components/RolePermissions";
import RequestPanel from "./components/RequestPanel";
import RequestQueue from "./components/RequestQueue";
import ChatPanel from "./components/ChatPanel";
import ReactionBar from "./components/ReactionBar";
import ReactionLayer from "./components/ReactionLayer";

export default function App() {
  const [roomId, setRoomId] = useState(null);
  const [people, setPeople] = useState([]);
  const [videoState, setVideoState] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState([]);
  const [floaties, setFloaties] = useState([]);
  const [error, setError] = useState("");

  const role = people.find((p) => p.userId === socket.id)?.role || "participant";
  const canControl = role === "host" || role === "moderator";

  const reset = () => { setRoomId(null); setPeople([]); setVideoState(null); setRequests([]); setNotice(""); setMessages([]); setFloaties([]); };

  const join = (code, name) => {
    if (!name.trim()) return setError("Enter your name first");
    socket.emit("join_room", { roomId: code, username: name.trim() }, (res) => {
      if (res.error) return setError(res.error);
      setError("");
      setRoomId(res.roomId);
    });
  };

  // Create = ask the server for a new room code, then join it (first joiner becomes Host)
  const create = async (name) => {
    if (!name.trim()) return setError("Enter your name first");
    try {
      const base = import.meta.env.VITE_SERVER_URL || "";
      const { roomId } = await (await fetch(`${base}/api/rooms`, { method: "POST" })).json();
      join(roomId, name);
    } catch (e) {
      setError("Could not create room. Server may be waking up, try again in a few seconds.");
    }
  };

  useEffect(() => {
    const setList = (d) => setPeople(d.participants);
    const onRemoved = (d) => (d.userId === socket.id ? reset() : setPeople(d.participants));
    const onResolved = (d) => setNotice(`Your request to ${d.label} was ${d.approved ? "approved" : "rejected"}`);
    const lists = ["user_joined", "user_left", "role_assigned"];
    lists.forEach((e) => socket.on(e, setList));
    socket.on("participant_removed", onRemoved);
    socket.on("sync_state", setVideoState);
    socket.on("requests_updated", (d) => setRequests(d.requests));
    socket.on("request_resolved", onResolved);
    socket.on("chat_history", (d) => setMessages(d.messages));
    socket.on("chat_message", (m) => setMessages((prev) => [...prev, m]));
    socket.on("reaction", (d) => {
      const id = Math.random();
      setFloaties((prev) => [...prev, { ...d, id, left: 8 + Math.random() * 75 }]);
      setTimeout(() => setFloaties((prev) => prev.filter((x) => x.id !== id)), 3000);
    });
    return () => {
      lists.forEach((e) => socket.off(e, setList));
      ["participant_removed", "sync_state", "requests_updated", "request_resolved", "chat_history", "chat_message", "reaction"].forEach((e) => socket.off(e));
    };
  }, []);

  if (!roomId) return <Lobby error={error} onCreate={create} onJoin={join} />;

  return (
    <>
      <RoomHeader roomId={roomId} role={role} onLeave={() => { socket.emit("leave_room"); reset(); }} />
      <div className="layout">
        <section>
          <div className="stagewrap">
            {videoState && <VideoPlayer state={videoState} canControl={canControl} />}
            <ReactionLayer items={floaties} />
          </div>
          <ReactionBar onReact={(emoji) => socket.emit("send_reaction", { emoji })} />
          {canControl
            ? <ChangeVideoBar onChange={(videoId) => socket.emit("change_video", { videoId })} />
            : <RequestPanel notice={notice} onRequest={(type, payload) => {
                socket.emit("request_change", { type, payload });
                setNotice("Request sent. Waiting for the host or a moderator...");
              }} />}
        </section>
        <div className="sidebar">
          <ParticipantList people={people} meId={socket.id} viewerIsHost={role === "host"}
            onAssign={(userId, r) => socket.emit("assign_role", { userId, role: r })}
            onRemove={(userId) => socket.emit("remove_participant", { userId })} />
          {canControl && <RequestQueue requests={requests}
            onResolve={(requestId, approve) => socket.emit("resolve_request", { requestId, approve })} />}
          <ChatPanel messages={messages} meId={socket.id} onSend={(text) => socket.emit("send_message", { text })} />
          <RolePermissions role={role} />
        </div>
      </div>
    </>
  );
}