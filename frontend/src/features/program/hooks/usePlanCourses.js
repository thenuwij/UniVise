import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchMyCourses, setCourseAdded } from "../utils/programCourses";
import { ADDED_SECTION } from "../utils/myCourses";

export function usePlanCourses(degreeCode, userId) {
  const [mine, setMine] = useState(null);
  const [added, setAdded] = useState(() => new Set());
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!degreeCode || !userId) return;
    let active = true;
    fetchMyCourses(degreeCode, userId)
      .then((loaded) => {
        if (!active) return;
        setMine(loaded);
        setAdded(new Set(loaded.added));
      })
      .catch((err) => {
        console.error("Loading My courses for Next courses failed:", err);
        if (active) setMine({ required: [], options: [], added: new Set() });
      });
    return () => { active = false; };
  }, [degreeCode, userId]);

  const inPlan = useCallback((code) => !!mine && (mine.required.includes(code) || added.has(code)), [mine, added]);

  const addToPlan = useCallback(
    async (course) => {
      if (!userId || saving) return;
      const option = mine?.options.find((o) => o.code === course.code);
      setSaving(course.code);
      try {
        const section = option?.section || ADDED_SECTION;
        await setCourseAdded({ userId, course: { code: course.code, name: course.name, uoc: option?.uoc ?? course.uoc ?? null }, section, added: true });
        setAdded((prev) => new Set(prev).add(course.code));
        toast.success(`${course.code} added to My courses, under ${section}.`);
      } catch (err) {
        console.error("Adding course to plan failed:", err);
        toast.error("Couldn't add that course. Try again.");
      } finally {
        setSaving(null);
      }
    },
    [userId, saving, mine]
  );

  return { ready: !!mine, inPlan, addToPlan, saving };
}
