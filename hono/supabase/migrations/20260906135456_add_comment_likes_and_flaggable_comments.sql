alter table public.comments
  add column if not exists is_flagged boolean not null default false;

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_comment_id_idx on public.comment_likes(comment_id);

alter table public.comment_likes enable row level security;

alter table public.flags
  add column if not exists target_comment_id uuid references public.comments(id) on delete cascade;

create index if not exists flags_target_comment_id_idx on public.flags(target_comment_id);
;
