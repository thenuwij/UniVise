create or replace function public.text_list_within(items text[], max_items integer, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(items), 0) <= max_items
    and coalesce((select bool_and(char_length(item) <= max_length) from unnest(items) as item), true);
$$;

alter table public.student_uni_data
  add constraint student_uni_data_degree_stage_length check (char_length(degree_stage) <= 50),
  add constraint student_uni_data_academic_year_length check (char_length(academic_year) <= 50),
  add constraint student_uni_data_degree_field_length check (char_length(degree_field) <= 150),
  add constraint student_uni_data_interest_areas_other_length check (char_length(interest_areas_other) <= 60),
  add constraint student_uni_data_hobbies_other_length check (char_length(hobbies_other) <= 60),
  add constraint student_uni_data_interest_areas_size check (public.text_list_within(interest_areas, 30, 80)),
  add constraint student_uni_data_hobbies_size check (public.text_list_within(hobbies, 30, 80)),
  add constraint student_uni_data_priorities_size check (public.text_list_within(priorities, 30, 80)),
  add constraint student_uni_data_work_style_size check (public.text_list_within(work_style, 30, 80));

comment on function public.text_list_within(text[], integer, integer) is
  'True when a text list has at most max_items entries, each at most max_length characters. Used by survey length checks.';
