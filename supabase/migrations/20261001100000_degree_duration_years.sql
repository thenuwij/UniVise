alter table public.unsw_degrees_final
  add column if not exists duration_years numeric;

comment on column public.unsw_degrees_final.duration_years is
  'Program length in years as a number, parsed from the Handbook duration text.';
