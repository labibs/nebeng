# Render Setup

Backend Go ini siap dideploy ke Render memakai blueprint di `render.yaml`.

## Konfigurasi service

```text
Service type: Web Service
Runtime: Go
Root Directory: backend
Build Command: go build -o backend .
Start Command: ./backend
Health Check Path: /health
Plan: free
Region: singapore
```

## Environment variables

Isi variabel berikut di dashboard Render:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
SUPABASE_ANON_KEY
CLERK_JWKS_URL
FRONTEND_URL
```

`PORT` tidak perlu diisi manual karena Render akan menyediakannya otomatis.

## Catatan

- Free instance Render akan sleep saat idle, jadi request pertama bisa lambat.
- Endpoint debug `/api/transactions-debug` sebaiknya dihapus atau diamankan sebelum dipakai lebih luas.
- Backend ini bergantung pada Supabase, Clerk, dan Supabase Edge Function untuk pembayaran.
