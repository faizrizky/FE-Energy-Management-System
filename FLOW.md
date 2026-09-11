# Flow Aplikasi — Dari Hulu ke Hilir

Dokumen ini menjelaskan **alur eksekusi fungsi** secara berurutan, mulai dari request masuk (browser/middleware) sampai data dirender dan disinkronkan kembali lewat realtime. Contoh konkret dipakai dari modul **Device** (`app/(protected)/device`) karena polanya identik untuk semua modul lain (Gateway, Rooms, Schedule, Alarm, Report, User, Role) — perbedaannya hanya nama fungsi/endpoint.

Lihat [README.md](README.md) untuk gambaran umum struktur proyek.

---

## 1. Alur Request — Level Tertinggi

```
Browser request
      │
      ▼
middleware.ts (edge)              ── cek/refresh token, redirect ke /login jika perlu
      │
      ▼
app/(protected)/layout.tsx         ── getSession() → render AppShell atau redirect
      │
      ▼
app/(protected)/<modul>/page.tsx   ── Server Component: fetch data awal (feat/<modul>/api.ts)
      │
      ▼
app/(protected)/<modul>/client.tsx ── Client Component: state, interaksi, realtime
      │
      ├─▶ _partials/modal.tsx      ── form create/edit → feat/<modul>/api.client.ts
      ├─▶ _partials/detail-modal.tsx── fetch detail on-demand
      └─▶ hooks/use-realtime-*.ts  ── socket.io listener → update state / router.refresh()
```

---

## 2. Middleware & Sesi Login (hulu paling awal)

**File**: `middleware.ts`, `lib/auth-shared.ts`, `lib/auth.ts`, `app/api/auth/refresh/route.ts`

Urutan fungsi saat request menyentuh path terproteksi (`/dashboard`, `/rooms`, `/schedule`, `/gateway`, `/device`, `/user`, `/role`, `/report`, `/alarm`):

1. `middleware()` dipanggil Next.js di edge sebelum route di-render.
2. Cek `PROTECTED_PREFIXES` — kalau path tidak termasuk, langsung `NextResponse.next()`.
3. Ambil cookie `ems_token` (access) & `ems_refresh_token` (refresh).
4. `isExpiredOrExpiringSoon(accessToken)` → decode payload JWT manual (`getTokenExpiry`) dan cek apakah sisa waktu ≤ 60 detik (`REFRESH_MARGIN_SECONDS`).
5. Jika token **masih valid** → lanjut ke halaman.
6. Jika **butuh refresh**:
   - Tidak ada refresh token → `redirectToLogin()`.
   - Ada refresh token → panggil `requestTokenRefresh(refreshToken)` (dari `lib/auth-shared.ts`) yang melakukan `fetch POST {API_BASE_URL}/auth/refresh`.
   - Hasilnya salah satu dari 4 status:
     - `ok` → `applySessionCookies()` set ulang cookie access & refresh, request diteruskan dengan token baru.
     - `rate_limited` → set header `x-rate-limited-retry-after`, request tetap diteruskan (user tidak di-kick).
     - `server_error` → set header `x-session-refresh-degraded`, request tetap diteruskan.
     - `invalid` → hapus cookie, `redirectToLogin()`.

Setelah lolos middleware, `app/(protected)/layout.tsx` (Server Component) berjalan:

1. `getSession()` (`lib/auth.ts`) → ambil access token dari cookie, `fetchMe(token)` ke `GET /auth/me`, retry hingga `MAX_ME_ATTEMPTS = 2` kali bila error jaringan/429/5xx.
2. Jika `401/403` → return `null` sesi → layout redirect ke `/login`.
3. Jika sukses → mapping response jadi `SessionUser { id, name, email, role }`.
4. Jika gagal karena rate limit/server error setelah semua percobaan → melempar `RateLimitedError` / `ServerUnavailableError`, ditangkap layout dan menampilkan `ErrorState` (bukan logout paksa — sesi tetap dianggap aktif).
5. Sesi valid → render `<AppShell>{children}</AppShell>` (sidebar, header, konten halaman).

### Proses Login (fungsi per fungsi)

`app/login/client.tsx` (`LoginClient`):

1. User isi form → divalidasi client-side oleh `react-hook-form` + `zodResolver(loginFormSchema)` (`feat/auth/schema.ts`).
2. Submit → `onSubmit(values)` dibungkus `startTransition` → memanggil **Server Action** `loginAction(values, captchaToken)` (`feat/auth/actions.ts`).
3. Di server: `loginAction`
   - Validasi ulang dengan `loginFormSchema.safeParse` (defense-in-depth).
   - `fetch POST {API_BASE_URL}/auth/login` dengan `username`, `password`, `captchaToken` (Cloudflare Turnstile).
   - Jika gagal → return `{ success: false, message, lockedOut }` (423 = akun terkunci).
   - Jika sukses → ambil `accessToken` & `refreshToken` dari response, panggil `setAuthCookies()` untuk menyimpan sebagai cookie (access: `httpOnly:false` supaya bisa dibaca client-side untuk socket/axios; refresh: `httpOnly:true`).
4. Balik ke client: jika `result.success` → `router.replace(redirectTo)` lalu `router.refresh()` (memaksa Server Component re-fetch dengan sesi baru). Jika gagal → `toast.error(...)` dan reset Turnstile widget.

### Logout

`logoutAction()` (`feat/auth/actions.ts`): ambil refresh token, `POST /auth/logout` ke backend (best-effort, error diabaikan), `clearAuthCookies()`, lalu `redirect('/login')`.

---

## 3. Server-Side Read Flow (initial page load)

Contoh: **Devices** — `app/(protected)/device/page.tsx`

1. `DevicePage()` (Server Component, async) dieksekusi di server saat route di-request.
2. `Promise.all([...])` menjalankan paralel:
   - `getSession()` → data user login untuk header.
   - `devicesApi.list()` (`feat/device/api.ts`) → `http<DeviceListResponseDTO>('/devices?...')`.
   - `roomsApi.list()`, `gatewaysApi.list()` → dropdown data untuk form modal.
3. `http()` (`lib/http.ts`) — HTTP client server-side:
   - `getAccessToken()` dari cookie, fallback ke `process.env.DEV_API_TOKEN` (dev only).
   - `fetch(`${BASE_URL}${path}`)` dengan header `Authorization: Bearer <token>`, mendukung opsi Next.js `next: { revalidate: 15 }` (ISR-style caching 15 detik per endpoint).
   - Jika response tidak `ok`: status `401` → lempar error khusus (`status = 401`) yang nantinya bisa memicu re-auth di layer atas; status lain → lempar `Error` dengan pesan dari body.
   - Jika sukses → unwrap `json.data` dan return sebagai `TResponse`.
4. Hasil fetch dikirim sebagai props ke `<DeviceClient initialData={devices} rooms={...} gateways={...} />` — inilah titik transisi dari Server Component ke Client Component (hydration).

---

## 4. Client-Side Interactivity Flow

`app/(protected)/device/client.tsx` (`DeviceClient`, Client Component `'use client'`).

### 4.1 Inisialisasi state

- `useState` menyimpan `data` (hasil awal dari server), `page`, `rowsPerPage`, `search`, `selected` (checkbox), `modalState` (form create/edit), `deleteTarget`, `detailDevice`, dll.
- `useTableSort(data.data, DEVICE_SORT_ACCESSORS)` (`lib/use-table-sort.ts`) — sorting **client-side murni**, tidak fetch ulang: `toggleSort(key)` set `sortKey`/`direction`, `useMemo` menyortir array dengan `localeCompare` (string) atau selisih angka.

### 4.2 Search & Pagination (re-fetch ke server)

1. User ketik di `SearchInput` → `handleSearchChange(value)`:
   - `setSearch(value)`, reset `page` ke 1.
   - Debounce 250 ms (`SEARCH_DEBOUNCE_MS`) via `setTimeout` → panggil `loadDevices(1, rowsPerPage, value)`.
2. `loadDevices()` → `devicesClientApi.list({ page, rowsPerPage, search })` (`feat/device/api.client.ts`) → `api.get('/devices', { params })` (axios instance dari `lib/axios.ts`) → `setData(result)`.
3. Ganti halaman (`Pagination` komponen) → `handlePageChange(nextPage)` → langsung panggil `loadDevices` (tanpa debounce).
4. Ganti rows-per-page → `handleRowsPerPageChange` → reset page ke 1, `loadDevices`.

### 4.3 Toggle Power (aksi cepat per baris)

1. User klik `Switch` di kolom Status (`column/device.tsx` → `columns.status`) → `onCheckedChange` memanggil `onTogglePower(device)` yang di-wire ke `handleTogglePower`.
2. `handleTogglePower(device)`:
   - Hitung `nextState = device.status !== 'on'`.
   - `devicesClientApi.setPower(device.id, nextState)` → `api.post('/devices/{id}/power', { action: 'on' | 'off' })`.
   - Sukses → update state lokal secara optimistic-ish (setelah await, bukan sebelum) via `setData`.
   - Gagal → `toast.error(...)`.

### 4.4 Create / Edit (Modal Form)

1. Klik tombol **Add device** atau ikon **Pencil** di baris tabel → `setModalState({ open: true, device? })`.
2. `DeviceFormModal` (`_partials/modal.tsx`) menerima `device` (undefined = mode create, ada isi = mode edit) → hitung `defaultValues` dari data device (atau default kosong/60 menit).
3. Form aktual ada di `DeviceForm` (`_partials/form.tsx`, tidak ditampilkan di sini tapi dipanggil sebagai child) — pakai `react-hook-form` + `zodResolver(deviceFormSchema)` (`feat/device/schema.ts`) untuk validasi field (nama, EUI, tipe komponen, room, gateway, interval min. 60 menit, dst).
4. Submit form (setelah validasi lolos) → `DeviceForm` memanggil `onSubmit(values)` milik modal → `handleSubmit(values)`:
   - `setSubmitting(true)`.
   - Mode edit → `devicesClientApi.update(device.id, values)` (`PUT /devices/{id}`); mode create → `devicesClientApi.create(values)` (`POST /devices`). Field `tbDeviceId` kosong dinormalisasi jadi `null`.
   - Sukses → panggil `onSuccess(saved)` (callback dari parent `DeviceClient`).
   - `finally` → `setSubmitting(false)`.
5. `onSuccess` di `DeviceClient`:
   - Lengkapi objek `saved` dengan data `room`/`gateway` penuh (dicari dari props `rooms`/`gateways`, karena response API create/update mungkin hanya mengembalikan `roomId`/`gatewayId`) → `enriched`.
   - `setData` — kalau device sudah ada di list (edit) → `map` replace; kalau baru (create) → unshift ke depan array + (implisit) rowsPerPage/totalRows tidak diubah manual di sini.
   - Tutup modal (`setModalState({ open: false })`), tampilkan `toast.success('Device created' | 'Device updated')`.

### 4.5 Delete (single & bulk)

- **Single delete**: klik ikon Trash di baris → `setDeleteTarget(device)` → `ConfirmDialog` muncul → konfirmasi → `handleConfirmDelete()`:
  - `toast.promise(devicesClientApi.remove(id), { loading, success })` — otomatis menampilkan toast loading→success/error.
  - `remove()` → `DELETE /devices/{id}`.
  - Sukses → filter device dari `data.data` di state lokal.
- **Bulk delete**: checkbox per baris (`selected: Set<string>`) → tombol "Delete (n)" → `ConfirmDialog` → `handleConfirmBulkDelete()`:
  - `Promise.allSettled(ids.map(id => devicesClientApi.remove(id)))` — hapus paralel, toleran sebagian gagal.
  - Filter state berdasarkan id yang berhasil (`fulfilled`), reset `selected`, tampilkan toast ringkasan (`"${success} deleted, ${failed} failed"`).

### 4.6 Detail Modal (lazy fetch on-demand)

1. Klik ikon Eye → `openDeviceDetail(device)`:
   - `setDetailOpen(true)`, `setDetailLoading(true)`, `setDetailDevice(null)` (tampilkan skeleton loading dulu).
   - `devicesClientApi.getById(device.id)` → `GET /devices/{id}` → hasil lebih lengkap (`DeviceDetailDTO`, termasuk `devices[]` — daftar device terkait bila relevan).
   - `setDetailDevice(result)`, `finally` → `setDetailLoading(false)`.
2. `DeviceDetailModal` (`_partials/detail-modal.tsx`) murni presentational — render skeleton saat `loading`, render info (`Created at`, `Last seen at`, `Status`) saat data tersedia, atau pesan error kalau `device === null`.

---

## 5. Axios Client Layer (`lib/axios.ts`) — dipakai semua `api.client.ts`

Ini "hilir" dari setiap pemanggilan `devicesClientApi.*` (dan modul lain yang sejenis):

1. **Request interceptor**: baca cookie `ems_token` langsung dari `document.cookie` (`readCookieToken()`), suntik ke header `Authorization`.
2. **Response interceptor (success)**: kalau body `{ data: ... }`, otomatis unwrap jadi `response.data = response.data.data` — makanya di `api.client.ts` cukup `.then(res => res.data)`.
3. **Response interceptor (error)**:
   - `status 429` → langsung reject dengan `ApiError` (kode `RATE_LIMITED`), tidak retry otomatis (toast rate-limit di-nonaktifkan/di-comment di kode saat ini).
   - `status 401` (dan bukan endpoint `/auth/login`, dan belum pernah di-retry):
     - Kalau sedang ada proses refresh lain berjalan (`isRefreshing`) → request baru masuk antrian (`pendingQueue`), menunggu `resolveQueue()`.
     - Kalau tidak → `refreshSession()` → `fetch POST /api/auth/refresh` (route handler Next.js, **bukan** langsung ke backend — supaya cookie httpOnly refresh token bisa diakses server-side).
     - Hasil `ok` → retry request original (`api(originalRequest)`).
     - Hasil `rate_limited`/`server_error` → toast peringatan, reject dengan `ApiError`, user **tidak** di-logout paksa.
     - Hasil `invalid` → `window.location.href = '/login?redirectTo=...'` (logout paksa, redirect).
   - Error lain → reject dengan `ApiError(message, status, code)` yang di-`catch` oleh pemanggil (biasanya ditampilkan lewat `toast.error(err.message)`).

`app/api/auth/refresh/route.ts` (dipanggil dari langkah di atas) pada dasarnya menjalankan ulang logic yang sama dengan middleware: `getRefreshTokenValue()` → `requestTokenRefresh()` → set/hapus cookie sesuai hasil.

---

## 6. Realtime Flow (Socket.IO)

**File**: `lib/socket.ts`, `hooks/use-realtime-event.ts`, `hooks/use-realtime-refresh.ts`

1. `getSocket()` — singleton, dibuat sekali per browser tab. `auth: (cb) => cb({ token: readCookieToken() })` — token dikirim saat handshake (dan setiap reconnect, karena berupa callback bukan value statis).
2. `connectSocket()` — dipanggil oleh hook saat komponen mount; kalau socket belum connect, `s.connect()`.
3. Dua pola pemakaian di halaman:
   - **`useRealtimeEvent<T>(event, handler)`** — subscribe event spesifik, lalu **manipulasi state langsung** di client tanpa re-fetch (contoh di `DeviceClient`: `device:created`, `device:updated`, `device:deleted`, `device:status` → masing-masing melakukan `setData` dengan strategi merge/filter/map yang sesuai). Ini yang dipakai Device, Rooms, Gateway.
   - **`useRealtimeRefresh(events[], debounceMs)`** — subscribe banyak event sekaligus, saat salah satu event terjadi → debounce lalu `router.refresh()` (re-run Server Component, fetch ulang data dari awal). Dipakai di Dashboard dan sebagian di Rooms (`device:status`, `room:power`) untuk data agregat yang lebih mudah di-refresh penuh daripada dipatch manual.
4. Contoh event per modul (nama event mengikuti konvensi `<domain>:<action>`):

   | Modul | Event | Efek |
   |---|---|---|
   | Device | `device:created`, `device:updated`, `device:deleted`, `device:status` | update array device di state (insert/merge/filter/patch status) |
   | Rooms | `room:created`, `room:updated`, `room:deleted`, + `useRealtimeRefresh(['device:status','room:power'])` | update state room langsung, atau full refresh untuk data daya |
   | Gateway | event serupa (`gateway:created/updated/deleted`) | update array gateway |
   | Schedule | `schedule:created`, `schedule:updated`, `schedule:deleted` | update array schedule |

5. Karena listener didaftarkan dengan `socket.on(event, listener)` di dalam `useEffect` dan di-`off` saat unmount, tiap halaman hanya mendengarkan event saat komponennya sedang ter-mount (tidak ada listener global yang bocor antar halaman).

---

## 7. Toast/Notifikasi Flow

`lib/toast-store.ts` — store custom (bukan library eksternal) berbasis **pub-sub sederhana**, dipakai lintas komponen tanpa Context:

1. `toast.success/error/warning/info/loading/message(title, options)` → `upsert()` membuat/update entry di array module-level `toasts`, set auto-dismiss timer sesuai `DEFAULT_DURATION` per varian (loading = `Infinity`, tidak auto-dismiss).
2. `emit()` memanggil semua `listeners` (di-subscribe oleh komponen `<Toaster>` via `subscribeToasts`) supaya UI re-render dengan daftar toast terbaru.
3. `toast.promise(promiseFn, { loading, success, error })` — pola paling sering dipakai untuk aksi mutasi (delete, dst): tampilkan toast `loading` dengan id tetap, lalu **update toast yang sama** (bukan toast baru) jadi `success`/`error` setelah promise selesai — dari perspektif user terlihat seperti satu toast yang berubah status.

---

## 8. Ringkasan Rantai Fungsi (per aksi)

### Load halaman pertama kali
```
Browser → middleware() → (refresh token bila perlu) →
ProtectedLayout → getSession() →
<Modul>Page() → <domain>Api.list() → lib/http.ts:http() → backend REST →
<ModulClient> (hydrate) → useTableSort() (sort lokal)
```

### Search/pagination
```
handleSearchChange/handlePageChange → loadDevices() →
<domain>ClientApi.list() → lib/axios.ts (interceptor) → backend →
setData() → re-render tabel
```

### Create/Update via modal
```
Klik tombol → setModalState → Form (react-hook-form + zod) → submit →
handleSubmit() → <domain>ClientApi.create/update() → axios → backend →
onSuccess() → setData() (merge lokal) + toast.success()
```

### Delete
```
Klik trash → setDeleteTarget → ConfirmDialog confirm → handleConfirmDelete() →
toast.promise(<domain>ClientApi.remove()) → axios → backend →
setData() (filter) 
```

### Event realtime masuk (mis. device dinyalakan dari perangkat lain)
```
Backend emit socket event → lib/socket.ts (singleton socket) →
useRealtimeEvent listener → setData() (patch langsung)
   — atau —
useRealtimeRefresh listener → debounce → router.refresh() → Server Component fetch ulang
```

### 401 di tengah sesi
```
Request API (axios) → 401 → refreshSession() → POST /api/auth/refresh →
route.ts → requestTokenRefresh() → backend /auth/refresh →
  ok      → set cookie baru → retry request original
  invalid → redirect ke /login
```

---

## 9. Catatan Konsistensi Antar Modul

Semua modul (`device`, `gateway`, `rooms`, `schedule`, `alarm`, `report`, `user`, `role`) mengikuti pola yang sama persis di atas, dengan pemetaan file:

| Layer | Device | Pola umum |
|---|---|---|
| Server fetch | `feat/device/api.ts` | `feat/<domain>/api.ts` |
| Client fetch | `feat/device/api.client.ts` | `feat/<domain>/api.client.ts` |
| Tipe response | `feat/device/dto.ts` | `feat/<domain>/dto.ts` |
| Validasi form | `feat/device/schema.ts` | `feat/<domain>/schema.ts` |
| Kolom tabel | `column/device.tsx` | `column/<domain>.tsx` |
| Halaman server | `app/(protected)/device/page.tsx` | `app/(protected)/<domain>/page.tsx` |
| Halaman client | `app/(protected)/device/client.tsx` | `app/(protected)/<domain>/client.tsx` |
| Modal form/detail | `app/(protected)/device/_partials/*.tsx` | `app/(protected)/<domain>/_partials/*.tsx` |

Jadi untuk memahami flow modul lain, susuri file dengan nama domain yang sama mengikuti urutan pada dokumen ini — struktur fungsinya akan sangat mirip.
