// src/pages/MyPathway.jsx
import { useEffect, useState } from "react";
import {
  HiAcademicCap,
  HiArrowLeft,
  HiBookmark,
  HiBriefcase,
  HiClipboard,
  HiCollection,
  HiUsers,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import SavedItemCard from "../components/pathway/SavedItemCard";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

function MyPathway() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("programs");
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

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

  const programItems = savedItems.filter((i) => ["degree", "major", "minor"].includes(i.item_type));
  const specialisationItems = savedItems.filter((i) => ["major", "minor", "specialisation", "honours"].includes(i.item_type));
  const courseItems = savedItems.filter((i) => i.item_type === "course");
  const communityItems = savedItems.filter((i) => i.item_type === "society");
  const industryItems = savedItems.filter((i) => i.item_type === "internship");
  const careerItems = savedItems.filter((i) => i.item_type === "career_path");

  const totalCount = savedItems.length;

  const handleRemove = async (itemId) => {
    const { error } = await supabase.from("user_saved_items").delete().eq("id", itemId);
    if (!error) setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">
          
          {/* Back Button */}
          <button
            onClick={() => navigate("/planner")}
            className="flex items-center gap-2 mt-8 mb-6 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span>Back to My Planner</span>
          </button>

          {/* Header Badge */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
              My Planner
            </div>
          </div>


          {/* Stats Card */}
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/40">
                    <HiBookmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Your Saved Items</h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {totalCount} item{totalCount !== 1 ? "s" : ""} saved in your planner
                </p>
              </div>

              <div className="flex gap-8">
                <CountBlock count={programItems.length} label="Programs" />
                <CountBlock count={specialisationItems.length} label="Specialisations" />
                <CountBlock count={courseItems.length} label="Courses" />
                <CountBlock count={communityItems.length} label="Communities" />
                <CountBlock count={industryItems.length} label="Industry" />
                <CountBlock count={careerItems.length} label="Careers" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
            <nav className="flex gap-1 overflow-x-auto">
              <TabButton
                active={activeTab === "programs"}
                onClick={() => setActiveTab("programs")}
                icon={<HiAcademicCap className="w-4 h-4" />}
                label="Programs"
                count={programItems.length}
              />
              <TabButton
                active={activeTab === "specialisations"}
                onClick={() => setActiveTab("specialisations")}
                icon={<HiCollection className="w-4 h-4" />}
                label="Specialisations"
                count={specialisationItems.length}
              />
              <TabButton
                active={activeTab === "courses"}
                onClick={() => setActiveTab("courses")}
                icon={<HiClipboard className="w-4 h-4" />}
                label="Courses"
                count={courseItems.length}
              />
              <TabButton
                active={activeTab === "communities"}
                onClick={() => setActiveTab("communities")}
                icon={<HiUsers className="w-4 h-4" />}
                label="Communities"
                count={communityItems.length}
              />
              <TabButton
                active={activeTab === "industry"}
                onClick={() => setActiveTab("industry")}
                icon={<HiBriefcase className="w-4 h-4" />}
                label="Industry"
                count={industryItems.length}
              />
              <TabButton
                active={activeTab === "careers"}
                onClick={() => setActiveTab("careers")}
                icon={<HiBriefcase className="w-4 h-4" />}
                label="Careers"
                count={careerItems.length}
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8 pb-16">
            {loading ? (
              <LoadingState />
            ) : (
              <>
                {activeTab === "programs" && (
                  <TabContent
                    items={programItems}
                    emptyMessage="No programs saved yet"
                    emptyDescription="Save degrees, majors, and minors from Explore or Roadmap"
                    emptyAction={() => navigate("/explore-by-degree")}
                    emptyActionText="Explore Programs"
                    onRemove={handleRemove}
                  />
                )}
                {activeTab === "specialisations" && (
                  <TabContent
                    items={specialisationItems}
                    emptyMessage="No specialisations saved yet"
                    emptyDescription="Save majors or minors to track your study focus"
                    emptyAction={() => navigate("/roadmap")}
                    emptyActionText="View My Roadmap"
                    onRemove={handleRemove}
                  />
                )}
                {activeTab === "courses" && (
                  <TabContent
                    items={courseItems}
                    emptyMessage="No courses saved yet"
                    emptyDescription="Save courses you want to study"
                    emptyAction={() => navigate("/explore-by-course")}
                    emptyActionText="Explore Courses"
                    onRemove={handleRemove}
                  />
                )}
                {activeTab === "communities" && (
                  <TabContent
                    items={communityItems}
                    emptyMessage="No communities saved yet"
                    emptyDescription="Save societies you want to join"
                    emptyAction={() => navigate("/roadmap")}
                    emptyActionText="View My Roadmap"
                    onRemove={handleRemove}
                  />
                )}
                {activeTab === "industry" && (
                  <TabContent
                    items={industryItems}
                    emptyMessage="No industry opportunities yet"
                    emptyDescription="Save internships and placements from your Roadmap"
                    emptyAction={() => navigate("/roadmap")}
                    emptyActionText="View My Roadmap"
                    onRemove={handleRemove}
                  />
                )}
                {activeTab === "careers" && (
                  <TabContent
                    items={careerItems}
                    emptyMessage="No career paths saved yet"
                    emptyDescription="Save career progressions from your Roadmap"
                    emptyAction={() => navigate("/roadmap")}
                    emptyActionText="View My Roadmap"
                    onRemove={handleRemove}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountBlock({ count, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
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
      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium">
        {count}
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading your saved items...</p>
    </div>
  );
}

function TabContent({ items, emptyMessage, emptyDescription, emptyAction, emptyActionText, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <HiBookmark className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          {emptyDescription}
        </p>
        <button
          onClick={emptyAction}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          {emptyActionText}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <SavedItemCard key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}

export default MyPathway;