import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { pathAfterSignIn } from "@/features/onboarding/utils/surveyStatus";
import { errorText, fieldInput, fieldLabel, footerLink, footerText, googleButton, primaryButton } from "./authStyles";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signInUser } = UserAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInUser(email, password);
      if (result.success) {
        navigate(await pathAfterSignIn(result.data.user.id));
      } else {
        const msg = result.error?.toLowerCase() ?? "";
        if (msg.includes("already registered") || msg.includes("oauth")) {
          setError("This email is linked to a Google account. Please sign in with Google.");
        } else {
          setError(result.error || "Invalid email or password.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError("Google sign-in failed. Please try again.");
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button onClick={handleGoogleLogin} className={googleButton} type="button">
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">or with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={fieldLabel}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInput}
          />
        </div>
        <div>
          <label htmlFor="password" className={fieldLabel}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldInput}
          />
        </div>

        {error && <p role="alert" className={errorText}>{error}</p>}

        <button type="submit" className={`${primaryButton} mt-2`} disabled={loading}>
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className={footerText}>
        New to UniVise?{" "}
        <Link to="/register" className={footerLink}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
