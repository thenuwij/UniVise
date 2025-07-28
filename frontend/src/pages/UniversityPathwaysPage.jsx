import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function UniversityPathwaysPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const options = [
    {
      label: "Explore by Degree",
      route: "/explore-by-degree",
      bg: "bg-blue-100 hover:bg-blue-200 text-blue-900",
    },
    {
      label: "Explore by Course",
      route: "/explore-by-course",
      bg: "bg-green-100 hover:bg-green-200 text-green-900",
    },
    {
      label: "Explore by Major",
      route: "/explore-by-major",
      bg: "bg-yellow-100 hover:bg-yellow-200 text-yellow-900",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <div className="flex flex-col items-center justify-center py-24 px-6">
        <h1 className="text-6xl font-light text-slate-800 mb-8 text-center">
          University Pathways
        </h1>
        <p className="text-xl text-slate-600 mb-20 text-center max-w-2xl">
          Start by selecting how you want UniVise to guide you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 w-full max-w-5xl">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => navigate(option.route)}
              className={`cursor-pointer ${option.bg} text-2xl font-medium py-12 rounded-2xl flex items-center justify-center text-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UniversityPathwaysPage;
