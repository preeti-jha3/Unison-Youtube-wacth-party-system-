# Unison - watch YouTube together, in sync

**Live URL:** _(add your Render URL here)_

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
```bash
cd backend && npm install && npm run dev      # http://localhost:3000
cd frontend && npm install && npm run dev     # http://localhost:5173
```
Open http://localhost:5173 in two browsers (normal + incognito).

## Deploy (Render, one Web Service)
Build command: `npm run build` | Start command: `npm start`
Express serves the built frontend and Socket.IO on the same URL; Render provides `PORT`.

## Roles
- **Host** (room creator): play/pause, seek, change video, assign roles, remove participants, transfer host, approve requests.
- **Moderator**: play/pause, seek, change video, approve requests.
- **Participant**: watch only; can *request* a change (play, pause, seek, change video) which a Host/Moderator approves or rejects.

## WebSocket events
Client -> Server: `join_room`, `leave_room`, `play`, `pause`, `seek`, `change_video`, `assign_role`, `remove_participant`, plus `request_change`, `resolve_request` (approval flow).
Server -> Clients: `sync_state`, `user_joined`, `user_left`, `role_assigned`, `participant_removed`, plus `requests_updated` (to Host/Mods), `request_resolved` (to the requester).

## Architecture
1. A client sends an event over Socket.IO.
2. The server checks the sender's role in the `Room` class. Not allowed -> ignored.
3. Allowed -> the room state (source of truth) is updated and `sync_state` is broadcast to everyone.
4. Clients apply `sync_state` to their YouTube IFrame player; an `ignore` flag prevents echo loops.
5. Participants' requests are stored in the room, shown only to Host/Mods, and applied only on approval.
6. Late joiners get `sync_state` right after `join_room`; playing time is computed as `time + (now - lastUpdate)`.
