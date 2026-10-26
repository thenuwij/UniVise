import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

export function useDegree(degreeCode) {
  const [degree, setDegree] = useState(null);

  useEffect(() => {
    if (!degreeCode) return;
    let active = true;
    supabase
      .from("unsw_degrees_final")
      .select("*")
      .eq("degree_code", degreeCode)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active && !error) setDegree(data);
      });
    return () => { active = false; };
  }, [degreeCode]);

  return degree;
}
