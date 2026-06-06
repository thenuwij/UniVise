// src/pages/MyPlannerPage.jsx
import { useState } from "react";
import {
  HiArrowRight,
  HiBookmark,
  HiClipboard,
  HiCollection,
  HiUsers,
  HiChevronRight,
  HiAcademicCap,
  HiUserGroup,
  HiBriefcase,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";

function MyPlannerPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} isMenuOpen={isOpen} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>

      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full mx-20">
          {/* HEADER */}
          <div className="mt-6 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium shadow-sm mb-4">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Planner
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-sky-600">
                Plan
              </span>{" "}
              Your Journey
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              View your saved items, or explore the UNSW handbook
            </p>
          </div>

          {/* Saved Items — full width */}
          <div
            onClick={() => navigate("/saved")}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(79,70,229,0.25)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.08),0_16px_40px_-16px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group mb-12"
          >
            {/* gradient wash + glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/20" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_260px_at_95%_-15%,rgba(99,102,241,0.16),transparent),radial-gradient(460px_240px_at_-5%_115%,rgba(56,189,248,0.12),transparent)]" />
            {/* top accent line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 opacity-70" />

            <div className="relative p-8 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm shadow-indigo-500/30">
                      <HiBookmark className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500 dark:text-indigo-300">Your library</span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-4">Saved Items</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                    Everything you've bookmarked across UniVise, organised and in one place.
                  </p>
                </div>

                <button className="button-primary shrink-0 px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap">
                  Open Library
                  <HiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Category tiles */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Programs", icon: <HiAcademicCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, desc: "Degrees & specialisations" },
                  { label: "Communities", icon: <HiUserGroup className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, desc: "Courses & student groups" },
                  { label: "Careers", icon: <HiBriefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, desc: "Industries & pathways" },
                ].map(({ label, icon, desc }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm px-4 py-3.5 group-hover:border-indigo-200 dark:group-hover:border-indigo-700/50 transition-colors"
                  >
                    <div className="shrink-0 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION HEADER */}
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Explore UNSW Handbook</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse the full catalogue of degrees, specialisations and courses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
            {[
              {
                route: "/explore-by-degree",
                label: "Degrees",
                desc: "Browse all UNSW degree programs, structures and entry requirements",
                icon: <HiCollection className="w-6 h-6 text-blue-600 dark:text-blue-300" />,
                card: "from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900 border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600",
                chip: "bg-blue-100/70 dark:bg-blue-900/30 group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
                glow: "bg-[radial-gradient(300px_140px_at_90%_-10%,rgba(37,99,235,0.16),transparent)]",
                accent: "from-blue-500 to-indigo-500",
                chevron: "text-blue-400",
              },
              {
                route: "/explore-by-specialisation",
                label: "Specialisations",
                desc: "Explore majors, minors and honours pathways available at UNSW",
                icon: <HiUsers className="w-6 h-6 text-violet-600 dark:text-violet-300" />,
                card: "from-violet-50/80 to-white dark:from-violet-950/30 dark:to-slate-900 border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-600",
                chip: "bg-violet-100/70 dark:bg-violet-900/30 group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
                glow: "bg-[radial-gradient(300px_140px_at_90%_-10%,rgba(124,58,237,0.16),transparent)]",
                accent: "from-violet-500 to-purple-500",
                chevron: "text-violet-400",
              },
              {
                route: "/explore-by-course",
                label: "Courses",
                desc: "Search individual courses, check prerequisites and see how they fit your plan",
                icon: <HiClipboard className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />,
                card: "from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-600",
                chip: "bg-emerald-100/70 dark:bg-emerald-900/30 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
                glow: "bg-[radial-gradient(300px_140px_at_90%_-10%,rgba(5,150,105,0.16),transparent)]",
                accent: "from-emerald-500 to-teal-500",
                chevron: "text-emerald-400",
              },
            ].map(({ route, label, desc, icon, card, chip, glow, accent, chevron }) => (
              <div
                key={route}
                onClick={() => navigate(route)}
                className={`relative overflow-hidden flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br border shadow-sm active:scale-[0.98] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group ${card}`}
              >
                <div className={`pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity ${glow}`} />
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent} opacity-80`} />
                <HiChevronRight className={`absolute top-5 right-5 w-4 h-4 ${chevron} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`} />

                <div className="relative flex items-center gap-4">
                  <div className={`p-3 rounded-xl shadow-sm transition-colors duration-200 [&>svg]:group-hover:text-white ${chip}`}>
                    {icon}
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{label}</p>
                </div>
                <p className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPlannerPage;
