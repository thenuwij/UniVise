import { useEffect, useState } from "react";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi";
import toast from "react-hot-toast";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { canonicalType, typeAliases } from "@/features/saved/utils/shortlist";
const CHANGE_EVENT = "univise-shortlist-change";

export default function SaveButton({
  itemType,
  itemId,
  className = "",
  itemName = null,
  itemData = {},
}) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setIsSaved(false);
    if (!userId || !itemId) return;
    supabase
      .from("user_saved_items")
      .select("id")
      .eq("user_id", userId)
      .in("item_type", typeAliases(itemType))
      .eq("item_id", String(itemId))
      .limit(1)
      .then(({ data, error }) => {
        if (active && !error) setIsSaved(!!data?.length);
      });
    return () => {
      active = false;
    };
  }, [userId, itemType, itemId]);
  useEffect(() => {
    const sync = ({ detail }) => {
      if (
        detail.userId === userId &&
        detail.itemType === canonicalType(itemType) &&
        detail.itemId === String(itemId)
      )
        setIsSaved(detail.saved);
    };
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, [userId, itemType, itemId]);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!userId) return toast.error("Sign in to save to your shortlist.");
    if (isLoading || !itemId) return;
    setIsLoading(true);
    try {
      const { error } = isSaved
        ? await supabase
            .from("user_saved_items")
            .delete()
            .eq("user_id", userId)
            .in("item_type", typeAliases(itemType))
            .eq("item_id", String(itemId))
        : await supabase
            .from("user_saved_items")
            .insert({
              user_id: userId,
              item_type: canonicalType(itemType),
              item_id: String(itemId),
              item_name: itemName,
              item_data: itemData,
            });
      if (error) throw error;
      setIsSaved(!isSaved);
      window.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, {
          detail: {
            userId,
            itemType: canonicalType(itemType),
            itemId: String(itemId),
            saved: !isSaved,
          },
        }),
      );
      toast.success(
        isSaved ? "Removed from your shortlist" : "Saved to your shortlist",
      );
    } catch {
      toast.error("Couldn't update your shortlist. Try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const label = isSaved ? "Remove from shortlist" : "Save to shortlist";
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || !itemId}
      title={label}
      aria-label={`${label}${itemName ? `: ${itemName}` : ""}`}
      aria-pressed={isSaved}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-xl border p-2 transition-colors disabled:opacity-50 ${isSaved ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "border-line text-ink-muted hover:border-blue-400 hover:text-link"} ${className}`}
    >
      {isSaved ? (
        <HiBookmark className="h-5 w-5" />
      ) : (
        <HiOutlineBookmark className="h-5 w-5" />
      )}
    </button>
  );
}
