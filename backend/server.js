require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const db = require("./db");
const Room = require("./Room");
const MessageHandler = require("./MessageHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map();
const makeCode = () => {
  let c;
  do c = Math.random().toString(36).slice(2, 8).toUpperCase();
  while (rooms.has(c));
  return c;
};

// Create room = API call; the creator then sends join_room and becomes Host
app.post("/api/rooms", async (req, res) => {
  const room = new Room(makeCode());
  rooms.set(room.id, room);
  await db.createRoom(room.id, room.state.videoId);
  res.json({ roomId: room.id });
});

// Every WebSocket connection gets its own MessageHandler
io.on("connection", (socket) => new MessageHandler(io, socket, rooms).register());

const dist = path.join(__dirname, "../frontend/dist");
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, "index.html")));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server on " + PORT));