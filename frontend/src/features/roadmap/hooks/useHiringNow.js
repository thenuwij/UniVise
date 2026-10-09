import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase";
import { assignAds } from "../utils/hiringNow";

const MAX_AGE_DAYS = 30;
const adsBySearch = new Map();

export function useJobAds(roles) {
  const searchKey = Array.from(new Set((roles || []).map((r) => r.ad_search).filter(Boolean))).sort().join("|");
  const [ads, setAds] = useState(() => (searchKey ? adsBySearch.get(searchKey) ?? null : []));

  useEffect(() => {
    if (!searchKey) {
      setAds([]);
      return;
    }
    if (adsBySearch.has(searchKey)) {
      setAds(adsBySearch.get(searchKey));
      return;
    }
    setAds(null);
    let active = true;
    const since = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString();
    supabase
      .from("job_ads")
      .select("ad_id, search_words, title, company, location, posted_at, url")
      .in("search_words", searchKey.split("|"))
      .gte("posted_at", since)
      .order("posted_at", { ascending: false })
      .then(({ data, error }) => {
        const found = error ? [] : data || [];
        if (!error) adsBySearch.set(searchKey, found);
        if (active) setAds(found);
      });
    return () => {
      active = false;
    };
  }, [searchKey]);

  return ads;
}

export function useHiringNow(roles) {
  const ads = useJobAds(roles);
  return useMemo(() => assignAds(roles || [], ads || []), [roles, ads]);
}
