require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");
const Room = require("./Room");
const MessageHandler = require("./MessageHandler");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map();
const makeCode = () => {
  let c;
  do c = Math.random().toString(36).slice(2, 8).toUpperCase();
  while (rooms.has(c));
  return c;
};

app.get("/", (req, res) => res.send("Unison backend is running"));
app.get("/health", (req, res) => res.json({ ok: true }));

// Create room = API call; the creator then sends join_room and becomes Host
app.post("/api/rooms", async (req, res) => {
  try {
    const room = new Room(makeCode());
    rooms.set(room.id, room);
    try {
      await db.createRoom(room.id, room.state.videoId);
    } catch (e) {
      console.error("DB createRoom failed (continuing without DB):", e.message);
    }
    res.json({ roomId: room.id });
  } catch (err) {
    console.error("create room failed:", err);
    res.status(500).json({ error: "Could not create room" });
  }
});

// Every WebSocket connection gets its own MessageHandler
io.on("connection", (socket) => new MessageHandler(io, socket, rooms).register());

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on " + PORT));