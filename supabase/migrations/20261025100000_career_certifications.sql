create table public.user_career_certifications (
    user_id uuid primary key references auth.users (id) on delete cascade,
    input_hash text not null,
    groups jsonb not null,
    updated_at timestamp with time zone not null default now()
);

alter table public.user_career_certifications enable row level security;

revoke all on table public.user_career_certifications from anon, authenticated;
