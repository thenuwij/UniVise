// src/components/pathway/SavedCollectionTabs.jsx
import React, { useState } from "react";
import SavedItemCard from "./SavedItemCard";
import { supabase } from "../../supabaseClient";

const TABS = [
  { key: "all", label: "All Items" },
  { key: "degree", label: "Degrees" },
  { key: "course", label: "Courses" },
  { key: "society", label: "Opportunities" },
  { key: "internship", label: "Internships" },
  { key: "career_path", label: "Career Paths" },
];

export default function SavedCollectionTabs({ items, refresh }) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? items
      : items.filter((i) => i.item_type === active);

  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              active === t.key
                ? "bg-sky-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-primary hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <SavedItemCard
            key={item.id}
            item={item}
            onRemove={async (id) => {
              await supabase.from("user_saved_items").delete().eq("id", id);
              refresh();
            }}
          />
        ))}
      </div>
    </div>
  );
}
