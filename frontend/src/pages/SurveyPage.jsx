import React, { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { supabase } from '../supabaseClient';
import SurveyForm from '../components/SurveyForm';
import Logo from '../components/Logo';
import { useSurvey } from '../context/SurveyContext';

function SurveyPage() {
  const { session, signOut } = UserAuth();
  const { hasCompletedSurvey, loading: surveyLoading } = useSurvey();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);


  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          navigate("/login", { replace: true });
          return;
        }

        setFirstName(user.user_metadata.first_name || '');
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (surveyLoading) return;

    if (!session) {
      navigate("/login", { replace: true });
    } else if (hasCompletedSurvey) {
      navigate("/dashboard", { replace: true });
    } else {
      setCheckingAccess(false); // Access granted to survey
    }
  }, [session, hasCompletedSurvey, surveyLoading, navigate]);

  if (loading || surveyLoading || checkingAccess) {
    return <div className="min-h-screen flex items-center justify-center text-black text-xl">Loading…</div>;
  }

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-100 to-indigo-200 flex flex-col items-center relative"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sign Out Button top-right */}
      <div className="absolute top-4 sm:top-8 right-2 sm:right-4">
        <Button color="gray" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="absolute top-4 left-4 sm:left-6 lg:left-8">
        <Logo />
      </div>

      {/* Welcome Heading */}
      <div className="mt-12 sm:mt-16 md:mt-20 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-4 leading-tight">
          Welcome, {firstName||session?.user?.email}!
        </h1>
      </div>

      {/* Survey Form */}
      <div className="flex flex-col items-center justify-center flex-grow w-full">
        <div className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-12 border border-gray-200 flex flex-col items-center justify-center mb-12">
          {/* Center form content */}
          <div className="w-full max-w-2xl px-4 sm:px-0">
            <SurveyForm />
          </div>
        </div>
      </div>

    </div>
  );
}

export default SurveyPage;
