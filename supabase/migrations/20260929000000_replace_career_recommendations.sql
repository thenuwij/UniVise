create function public.replace_career_recommendations(p_user_id uuid, p_rows jsonb)
returns setof public.career_recommendations
language sql
set search_path = ''
as $$
  delete from public.career_rec_details
  where id in (select id from public.career_recommendations where user_id = p_user_id);

  delete from public.career_recommendations
  where user_id = p_user_id;

  insert into public.career_recommendations (
    user_id, career_title, industry, suitability_score, reason, avg_salary_range,
    education_required, skills_needed, link, source
  )
  select
    p_user_id, r.career_title, r.industry, r.suitability_score, r.reason, r.avg_salary_range,
    r.education_required, r.skills_needed, r.link, r.source
  from jsonb_to_recordset(p_rows) as r (
    career_title text, industry text, suitability_score numeric, reason text, avg_salary_range text,
    education_required text, skills_needed jsonb, link text, source text
  )
  returning *;
$$;

revoke execute on function public.replace_career_recommendations(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_career_recommendations(uuid, jsonb) to service_role;
