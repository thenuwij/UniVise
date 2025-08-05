import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import DegreeSelectorForRoadmap from "../components/DegreeSelectorForRoadmap";
import { supabase } from "../supabaseClient";

function RoadmapPage() {
 console.log("RoadmapPage component loaded");
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState("university");
  const [hasTranscript, setHasTranscript] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const [transcriptRoadmap, setTranscriptRoadmap] = useState(null);
  const [finalRecommendations, setFinalRecommendations] = useState([]);
  const [selectedDegreeId, setSelectedDegreeId] = useState(null);
  const [selectedDegreeObject, setSelectedDegreeObject] = useState(null);

useEffect(() => {
  console.log("useEffect triggered");
  async function fetchInitialData() {
    try {
      console.log("useEffect triggered");

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError) {
        console.error("Error fetching user:", userError.message);
        return;
      }

      if (!user) {
        console.log("No user found");
        return;
      }

      console.log("👤 Logged in user ID:", user.id);

      // === 0. Check userType and transcript analysis ===
        const { data: profileData, error: profileError } = await supabase
        .from("student_profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

        const currentUserType = profileData?.user_type || "university";
        setUserType(currentUserType);

        const analysisTable = currentUserType === "high_school"
        ? "school_report_analysis"
        : "transcript_analysis";

        const { data: analysisData, error: analysisError } = await supabase
        .from(analysisTable)
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

        if (analysisError) {
        console.error("Error checking transcript:", analysisError.message);
        setHasTranscript(false);
        return;
        }

        if (analysisData !== null) {
        console.log("Transcript or school report found");
        setHasTranscript(true);
        } else {
        console.log("No transcript or report found");
        setHasTranscript(false);
        }



      // === 1. Check transcript roadmap ===
      const { data: transcript, error: transcriptError } = await supabase
        .from("transcript_roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (transcriptError) {
        console.warn("Transcript fetch error (might be fine):", transcriptError.message);
      }

      if (transcript) {
        console.log("Found transcript roadmap");
        setTranscriptRoadmap(transcript);
      }

      // === 2. Check final recommendations ===
      const { data: final, error: finalError } = await supabase
        .from("final_degree_recommendations")
        .select("id, degree_name, reason, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (finalError) {
        console.error("Error fetching final recommendations:", finalError.message);
        return;
      }

      console.log("Supabase final_degree_recommendations:", final);

      if (final && final.length > 0) {
        console.log("Setting finalRecommendations state");
        setFinalRecommendations(final);
        return;
      }

      // === 3. Trigger backend if missing ===
      console.log("No existing recommendations — generating via backend...");

      const hardcodedToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImhNV2p4NmxuVlY1TnMwOWEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2ZydGlhY2Vwdm1rbnBtbm1wd2R2LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhMzU4ZjhmZS0zODcyLTQ2M2ItOWRkNS1hMGM5NWM5NjFiNzgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUzNzU0OTEyLCJpYXQiOjE3NTM3NTEzMTIsImVtYWlsIjoidW5pMkBkb21haW4uY29tIiwic3ViIjoiYTM1OGY4ZmUtMzg3Mi00NjNiLTlkZDUtYTBjOTVjOTYxYjc4In0.hbJRaO5u9TcqSWsMAD1InORwx3okCQZYALMv0PR-PGE";

      const res = await fetch("http://localhost:8000/final-degree-plan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hardcodedToken}`,
        },
      });

      const text = await res.text();
      console.log("Backend response:", res.status, text);

      if (!res.ok) {
        throw new Error("Backend returned error");
      }

      const generated = JSON.parse(text);
      console.log("Parsed backend result:", generated);
      setFinalRecommendations(generated);
    } catch (err) {
      console.error("Error during roadmap setup:", err);
    }
  }

  fetchInitialData();
}, []);


  const handleProceed = () => {
    if (!selectedDegreeId || !selectedDegreeObject) {
      alert("Please select a degree to proceed.");
      return;
    }
    // Later we will call backend to send selectedDegreeObject for AI generation
    navigate(`/roadmap/${selectedDegreeId}`);
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

       <div className="max-w-7xl mx-auto py-20 px-6 text-center">
        <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          My Roadmap
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
          UniVise helps you plan your academic future. Explore recommended UNSW degrees or upload your transcript to generate a roadmap tailored just for you.
        </p>

        <button
          onClick={() => {
            if (hasTranscript) {
              navigate("/roadmap/transcript");
            }
          }}
          disabled={!hasTranscript}
          className={`inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white rounded-lg transition
            ${
              hasTranscript
                ? "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
                : "bg-blue-300 cursor-not-allowed"
            }`}
        >
          Generate Using Transcript
          <svg
            className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 5h12m0 0L9 1m4 4L9 9"
            />
          </svg>
        </button>

        {!hasTranscript && (
          <p className="text-sm text-gray-500 mt-2 italic">
            Upload a transcript to enable this option.
          </p>
        )}
        </div>

        
        <div className="flex flex-col items-center px-6 max-w-7xl mx-auto w-full">

        <section className="w-full mb-20">
            <h2 class="text-4xl font-bold dark:text-white">Recommended Degrees</h2>
            {finalRecommendations.length === 0 ? (
            <p className="text-gray-500 italic">No recommendations available.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {finalRecommendations.map(({ id, degree_name, reason }) => (
                    <div
                    key={id}
                    onClick={() => {
                        setSelectedDegreeId(id);
                        setSelectedDegreeObject({ id, degree_name, reason }); 
                    }}
                    className={`cursor-pointer rounded-3xl p-6 border shadow-md transition-all duration-300 ${
                        selectedDegreeId === id
                        ? "bg-sky-100 border-sky-600 shadow-lg scale-[1.02]"
                        : "bg-white border-slate-200 hover:shadow-md hover:scale-[1.01]"
                    }`}
                    >
                    <div>
                        <h3 className="text-lg font-semibold text-sky-900 mb-2">{degree_name}</h3>
                        <p className="text-sm text-slate-700">{reason}</p>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </section>

        <section className="w-full mb-12">
            <h2 class="text-4xl font-bold dark:text-white">Search Degrees</h2>
            <DegreeSelectorForRoadmap
            selectedId={selectedDegreeId}
            onSelect={(deg) => {
                setSelectedDegreeId(deg.id);
                setSelectedDegreeObject(deg);
            }}
            />
        </section>

        <button
            onClick={handleProceed}
            disabled={!selectedDegreeId}
            className={`mt-12 mb-20 px-12 py-4 rounded-2xl text-white text-xl font-semibold shadow-lg transition ${
            selectedDegreeId
                ? "bg-sky-700 hover:bg-sky-900 cursor-pointer"
                : "bg-sky-300 cursor-not-allowed"
            }`}
        >
            Generate My Roadmap
        </button>
        </div>
    </div>
    );

}

export default RoadmapPage;