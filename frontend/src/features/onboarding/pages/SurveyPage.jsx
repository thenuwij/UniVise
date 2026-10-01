import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/shared/layout/Header';
import SurveyForm from '../components/SurveyForm';
import { UserAuth } from '@/app/AuthContext';
import { supabase } from '@/shared/lib/supabase';
import { hasCompletedSurvey } from '../utils/surveyStatus';

function SurveyPage() {
  const { session } = UserAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [, setFirstName] = useState('');
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
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }

    hasCompletedSurvey(session.user.id).then((completed) => {
      if (completed) {
        navigate("/dashboard", { replace: true });
      } else {
        setCheckingAccess(false);
      }
    });
  }, [session, navigate]);

  if (loading || checkingAccess) {
    return <div className="min-h-screen flex items-center justify-center text-black text-xl">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative app-page"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sign Out Button top-right */}
      <div>
        <Header/>
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
