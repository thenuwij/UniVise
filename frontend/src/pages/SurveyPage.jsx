import React, { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { supabase } from '../supabaseClient';
import SurveyForm from '../components/SurveyForm';
import Logo from '../components/Logo';
import { useSurvey } from '../context/SurveyContext';
import { Header } from '../components/Header';

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
    <div className="min-h-screen  flex flex-col  relative"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sign Out Button top-right */}
      <div>
        <Header/>
      </div>
      {/* Welcome Heading */}
      <div className="mt-12 sm:mt-16 md:mt-20 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold mb-4 leading-tight">
          Welcome, {firstName||session?.user?.email}!
        </h1>
      </div>

      {/* Survey Form */}
      <div className="flex flex-col items-center flex-grow w-full justify-center">
        <div className="max-w-6xl  shadow-2xl rounded-2xl p-6 sm:p-8 lg:p-12  flex flex-col mb-12 card-glass-spotlight dark:card-glass-spotlight">
          {/* Center form content */}
          <div className=" max-w-2xl px-4 sm:px-0">
            <SurveyForm />
          </div>
        </div>
      </div>

    </div>
  );
}

export default SurveyPage;
