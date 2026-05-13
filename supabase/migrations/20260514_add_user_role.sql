alter table public.users
add column if not exists role text not null default 'user';

create index if not exists users_role_idx on public.users(role);
