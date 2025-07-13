import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const LoadingPersonalityPage = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [status, setStatus] = useState("Preparing your quiz...");

  useEffect(() => {
    const prepare = async () => {
      try {
        // Fetch user details (or store in localStorage if needed)
        const { data: user } = await supabase.auth.getUser();
        const studentType = user.user.user_metadata?.student_type;

        // Generate recommendations (you can modify as needed)
        const resp = await fetch("http://localhost:8000/recommendation/prompt", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!resp.ok) throw new Error("Failed to generate");

        setStatus("Ready! Launching your quiz...");
        setTimeout(() => navigate("/quiz"), 1500); // slight delay for smoothness
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      }
    };

    prepare();
  }, [navigate, session]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-white via-sky-100 to-indigo-200">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-4 text-center">
        Let’s find out your personality!
      </h1>
      <p className="text-lg text-gray-700 mt-2 text-center animate-pulse">
        {status}
      </p>
    </div>
  );
};

export default LoadingPersonalityPage;
