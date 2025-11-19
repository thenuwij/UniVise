// src/components/SaveButton.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi";

function SaveButton({ itemType, itemId, className = "", itemName = null, itemData = {} }) {
  const { session } = UserAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCleanData = async () => {
    try {
      if (itemType === "program") {
        const { data } = await supabase
          .from("unsw_degrees_final")
          .select("*")
          .eq("id", itemId)
          .maybeSingle();

        if (!data) return null;

        return {
          degree_code: data.degree_code,
          program_name: data.program_name,
          faculty: data.faculty,
          duration: data.duration,
          minimum_uoc: data.minimum_uoc,
        };
      }

      if (itemType === "specialisation") {
        const { data } = await supabase
          .from("unsw_specialisations")
          .select("*")
          .eq("id", itemId)
          .maybeSingle();

        if (!data) return null;

        return {
          major_code: data.major_code,
          major_name: data.major_name,
          specialisation_type: data.specialisation_type,
          faculty: data.faculty,
          uoc_required: data.uoc_required,
        };
      }

      // fallback for all other types
      return itemData;

    } catch (e) {
      console.error("fetchCleanData error:", e);
      return itemData;
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from("user_saved_items")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle()
      .then(({ data }) => setIsSaved(!!data));
  }, [session, itemType, itemId]);


  const handleClick = async (e) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      alert("Please sign in to save items");
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        await supabase
          .from("user_saved_items")
          .delete()
          .eq("user_id", session.user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        setIsSaved(false);
      } else {
        const cleanData = await fetchCleanData();

        await supabase.from("user_saved_items").insert({
          user_id: session.user.id,
          item_type: itemType,
          item_id: itemId,
          item_name: itemName,
          item_data: cleanData,
        });

        setIsSaved(true);
      }
    } catch (err) {
      console.error("SaveButton error:", err);
      alert("Failed to save item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={isSaved ? "Remove from planner" : "Save to planner"}
      className={`
        group flex items-center gap-2 px-4 py-2 rounded-xl border-2
        transition-all duration-200 font-semibold whitespace-nowrap
        ${isSaved
          ? "border-sky-600 dark:border-sky-500 text-sky-700 dark:text-sky-400"
          : "border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-500 dark:hover:border-slate-500"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {isSaved ? (
        <HiBookmark className="w-5 h-5" />
      ) : (
        <HiOutlineBookmark className="w-5 h-5" />
      )}

      <span className="text-sm font-semibold">
        {isSaved ? "Saved to Planner" : "Save to Planner"}
      </span>
    </button>
  );
}

export default SaveButton;
