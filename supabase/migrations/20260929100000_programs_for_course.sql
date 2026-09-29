create function public.programs_for_course(p_course_code text)
returns table (id uuid, degree_code text, program_name text, faculty text)
language sql
stable
set search_path = ''
as $$
  with listing as (
    select jsonb_build_array(jsonb_build_object('courses', jsonb_build_array(jsonb_build_object('code', p_course_code)))) as pattern
  ),
  specialisations as (
    select s.major_code, s.sections_degrees
    from public.unsw_specialisations s, listing
    where s.sections @> listing.pattern
  ),
  linked_programs as (
    select link ->> 'degree_code' as degree_code
    from specialisations s, jsonb_array_elements(coalesce(s.sections_degrees, '[]'::jsonb)) as link
  )
  select p.id, p.degree_code, p.program_name, p.faculty
  from public.unsw_degrees_final p, listing
  where p.sections @> listing.pattern
     or p.degree_code in (select degree_code from linked_programs)
     or exists (
       select 1 from specialisations s
       where p.sections @> jsonb_build_array(jsonb_build_object('courses', jsonb_build_array(jsonb_build_object('code', s.major_code))))
     )
  order by p.program_name;
$$;

revoke execute on function public.programs_for_course(text) from public, anon, authenticated;
grant execute on function public.programs_for_course(text) to service_role;
