import { useEffect, useState } from "react";
import { ROADMAP_VIEWS } from "../utils/roadmapSteps";

const stepIndexFromUrl = (search) => {
  const step = Number(new URLSearchParams(search).get("step"));
  return Number.isInteger(step) && step >= 1 && step <= ROADMAP_VIEWS.degree.steps.length ? step - 1 : 0;
};

export function useStepNavigation(search, hasData, roadmapId) {
  const [activeIndex, setActiveIndex] = useState(() => stepIndexFromUrl(search));

  useEffect(() => {
    setActiveIndex(stepIndexFromUrl(search));
  }, [search]);

  useEffect(() => {
    if (!hasData || !roadmapId) return;
    const section = new URLSearchParams(window.location.search).get("section");
    const sectionQuery = section ? `&section=${encodeURIComponent(section)}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}?id=${roadmapId}&step=${activeIndex + 1}${sectionQuery}`);
  }, [activeIndex, hasData, roadmapId]);

  return { activeIndex, setActiveIndex };
}
