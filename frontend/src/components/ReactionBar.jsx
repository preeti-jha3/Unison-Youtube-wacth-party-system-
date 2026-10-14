const EMOJIS = ["👍", "😂", "😮", "❤️", "🔥"];

export default function ReactionBar({ onReact }) {
  return (
    <div className="reactbar">
      {EMOJIS.map((e) => <button key={e} onClick={() => onReact(e)}>{e}</button>)}
    </div>
  );
}