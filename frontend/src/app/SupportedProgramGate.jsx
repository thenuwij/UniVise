import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/shared/layout/Header";
import { UserAuth } from "./AuthContext";
import { fetchSupportedEnrolment } from "@/features/onboarding/utils/supportedProgram";
import { TERMS_CONTACT } from "@/features/auth/data/termsContent";

// A brief cache avoids repeating eligibility lookups on each navigation.
// Missing programs and failures are never cached, so setup can be completed immediately.
const verified = new Map();

export default function SupportedProgramGate({ children }) {
  const { session, signOut } = UserAuth();
  const userId = session?.user?.id;
  const [state, setState] = useState({ userId: null, status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!userId) return;
    if ((verified.get(userId) || 0) > Date.now()) {
      setState({ userId, status: "supported" });
      return;
    }
    setState({ userId, status: "loading" });
    fetchSupportedEnrolment(userId)
      .then((degree) => {
        if (!active) return;
        if (degree) verified.set(userId, Date.now() + 30000);
        setState({ userId, status: degree ? "supported" : "unsupported" });
      })
      .catch(() => {
        if (active) setState({ userId, status: "error" });
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  if (state.userId === userId && state.status === "supported") return children;
  return (
    <div className="min-h-screen app-page">
      <Header matchDashboard />
      <main className="mx-auto max-w-xl px-6 py-16">
        {state.userId !== userId || state.status === "loading" ? (
          <p role="status" className="text-ink-muted">
            Checking your program…
          </p>
        ) : state.status === "error" ? (
          <>
            <h1 className="text-2xl font-bold text-ink-strong">
              We couldn't check your program
            </h1>
            <p className="mt-3 text-ink-muted">
              Please try again. A connection problem does not mean your degree
              is unsupported.
            </p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="button-primary mt-5 rounded-xl px-5 py-3"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink-strong">
              A supported UNSW degree is required
            </h1>
            <p className="mt-4 leading-relaxed text-ink-muted">
              Personal academic and career planning is available only when your
              enrolled degree is in UniVise’s supported list. If your degree
              isn't listed, UniVise isn't currently supported for your studies.
              Please don't choose a different degree just to continue.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/survey"
                className="button-primary rounded-xl px-5 py-3"
              >
                Choose your degree
              </Link>
            </div>
            <p className="mt-5 text-sm text-ink-muted">
              Questions?{" "}
              <a
                href={`mailto:${TERMS_CONTACT}`}
                className="text-link underline"
              >
                {TERMS_CONTACT}
              </a>
            </p>
          </>
        )}
        <div className="mt-8 flex gap-5 text-sm text-link">
          <Link to="/profile" className="hover:underline">
            Manage account & data
          </Link>
          <button type="button" onClick={signOut} className="hover:underline">
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
