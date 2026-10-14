require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// DB fail ho toh bhi app na ruke, bas error log ho
const safe = async (fn) => {
  try { return await fn(); }
  catch (e) { console.error("DB error:", e.message); return null; }
};

module.exports = {
  createRoom: (id, videoId) =>
    safe(() => pool.query("INSERT INTO rooms (id, video_id) VALUES ($1, $2)", [id, videoId])),

  setHost: (id, name) =>
    safe(() => pool.query("UPDATE rooms SET host_name = $2 WHERE id = $1", [id, name])),

  saveState: (id, s) =>
    safe(() => pool.query(
      "UPDATE rooms SET video_id = $2, play_state = $3, video_time = $4 WHERE id = $1",
      [id, s.videoId, s.playState, s.currentTime]
    )),

  loadRoom: async (id) => {
    const res = await safe(() => pool.query("SELECT * FROM rooms WHERE id = $1", [id]));
    return res?.rows[0] || null;
  },

  saveMessage: (roomId, username, text) =>
    safe(() => pool.query(
      "INSERT INTO messages (room_id, username, text) VALUES ($1, $2, $3)",
      [roomId, username, text]
    )),

  loadMessages: async (roomId) => {
    const res = await safe(() => pool.query(
      `SELECT * FROM (SELECT * FROM messages WHERE room_id = $1 ORDER BY id DESC LIMIT 50) m ORDER BY id ASC`,
      [roomId]
    ));
    return res?.rows || [];
  },
};