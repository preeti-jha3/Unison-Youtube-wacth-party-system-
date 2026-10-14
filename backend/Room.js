// Room: participants, roles, video state, pending requests and chat for ONE room.
const Participant = require("./Participant");
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

class Room {
  constructor(id) {
    this.id = id;
    this.participants = new Map(); // socketId -> Participant
    this.hostAssigned = false;
    this.requests = [];
    this.nextRequestId = 1;
    this.messages = [];            // last 50 chat messages
    this.nextMessageId = 1;
    this.state = { videoId: "aqz-KE-bpKQ", playState: "paused", time: 0, at: Date.now() };
  }

  // ---- participants & roles ----
  add(userId, username) {
    const role = this.hostAssigned ? "participant" : "host"; // creator = first joiner = Host
    this.hostAssigned = true;
    this.participants.set(userId, new Participant(userId, username, role));
    return role;
  }
  has(userId) { return this.participants.has(userId); }
  roleOf(userId) { return this.participants.get(userId)?.role; }
  can(userId) { return !!this.participants.get(userId)?.canControl; }
  isHost(userId) { return !!this.participants.get(userId)?.isHost; }
  controllers() { return [...this.participants.values()].filter((p) => p.canControl).map((p) => p.id); }
  list() { return [...this.participants.values()].map((p) => p.toJSON()); }
  remove(userId) {
    this.participants.delete(userId);
    this.requests = this.requests.filter((r) => r.userId !== userId);
  }

  // ---- video state (server is the source of truth) ----
  snapshot() {
    const s = this.state;
    const currentTime = s.playState === "playing" ? s.time + (Date.now() - s.at) / 1000 : s.time;
    return { videoId: s.videoId, playState: s.playState, currentTime };
  }
  static describe(type, p = {}) {
    if (type === "play") return "play the video";
    if (type === "pause") return "pause the video";
    if (type === "seek" && typeof p.time === "number" && p.time >= 0) return `seek to ${fmt(p.time)}`;
    if (type === "change_video" && /^[\w-]{11}$/.test(p.videoId || "")) return `change video (${p.videoId})`;
    return null;
  }
  apply(type, p = {}) {
    const now = this.snapshot();
    const s = { ...this.state, time: now.currentTime, at: Date.now() };
    if (type === "play") s.playState = "playing";
    if (type === "pause") s.playState = "paused";
    if (type === "seek") s.time = p.time;
    if (type === "change_video") Object.assign(s, { videoId: p.videoId, playState: "playing", time: 0 });
    this.state = s;
  }

  // ---- participant change requests ----
  pendingFrom(userId) { return this.requests.filter((r) => r.userId === userId).length; }
  addRequest(userId, type, payload, label) {
    this.requests.push({ id: this.nextRequestId++, userId, username: this.participants.get(userId).username, type, payload, label });
  }
  takeRequest(id) {
    const i = this.requests.findIndex((r) => r.id === id);
    return i < 0 ? null : this.requests.splice(i, 1)[0];
  }

  // ---- chat ----
  addMessage(userId, text) {
    const m = { id: this.nextMessageId++, userId, username: this.participants.get(userId).username, text, time: Date.now() };
    this.messages.push(m);
    if (this.messages.length > 50) this.messages.shift();
    return m;
  }
}

module.exports = Room;