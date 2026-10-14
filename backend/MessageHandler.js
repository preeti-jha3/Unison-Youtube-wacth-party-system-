// One MessageHandler per socket connection: validates and handles every event.
const Room = require("./Room");
const db = require("./db");
const EMOJIS = ["👍", "😂", "😮", "❤️", "🔥"];

class MessageHandler {
  constructor(io, socket, rooms) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
  }

  // ---- helpers ----
  get room() {
    const r = this.rooms.get(this.socket.data.roomId);
    return r && r.has(this.socket.id) ? r : null;
  }
  get hostRoom() { const r = this.room; return r && r.isHost(this.socket.id) ? r : null; }
  get controlRoom() { const r = this.room; return r && r.can(this.socket.id) ? r : null; }
  sync(r) { this.io.to(r.id).emit("sync_state", r.snapshot()); }
  pushRequests(r) {
    r.controllers().forEach((id) => this.io.to(id).emit("requests_updated", { requests: r.requests }));
  }

  register() {
    const s = this.socket;
    s.on("join_room", (d, cb) => this.joinRoom(d, cb));
    ["play", "pause", "seek", "change_video"].forEach((t) => s.on(t, (p) => this.control(t, p)));
    s.on("request_change", (d) => this.requestChange(d));
    s.on("resolve_request", (d) => this.resolveRequest(d));
    s.on("assign_role", (d) => this.assignRole(d));
    s.on("remove_participant", (d) => this.removeParticipant(d));
    s.on("send_message", (d) => this.sendMessage(d));
    s.on("send_reaction", (d) => this.sendReaction(d));
    s.on("leave_room", () => this.leave());
    s.on("disconnect", () => this.leave());
  }

  // ---- room ----
  // Server restart ke baad room memory se gayab ho jaata hai; DB se wapas banao
  async restoreRoom(id) {
    const row = await db.loadRoom(id);
    if (!row) return null;
    if (this.rooms.has(id)) return this.rooms.get(id); // kisi aur ne pehle restore kar liya
    const room = new Room(id);
    room.state = {
      videoId: row.video_id || room.state.videoId,
      playState: "paused",
      time: row.video_time || 0,
      at: Date.now(),
    };
    const msgs = await db.loadMessages(id);
    room.messages = msgs.map((m) => ({
      id: m.id,
      userId: null,
      username: m.username,
      text: m.text,
      time: new Date(m.created_at).getTime(),
    }));
    room.nextMessageId = msgs.length ? msgs[msgs.length - 1].id + 1 : 1;
    this.rooms.set(id, room);
    return room;
  }

  async joinRoom({ roomId, username } = {}, cb) {
    const reply = (d) => typeof cb === "function" && cb(d);
    const id = String(roomId || "").toUpperCase();
    const r = this.rooms.get(id) || (await this.restoreRoom(id));
    if (!r) return reply({ error: "Room not found" });
    const name = String(username || "").trim().slice(0, 30);
    if (!name) return reply({ error: "Name required" });
    if (r.has(this.socket.id)) return reply({ roomId: r.id });
    const role = r.add(this.socket.id, name);
    if (role === "host") db.setHost(r.id, name);
    this.socket.data.roomId = r.id;
    this.socket.join(r.id);
    reply({ roomId: r.id });
    this.socket.emit("sync_state", r.snapshot());
    this.socket.emit("chat_history", { messages: r.messages });
    this.io.to(r.id).emit("user_joined", { username: name, userId: this.socket.id, role, participants: r.list() });
    this.pushRequests(r);
  }

  leave() {
    const r = this.room;
    if (!r) return;
    const username = r.participants.get(this.socket.id).username;
    r.remove(this.socket.id);
    this.socket.leave(r.id);
    if (r.participants.size === 0) return this.rooms.delete(r.id);
    this.io.to(r.id).emit("user_left", { username, userId: this.socket.id, participants: r.list() });
    this.pushRequests(r);
  }

  // ---- playback: Host/Moderator only ----
  control(type, payload = {}) {
    const r = this.controlRoom;
    if (!r || !Room.describe(type, payload)) return;
    r.apply(type, payload);
    db.saveState(r.id, r.snapshot());
    this.sync(r);
  }

  // ---- approval flow ----
  requestChange({ type, payload } = {}) {
    const r = this.room;
    if (!r || r.can(this.socket.id)) return;
    const label = Room.describe(type, payload);
    if (!label || r.pendingFrom(this.socket.id) >= 3) return;
    r.addRequest(this.socket.id, type, payload, label);
    this.pushRequests(r);
  }

  resolveRequest({ requestId, approve } = {}) {
    const r = this.controlRoom;
    if (!r) return;
    const req = r.takeRequest(requestId);
    if (!req) return;
    if (approve) {
      r.apply(req.type, req.payload);
      db.saveState(r.id, r.snapshot());
      this.sync(r);
    }
    this.io.to(req.userId).emit("request_resolved", { label: req.label, approved: !!approve });
    this.pushRequests(r);
  }

  // ---- Host only ----
  assignRole({ userId, role } = {}) {
    const r = this.hostRoom;
    if (!r || !["host", "moderator", "participant"].includes(role)) return;
    if (!r.has(userId) || userId === this.socket.id) return;
    if (role === "host") r.participants.get(this.socket.id).role = "moderator"; // transfer host
    r.participants.get(userId).role = role;
    this.io.to(r.id).emit("role_assigned", {
      userId, username: r.participants.get(userId).username, role, participants: r.list(),
    });
    this.pushRequests(r);
  }

  removeParticipant({ userId } = {}) {
    const r = this.hostRoom;
    if (!r || !r.has(userId) || userId === this.socket.id) return;
    r.remove(userId);
    this.io.to(r.id).emit("participant_removed", { userId, participants: r.list() });
    this.io.sockets.sockets.get(userId)?.leave(r.id);
    this.pushRequests(r);
  }

  // ---- chat & reactions: everyone in the room ----
  sendMessage({ text } = {}) {
    const r = this.room;
    const t = String(text || "").trim().slice(0, 300);
    if (!r || !t) return;
    const m = r.addMessage(this.socket.id, t);
    db.saveMessage(r.id, m.username, m.text);
    this.io.to(r.id).emit("chat_message", m);
  }

  sendReaction({ emoji } = {}) {
    const r = this.room;
    if (!r || !EMOJIS.includes(emoji)) return;
    this.io.to(r.id).emit("reaction", {
      userId: this.socket.id,
      username: r.participants.get(this.socket.id).username,
      emoji,
    });
  }
}

module.exports = MessageHandler;