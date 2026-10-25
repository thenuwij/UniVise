begin;

drop function if exists public.claim_recommendation_run(uuid);
drop function if exists public.replace_career_recommendations(uuid, jsonb);
drop function if exists public.programs_for_course(text);

drop table if exists public.career_rec_details;
drop table if exists public.career_recommendations;
drop table if exists public.degree_rec_details;
drop table if exists public.degree_recommendations;
drop table if exists public.final_degree_recommendations;
drop table if exists public.recommendation_runs;
drop table if exists public.mindmesh_edges;
drop table if exists public.mindmesh_items;
drop table if exists public.mindmeshes;
drop table if exists public.personality_results;
drop table if exists public.school_report_analysis;
drop table if exists public.school_roadmap;
drop table if exists public.student_school_data;

commit;
