import RoleBadge from "./RoleBadge";

export default function ParticipantItem({ person, isMe, viewerIsHost, onAssign, onRemove }) {
  const manageable = viewerIsHost && person.role !== "host";
  return (
    <div className="person">
      <div className="person-row">
        <span className="who">
          <span className="avatar">{person.username[0].toUpperCase()}</span>
          <span>{person.username} {isMe && <span className="you">(you)</span>}</span>
        </span>
        <RoleBadge role={person.role} />
      </div>
      {manageable && (
        <div className="person-actions">
          <select value={person.role} onChange={(e) => onAssign(person.userId, e.target.value)}>
            <option value="participant">participant</option>
            <option value="moderator">moderator</option>
          </select>
          <button className="btn sm" onClick={() => onAssign(person.userId, "host")}>Make host</button>
          <button className="btn sm danger" onClick={() => onRemove(person.userId)}>Remove</button>
        </div>
      )}
    </div>
  );
}
