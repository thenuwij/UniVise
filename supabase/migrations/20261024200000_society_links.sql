alter table public.unsw_societies
  add column if not exists website_url text,
  add column if not exists rubric_url text,
  add column if not exists links_checked_at timestamptz;

comment on column public.unsw_societies.website_url is
  'The society''s own official website, verified to load and name the society.';
comment on column public.unsw_societies.rubric_url is
  'The society''s page on Rubric, the Arc UNSW club directory, used when there is no website.';
comment on column public.unsw_societies.links_checked_at is
  'When website_url and rubric_url were last verified.';
