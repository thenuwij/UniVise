import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const SurveyContext = createContext();

export const SurveyContextProvider = ({ children }) => {
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);

  const checkSurveyStatus = async (userType, userId) => {
    if (!userId) return;

    if (userType === "high_school") {
      const { data } = await supabase
        .from("student_school_data")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (data) setHasCompletedSurvey(true);
    }

    if (userType === "university") {
      const { data } = await supabase
        .from("student_university_data")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (data) setHasCompletedSurvey(true);
    }
  };


  useEffect(() => {
    const fetchSurveyStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("student_type")
          .eq("id", user.id)
          .single();

        if (profile?.student_type) {
          await checkSurveyStatus(profile.student_type, user.id);
        }
      }
    };

    fetchSurveyStatus();
  }, []);

  return (
    <SurveyContext.Provider value={{ hasCompletedSurvey, checkSurveyStatus }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
