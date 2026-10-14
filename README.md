# Unison - watch YouTube together, in sync

Live URL: _(add your Render URL here)_

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




