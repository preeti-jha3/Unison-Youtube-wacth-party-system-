import { io } from "socket.io-client";
// Same origin in production; Vite proxies /socket.io to :3000 in dev
export const socket = io();
