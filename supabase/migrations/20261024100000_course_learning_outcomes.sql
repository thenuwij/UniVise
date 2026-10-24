alter table public.unsw_courses
  add column if not exists learning_outcomes jsonb;

comment on column public.unsw_courses.learning_outcomes is
  'Course learning outcomes from the Handbook, e.g. [{"code": "CLO1", "description": "..."}].';
