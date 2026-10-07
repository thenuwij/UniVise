alter table public.unsw_degrees_final
  add column if not exists handbook_year integer,
  add column if not exists scraped_at timestamptz;

alter table public.unsw_specialisations
  add column if not exists handbook_year integer,
  add column if not exists scraped_at timestamptz;

alter table public.unsw_courses
  add column if not exists handbook_year integer,
  add column if not exists scraped_at timestamptz,
  add column if not exists offering_terms text[];

comment on column public.unsw_degrees_final.handbook_year is
  'Handbook year this row was last confirmed against.';
comment on column public.unsw_degrees_final.scraped_at is
  'When the Handbook page for this row was downloaded.';
comment on column public.unsw_specialisations.handbook_year is
  'Handbook year this row was last confirmed against.';
comment on column public.unsw_specialisations.scraped_at is
  'When the Handbook page for this row was downloaded.';
comment on column public.unsw_courses.handbook_year is
  'Handbook year this row was last confirmed against.';
comment on column public.unsw_courses.scraped_at is
  'When the Handbook page for this row was downloaded.';
comment on column public.unsw_courses.offering_terms is
  'Terms the course is offered in, from the Handbook, e.g. {Term 1,Term 2}.';
