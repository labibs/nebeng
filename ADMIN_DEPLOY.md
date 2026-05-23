# Admin App Deploy

Repo ini sekarang berisi dua frontend:

- User PWA: root app lama di `src/`
- Admin panel: app baru di `apps/admin/`

## Local Development

```bash
npm run dev
npm run dev:admin
```

## Vercel

Buat dua project Vercel dari repo yang sama.

### User App

- Build Command: `npm run build`
- Output Directory: `dist`
- Domain: `numpak.vercel.app`

### Admin App

- Build Command: `npm run build:admin`
- Output Directory: `apps/admin/dist`
- Domain: `numpak-admin.vercel.app`

Environment variables admin memakai Supabase dan Clerk yang sama:

```bash
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Untuk link dari user app ke admin:

```bash
VITE_ADMIN_URL=https://numpak-admin.vercel.app
```

Untuk backend CORS:

```bash
ADMIN_FRONTEND_URL=https://numpak-admin.vercel.app
```

## Admin Role

Admin guard menerima salah satu nilai berikut:

- `users.role = admin`
- `users.is_admin = true`
- `publicMetadata.role = admin` di Clerk
- `publicMetadata.is_admin = true` di Clerk

Untuk fitur admin yang sensitif, gunakan endpoint backend khusus admin, bukan query langsung dari browser.
