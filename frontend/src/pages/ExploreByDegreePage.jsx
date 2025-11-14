import React, { useState, useEffect } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import DegreeSearch from "../components/DegreeSearch"; // Supabase-connected
import { supabase } from "../supabaseClient";

function ExploreByDegreePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState(null);
  
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300/80 to-slate-400/40
                    dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 relative">
      
      {/* Background decorative elements */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-sky-200/30 via-blue-200/20 to-transparent rounded-full blur-3xl dark:opacity-20" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-200/20 via-purple-200/10 to-transparent rounded-full blur-3xl dark:opacity-20" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/30 via-cyan-100/20 to-transparent rounded-full blur-3xl dark:opacity-20" />
      </div>

      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      
      <div className="relative max-w-7xl mx-auto py-24 px-6">
        <DegreeSearch onSelectDegree={setSelectedDegree} />
        
        {/* You can enable this once DegreeDetailCard is ready */}
        {/* {selectedDegree && (
          <div className="mt-10">
            <DegreeDetailCard degree={selectedDegree} />
          </div>
        )} */}
      </div>
    </div>
  );
}

export default ExploreByDegreePage;