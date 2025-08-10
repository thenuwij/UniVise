// src/pages/PlannerSwitchPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { HiSwitchHorizontal } from "react-icons/hi";

export default function PlannerSwitchPage() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // --- Static placeholders (no backend calls yet) ---
  const degrees = [
    { id: "425800", label: "BSc (Computer Science) — UNSW" },
    { id: "3778", label: "BE (Software) — UNSW" },
    { id: "3521", label: "BCom (Information Systems) — UNSW" },
  ];

  const specialisationsByDegree = {
    "425800": [
      { id: "CS", label: "Computer Science" },
      { id: "AI", label: "Artificial Intelligence" },
      { id: "SEMIN", label: "Software Eng (Minor)" },
    ],
    "3778": [
      { id: "SENG", label: "Software Engineering" },
      { id: "CE", label: "Computer Engineering" },
    ],
    "3521": [
      { id: "INFO", label: "Information Systems" },
      { id: "BUSAN", label: "Business Analytics" },
    ],
  };

  const [fromDegree, setFromDegree] = useState("");
  const [fromSpec, setFromSpec] = useState("");
  const [toDegree, setToDegree] = useState("");
  const [toSpec, setToSpec] = useState("");

  const fromSpecs = useMemo(() => (fromDegree ? specialisationsByDegree[fromDegree] ?? [] : []), [fromDegree]);
  const toSpecs = useMemo(() => (toDegree ? specialisationsByDegree[toDegree] ?? [] : []), [toDegree]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
      <DashboardNavBar onMenuClick={() => setIsOpen(true)} />
      <MenuBar isOpen={isOpen} handleClose={() => setIsOpen(false)} />

      {/* Header */}
      <div className="max-w-7xl mx-auto pt-10 pb-4 px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow hover:bg-slate-50"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 text-slate-700">
            <HiSwitchHorizontal className="w-6 h-6 text-sky-700" />
            <h1 className="text-2xl md:text-3xl font-bold">Switch Majors (Preview)</h1>
          </div>
          <div />
        </div>
        <p className="mt-2 text-slate-600">
          Compare your current path <em>(FROM)</em> with a target path <em>(TO)</em>. We’ll surface WAM eligibility,
          UOC carry-over, and what changes. (Static UI only for now.)
        </p>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic Status */}
          <section className="lg:col-span-1 rounded-3xl p-6 bg-white shadow-md border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Academic Status</h2>
            <p className="text-sm text-slate-600 mt-1">Placeholder stats for preview.</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatBox label="WAM" value="72.4" />
              <StatBox label="UOC Completed" value="72" />
              <StatBox label="UOC Remaining" value="96" />
            </div>
          </section>

          {/* FROM / TO */}
          <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FROM */}
            <div className="rounded-3xl p-6 bg-white shadow-md border border-slate-200">
              <h3 className="text-base md:text-lg font-semibold text-slate-900">FROM</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                  <select
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={fromDegree}
                    onChange={(e) => {
                      setFromDegree(e.target.value);
                      setFromSpec("");
                    }}
                  >
                    <option value="">Select degree…</option>
                    {degrees.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialisation</label>
                  <select
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 disabled:opacity-60"
                    value={fromSpec}
                    onChange={(e) => setFromSpec(e.target.value)}
                    disabled={!fromDegree}
                  >
                    <option value="">{fromDegree ? "Select specialisation…" : "Select a degree first"}</option>
                    {fromSpecs.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* TO */}
            <div className="rounded-3xl p-6 bg-white shadow-md border border-slate-200">
              <h3 className="text-base md:text-lg font-semibold text-slate-900">TO</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Degree</label>
                  <select
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={toDegree}
                    onChange={(e) => {
                      setToDegree(e.target.value);
                      setToSpec("");
                    }}
                  >
                    <option value="">Select degree…</option>
                    {degrees.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialisation</label>
                  <select
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 disabled:opacity-60"
                    value={toSpec}
                    onChange={(e) => setToSpec(e.target.value)}
                    disabled={!toDegree}
                  >
                    <option value="">{toDegree ? "Select specialisation…" : "Select a degree first"}</option>
                    {toSpecs.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Disabled Compare button */}
            <div className="md:col-span-2">
              <button
                disabled
                className="w-full rounded-2xl px-5 py-3 font-semibold border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                title="Preview only — backend coming soon"
              >
                Compare Paths (Preview) — Coming Soon
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* --- tiny stat box --- */
function StatBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold mt-1 text-slate-900">{value}</div>
    </div>
  );
}
