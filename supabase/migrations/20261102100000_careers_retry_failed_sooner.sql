create or replace function public.claim_careers_refresh(p_degree_key text, p_source text, p_today date)
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
      and (feed.status <> 'failed' or feed.failed_at < now() - interval '5 minutes');

  return found;
end;
$$;
