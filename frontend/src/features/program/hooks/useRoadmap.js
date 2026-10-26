import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { apiFetch } from "@/shared/lib/api";

const INDUSTRY_KEYS = ["industry_societies", "industry_experience", "career_pathways"];
const SECTION_POLL_MS = 5000;
const SECTION_GIVE_UP_MS = 90000;

export const hasSection = (payload, key) => {
  const value = payload?.[key];
  return !!value && Object.keys(value).length > 0;
};

export function useRoadmap(roadmapId, accessToken) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionsStatus, setSectionsStatus] = useState("loading");
  const [pollKey, setPollKey] = useState(0);
  const [header, setHeader] = useState({ program_name: null, uac_code: null, degree_code: null });

  useEffect(() => {
    if (!roadmapId) return;
    let active = true;
    setLoading(true);
    supabase
      .from("unsw_roadmap")
      .select("payload, program_name, uac_code, degree_code")
      .eq("id", roadmapId)
      .maybeSingle()
      .then(({ data: row, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(fetchError.message || "Failed to fetch UNSW roadmap by id.");
          return;
        }
        setData((prev) => prev || row?.payload || null);
        setHeader({
          program_name: row?.program_name || null,
          uac_code: row?.uac_code || null,
          degree_code: row?.degree_code || null,
        });
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [roadmapId]);

  useEffect(() => {
    if (!roadmapId) return;

    let stopped = false;
    let intervalId = null;
    const startedAt = Date.now();

    const check = async () => {
      const { data: row, error: pollError } = await supabase
        .from("unsw_roadmap")
        .select("payload")
        .eq("id", roadmapId)
        .maybeSingle();

      if (stopped) return true;
      const timedOut = Date.now() - startedAt > SECTION_GIVE_UP_MS;
      if (pollError || !row) {
        if (timedOut) setSectionsStatus("failed");
        return timedOut;
      }

      const payload = row.payload || {};
      setData((prev) => ({ ...(prev || {}), ...payload }));

      const failed = payload.industry_failed || [];
      if (INDUSTRY_KEYS.every((k) => hasSection(payload, k)) && failed.length === 0) {
        setSectionsStatus("done");
        return true;
      }
      if (failed.length > 0 || timedOut) {
        setSectionsStatus("failed");
        return true;
      }
      return false;
    };

    setSectionsStatus("loading");
    check().then((finished) => {
      if (finished || stopped) return;
      intervalId = setInterval(async () => {
        if (await check()) clearInterval(intervalId);
      }, SECTION_POLL_MS);
    });

    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [roadmapId, pollKey]);

  const retrySections = useCallback(async () => {
    if (!roadmapId) return;
    setSectionsStatus("loading");
    try {
      await apiFetch(`/roadmap/unsw/${roadmapId}/industry`, {
        method: "POST",
        token: accessToken,
        credentials: "include",
      });
    } catch (err) {
      console.error("Retrying roadmap sections failed:", err);
    }
    setPollKey((k) => k + 1);
  }, [roadmapId, accessToken]);

  return { data, loading, error, header, sectionsStatus, retrySections };
}
