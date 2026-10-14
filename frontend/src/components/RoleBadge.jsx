export default function RoleBadge({ role }) {
  return <span className={`badge badge-${role}`}>{role}</span>;
}
