// Emojis that float up over the video when anyone reacts
export default function ReactionLayer({ items }) {
  return (
    <div className="floatlayer">
      {items.map((r) => (
        <div key={r.id} className="floaty" style={{ left: `${r.left}%` }}>
          <span>{r.emoji}</span><small>{r.username}</small>
        </div>
      ))}
    </div>
  );
}