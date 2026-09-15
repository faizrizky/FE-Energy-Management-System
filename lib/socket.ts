'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Baca cookie ems_token buat token handshake socket.
 *
 * Dipake di: getSocket (file ini).
 */
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

/**
 * Bikin instance socket.io sekali aja (singleton), token diambil dari cookie
 * tiap nyambung, belom langsung connect.
 *
 * Dipake di: connectSocket (file ini).
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,

    auth: (cb) => cb({ token: readCookieToken() }),
    withCredentials: true,
  });

  return socket;
}

/**
 * Ambil socket terus connect kalo belom nyambung.
 *
 * Dipake di: device/client.tsx, gateway/client.tsx, hooks use-realtime-event,
 *   use-realtime-refresh, use-resync-on-restore.
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/**
 * Mutusin koneksi socket.
 *
 * Dipake di: components/shared/sidebar.tsx (tombol Log out).
 */
export function disconnectSocket() {
  socket?.disconnect();
}
