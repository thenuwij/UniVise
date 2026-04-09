import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = (session) => {
      const hasStudentType = session.user.user_metadata?.student_type;
      navigate(hasStudentType ? '/dashboard' : '/survey', { replace: true });
    };

    // Try getSession first (works if token exchange already completed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirect(session);
        return;
      }

      // PKCE flow: session not ready yet — wait for onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          redirect(session);
        }
      });

      // Fallback: if nothing happens in 8s, go back to login
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 8000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;