import { Navigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";

const UniversityOnlyNotice = ({ onSignOut }) => (
  <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
    <div className="max-w-md w-full rounded-2xl p-8 shadow-2xl card-glass-spotlight text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        UniVise is for university students only
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        UniVise currently supports students enrolled in a UNSW program.
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="button-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
      >
        Sign out
      </button>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { session, signOut } = UserAuth();

  if (session === undefined) {
    return <div>Loading...</div>;
  }

  if (session?.user?.user_metadata?.student_type === "high_school") {
    return <UniversityOnlyNotice onSignOut={signOut} />;
  }

  return <div>{session ? <>{children}</> : <Navigate to="/login" replace />}</div>;
};

export default PrivateRoute;
