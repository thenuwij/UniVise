import React, { useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import CourseSearch from "../components/CourseSearch";

function ExploreByCoursePage() {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="max-w-5xl mx-auto py-20 px-6">

        <CourseSearch />
      </div>
    </div>
  );
}

export default ExploreByCoursePage;
