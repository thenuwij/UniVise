import { supabase } from "@/shared/lib/supabase";

const degrees = () => supabase.from("unsw_degrees_final");
const courses = () => supabase.from("unsw_courses");

export const fetchDegree = (degreeCode, columns = "*") => degrees().select(columns).eq("degree_code", degreeCode).maybeSingle();

export const listOfferedDegrees = (columns = "*") => degrees().select(columns).eq("is_offered", true);

export const fetchCourse = (code, columns) => courses().select(columns).eq("code", code).maybeSingle();

export const searchCourses = (query) =>
  courses().select("code, title, uoc").or(`code.ilike.%${query}%,title.ilike.%${query}%`).order("code").limit(25);

export const fetchCourseLinks = (courseKey) =>
  supabase
    .from("mindmesh_edges_global")
    .select("from_key,to_key,edge_type,confidence,logic_type,group_id")
    .or(`from_key.eq."${courseKey}",to_key.eq."${courseKey}"`);

export const fetchMeshNodes = (keys) =>
  supabase.from("mindmesh_nodes_global").select("key,label,uoc,faculty,school,level").in("key", keys);
