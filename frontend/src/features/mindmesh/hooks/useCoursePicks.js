import { useEffect, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";

export const MYPLAN_URL = "https://myplan.unsw.edu.au/app/home";

export function useCoursePicks(enabled = true) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const [state, setState] = useState({ loading: enabled, picks: [], failed: false, programCode: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !token) return;
    let active = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    apiJson("/course-picks", { token })
      .then((data) => {
        if (active) setState({ loading: false, picks: data.picks || [], failed: !!data.failed, programCode: data.program_code });
      })
      .catch((err) => {
        console.error("Course picks failed:", err);
        if (active) setState({ loading: false, picks: [], failed: true, programCode: null });
      });
    return () => { active = false; };
  }, [enabled, token, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
