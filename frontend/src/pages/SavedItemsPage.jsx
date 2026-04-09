// src/pages/SavedItemsPage.jsx
import { useEffect, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookmark,
  HiBriefcase,
  HiClipboard,
  HiCollection,
  HiUsers,
  HiViewGrid,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SavedItemCard from "../components/pathway/SavedItemCard";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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
      if (!error && data) setSavedItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [session]);

  // Fixed: programs = degree only (no overlap with specialisations)
  const degreeItems        = savedItems.filter((i) => i.item_type === "degree");
  const specialisationItems = savedItems.filter((i) => ["major", "minor", "specialisation", "honours"].includes(i.item_type));
  const courseItems        = savedItems.filter((i) => i.item_type === "course");
  const communityItems     = savedItems.filter((i) => i.item_type === "society");
  const industryItems      = savedItems.filter((i) => i.item_type === "internship");
  const careerItems        = savedItems.filter((i) => i.item_type === "career_path");

  const ALL_TABS = [
    { id: "all",             label: "All",             icon: <HiViewGrid className="w-4 h-4" />,     items: savedItems },
    { id: "programs",        label: "Programs",        icon: <HiAcademicCap className="w-4 h-4" />,  items: degreeItems },
    { id: "specialisations", label: "Specialisations", icon: <HiCollection className="w-4 h-4" />,   items: specialisationItems },
    { id: "courses",         label: "Courses",         icon: <HiClipboard className="w-4 h-4" />,    items: courseItems },
    { id: "communities",     label: "Communities",     icon: <HiUsers className="w-4 h-4" />,        items: communityItems },
    { id: "industry",        label: "Industry",        icon: <HiBriefcase className="w-4 h-4" />,    items: industryItems },
    { id: "careers",         label: "Careers",         icon: <HiBriefcase className="w-4 h-4" />,    items: careerItems },
  ];

  const visibleTabs = ALL_TABS;
  const activeItems = ALL_TABS.find((t) => t.id === activeTab)?.items ?? savedItems;

  // If current tab becomes empty (after remove), fall back to "all"
  useEffect(() => {
    const tab = ALL_TABS.find((t) => t.id === activeTab);
    if (tab && tab.id !== "all" && tab.items.length === 0) setActiveTab("all");
  }, [savedItems]);

  const handleRemove = async (itemId) => {
    const { error } = await supabase.from("user_saved_items").delete().eq("id", itemId);
    if (!error) setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const emptyActions = {
    programs:        { action: () => navigate("/explore-by-degree"),  text: "Explore Programs" },
    specialisations: { action: () => navigate("/roadmap"),            text: "View My Roadmap" },
    courses:         { action: () => navigate("/explore-by-course"),  text: "Explore Courses" },
    communities:     { action: () => navigate("/roadmap"),            text: "View My Roadmap" },
    industry:        { action: () => navigate("/roadmap"),            text: "View My Roadmap" },
    careers:         { action: () => navigate("/roadmap"),            text: "View My Roadmap" },
    all:             { action: () => navigate("/roadmap"),            text: "View My Roadmap" },
  };

  const withNotes = savedItems.filter((i) => i.personal_notes?.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={() => setIsOpen(true)} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />
      </div>

      <div className="pt-16 sm:pt-20 px-4 sm:px-10 xl:px-20 max-w-7xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate("/planner")}
          className="flex items-center gap-2 mt-8 mb-6 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to My Planner
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium mb-3">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
              My Planner
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Items</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {savedItems.length} item{savedItems.length !== 1 ? "s" : ""} saved
              {withNotes > 0 && ` · ${withNotes} with notes`}
            </p>
          </div>

          {/* Mini stat pills */}
          {!loading && savedItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ALL_TABS.filter((t) => t.id !== "all" && t.items.length > 0).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeTab === t.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {t.items.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
                count={tab.items.length}
              />
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6 pb-16">
          {loading ? (
            <LoadingState />
          ) : activeItems.length === 0 ? (
            <EmptyState
              tab={activeTab}
              onAction={emptyActions[activeTab]?.action}
              actionText={emptyActions[activeTab]?.text}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeItems.map((item) => (
                <SavedItemCard key={item.id} item={item} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
        active
          ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-medium"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
          active ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                 : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading your saved items...</p>
    </div>
  );
}

function EmptyState({ tab, onAction, actionText }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        <HiBookmark className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {tab === "all" ? "Nothing saved yet" : `No ${tab} saved yet`}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
        Save items from your Roadmap, Explore, and other sections to track what interests you.
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default SavedItemsPage;
