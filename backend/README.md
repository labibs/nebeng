# Numpak Backend

Laravel backend for the Numpak application.

## Run locally

```bash
cd backend
composer install
php artisan serve
```

## Notes

- API routes live in `routes/api.php`.
- The skeleton is the official Laravel project structure.
- Shared hosting deployment will usually need only PHP, Composer for setup, and MySQL or another managed database.
- To import Supabase data into MySQL, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then run `php artisan supabase:import --truncate`.

Example:

```bash
php artisan supabase:import --truncate
```
