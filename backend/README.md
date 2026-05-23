# Numpak Backend (Go)

REST API backend untuk aplikasi Numpak, menghubungkan React frontend dengan Supabase.

## Tech Stack

- **Go 1.21+** — bahasa backend
- **Gin** — HTTP framework
- **Clerk JWT** — autentikasi
- **Supabase** — database (via REST API menggunakan service role key)

## Struktur Folder

```
backend/
├── main.go
├── go.mod
├── .env                  # ← kamu buat dari .env.example
├── config/config.go
├── middleware/auth.go    # Clerk JWT validation
├── supabase/client.go   # Supabase REST client
├── models/models.go      # Go structs
├── routes/routes.go      # Register semua routes
└── handlers/
    ├── users.go
    ├── posts.go
    ├── cart.go
    ├── market.go
    ├── conversations.go
    └── transactions.go
```

## Setup

### 1. Install Go

Download dari https://go.dev/dl/ dan install (versi 1.21 ke atas).

Verifikasi dengan:
```powershell
go version
```

### 2. Isi `.env`

Copy `.env.example` ke `.env` dan isi:
```
SUPABASE_URL=https://osoryiixxzufkvsftkai.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key_dari_supabase_dashboard>
SUPABASE_ANON_KEY=<anon_key>
CLERK_JWKS_URL=https://electric-terrier-92.clerk.accounts.dev/.well-known/jwks.json
PORT=8080
FRONTEND_URL=http://localhost:5173
```

> **PENTING:** `SUPABASE_SERVICE_KEY` adalah Secret Key dari Supabase → Project Settings → API.

### 3. Install dependencies & jalankan

```powershell
# Di dalam folder backend/
go mod tidy
go run main.go
```

Backend akan berjalan di `http://localhost:8080`

## API Endpoints

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/health` | — | Health check |
| GET | `/api/posts` | — | List posts (dengan filter) |
| GET | `/api/users/me` | ✅ | Get profil user saat ini |
| POST | `/api/users/sync` | ✅ | Sync user dari Clerk |
| GET | `/api/cart` | ✅ | Get cart items |
| PATCH | `/api/cart/:id/quantity` | ✅ | Update quantity |
| DELETE | `/api/cart/:id` | ✅ | Hapus satu item |
| DELETE | `/api/cart` | ✅ | Hapus beberapa item |
| POST | `/api/cart/deal` | ✅ | Proses deal |
| GET | `/api/market/products` | ✅ | List produk market |
| GET | `/api/market/outlets` | ✅ | List outlet |
| GET | `/api/conversations` | ✅ | List percakapan |
| POST | `/api/conversations` | ✅ | Buat percakapan baru |
| GET | `/api/users` | ✅ | Semua user (untuk new chat) |
| GET | `/api/transactions` | ✅ | List transaksi |
| POST | `/api/transactions/pay` | ✅ | Inisiasi pembayaran Midtrans |

## Menjalankan Bersamaan dengan Frontend

**Terminal 1 — Backend:**
```powershell
cd backend
go run main.go
```

**Terminal 2 — Frontend:**
```powershell
npm run dev
```

Buka http://localhost:5173
