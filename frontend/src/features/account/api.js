import { supabase } from "@/shared/lib/supabase";

const studentProfile = () => supabase.from("student_uni_data");

export const loadStudentProfile = (userId) => studentProfile().select("*").eq("user_id", userId).single();

export const updateStudentProfile = (userId, changes) => studentProfile().update(changes).eq("user_id", userId);

export const fetchInterestAreas = (userId) => studentProfile().select("interest_areas").eq("user_id", userId).limit(1);
