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
  const [firstName, setFirstName] = useState('');


  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error fetching user:', userError);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')  // Change to your actual table name if different
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching first name:', error);
        } else {
          setFirstName(data.first_name);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
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
    <div className="min-h-screen bg-gradient-to-r from-white to-sky-100 flex flex-col items-center justify-center p-4 relative"
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
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 mb-2">
          Welcome, {firstName||session?.user?.email}!
        </h1>
      </div>

      {/* Survey Form */}
     <div className="w-full max-w-6xl bg-gray-100 shadow-xl rounded-2xl p-6 sm:p-8 lg:p-12 border border-gray-200 relative flex flex-col items-center justify-center pt-40">
        {/* Center form content */}
        <SurveyForm />

      </div>

    </div>
  );
}

export default SurveyPage;
