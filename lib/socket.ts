'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

function readCookieToken() {
  if (typeof document === 'undefined') return undefined;
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('ems_token='))
    ?.split('=')[1];
  return token ? decodeURIComponent(token) : undefined;
}

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,

    auth: (cb) => cb({ token: readCookieToken() }),
    withCredentials: true,
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}
