import { useState } from "react";
import { HiAcademicCap, HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import DegreeSearchPlanner from "../components/DegreeSearchPlanner";
import { MenuBar } from "../components/MenuBar";


function ExploreByDegreePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState(null);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        
        <div className="flex flex-col justify-center h-full px-10 xl:px-20">

          <button
            onClick={() => navigate("/planner")}
            className="group inline-flex items-center gap-2 mt-8 mb-6 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 shadow-sm transition-all"
          >
            <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to My Planner
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg p-8 mb-16">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30">
                <HiAcademicCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Search Programs
              </h2>
            </div>

            {/* Search Component */}
            <DegreeSearchPlanner onSelectDegree={setSelectedDegree} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ExploreByDegreePage;