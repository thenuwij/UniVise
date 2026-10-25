import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";

const SAVED_AD_TYPE = "job_ad";

const adSnapshot = (ad) => ({ ...ad });

export function useSavedAds() {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [savedIds, setSavedIds] = useState(() => new Set());

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("user_saved_items")
      .select("item_id")
      .eq("user_id", userId)
      .eq("item_type", SAVED_AD_TYPE)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Loading saved jobs failed:", error);
          return;
        }
        setSavedIds(new Set(data.map((row) => row.item_id)));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const setSaved = useCallback((id, saved) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSave = useCallback(
    async (ad) => {
      if (!userId) {
        toast.error("Sign in to save jobs");
        return;
      }
      const wasSaved = savedIds.has(ad.id);
      setSaved(ad.id, !wasSaved);
      const { error } = wasSaved
        ? await supabase
            .from("user_saved_items")
            .delete()
            .eq("user_id", userId)
            .eq("item_type", SAVED_AD_TYPE)
            .eq("item_id", ad.id)
        : await supabase.from("user_saved_items").insert({
            user_id: userId,
            item_type: SAVED_AD_TYPE,
            item_id: ad.id,
            item_name: ad.title,
            item_data: adSnapshot(ad),
          });
      if (error) {
        console.error("Updating saved jobs failed:", error);
        setSaved(ad.id, wasSaved);
        toast.error("Couldn't update your shortlist. Try again.");
        return;
      }
      toast.success(wasSaved ? "Removed from your shortlist" : "Saved to your shortlist");
    },
    [userId, savedIds, setSaved]
  );

  return { savedIds, toggleSave };
}
