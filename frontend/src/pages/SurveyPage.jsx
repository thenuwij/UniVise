import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import SurveyForm from '../components/SurveyForm';
import { UserAuth } from '../context/AuthContext';
import { useSurvey } from '../context/useSurvey';
import { supabase } from '../supabaseClient';

function SurveyPage() {
  const { session } = UserAuth();
  const { hasCompletedSurvey, loading: surveyLoading } = useSurvey();
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

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
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
