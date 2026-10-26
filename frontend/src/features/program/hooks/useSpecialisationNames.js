import { useEffect, useState } from "react";
import { fetchChosenSpecialisations } from "../utils/programCourses";

export function useSpecialisationNames(degreeCode, userId) {
  const [names, setNames] = useState([]);

  useEffect(() => {
    let active = true;
    fetchChosenSpecialisations(degreeCode, userId).then((specs) => {
      if (active) setNames(specs.map((s) => s.name));
    });
    return () => { active = false; };
  }, [degreeCode, userId]);

  return names;
}
