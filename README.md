# Pidu-App

Aplikasi pencatat keuangan pribadi (monorepo): backend Laravel (REST API) + frontend React (Vite).

## Prasyarat

- PHP 8.2+ (CLI) & Composer 2
- Node.js 18+ & npm
- Tidak butuh server database — pakai **SQLite**

## Setup (sekali saja)

```bash
npm run setup
```

Perintah ini menjalankan: `composer install` (backend), membuat `.env` & `database.sqlite` jika belum ada, `key:generate`, `migrate:fresh --seed`, lalu `npm install` di root dan `frontend/`.

Jalankan manual (non-Windows / jika `setup` gagal):

```bash
cd backend
composer install
cp .env.example .env        # Windows: copy .env.example .env
touch database/database.sqlite   # Windows: type nul > database\database.sqlite
php artisan key:generate
php artisan migrate:fresh --seed
cd ..
npm install
npm --prefix frontend install
```

## Menjalankan

```bash
npm start
```

- Frontend: http://localhost:8010
- Backend API: http://127.0.0.1:8001 (`/api` di-proxy oleh Vite)

Login demo (dari seeder): `demo@pidu.test` / `password`

## Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run be` | Backend saja |
| `npm run fe` | Frontend saja |
| `npm run db:reset` | Reset & seed ulang database |
