import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

const personalityDescriptions = {
  Realistic: {
    name: "Realistic",
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
  },
  Investigative: {
    name: "Investigative",
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
  },
  Artistic: {
    name: "Artistic",
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
  },
  Social: {
    name: "Social",
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
  },
  Enterprising: {
    name: "Enterprising",
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
  },
  Conventional: {
    name: "Conventional",
    summary: "Organised, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
  },
};

function TraitsPage() {

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      const { data, error } = await supabase
        .from("personality_results")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.error("Error fetching result:", error);
        navigate("/quiz");
      } else {
        setResult(data);
        console.log("Fetched result:", data);
      }
      setLoading(false);
    };

    if (session?.user?.id) fetchResult();
  }, [session, navigate]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50">
          <DashboardNavBar onMenuClick={openDrawer} />
          <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        </div>
        <div className="pt-16 sm:pt-20">
          <div className="flex flex-col justify-center h-full mx-20">
            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                My Traits
              </div>
              <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
                Loading your traits...
              </h1>
              <p className="mt-2">
                Please wait while we fetch your personality data.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no result is found
  if (!result) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50">
          <DashboardNavBar onMenuClick={openDrawer} />
          <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
        </div>
        <div className="pt-16 sm:pt-20">
          <div className="flex flex-col justify-center h-full mx-20">
            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                My Traits
              </div>
              <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
                No traits found
              </h1>
              <p className="mt-2">
                You haven't completed the personality quiz yet.
              </p>
              <button 
                onClick={() => navigate("/quiz")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content when data is loaded
  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50">
        <DashboardNavBar onMenuClick={openDrawer} />
        <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      </div>
      <div className="pt-16 sm:pt-20">
        <div className="flex flex-col justify-center h-full mx-20">
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              My Traits
            </div>

            <h1 className="mt-3 text-2xl sm:text-4xl lg:text-4xl font-extrabold">
              You are a{" "}
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                {result?.result_summary || 'Unknown'}
              </span>{" "}
              type.
            </h1>
            {result?.top_types && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Your Top Traits:</h3>
                <div className="flex flex-wrap gap-2">
                  {result.top_types.map((trait) => (
                    <span 
                      key={trait} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {personalityDescriptions[trait]?.name || trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
          <div className='card-glass-spotlight mt-6 p-6'>
            {/* Content goes here */}
            <p className="mt-2 text-lg">
              What is a {" "}
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                {result?.result_summary || 'Unknown'}
              </span>{" "}
              type?
            </p>
            
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default TraitsPage