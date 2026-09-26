create table public.recommendation_runs (
    user_id uuid primary key references auth.users (id) on delete cascade,
    started_at timestamp with time zone not null default now()
);

alter table public.recommendation_runs enable row level security;

revoke all on table public.recommendation_runs from anon, authenticated;

create function public.claim_recommendation_run(p_user_id uuid)
returns boolean
language sql
set search_path = ''
as $$
  with claimed as (
    insert into public.recommendation_runs as runs (user_id, started_at)
    values (p_user_id, now())
    on conflict (user_id) do update
      set started_at = excluded.started_at
      where runs.started_at < now() - interval '3 minutes'
    returning 1
  )
  select exists (select 1 from claimed);
$$;

revoke execute on function public.claim_recommendation_run(uuid) from public, anon, authenticated;
grant execute on function public.claim_recommendation_run(uuid) to service_role;
