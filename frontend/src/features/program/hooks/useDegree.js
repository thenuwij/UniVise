import { useEffect, useState } from "react";
import { fetchDegree } from "../api";

export function useDegree(degreeCode) {
  const [degree, setDegree] = useState(null);

  useEffect(() => {
    if (!degreeCode) return;
    let active = true;
    fetchDegree(degreeCode)
      .then(({ data, error }) => {
        if (active && !error) setDegree(data);
      });
    return () => { active = false; };
  }, [degreeCode]);

  return degree;
}
