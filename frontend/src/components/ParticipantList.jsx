import ParticipantItem from "./ParticipantItem";

export default function ParticipantList({ people, meId, viewerIsHost, ...actions }) {
  return (
    <aside className="panel">
      <h3>Participants · {people.length}</h3>
      {people.map((p) => (
        <ParticipantItem key={p.userId} person={p} isMe={p.userId === meId} viewerIsHost={viewerIsHost} {...actions} />
      ))}
    </aside>
  );
}
