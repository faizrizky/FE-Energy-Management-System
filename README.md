# EMS Frontend

Frontend web app untuk **EMS (Energy/Environment Management System)** — mengelola gedung, ruangan, gateway IoT, device, jadwal (schedule), alarm, laporan (report), serta user & role. Dibangun dengan Next.js App Router.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + `tailwindcss-animate`, komponen berbasis [shadcn/ui](https://ui.shadcn.com) (lihat `components.json`)
- **UI Primitives**: Radix UI (dialog, dropdown, select, tabs, switch, checkbox, avatar)
- **Forms & Validasi**: React Hook Form + Zod (`@hookform/resolvers`)
- **Data client**: `axios` (browser) dan `fetch` (server), lihat bagian [Data Fetching](#data-fetching--auth)
- **Realtime**: `socket.io-client`
- **Charts**: Recharts
- **Animasi**: `motion` (Framer Motion)
- **Icons**: `lucide-react`

## Prasyarat

- Node.js (versi yang kompatibel dengan Next.js 15 / React 18, disarankan Node 18.18+ atau 20+)
- Backend API EMS yang berjalan terpisah (default `http://localhost:3000/api`) dan server socket (default `http://localhost:4000`)

## Menjalankan Proyek

```bash
npm install
cp .env.example .env   # lalu isi sesuai kebutuhan
npm run dev             # http://localhost:3000 (atau port lain jika 3000 dipakai backend)
```

Script lain:

```bash
npm run build   # production build
npm run start   # jalankan hasil build
npm run lint    # eslint
```

### Environment Variables

Didefinisikan di `.env.example`:

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL REST API backend (mis. `http://localhost:3000/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL server Socket.IO untuk realtime update |
| `DEV_API_TOKEN` | Token bearer untuk development di server-side (`lib/http.ts` fallback saat tidak ada cookie session) — didapat lewat login manual via curl ke `/api/auth/login` |
| `NEXT_PUBLIC_DEV_API_TOKEN` | Token yang sama, untuk keperluan client-side saat dev |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site key Cloudflare Turnstile untuk widget captcha di halaman login |

## Struktur Proyek

```
app/
  (protected)/        # Halaman yang butuh login (lihat middleware.ts)
    dashboard/         schedule/        rooms/
    gateway/            device/          user/
    role/               report/          alarm/
    layout.tsx          # Shell (sidebar, header) untuk semua halaman protected
  api/auth/refresh/     # Route handler BFF untuk refresh token (dipanggil axios interceptor)
  login/                 # Halaman login (public)
  maintenance/            unauthorized/
  layout.tsx, page.tsx, error.tsx, not-found.tsx

feat/                  # "Feature modules" per domain — API client, DTO, schema validasi
  <domain>/
    api.ts             # Fungsi fetch server-side (pakai lib/http.ts, mendukung Next cache/revalidate)
    api.client.ts       # Fungsi fetch client-side (pakai lib/axios.ts)
    dto.ts              # Tipe/interface response API
    schema.ts           # Skema Zod untuk form (create/edit)

column/                # Definisi kolom tabel (per domain) dipakai oleh components/ui/table.tsx
components/
  ui/                  # Primitif UI generik (button, modal, table, calendar, dst — gaya shadcn/ui)
  shared/              # Komponen komposit spesifik app (sidebar, header, app-shell, dst)
hooks/                 # Custom hooks (mis. realtime event/refresh via socket)
lib/                   # Util inti: auth, http client, axios instance, socket, toast store
middleware.ts          # Proteksi route + auto-refresh token di edge middleware
```

### Pola Modul Fitur (`feat/<domain>`)

Setiap domain (device, gateway, rooms, schedule, role, user, report, alarm, dashboard, auth) punya struktur konsisten:

- `dto.ts` — bentuk data dari API (response types)
- `schema.ts` — validasi form dengan Zod, dipakai bareng React Hook Form di halaman/modal terkait
- `api.ts` — pemanggilan API di **Server Component** (via `lib/http.ts`, mendukung `next.revalidate`)
- `api.client.ts` — pemanggilan API di **Client Component** (via `lib/axios.ts` / instance `api`)

Halaman di `app/(protected)/<domain>/` biasanya terdiri dari `page.tsx` (server, fetch data awal), `client.tsx` (interaktivitas: tabel, pagination, search), `loading.tsx`, dan folder `_partials/` berisi modal create/edit/detail.

## Data Fetching & Auth

Ada dua jalur HTTP client karena Next.js App Router memisahkan server & client component:

1. **Server-side** — `lib/http.ts`: `fetch` ke `NEXT_PUBLIC_API_BASE_URL`, ambil access token dari cookie (`lib/auth.ts`), fallback ke `DEV_API_TOKEN` saat development.
2. **Client-side** — `lib/axios.ts`: instance axios dengan interceptor:
   - Menyisipkan token dari cookie `ems_token` ke header `Authorization`
   - Auto-unwrap `{ data: ... }` dari response backend
   - Pada `401`, mencoba refresh sesi via `POST /api/auth/refresh` (route handler Next, lihat `app/api/auth/refresh/route.ts`) lalu retry request; jika refresh gagal, redirect ke `/login`
   - Pada `429` (rate limit), menampilkan toast dan tidak memaksa logout

**Auth flow ringkas**:
- Login di `app/login` → set cookie `ems_token` (access, non-httpOnly) & `ems_refresh_token` (refresh, httpOnly) — lihat `lib/auth.ts` / `lib/auth-shared.ts`
- `middleware.ts` melindungi prefix: `/dashboard`, `/rooms`, `/schedule`, `/gateway`, `/device`, `/user`, `/role`, `/report`, `/alarm` — cek expiry token, auto-refresh jika hampir kedaluwarsa (margin 60 detik), redirect ke `/login` jika refresh token tidak valid
- Role user: `Administrator`, `PJ Gedung`, `Komandan` — permission per modul/aksi dikelola lewat `feat/role` (lihat `permissionLabels.ts` untuk mapping label modul & aksi seperti `view`, `create`, `edit`, `delete`, `power_control`, `export`, `ack`)

## Realtime

`lib/socket.ts` membuat singleton koneksi Socket.IO (autentikasi via token dari cookie). Hook `hooks/use-realtime-event.ts` dan `hooks/use-realtime-refresh.ts` dipakai di halaman untuk subscribe event dan me-refresh data tabel/dashboard secara otomatis saat ada perubahan dari server (mis. status device/gateway berubah, alarm baru).

## Navigasi & Modul

Sidebar (`components/shared/sidebar.tsx`) dikelompokkan menjadi:
- **Platform management**: Dashboard, Schedule, Rooms
- **Installation management**: Gateway, Device
- (Nonaktif/sedang tidak ditampilkan di sidebar): User management (User, Role), Report management (Report)

## Konvensi

- Import pakai alias `@/*` mengarah ke root proyek (lihat `tsconfig.json`)
- Komponen UI dasar mengikuti pola shadcn/ui (`components.json`), styling via `class-variance-authority` + `tailwind-merge`
- Husky terpasang untuk git hooks (`.husky/`); Prettier dikonfigurasi via `.prettierrc.json`
