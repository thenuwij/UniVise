import { useCallback, useEffect, useRef, useState } from "react";
import { UserAuth } from "@/app/AuthContext";
import { apiJson } from "@/shared/lib/api";

const POLL_MS = 5000;
const POLL_FOR_MS = 4 * 60 * 1000;
const LOAD_RETRY_MS = [2000, 4000];

export function useCareersFeed(roadmapId) {
  const { session } = UserAuth();
  const token = session?.access_token;
  const [sources, setSources] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const refreshing = useRef(new Set());

  const setSource = useCallback((state) => {
    setSources((prev) => ({ ...(prev || {}), [state.source]: state }));
  }, []);

  const refresh = useCallback(
    async (source) => {
      if (!roadmapId || !token || refreshing.current.has(source)) return;
      refreshing.current.add(source);
      setSources((prev) => ({ ...(prev || {}), [source]: { ...(prev?.[source] || { source, items: [] }), status: "running" } }));
      try {
        const state = await apiJson("/careers/refresh", { method: "POST", token, body: { roadmap_id: roadmapId, source } });
        setSource(state);
      } catch (err) {
        console.error(`Refreshing ${source} failed:`, err);
        setSources((prev) => ({ ...(prev || {}), [source]: { ...(prev?.[source] || { source, items: [] }), status: "failed" } }));
      } finally {
        refreshing.current.delete(source);
      }
    },
    [roadmapId, token, setSource]
  );

  useEffect(() => {
    if (!roadmapId || !token) return;
    let active = true;
    let retryTimer = null;
    const load = (attempt) =>
      apiJson(`/careers/feed?roadmap_id=${encodeURIComponent(roadmapId)}`, { token })
        .then((feed) => {
          if (!active) return;
          setSources(Object.fromEntries(feed.sources.map((s) => [s.source, s])));
          feed.sources.filter((s) => s.stale).forEach((s) => refresh(s.source));
        })
        .catch((err) => {
          if (!active) return;
          if (attempt < LOAD_RETRY_MS.length) {
            retryTimer = setTimeout(() => load(attempt + 1), LOAD_RETRY_MS[attempt]);
            return;
          }
          console.error("Loading the careers feed failed:", err);
          setLoadFailed(true);
        });
    load(0);
    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, [roadmapId, token, refresh, loadKey]);

  const retryLoad = useCallback(() => {
    setLoadFailed(false);
    setLoadKey((key) => key + 1);
  }, []);

  const waitingOnOthers = !!sources && Object.values(sources).some((s) => s.status === "running" && !refreshing.current.has(s.source));

  useEffect(() => {
    if (!waitingOnOthers || !roadmapId || !token) return;
    const started = Date.now();
    const id = setInterval(async () => {
      if (Date.now() - started > POLL_FOR_MS) return clearInterval(id);
      try {
        const feed = await apiJson(`/careers/feed?roadmap_id=${encodeURIComponent(roadmapId)}`, { token });
        setSources((prev) => {
          const next = { ...(prev || {}) };
          for (const s of feed.sources) if (!refreshing.current.has(s.source)) next[s.source] = s;
          return next;
        });
      } catch (err) {
        console.error("Polling the careers feed failed:", err);
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [waitingOnOthers, roadmapId, token]);

  return { sources, loadFailed, retryLoad, refresh };
}
