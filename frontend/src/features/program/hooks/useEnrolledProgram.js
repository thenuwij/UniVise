import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { UserAuth } from "@/app/AuthContext";

export function useEnrolledProgram() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("user_enrolled_program")
      .select("degree_code, program_name")
      .eq("user_id", userId)
      .limit(1)
      .then(({ data }) => {
        if (!active) return;
        setProgram(data?.[0] || null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  return { program, loading };
}
