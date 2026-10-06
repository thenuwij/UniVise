create table public.career_study_area_outcomes (
    study_area text primary key,
    full_time_employment_rate numeric,
    overall_employment_rate numeric,
    labour_force_participation_rate numeric,
    median_salary integer,
    further_study_rate numeric,
    professional_occupation_rate numeric,
    survey_year integer not null,
    source text not null,
    source_url text,
    updated_at timestamp with time zone not null default now()
);

create table public.career_occupations (
    anzsco_code text primary key,
    title text not null,
    skill_level integer,
    employed integer,
    median_weekly_earnings integer,
    annual_employment_growth integer,
    shortage_national text,
    shortage_nsw text,
    data_period text not null,
    source text not null,
    source_url text,
    updated_at timestamp with time zone not null default now()
);

create table public.program_study_areas (
    degree_code text not null,
    study_area text not null references public.career_study_area_outcomes (study_area),
    primary key (degree_code, study_area)
);

create table public.specialisation_study_areas (
    major_code text not null,
    study_area text not null references public.career_study_area_outcomes (study_area),
    primary key (major_code, study_area)
);

create table public.study_area_occupations (
    study_area text not null references public.career_study_area_outcomes (study_area),
    anzsco_code text not null references public.career_occupations (anzsco_code),
    primary key (study_area, anzsco_code)
);

create index study_area_occupations_anzsco_code_idx on public.study_area_occupations (anzsco_code);

alter table public.career_study_area_outcomes enable row level security;
alter table public.career_occupations enable row level security;
alter table public.program_study_areas enable row level security;
alter table public.specialisation_study_areas enable row level security;
alter table public.study_area_occupations enable row level security;

revoke all on table public.career_study_area_outcomes from anon, authenticated;
revoke all on table public.career_occupations from anon, authenticated;
revoke all on table public.program_study_areas from anon, authenticated;
revoke all on table public.specialisation_study_areas from anon, authenticated;
revoke all on table public.study_area_occupations from anon, authenticated;

grant select on table public.career_study_area_outcomes to authenticated;
grant select on table public.career_occupations to authenticated;
grant select on table public.program_study_areas to authenticated;
grant select on table public.specialisation_study_areas to authenticated;
grant select on table public.study_area_occupations to authenticated;

create policy "Signed-in read" on public.career_study_area_outcomes for select to authenticated using (true);
create policy "Signed-in read" on public.career_occupations for select to authenticated using (true);
create policy "Signed-in read" on public.program_study_areas for select to authenticated using (true);
create policy "Signed-in read" on public.specialisation_study_areas for select to authenticated using (true);
create policy "Signed-in read" on public.study_area_occupations for select to authenticated using (true);
