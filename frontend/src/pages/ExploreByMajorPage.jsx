import React, { useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import MajorSearch from "../components/MajorSearch"; // Will handle search, filter, and results

function ExploreByMajorPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState(null);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-5xl font-light text-slate-800 mb-12 text-center">
          Explore Majors
        </h1>

        <MajorSearch onSelectMajor={setSelectedMajor} />

        {/* Optionally add a detailed card here */}
        {/* {selectedMajor && (
          <div className="mt-10">
            <MajorDetailCard major={selectedMajor} />
          </div>
        )} */}
      </div>
    </div>
  );
}

export default ExploreByMajorPage;
