import React, { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { supabase } from '../supabaseClient';
import SurveyForm from '../components/SurveyForm';
import Logo from '../components/Logo';

function SurveyPage() {
  const { session, signOut } = UserAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const { error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      setLoading(false);
    }

    fetchUser();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-black text-xl">Loading…</div>;

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative">
      
      {/* Sign Out Button top-right */}
      <div className="absolute top-8 right-4">
        <Button color="gray" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="absolute top-4 left-4">
        <Logo />
      </div>

      {/* Welcome Heading */}
      <div className="absolute top-24 left-20">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-2">
          Welcome, {session?.user?.email}!
        </h1>
      </div>

      {/* Survey Form */}
     <div className="w-full max-w-6xl bg-gray-100 shadow-xl rounded-2xl p-12 border border-gray-200 min-h-[500px] flex items-center justify-center relative">


        {/* Tagline top-left */}
        <h2 className="absolute top-2 left-6 text-2xl italic font-sans text-sky-900">
          Let’s personalise your experience
        </h2>

        {/* Center form content */}
        <SurveyForm />

      </div>

    </div>
  );
}

export default SurveyPage;
