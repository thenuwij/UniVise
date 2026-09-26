


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."career_rec_details" (
    "id" "uuid" NOT NULL,
    "explanation" "jsonb",
    "companies" "jsonb",
    "insights" "jsonb",
    "score_breakdown" "jsonb",
    "job_opportunity" "jsonb",
    "next_steps" "jsonb",
    "resources" "jsonb",
    "summary" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."career_rec_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "career_title" "text" NOT NULL,
    "industry" "text",
    "suitability_score" numeric,
    "reason" "text",
    "avg_salary_range" "text",
    "education_required" "text",
    "skills_needed" "jsonb",
    "link" "text",
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."career_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."degree_rec_details" (
    "id" "uuid" NOT NULL,
    "explanation" "jsonb",
    "insights" "jsonb",
    "score_breakdown" "jsonb",
    "specialisations" "jsonb",
    "career_pathways" "jsonb",
    "entry_requirements" "jsonb",
    "next_steps" "jsonb",
    "resources" "jsonb",
    "summary" "jsonb"
);


ALTER TABLE "public"."degree_rec_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."degree_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "degree_name" "text" NOT NULL,
    "university_name" "text",
    "atar_requirement" numeric,
    "suitability_score" numeric,
    "est_completion_years" numeric,
    "reason" "text",
    "sources" "jsonb",
    "link" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."degree_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."final_degree_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "degree_id" "uuid",
    "degree_code" "text",
    "degree_name" "text",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."final_degree_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmesh_edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mesh_id" "uuid" NOT NULL,
    "from_key" "text" NOT NULL,
    "to_key" "text" NOT NULL,
    "edge_type" "text",
    "confidence" numeric,
    "logic_type" "text",
    "group_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mindmesh_edges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmesh_edges_global" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_key" "text" NOT NULL,
    "to_key" "text" NOT NULL,
    "edge_type" "text" NOT NULL,
    "confidence" numeric,
    "logic_type" "text",
    "group_id" "text"
);


ALTER TABLE "public"."mindmesh_edges_global" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmesh_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mesh_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "item_key" "text" NOT NULL,
    "title" "text",
    "tags" "jsonb",
    "metadata" "jsonb",
    "source_table" "text",
    "source_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mindmesh_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmesh_nodes_global" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "uoc" integer,
    "faculty" "text",
    "school" "text",
    "level" "text"
);


ALTER TABLE "public"."mindmesh_nodes_global" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmeshes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mindmeshes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personality_results" (
    "user_id" "uuid" NOT NULL,
    "trait_scores" "jsonb",
    "top_types" "jsonb",
    "result_summary" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."personality_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_report_analysis" (
    "user_id" "uuid" NOT NULL,
    "analysis" "jsonb",
    "report_path" "text",
    "analysed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."school_report_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_roadmap" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "degree_name" "text",
    "mode" "text" DEFAULT 'school'::"text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."school_roadmap" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_school_data" (
    "user_id" "uuid" NOT NULL,
    "year" "text",
    "academic_strengths" "text"[],
    "hobbies" "text"[],
    "career_interests" "text"[],
    "atar" numeric,
    "confidence" "text",
    "degree_interest" "text"[],
    "report_path" "text"
);


ALTER TABLE "public"."student_school_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_uni_data" (
    "user_id" "uuid" NOT NULL,
    "degree_stage" "text",
    "academic_year" "text",
    "degree_field" "text",
    "interest_areas" "text"[],
    "interest_areas_other" "text",
    "hobbies" "text"[],
    "hobbies_other" "text",
    "wam" numeric,
    "switching_pathway" boolean,
    "study_feelings" "text",
    "confidence" "text",
    "want_help" "text",
    "priorities" "text"[],
    "work_style" "text"[]
);


ALTER TABLE "public"."student_uni_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unsw_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "overview" "text",
    "faculty" "text",
    "school" "text",
    "uoc" integer,
    "study_level" "text",
    "field_of_education" "text",
    "conditions_for_enrolment" "text"
);


ALTER TABLE "public"."unsw_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unsw_degrees_final" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "degree_code" "text" NOT NULL,
    "uac_code" "text",
    "program_name" "text" NOT NULL,
    "faculty" "text",
    "other_faculty" "text",
    "school" "text",
    "overview_description" "text",
    "career_outcomes" "text",
    "assumed_knowledge" "text",
    "source_url" "text",
    "duration" "text",
    "level" "text",
    "cricos_code" "text",
    "lowest_selection_rank" numeric,
    "lowest_atar" numeric,
    "minimum_uoc" integer,
    "sections" "jsonb",
    "program_structure" "jsonb",
    "special_notes" "text"
);


ALTER TABLE "public"."unsw_degrees_final" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unsw_roadmap" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "degree_id" "uuid",
    "degree_code" "text",
    "uac_code" "text",
    "program_name" "text",
    "mode" "text" DEFAULT 'unsw'::"text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unsw_roadmap" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unsw_societies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "arc_category" "text" NOT NULL,
    "short_name" "text"
);


ALTER TABLE "public"."unsw_societies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unsw_specialisations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "major_code" "text" NOT NULL,
    "major_name" "text" NOT NULL,
    "specialisation_type" "text" NOT NULL,
    "faculty" "text",
    "uoc_required" integer,
    "sections" "jsonb",
    "sections_degrees" "jsonb",
    "overview_description" "text",
    "special_notes" "text",
    "source_url" "text"
);


ALTER TABLE "public"."unsw_specialisations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_completed_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_code" "text" NOT NULL,
    "course_name" "text",
    "uoc" integer,
    "is_completed" boolean DEFAULT false NOT NULL,
    "category" "text",
    "source_type" "text",
    "source_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_completed_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_custom_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_code" "text" NOT NULL,
    "course_name" "text",
    "uoc" integer,
    "section_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_custom_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_enrolled_program" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "degree_code" "text" NOT NULL,
    "program_name" "text",
    "specialisation_codes" "text"[],
    "specialisation_names" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_enrolled_program" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress_stats" (
    "user_id" "uuid" NOT NULL,
    "total_uoc_required" integer,
    "uoc_completed" integer,
    "uoc_remaining" integer,
    "current_wam" numeric,
    "courses_completed_count" integer,
    "courses_remaining_count" integer,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_progress_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_saved_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "text" NOT NULL,
    "item_name" "text",
    "item_data" "jsonb",
    "personal_notes" "text",
    "saved_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_saved_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_specialisation_selections" (
    "user_id" "uuid" NOT NULL,
    "degree_code" "text" NOT NULL,
    "major_id" "uuid",
    "minor_id" "uuid",
    "honours_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_specialisation_selections" OWNER TO "postgres";


ALTER TABLE ONLY "public"."career_rec_details"
    ADD CONSTRAINT "career_rec_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."career_recommendations"
    ADD CONSTRAINT "career_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."degree_rec_details"
    ADD CONSTRAINT "degree_rec_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."degree_recommendations"
    ADD CONSTRAINT "degree_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."final_degree_recommendations"
    ADD CONSTRAINT "final_degree_rec_user_degree_unique" UNIQUE ("user_id", "degree_code");



ALTER TABLE ONLY "public"."final_degree_recommendations"
    ADD CONSTRAINT "final_degree_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mindmesh_edges_global"
    ADD CONSTRAINT "mindmesh_edges_global_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mindmesh_edges_global"
    ADD CONSTRAINT "mindmesh_edges_global_unique" UNIQUE ("from_key", "to_key", "edge_type");



ALTER TABLE ONLY "public"."mindmesh_edges"
    ADD CONSTRAINT "mindmesh_edges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mindmesh_edges"
    ADD CONSTRAINT "mindmesh_edges_user_id_mesh_id_from_key_to_key_edge_type_key" UNIQUE ("user_id", "mesh_id", "from_key", "to_key", "edge_type");



ALTER TABLE ONLY "public"."mindmesh_items"
    ADD CONSTRAINT "mindmesh_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mindmesh_items"
    ADD CONSTRAINT "mindmesh_items_user_id_mesh_id_item_type_item_key_key" UNIQUE ("user_id", "mesh_id", "item_type", "item_key");



ALTER TABLE ONLY "public"."mindmesh_nodes_global"
    ADD CONSTRAINT "mindmesh_nodes_global_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."mindmeshes"
    ADD CONSTRAINT "mindmeshes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personality_results"
    ADD CONSTRAINT "personality_results_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."school_report_analysis"
    ADD CONSTRAINT "school_report_analysis_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."school_roadmap"
    ADD CONSTRAINT "school_roadmap_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_school_data"
    ADD CONSTRAINT "student_school_data_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."student_uni_data"
    ADD CONSTRAINT "student_uni_data_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."unsw_courses"
    ADD CONSTRAINT "unsw_courses_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."unsw_courses"
    ADD CONSTRAINT "unsw_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unsw_degrees_final"
    ADD CONSTRAINT "unsw_degrees_final_degree_code_key" UNIQUE ("degree_code");



ALTER TABLE ONLY "public"."unsw_degrees_final"
    ADD CONSTRAINT "unsw_degrees_final_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unsw_roadmap"
    ADD CONSTRAINT "unsw_roadmap_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unsw_societies"
    ADD CONSTRAINT "unsw_societies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."unsw_societies"
    ADD CONSTRAINT "unsw_societies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unsw_specialisations"
    ADD CONSTRAINT "unsw_specialisations_major_code_key" UNIQUE ("major_code");



ALTER TABLE ONLY "public"."unsw_specialisations"
    ADD CONSTRAINT "unsw_specialisations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_completed_courses"
    ADD CONSTRAINT "user_completed_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_completed_courses"
    ADD CONSTRAINT "user_completed_courses_user_id_course_code_key" UNIQUE ("user_id", "course_code");



ALTER TABLE ONLY "public"."user_custom_courses"
    ADD CONSTRAINT "user_custom_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_custom_courses"
    ADD CONSTRAINT "user_custom_courses_user_id_course_code_key" UNIQUE ("user_id", "course_code");



ALTER TABLE ONLY "public"."user_enrolled_program"
    ADD CONSTRAINT "user_enrolled_program_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress_stats"
    ADD CONSTRAINT "user_progress_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_saved_items"
    ADD CONSTRAINT "user_saved_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_saved_items"
    ADD CONSTRAINT "user_saved_items_user_id_item_type_item_id_key" UNIQUE ("user_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_pkey" PRIMARY KEY ("user_id", "degree_code");



CREATE INDEX "career_recommendations_user_id_created_at_idx" ON "public"."career_recommendations" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "conversation_messages_conversation_id_created_at_idx" ON "public"."conversation_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "conversations_user_id_updated_at_idx" ON "public"."conversations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "degree_recommendations_user_id_created_at_idx" ON "public"."degree_recommendations" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "final_degree_recommendations_user_id_created_at_idx" ON "public"."final_degree_recommendations" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "mindmesh_edges_global_from_key_idx" ON "public"."mindmesh_edges_global" USING "btree" ("from_key");



CREATE INDEX "mindmesh_edges_global_to_key_idx" ON "public"."mindmesh_edges_global" USING "btree" ("to_key");



CREATE INDEX "mindmesh_edges_user_id_mesh_id_idx" ON "public"."mindmesh_edges" USING "btree" ("user_id", "mesh_id");



CREATE INDEX "mindmesh_items_user_id_mesh_id_idx" ON "public"."mindmesh_items" USING "btree" ("user_id", "mesh_id");



CREATE INDEX "mindmeshes_user_id_idx" ON "public"."mindmeshes" USING "btree" ("user_id");



CREATE INDEX "school_roadmap_user_id_created_at_idx" ON "public"."school_roadmap" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "unsw_courses_faculty_idx" ON "public"."unsw_courses" USING "btree" ("faculty");



CREATE INDEX "unsw_courses_study_level_idx" ON "public"."unsw_courses" USING "btree" ("study_level");



CREATE INDEX "unsw_degrees_final_faculty_idx" ON "public"."unsw_degrees_final" USING "btree" ("faculty");



CREATE INDEX "unsw_degrees_final_level_idx" ON "public"."unsw_degrees_final" USING "btree" ("level");



CREATE INDEX "unsw_roadmap_user_id_updated_at_idx" ON "public"."unsw_roadmap" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "unsw_specialisations_faculty_idx" ON "public"."unsw_specialisations" USING "btree" ("faculty");



CREATE INDEX "unsw_specialisations_specialisation_type_idx" ON "public"."unsw_specialisations" USING "btree" ("specialisation_type");



CREATE INDEX "user_completed_courses_user_id_idx" ON "public"."user_completed_courses" USING "btree" ("user_id");



CREATE INDEX "user_custom_courses_user_id_idx" ON "public"."user_custom_courses" USING "btree" ("user_id");



CREATE INDEX "user_enrolled_program_user_id_idx" ON "public"."user_enrolled_program" USING "btree" ("user_id");



CREATE INDEX "user_saved_items_user_id_saved_at_idx" ON "public"."user_saved_items" USING "btree" ("user_id", "saved_at" DESC);



ALTER TABLE ONLY "public"."career_rec_details"
    ADD CONSTRAINT "career_rec_details_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."career_recommendations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."career_recommendations"
    ADD CONSTRAINT "career_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."degree_rec_details"
    ADD CONSTRAINT "degree_rec_details_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."degree_recommendations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."degree_recommendations"
    ADD CONSTRAINT "degree_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_degree_recommendations"
    ADD CONSTRAINT "final_degree_recommendations_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "public"."unsw_degrees_final"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."final_degree_recommendations"
    ADD CONSTRAINT "final_degree_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_edges_global"
    ADD CONSTRAINT "mindmesh_edges_global_from_key_fkey" FOREIGN KEY ("from_key") REFERENCES "public"."mindmesh_nodes_global"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_edges_global"
    ADD CONSTRAINT "mindmesh_edges_global_to_key_fkey" FOREIGN KEY ("to_key") REFERENCES "public"."mindmesh_nodes_global"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_edges"
    ADD CONSTRAINT "mindmesh_edges_mesh_id_fkey" FOREIGN KEY ("mesh_id") REFERENCES "public"."mindmeshes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_edges"
    ADD CONSTRAINT "mindmesh_edges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_items"
    ADD CONSTRAINT "mindmesh_items_mesh_id_fkey" FOREIGN KEY ("mesh_id") REFERENCES "public"."mindmeshes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_items"
    ADD CONSTRAINT "mindmesh_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmesh_nodes_global"
    ADD CONSTRAINT "mindmesh_nodes_global_key_fkey" FOREIGN KEY ("key") REFERENCES "public"."unsw_courses"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mindmeshes"
    ADD CONSTRAINT "mindmeshes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personality_results"
    ADD CONSTRAINT "personality_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_report_analysis"
    ADD CONSTRAINT "school_report_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_roadmap"
    ADD CONSTRAINT "school_roadmap_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_school_data"
    ADD CONSTRAINT "student_school_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_uni_data"
    ADD CONSTRAINT "student_uni_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unsw_roadmap"
    ADD CONSTRAINT "unsw_roadmap_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "public"."unsw_degrees_final"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."unsw_roadmap"
    ADD CONSTRAINT "unsw_roadmap_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_completed_courses"
    ADD CONSTRAINT "user_completed_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_custom_courses"
    ADD CONSTRAINT "user_custom_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_enrolled_program"
    ADD CONSTRAINT "user_enrolled_program_degree_code_fkey" FOREIGN KEY ("degree_code") REFERENCES "public"."unsw_degrees_final"("degree_code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_enrolled_program"
    ADD CONSTRAINT "user_enrolled_program_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress_stats"
    ADD CONSTRAINT "user_progress_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_saved_items"
    ADD CONSTRAINT "user_saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_degree_code_fkey" FOREIGN KEY ("degree_code") REFERENCES "public"."unsw_degrees_final"("degree_code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_honours_id_fkey" FOREIGN KEY ("honours_id") REFERENCES "public"."unsw_specialisations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "public"."unsw_specialisations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_minor_id_fkey" FOREIGN KEY ("minor_id") REFERENCES "public"."unsw_specialisations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_specialisation_selections"
    ADD CONSTRAINT "user_specialisation_selections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Own messages delete" ON "public"."conversation_messages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "conversation_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own messages insert" ON "public"."conversation_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "conversation_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own messages read" ON "public"."conversation_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "conversation_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own messages update" ON "public"."conversation_messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "conversation_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details delete" ON "public"."career_rec_details" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."career_recommendations" "cr"
  WHERE (("cr"."id" = "career_rec_details"."id") AND ("cr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details delete" ON "public"."degree_rec_details" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."degree_recommendations" "dr"
  WHERE (("dr"."id" = "degree_rec_details"."id") AND ("dr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details insert" ON "public"."career_rec_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."career_recommendations" "cr"
  WHERE (("cr"."id" = "career_rec_details"."id") AND ("cr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details insert" ON "public"."degree_rec_details" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."degree_recommendations" "dr"
  WHERE (("dr"."id" = "degree_rec_details"."id") AND ("dr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details read" ON "public"."career_rec_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."career_recommendations" "cr"
  WHERE (("cr"."id" = "career_rec_details"."id") AND ("cr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details read" ON "public"."degree_rec_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."degree_recommendations" "dr"
  WHERE (("dr"."id" = "degree_rec_details"."id") AND ("dr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details update" ON "public"."career_rec_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."career_recommendations" "cr"
  WHERE (("cr"."id" = "career_rec_details"."id") AND ("cr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own rec details update" ON "public"."degree_rec_details" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."degree_recommendations" "dr"
  WHERE (("dr"."id" = "degree_rec_details"."id") AND ("dr"."user_id" = "auth"."uid"())))));



CREATE POLICY "Own row delete" ON "public"."career_recommendations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."degree_recommendations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."final_degree_recommendations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."mindmesh_edges" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."mindmesh_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."mindmeshes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."personality_results" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."school_report_analysis" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."school_roadmap" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."student_school_data" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."student_uni_data" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."unsw_roadmap" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_completed_courses" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_custom_courses" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_enrolled_program" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_progress_stats" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_saved_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row delete" ON "public"."user_specialisation_selections" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."career_recommendations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."degree_recommendations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."final_degree_recommendations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."mindmesh_edges" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."mindmesh_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."mindmeshes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."personality_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."school_report_analysis" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."school_roadmap" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."student_school_data" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."student_uni_data" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."unsw_roadmap" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_completed_courses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_custom_courses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_enrolled_program" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_progress_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_saved_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row insert" ON "public"."user_specialisation_selections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."career_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."degree_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."final_degree_recommendations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."mindmesh_edges" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."mindmesh_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."mindmeshes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."personality_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."school_report_analysis" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."school_roadmap" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."student_school_data" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."student_uni_data" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."unsw_roadmap" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_completed_courses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_custom_courses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_enrolled_program" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_progress_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_saved_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row read" ON "public"."user_specialisation_selections" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."career_recommendations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."degree_recommendations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."final_degree_recommendations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."mindmesh_edges" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."mindmesh_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."mindmeshes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."personality_results" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."school_report_analysis" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."school_roadmap" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."student_school_data" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."student_uni_data" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."unsw_roadmap" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_completed_courses" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_custom_courses" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_enrolled_program" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_progress_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_saved_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Own row update" ON "public"."user_specialisation_selections" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public read" ON "public"."mindmesh_edges_global" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."mindmesh_nodes_global" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."unsw_courses" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."unsw_degrees_final" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."unsw_societies" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."unsw_specialisations" FOR SELECT USING (true);



ALTER TABLE "public"."career_rec_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."career_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."degree_rec_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."degree_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."final_degree_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mindmesh_edges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mindmesh_edges_global" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mindmesh_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mindmesh_nodes_global" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mindmeshes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personality_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_report_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_roadmap" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_school_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_uni_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unsw_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unsw_degrees_final" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unsw_roadmap" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unsw_societies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unsw_specialisations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_completed_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_custom_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_enrolled_program" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_saved_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_specialisation_selections" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."career_rec_details" TO "anon";
GRANT ALL ON TABLE "public"."career_rec_details" TO "authenticated";
GRANT ALL ON TABLE "public"."career_rec_details" TO "service_role";



GRANT ALL ON TABLE "public"."career_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."career_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."career_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."degree_rec_details" TO "anon";
GRANT ALL ON TABLE "public"."degree_rec_details" TO "authenticated";
GRANT ALL ON TABLE "public"."degree_rec_details" TO "service_role";



GRANT ALL ON TABLE "public"."degree_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."degree_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."degree_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."final_degree_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."final_degree_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."final_degree_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."mindmesh_edges" TO "anon";
GRANT ALL ON TABLE "public"."mindmesh_edges" TO "authenticated";
GRANT ALL ON TABLE "public"."mindmesh_edges" TO "service_role";



GRANT ALL ON TABLE "public"."mindmesh_edges_global" TO "anon";
GRANT ALL ON TABLE "public"."mindmesh_edges_global" TO "authenticated";
GRANT ALL ON TABLE "public"."mindmesh_edges_global" TO "service_role";



GRANT ALL ON TABLE "public"."mindmesh_items" TO "anon";
GRANT ALL ON TABLE "public"."mindmesh_items" TO "authenticated";
GRANT ALL ON TABLE "public"."mindmesh_items" TO "service_role";



GRANT ALL ON TABLE "public"."mindmesh_nodes_global" TO "anon";
GRANT ALL ON TABLE "public"."mindmesh_nodes_global" TO "authenticated";
GRANT ALL ON TABLE "public"."mindmesh_nodes_global" TO "service_role";



GRANT ALL ON TABLE "public"."mindmeshes" TO "anon";
GRANT ALL ON TABLE "public"."mindmeshes" TO "authenticated";
GRANT ALL ON TABLE "public"."mindmeshes" TO "service_role";



GRANT ALL ON TABLE "public"."personality_results" TO "anon";
GRANT ALL ON TABLE "public"."personality_results" TO "authenticated";
GRANT ALL ON TABLE "public"."personality_results" TO "service_role";



GRANT ALL ON TABLE "public"."school_report_analysis" TO "anon";
GRANT ALL ON TABLE "public"."school_report_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."school_report_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."school_roadmap" TO "anon";
GRANT ALL ON TABLE "public"."school_roadmap" TO "authenticated";
GRANT ALL ON TABLE "public"."school_roadmap" TO "service_role";



GRANT ALL ON TABLE "public"."student_school_data" TO "anon";
GRANT ALL ON TABLE "public"."student_school_data" TO "authenticated";
GRANT ALL ON TABLE "public"."student_school_data" TO "service_role";



GRANT ALL ON TABLE "public"."student_uni_data" TO "anon";
GRANT ALL ON TABLE "public"."student_uni_data" TO "authenticated";
GRANT ALL ON TABLE "public"."student_uni_data" TO "service_role";



GRANT ALL ON TABLE "public"."unsw_courses" TO "anon";
GRANT ALL ON TABLE "public"."unsw_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."unsw_courses" TO "service_role";



GRANT ALL ON TABLE "public"."unsw_degrees_final" TO "anon";
GRANT ALL ON TABLE "public"."unsw_degrees_final" TO "authenticated";
GRANT ALL ON TABLE "public"."unsw_degrees_final" TO "service_role";



GRANT ALL ON TABLE "public"."unsw_roadmap" TO "anon";
GRANT ALL ON TABLE "public"."unsw_roadmap" TO "authenticated";
GRANT ALL ON TABLE "public"."unsw_roadmap" TO "service_role";



GRANT ALL ON TABLE "public"."unsw_societies" TO "anon";
GRANT ALL ON TABLE "public"."unsw_societies" TO "authenticated";
GRANT ALL ON TABLE "public"."unsw_societies" TO "service_role";



GRANT ALL ON TABLE "public"."unsw_specialisations" TO "anon";
GRANT ALL ON TABLE "public"."unsw_specialisations" TO "authenticated";
GRANT ALL ON TABLE "public"."unsw_specialisations" TO "service_role";



GRANT ALL ON TABLE "public"."user_completed_courses" TO "anon";
GRANT ALL ON TABLE "public"."user_completed_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."user_completed_courses" TO "service_role";



GRANT ALL ON TABLE "public"."user_custom_courses" TO "anon";
GRANT ALL ON TABLE "public"."user_custom_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."user_custom_courses" TO "service_role";



GRANT ALL ON TABLE "public"."user_enrolled_program" TO "anon";
GRANT ALL ON TABLE "public"."user_enrolled_program" TO "authenticated";
GRANT ALL ON TABLE "public"."user_enrolled_program" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_progress_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_saved_items" TO "anon";
GRANT ALL ON TABLE "public"."user_saved_items" TO "authenticated";
GRANT ALL ON TABLE "public"."user_saved_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_specialisation_selections" TO "anon";
GRANT ALL ON TABLE "public"."user_specialisation_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_specialisation_selections" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































