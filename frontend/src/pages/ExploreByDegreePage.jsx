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
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-light text-slate-800 mb-12 text-center">
          Explore by Degree
        </h1>

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
