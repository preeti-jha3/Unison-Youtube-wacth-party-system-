const INFO = {
  host: ["Play, pause, seek, change video", "Assign roles, remove people, transfer host", "Approve or reject requests"],
  moderator: ["Play, pause, seek, change video", "Approve or reject requests"],
  participant: ["Watch only", "Request a change; the host or a moderator approves it"],
};

export default function RolePermissions({ role }) {
  return (
    <aside className="panel perm">
      <h3>Your access · {role}</h3>
      <ul>{INFO[role].map((t) => <li key={t}>{t}</li>)}</ul>
    </aside>
  );
}
