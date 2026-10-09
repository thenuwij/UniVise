import { useEffect, useState } from "react";
import {
  HiBookmark,
  HiBriefcase,
  HiOfficeBuilding,
  HiUsers,
  HiViewGrid,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "@/shared/layout/DashboardNavBar";
import { MenuBar } from "@/shared/layout/MenuBar";
import PageHeader from "@/shared/layout/PageHeader";
import { card } from "@/shared/ui/cardStyles";
import SavedItemCard from "../components/SavedItemCard";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";

const SHORTLIST_TYPES = ["career_path", "internship", "society"];
const TYPE_OF = { careers: "career_path", internships: "internship", societies: "society" };

function SavedItemsPage() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_saved_items")
        .select("*")
        .eq("user_id", session.user.id)
        .order("saved_at", { ascending: false });
      if (!error && data) setSavedItems(data.filter((i) => SHORTLIST_TYPES.includes(i.item_type)));
      setLoading(false);
    };
    fetchItems();
  }, [session]);

  const careerItems      = savedItems.filter((i) => i.item_type === "career_path");
  const internshipItems  = savedItems.filter((i) => i.item_type === "internship");
  const societyItems     = savedItems.filter((i) => i.item_type === "society");

  const tabs = [
    { id: "all", label: "All", icon: <HiViewGrid className="w-4 h-4" />, items: savedItems },
    { id: "careers", label: "Careers", icon: <HiBriefcase className="w-4 h-4" />, items: careerItems },
    { id: "internships", label: "Internships", icon: <HiOfficeBuilding className="w-4 h-4" />, items: internshipItems },
    { id: "societies", label: "Societies", icon: <HiUsers className="w-4 h-4" />, items: societyItems },
  ];
  const active = tabs.find((t) => t.id === activeTab) || tabs[0];

  useEffect(() => {
    if (activeTab !== "all" && !savedItems.some((i) => i.item_type === TYPE_OF[activeTab])) setActiveTab("all");
  }, [savedItems, activeTab]);

  const handleRemove = async (itemId) => {
    const { error } = await supabase.from("user_saved_items").delete().eq("id", itemId);
    if (!error) setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const withNotes = savedItems.filter((i) => i.personal_notes?.trim()).length;

  return (
    <div className="min-h-screen app-page">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      <PageHeader
        eyebrow="Your careers"
        title="My shortlist"
        subtitle={`${savedItems.length} item${savedItems.length !== 1 ? "s" : ""} saved${withNotes > 0 ? ` · ${withNotes} with notes` : ""}`}
      />

      <main className="max-w-[1440px] mx-auto px-5 md:px-10 py-8 space-y-6">
        {savedItems.length > 0 && (
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter your shortlist">
            {tabs.map((tab) => {
              const on = tab.id === active.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  disabled={!tab.items.length}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    on
                      ? "text-white bg-blue-600 border-blue-600"
                      : "text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`px-1.5 rounded-full text-xs font-bold ${on ? "bg-white/25" : "bg-white/70 dark:bg-slate-900/50"}`}>{tab.items.length}</span>
                </button>
              );
            })}
          </nav>
        )}

        {loading ? (
          <LoadingState />
        ) : active.items.length === 0 ? (
          <EmptyState onAction={() => navigate(roadmapStepUrl("careers"))} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.items.map((item) => (
              <SavedItemCard key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading your shortlist...</p>
    </div>
  );
}

function EmptyState({ onAction }) {
  return (
    <div className={`${card} p-10 text-center`}>
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
        <HiBookmark className="w-7 h-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-ink-strong">Nothing saved yet</h3>
      <p className="mt-2 text-[15px] text-ink-muted max-w-md mx-auto">
        Use the save button on careers, internships and societies in your roadmap. They'll collect here so you can compare them and add notes.
      </p>
      <button type="button" onClick={onAction} className="button-primary mt-6 px-5 py-2.5 rounded-xl text-sm font-bold">
        Open the Careers step
      </button>
    </div>
  );
}

export default SavedItemsPage;
