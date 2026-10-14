# Unison - watch YouTube together, in sync

Live URL: _(https://unison-youtube-wacth-party-system.vercel.app)_

## Project structure
```
unison-app/
├── package.json        root scripts (build/start for deployment)
├── backend/            Node.js + Express + Socket.IO
│   ├── server.js       HTTP API + WebSocket event handlers
│   └── Room.js         Room class: participants, roles, video state, requests
└── frontend/           React + Vite
    └── src/
        ├── App.jsx     state + socket listeners
        ├── lib/        socket connection, YouTube helpers
        └── components/ Lobby, RoomHeader, VideoPlayer, ChangeVideoBar,
                        ParticipantList/Item, RoleBadge, RolePermissions,
                        RequestPanel (participant), RequestQueue (host/mod)
```

## Run locally (two terminals)

cd backend && npm install && npm run dev      # http://localhost:3000
cd frontend && npm install && npm run dev     # http://localhost:5173
```
Open http://localhost:5173 in two browsers (normal + incognito).

### Core
- **Real-time synchronization** of play/pause, seek position and current video for everyone in the room
- **Room-based model**: create a room, get a unique 6-character code, join via code or link
- **YouTube integration** using the YouTube IFrame Player API
- **WebSockets (Socket.IO)** for bidirectional real-time communication
- **Role-based access control**: Host, Moderator, Participant
- **Participant list** showing every user with their role
- **Host controls**: assign roles, remove participants
- **Permission enforcement on the backend**: unauthorized events are rejected server-side
- **Approval flow**: a Participant can request a change, and the Host or a Moderator approves or rejects it

### Bonus
- Real-time text chat
- OOP-structured WebSocket server (`Room`, `Participant`, `MessageHandler` classes)
- Persistent room records in a database
- [Transfer host: keep this line only if implemented]

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Realtime | Socket.IO (WebSockets) |
| Database | [SQLite / PostgreSQL / Supabase: write the one you used] |
| Video | YouTube IFrame Player API |
| Hosting | Vercel (frontend), Render (backend) |

## Roles and Permissions

| Action | Host | Moderator | Participant |
|--------|:----:|:---------:|:-----------:|
| Play / Pause | Yes | Yes | No (can request) |
| Seek | Yes | Yes | No (can request) |
| Change video | Yes | Yes | No (can request) |
| Approve / reject requests | Yes | Yes | No |
| Assign roles | Yes | No | No |
| Remove participants | Yes | No | No |
| Chat | Yes | Yes | Yes |

- The room creator automatically becomes the **Host**.
- Everyone who joins becomes a **Participant** by default.
- The Host can promote a Participant to **Moderator** (or demote back).

## Architecture Overview

```
 React Client (Vercel)                     Node/Express + Socket.IO (Render)
 +---------------------+   HTTP POST       +--------------------------------+
 | Create / Join UI    | ----------------> | POST /api/rooms -> new Room    |
 |                     |  /api/rooms       |                                |
 | YouTube IFrame      |                   | rooms: Map<roomId, Room>       |
 | Player              |   WebSocket       |                                |
 | Participants, Chat  | <===============> | MessageHandler (1 per socket)  |
 +---------------------+   Socket.IO       |   - validates role             |
                                           |   - updates Room state         |
                                           |   - broadcasts to the room     |
                                           +---------------+----------------+
                                                           |
                                                      Database
                                                  (room metadata)
```

### Flow
1. **Create room:** the client calls `POST /api/rooms`. The server creates a `Room` with a unique code, stores it in an in-memory `Map`, saves the room record in the database and returns `roomId`.
2. **Join room:** the client connects over Socket.IO and emits `join_room { roomId, username }`. The first user becomes Host, everyone else becomes Participant. The server adds the user to the Socket.IO room and broadcasts `user_joined` with the full participant list. The new user receives the current `sync_state`.
3. **Playback events:** when someone presses play, pause, seek or change video, the client emits the event. `MessageHandler` checks the sender's role. If the role is Host or Moderator, the server updates `Room.state` and broadcasts to everyone. Otherwise the event is rejected.
4. **Participant requests:** a Participant's attempt turns into a request sent to the Host and Moderators. They approve or reject it with `resolve_request`. On approval the server applies the change and broadcasts it.
5. **Role management:** the Host emits `assign_role` or `remove_participant`. The server validates that the sender is the Host, applies the change and broadcasts `role_assigned` or `participant_removed`, so every UI updates its controls.
6. **Leave or disconnect:** the server removes the participant, broadcasts `user_left`, and handles host reassignment if needed.

### Why WebSockets
HTTP is request-response, so the server cannot push updates by itself. WebSockets keep one persistent two-way connection per client, so when the Host pauses, the server pushes the event to every participant instantly. There is no polling and latency is low. Socket.IO adds rooms, automatic reconnection and a polling fallback.

### OOP Structure (backend)

| Class / Module | Responsibility |
|----------------|----------------|
| `Room` | Holds participants and playback state (`playState`, `currentTime`, `videoId`), plus broadcast helpers |
| `Participant` | Holds user id, username and role |
| `MessageHandler` | One instance per socket. Registers all event listeners, validates permissions, calls into `Room` |
| `db.js` | Persistence layer for room records |
| `server.js` | Express app, REST endpoint, Socket.IO setup |

### Role Enforcement
All permission checks live in `MessageHandler` on the **backend**. Disabling buttons in the UI is only a convenience. Even if someone bypasses the frontend and emits `change_video` manually, the server rejects it unless their role allows it.

## WebSocket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_room` | Client to Server | `{ roomId, username }` | Join a room, role assigned by server |
| `leave_room` | Client to Server | `{ roomId }` | Leave the room |
| `play` | Client to Server | `{}` | Host/Moderator only |
| `pause` | Client to Server | `{}` | Host/Moderator only |
| `seek` | Client to Server | `{ time }` | Host/Moderator only |
| `change_video` | Client to Server | `{ videoId }` | Host/Moderator only |
| `assign_role` | Client to Server | `{ userId, role }` | Host only |
| `remove_participant` | Client to Server | `{ userId }` | Host only |
| `resolve_request` | Client to Server | `{ requestId, approve }` | Host/Moderator approves or rejects a request |
| `send_message` | Client to Server | `{ text }` | Chat message |
| `sync_state` | Server to Clients | `{ playState, currentTime, videoId }` | Current video state |
| `user_joined` | Server to Clients | `{ username, userId, role, participants }` | New participant joined |
| `user_left` | Server to Clients | `{ username, userId, participants }` | Participant left |
| `role_assigned` | Server to Clients | `{ userId, username, role, participants }` | Role updated |
| `participant_removed` | Server to Clients | `{ userId, participants }` | Participant removed by host |

## Project Structure

```
unison-app/
├── backend/
│   ├── server.js            # Express + Socket.IO entry point
│   ├── Room.js              # Room class (state + broadcast)
│   ├── Participant.js       # Participant class
│   ├── MessageHandler.js    # Event handling + permission checks
│   ├── db.js                # Database layer
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/      # ParticipantList, ChatPanel, RequestPanel, RolePermissions, ...
│   │   └── lib/
│   │       ├── socket.js    # Socket.IO client
│   │       └── youtube.js   # YouTube IFrame helpers
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Clone
```bash
git clone https://github.com/preeti-jha3/Unison-Youtube-wacth-party-system-.git
cd Unison-Youtube-wacth-party-system-
```

### 2. Backend
```bash
cd backend
npm install
npm start
```
The server runs on `http://localhost:3000`.

### 3. Frontend
Create `frontend/.env`:
```
VITE_SERVER_URL=http://localhost:3000
```
Then:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

### 4. Try it
Open two browser windows (one normal, one incognito). Create a room in the first and join with the room code in the second.

## Environment Variables

**Backend**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (Render sets this automatically; defaults to 3000) |
| [Add any DB variables you use] | |

**Frontend**

| Variable | Description |
|----------|-------------|
| `VITE_SERVER_URL` | Public URL of the backend (no trailing slash) |

> Vite bakes `VITE_*` variables in at **build time**, so the frontend must be redeployed after changing them.

## Deployment

### Backend on Render
- Service type: Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node server.js`
- The server listens on `process.env.PORT`

### Frontend on Vercel
- Framework preset: Vite
- Root directory: `frontend`
- Environment variable: `VITE_SERVER_URL=https://unison-backend-xl1r.onrender.com`

### Deployment notes
- The frontend and backend are on different origins, so the backend enables CORS for both the REST route and Socket.IO.
- Socket.IO runs on a long-lived Node server (Render). Vercel serverless functions do not support persistent WebSocket connections, which is why the backend is hosted separately.
- All frontend API calls use `VITE_SERVER_URL` as the base URL, because relative URLs would hit Vercel instead of the backend.

## Issues Faced and Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| "Could not create room" in production | Frontend called its own domain (Vercel) instead of the backend because `VITE_SERVER_URL` was not set | Set the variable on Vercel and redeploy |
| Browser blocked the create-room request | CORS was configured only for Socket.IO, not the Express route | Added the `cors` middleware to Express |
| Server crashed on Render | Backend tried to serve `frontend/dist`, which does not exist on the backend service | Removed static serving from the backend |
| Slow first request | Render free tier sleeps when idle | Documented it, and use `/health` to wake the server |
| Server crash on DB failure | Unhandled promise rejection in the create-room route | Added try/catch so room creation still works and the error is logged |

## Limitations and Future Work

- Active rooms live in server memory, so a backend restart clears them. Only room metadata is stored in the database.
- On Render's free tier, an Supabase file would not persist across restarts. Use a hosted database for durable storage.
- CORS currently allows all origins. For production hardening, restrict it to the Vercel domain.
- Scaling horizontally would need the Socket.IO Redis adapter (Redis Pub/Sub) so broadcasts reach clients on other server instances.
- Authentication (login before joining) is not implemented.


## Author

Preeti Jha
GitHub: https://github.com/preeti-jha3



