import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const LoadingPersonalityPage = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [status, setStatus] = useState("Preparing your quiz...");

  useEffect(() => {
    const prepare = async () => {
      try {
        setStatus("Ready! Launching your quiz...");
        setTimeout(() => navigate("/quiz"), 1500); 
      } catch (err) {
        console.error(err);
        setStatus("Something went wrong. Please try again.");
      }
    };

    prepare();
  }, [navigate, session]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-4 text-center">
        Let’s find out your personality!
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mt-2 text-center animate-pulse">
        {status}
      </p>
    </div>
  );
};

export default LoadingPersonalityPage;
