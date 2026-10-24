import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";

export function useCareerCertifications(roadmapId) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const [state, setState] = useState({ loading: !!roadmapId, careers: [], groups: [], failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!roadmapId || !token) return;
    let active = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    apiJson(`/careers/certifications?roadmap_id=${encodeURIComponent(roadmapId)}`, { token })
      .then((data) => {
        if (active) setState({ loading: false, careers: data.careers || [], groups: data.groups || [], failed: !!data.failed });
      })
      .catch((err) => {
        console.error("Certifications failed:", err);
        if (active) setState({ loading: false, careers: [], groups: [], failed: true });
      });
    return () => { active = false; };
  }, [roadmapId, token, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
