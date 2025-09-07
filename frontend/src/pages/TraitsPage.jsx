import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { Accordion, AccordionContent, AccordionPanel, AccordionTitle } from "flowbite-react";
import { TbAugmentedReality } from "react-icons/tb";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { TbPalette } from "react-icons/tb";
import { GrGroup } from "react-icons/gr";
import { TbBriefcase } from "react-icons/tb";
import { TbClipboardList } from "react-icons/tb";




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

const personalityResults = {
  "artistic-social": "Expressive, empathetic, and people-focused. Enjoys inspiring, teaching, or counseling others through creative mediums like art, writing, or performance. Values communication and emotional impact.",
  "artistic-investigative": "Imaginative yet analytical. Likes exploring ideas, solving problems in innovative ways, and blending creativity with intellectual curiosity. Drawn to research, design, or creative analysis.",
  "artistic-realistic": "Hands-on creator who enjoys bringing ideas into physical form. Prefers tangible design, crafts, architecture, or creative building where imagination meets practical skills.",
  "artistic-enterprising": "Visionary and persuasive. Uses creativity to influence, market, or lead initiatives. Thrives in media, advertising, entrepreneurship, or leadership with a creative twist.",
  "artistic-conventional": "Precise and structured in creative work. Enjoys organizing, editing, or curating creative projects, such as design management, publishing, or event planning.",

  "social-artistic": "Warm, expressive, and compassionate. Loves helping and teaching others through creative or interactive methods. Excels in roles where empathy meets creativity, like education or therapy.",
  "social-investigative": "Knowledgeable and supportive. Enjoys applying expertise to guide, mentor, or advise others, especially in science, health, or education. Balances empathy with intellectual depth.",
  "social-realistic": "Practical and hands-on helper. Enjoys physically engaging roles that directly improve people’s lives, such as healthcare, sports coaching, or community services.",
  "social-enterprising": "Energetic motivator who thrives on leading and persuading. Drawn to leadership, sales, or HR, where helping people grow and succeed is a key driver.",
  "social-conventional": "Organized and dependable helper. Enjoys structured roles in support, administration, or coordination, ensuring systems run smoothly while serving people.",

  "investigative-artistic": "Analytical yet creative. Enjoys solving problems with imagination and exploring research or design that combines logic and originality. Suited to innovation-focused fields.",
  "investigative-social": "Thoughtful advisor. Prefers sharing knowledge, educating, or counseling based on research and evidence. Combines intellectual curiosity with a desire to help others learn.",
  "investigative-realistic": "Practical problem-solver. Drawn to technical or scientific fields where logic can be applied to real-world systems, such as engineering, IT, or healthcare technology.",
  "investigative-enterprising": "Strategic innovator. Blends analysis with leadership, using insights to create and manage new solutions. Often thrives in entrepreneurship, consulting, or tech startups.",
  "investigative-conventional": "Methodical and detail-oriented. Enjoys structured, precise work like data analysis, auditing, or laboratory research where accuracy is essential.",

  "realistic-artistic": "Practical creator. Likes designing or crafting functional products, blending hands-on skills with imagination—common in trades, design, or applied arts.",
  "realistic-social": "Action-oriented helper. Prefers teamwork, service, or community roles where practical skills can directly benefit others, like first responders, trainers, or healthcare workers.",
  "realistic-investigative": "Technical thinker. Drawn to engineering, science, or IT where structured problem-solving is applied to real-world challenges.",
  "realistic-enterprising": "Hands-on leader. Prefers leading projects, coordinating teams, and taking action. Combines practical work with decision-making and initiative.",
  "realistic-conventional": "Reliable and orderly. Enjoys structured, predictable roles that involve routine, technical precision, and practical systems management.",

  "enterprising-artistic": "Charismatic and innovative. Uses creativity to persuade or inspire in business, leadership, or media. Drawn to roles where vision and influence are key.",
  "enterprising-social": "Inspiring leader. Enjoys motivating and connecting with people, excelling in roles like management, HR, or community leadership.",
  "enterprising-investigative": "Strategic and forward-thinking. Blends curiosity with entrepreneurship, often thriving in innovation management, consulting, or tech-driven businesses.",
  "enterprising-realistic": "Energetic and practical leader. Prefers directing hands-on projects, supervising teams, or running ventures where action and influence meet.",
  "enterprising-conventional": "Organized manager. Skilled in planning and persuading, often excelling in administration, project management, or structured leadership roles.",

  "conventional-artistic": "Precise but creative. Enjoys structured creative tasks like editing, layout design, or curation, where order enhances artistry.",
  "conventional-social": "Reliable and service-oriented. Drawn to structured environments where helping others through organization and support is the focus.",
  "conventional-investigative": "Detail-oriented analyst. Thrives in systematic, fact-based roles such as data analysis, quality control, or scientific documentation.",
  "conventional-realistic": "Dependable and structured. Prefers practical, organized work environments like logistics, operations, or administrative support.",
  "conventional-enterprising": "Efficient and persuasive organizer. Enjoys planning, coordinating, and managing systems that support larger business or leadership goals."
}


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
            <p className="mt-2 text-xl">
              What is a {" "}
              <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                {result?.result_summary || 'Unknown'}
              </span>{" "}
              type?
            </p>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {personalityResults[result?.result_summary] || "No description available."}
            </p>

          </div>
          <div className='card-glass-spotlight mt-6 p-6'>
            <p className=" text-2xl font-semibold ">
              Why the RIASEC model?
            </p>
            <p className="mt-2 text-gray-700 dark:text-gray-300 mb-4">
              The RIASEC model, developed by John Holland, is one of the most widely used frameworks for understanding personality and career interests. It categorizes individuals into six primary types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. By identifying your top personality traits using this model, we can provide more tailored recommendations for your educational and career paths. This helps ensure that the suggestions align with your natural preferences and strengths, ultimately leading to greater satisfaction and success in your future endeavors.
            </p>
                <Accordion collapseAll>
                  <AccordionPanel>
                    <AccordionTitle>
                      <TbAugmentedReality className="inline mr-2 mb-1 text-xl text-sky-600 w-6 h-6" />
                      Realistic
                      </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Realistic.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                  <AccordionPanel>
                    <AccordionTitle>
                      <FaMagnifyingGlass className="inline mr-2 mb-1 text-xl text-sky-600 w-4 h-4" />
                      Investigative
                    </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Investigative.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                  <AccordionPanel>
                    <AccordionTitle>
                      <TbPalette className="inline mr-2 mb-1 text-xl text-sky-600 w-6 h-6" />
                      Artistic
                    </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Artistic.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                   <AccordionPanel>
                    <AccordionTitle>
                      <GrGroup className="inline mr-2 mb-1 text-xl text-sky-600 w-6 h-6" />
                      Social
                    </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Social.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                   <AccordionPanel>
                    <AccordionTitle>
                      <TbBriefcase className="inline mr-2 mb-1 text-xl text-sky-600 w-6 h-6" />
                      Enterprising
                    </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Enterprising.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                  <AccordionPanel>
                    <AccordionTitle>
                      <TbClipboardList className="inline mr-2 mb-1 text-xl text-sky-600 w-6 h-6" /> 
                      Conventional
                    </AccordionTitle>
                    <AccordionContent>
                      <p>{personalityDescriptions.Conventional.summary}</p>
                    </AccordionContent>
                  </AccordionPanel>
                </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TraitsPage