create table public.roadmap_cache (
    cache_key text primary key,
    degree_code text not null,
    specialisation_ids text[] not null default '{}',
    prompt_version integer not null,
    input_hash text not null,
    payload jsonb not null,
    created_at timestamp with time zone not null default now(),
    refreshed_at timestamp with time zone not null default now(),
    last_used_at timestamp with time zone not null default now()
);

create index roadmap_cache_degree_code_idx on public.roadmap_cache (degree_code);

alter table public.roadmap_cache enable row level security;

revoke all on table public.roadmap_cache from anon, authenticated;
