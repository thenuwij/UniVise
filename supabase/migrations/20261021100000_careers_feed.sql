create table public.careers_feed (
    degree_key text not null,
    source text not null check (source in ('adzuna', 'ai_jobs', 'ai_internships', 'ai_networking')),
    items jsonb not null default '[]'::jsonb,
    refreshed_at timestamp with time zone,
    refresh_day date,
    status text not null default 'idle' check (status in ('idle', 'running', 'failed')),
    claimed_at timestamp with time zone,
    failed_at timestamp with time zone,
    error text,
    primary key (degree_key, source)
);

create index careers_feed_source_day_idx on public.careers_feed (source, refresh_day);

alter table public.careers_feed enable row level security;

revoke all on table public.careers_feed from anon, authenticated;

create function public.claim_careers_refresh(p_degree_key text, p_source text, p_today date)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  insert into public.careers_feed (degree_key, source)
  values (p_degree_key, p_source)
  on conflict (degree_key, source) do nothing;

  update public.careers_feed as feed
    set status = 'running', claimed_at = now(), error = null
    where feed.degree_key = p_degree_key
      and feed.source = p_source
      and (feed.refresh_day is null or feed.refresh_day < p_today)
      and (feed.status <> 'running' or feed.claimed_at < now() - interval '3 minutes')
      and (feed.status <> 'failed' or feed.failed_at < now() - interval '1 hour');

  return found;
end;
$$;

revoke execute on function public.claim_careers_refresh(text, text, date) from public, anon, authenticated;
grant execute on function public.claim_careers_refresh(text, text, date) to service_role;
