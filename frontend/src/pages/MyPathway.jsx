// src/pages/MyPathway.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import SavedItemCard from "../components/pathway/SavedItemCard";
import {
  HiCollection,
  HiClipboard,
  HiUsers,
  HiArrowRight,
  HiBriefcase,
  HiAcademicCap,
  HiBookmark,
} from "react-icons/hi";

function MyPathway() {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("programs");
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  // Fetch saved items
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_saved_items")
        .select("*")
        .eq("user_id", session.user.id)
        .order("saved_at", { ascending: false });

      if (!error && data) {
        setSavedItems(data);
      }
      setLoading(false);
    };

    fetchItems();
  }, [session]);

  // Category filters
  const programItems = savedItems.filter((i) =>
    ["degree", "major", "minor"].includes(i.item_type)
  );
  const specialisationItems = savedItems.filter((i) =>
    ["major", "minor", "specialisation", "honours"].includes(i.item_type)
  );
  const courseItems = savedItems.filter((i) => i.item_type === "course");
  const communityItems = savedItems.filter((i) => i.item_type === "society");
  const industryItems = savedItems.filter((i) => i.item_type === "internship");
  const careerItems = savedItems.filter((i) => i.item_type === "career_path");

  const totalCount = savedItems.length;

  // Handle item removal
  const handleRemove = async (itemId) => {
    const { error } = await supabase
      .from("user_saved_items")
      .delete()
      .eq("id", itemId);

    if (!error) {
      setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  return (
    <div>
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">
          {/* Header Section */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              MyPlanner
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="card-glass-spotlight mt-6 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HiBookmark className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  <p className="text-2xl font-semibold">Your Saved Items</p>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {totalCount} item{totalCount !== 1 ? "s" : ""} saved in your planner
                </p>
              </div>

              {/* Counters */}
              <div className="flex gap-6 text-sm">
                <CountBlock count={programItems.length} label="Programs" color="blue" />
                <CountBlock count={specialisationItems.length} label="Specialisations" color="sky" />
                <CountBlock count={courseItems.length} label="Courses" color="purple" />
                <CountBlock count={communityItems.length} label="Communities" color="indigo" />
                <CountBlock count={industryItems.length} label="Industry" color="amber" />
                <CountBlock count={careerItems.length} label="Careers" color="green" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-6 overflow-x-auto">
              <TabButton
                active={activeTab === "programs"}
                onClick={() => setActiveTab("programs")}
                icon={<HiAcademicCap className="w-5 h-5" />}
                label="Programs"
                count={programItems.length}
              />

              <TabButton
                active={activeTab === "specialisations"}
                onClick={() => setActiveTab("specialisations")}
                icon={<HiCollection className="w-5 h-5" />}
                label="Specialisations"
                count={specialisationItems.length}
              />

              <TabButton
                active={activeTab === "courses"}
                onClick={() => setActiveTab("courses")}
                icon={<HiClipboard className="w-5 h-5" />}
                label="Courses"
                count={courseItems.length}
              />

              <TabButton
                active={activeTab === "communities"}
                onClick={() => setActiveTab("communities")}
                icon={<HiUsers className="w-5 h-5" />}
                label="Communities"
                count={communityItems.length}
              />

              <TabButton
                active={activeTab === "industry"}
                onClick={() => setActiveTab("industry")}
                icon={<HiBriefcase className="w-5 h-5" />}
                label="Industry Opportunities"
                count={industryItems.length}
              />

              <TabButton
                active={activeTab === "careers"}
                onClick={() => setActiveTab("careers")}
                icon={<HiBriefcase className="w-5 h-5" />}
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

          {/* Back to Planner */}
          <div className="mb-16">
            <button
              onClick={() => navigate("/planner")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <HiArrowRight className="w-5 h-5 rotate-180" />
              <span>Back to My Planner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function CountBlock({ count, label, color }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    sky: "text-sky-600 dark:text-sky-400",
    purple: "text-purple-600 dark:text-purple-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    amber: "text-amber-600 dark:text-amber-400",
    green: "text-green-600 dark:text-green-400",
  };

  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{count}</p>
      <p className="text-gray-600 dark:text-gray-400 text-xs">{label}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-sky-500 text-sky-600 dark:text-sky-400 font-semibold"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold">
        {count}
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12">
      <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <HiBookmark className="w-8 h-8 text-slate-400 animate-pulse" />
      </div>
      <p className="text-gray-500 dark:text-gray-400">Loading your saved items...</p>
    </div>
  );
}

function TabContent({ items, emptyMessage, emptyDescription, emptyAction, emptyActionText, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="card-glass-spotlight p-12 text-center">
        <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <HiBookmark className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {emptyDescription}
        </p>
        <button
          onClick={emptyAction}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:shadow-lg transition"
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