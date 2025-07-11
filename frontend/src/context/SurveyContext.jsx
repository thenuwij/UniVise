import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const SurveyContext = createContext();

export const SurveyContextProvider = ({ children }) => {
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);

  const checkSurveyStatus = async (userType, userId) => {
    if (!userId) return;
    console.log(`Checking survey status for type: ${userType}, id: ${userId}`);

    try {
      
      if (userType === "high_school") {
        const { data } = await supabase
          .from("student_school_data")
          .select("id")
          .eq("user_id", userId)
          .single();

        // console.log("High school data lookup result:", data);

        if (data) setHasCompletedSurvey(true);
      }

      if (userType === "university") {
        const { data } = await supabase
          .from("student_uni_data")
          .select("id")
          .eq("user_id", userId)
          .single();

        // console.log("University data lookup result:", data);

        if (data) setHasCompletedSurvey(true);
      }
    } catch (error) {
      console.error("Error checking survey status:", error);
    }
  };

  useEffect(() => {
    const fetchSurveyStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setLoading(false);
          return;
        }


        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("student_type")
          .eq("id", user.id)
          .single();

        if (profile?.student_type) {
          setUserType(profile.student_type);
          setUserId(user.id);
          await checkSurveyStatus(profile.student_type, user.id);
        }
        // console.log("Profile data:", profile);

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profile?.student_type) {
          await checkSurveyStatus(profile.student_type, user.id);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyStatus();
  }, []);

  return (
     <SurveyContext.Provider
      value={{
        hasCompletedSurvey,
        loading,
        checkSurveyStatus,
        userType,
        userId,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = () => useContext(SurveyContext);
