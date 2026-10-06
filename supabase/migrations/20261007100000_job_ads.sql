create table public.job_ads (
    search_words text not null,
    ad_id text not null,
    title text not null,
    company text,
    location text,
    posted_at timestamp with time zone,
    url text not null,
    fetched_at timestamp with time zone not null default now(),
    primary key (search_words, ad_id)
);

create index job_ads_posted_at_idx on public.job_ads (posted_at);

alter table public.job_ads enable row level security;

revoke all on table public.job_ads from anon, authenticated;

grant select on table public.job_ads to authenticated;

create policy "Signed-in read" on public.job_ads for select to authenticated using (true);
