// One person in a room: identity + role + what that role may do.
class Participant {
  constructor(id, username, role) {
    this.id = id;
    this.username = username;
    this.role = role;
  }
  get canControl() { return this.role === "host" || this.role === "moderator"; }
  get isHost() { return this.role === "host"; }
  toJSON() { return { userId: this.id, username: this.username, role: this.role }; }
}

module.exports = Participant;