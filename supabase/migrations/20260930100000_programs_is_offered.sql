alter table public.unsw_degrees_final
  add column is_offered boolean not null default true;

update public.unsw_degrees_final
set is_offered = false
where degree_code in ('3881', '7011');
