create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.scripts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  ip_address text,
  device_id text,
  identity_key text not null,
  created_at timestamptz not null default now(),
  unique (script_id, identity_key)
);

create index if not exists download_events_script_id_idx on public.download_events(script_id);
create index if not exists download_events_user_id_idx on public.download_events(user_id);

alter table public.download_events enable row level security;
;
