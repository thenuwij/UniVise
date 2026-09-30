create table public.user_course_picks (
    user_id uuid primary key references auth.users (id) on delete cascade,
    input_hash text not null,
    picks jsonb not null,
    updated_at timestamp with time zone not null default now()
);

alter table public.user_course_picks enable row level security;

revoke all on table public.user_course_picks from anon, authenticated;
