import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, PlayCircle } from "lucide-react";
import { startDemo } from "../utils/demo";
import { errorText, footerLink } from "./authStyles";

export default function DemoButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setError("");
    setLoading(true);
    try {
      await startDemo();
      window.scrollTo({ top: 0 });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Starting the demo failed:", err);
      setError(String(err?.message).includes("(429)") ? "The demo is busy right now. Please try again in a few minutes." : "The demo couldn't start. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 bg-white/60 dark:bg-slate-900/40 p-5">
      <p className="font-semibold text-ink-strong">Just having a look?</p>
      <p className="mt-1 text-[15px] text-ink-muted">
        Explore UniVise as a sample Computer Science student. No sign-up, and nothing you do is kept.
      </p>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
        {loading ? "Setting up your demo..." : "Try the demo"}
      </button>
      {error && <p role="alert" className={`${errorText} mt-3`}>{error}</p>}
      <p className="mt-3 text-xs text-ink-muted">
        By trying the demo you agree to the{" "}
        <Link to="/terms" className={footerLink}>Terms</Link> and{" "}
        <Link to="/privacy" className={footerLink}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
