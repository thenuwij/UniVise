import React, { useEffect, useState } from "react";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import Roadmap from "../components/Roadmap";
import DegreeSearch from "../components/DegreeSearch";
import { Button, Modal } from "flowbite-react";

function RoadmapPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProgramData, setSelectedProgramData] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session } = UserAuth();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session) return;

      const { data, error } = await supabase
        .from("final_degree_recommendations")
        .select(
          "degree_name, reason, year_1_courses, year_2_courses, year_3_courses, year_4_courses, specialisations"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!error && data?.length > 0) {
        const formatted = data.map((deg) => ({
          degreeName: deg.degree_name,
          reason: deg.reason,
          specialisations: deg.specialisations,
          courseBreakdown: {
            "Year 1": deg.year_1_courses,
            "Year 2": deg.year_2_courses,
            "Year 3": deg.year_3_courses,
            "Year 4": deg.year_4_courses,
          },
        }));
        setRecommended(formatted);
      } else {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [session]);

  const handleRecommendedClick = (degree) => {
    setSelectedProgramData({
      degreeName: degree.degreeName,
      courseBreakdown: degree.courseBreakdown,
      specialisations: degree.specialisations,
    });
    setIsModalOpen(true);
  };

  const handleDegreeSelect = (degree) => {
    console.log("Degree selected (no action taken):", degree.program_name);
    
    // setSelectedProgramData({
    //   degreeName: degree.program_name,
    //   courseBreakdown: {
    //     "Year 1": degree.year_1_courses || [],
    //     "Year 2": degree.year_2_courses || [],
    //     "Year 3": degree.year_3_courses || [],
    //     "Year 4": degree.year_4_courses || [],
    //   },
    //   specialisations: degree.majors || [],
    // });
    // setIsModalOpen(true);
  };

  return (
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className="mx-6 mt-6 md:ml-72">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-6">
          Explore your pathway
        </h1>

        {loading ? (
          <p className="text-gray-500">Generating roadmap, please wait...</p>
        ) : (
          <>
            {recommended.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-slate-700 mb-4">
                  Select a program pathway from your recommendations:
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommended.map((degree, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-xl shadow border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold text-indigo-700">
                        {degree.degreeName}
                      </h3>
                      <p className="text-gray-700 mb-3">{degree.reason}</p>
                      <Button color="blue" onClick={() => handleRecommendedClick(degree)}>
                        View Roadmap
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <DegreeSearch onSelectDegree={handleDegreeSelect} />
            </div>
          </>
        )}

        <Modal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="4xl"
          dismissible
        >
          <Modal.Header>Program Roadmap</Modal.Header>
          <Modal.Body>
            {selectedProgramData && <Roadmap programData={selectedProgramData} />}
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default RoadmapPage;
