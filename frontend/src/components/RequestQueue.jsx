// Host/Moderator view: pending participant requests
export default function RequestQueue({ requests, onResolve }) {
  return (
    <aside className="panel">
      <h3>Requests · {requests.length}</h3>
      {requests.length === 0 && <p className="muted">No pending requests</p>}
      {requests.map((r) => (
        <div className="request" key={r.id}>
          <span><b>{r.username}</b> wants to {r.label}</span>
          <div className="person-actions">
            <button className="btn sm primary" onClick={() => onResolve(r.id, true)}>Approve</button>
            <button className="btn sm danger" onClick={() => onResolve(r.id, false)}>Reject</button>
          </div>
        </div>
      ))}
    </aside>
  );
}
