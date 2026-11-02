import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { cleanText } from "@/shared/lib/cleanText";
import { supabase } from "@/shared/lib/supabase";
import { TermsAgreement } from "./TermsAgreement";
import { errorText, fieldInput, fieldLabel, footerLink, footerText, googleButton, primaryButton } from "./authStyles";


const NAME_MAX = 50;

function RegisterForm() {

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate() 
    const { registerNewUser } = UserAuth();

    // Set to true before deployment to enforce UNSW email
    const ENFORCE_UNSW_EMAIL = false;
    const isUnswEmail = (val) => /^[^\s@]+@(student\.)?unsw\.edu\.au$/i.test(val);

    const handleRegister = async (e) => {
      e.preventDefault();

      const first = cleanText(firstName, NAME_MAX);
      const last = cleanText(lastName, NAME_MAX);
      if (!first || !last) {
        setError("Please enter your first and last name.");
        return;
      }

      if (!agreed) {
        setError("Please read and agree to the terms and conditions to register.");
        return;
      }

      if (ENFORCE_UNSW_EMAIL && !isUnswEmail(email)) {
        setError("Please use a valid UNSW email address (e.g. z1234567@ad.unsw.edu.au).");
        return;
      }

      setError('');
      setLoading(true);
      try { 
        const result = await registerNewUser(email, password, first, last, new Date().toISOString());
        if (result.error) {
          setError(result.error.message);
          return;
        }
        if (result.data) {
          setError('');
          navigate('/survey', { replace: true });
        }
      }catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    const handleGoogleSignUp = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) setError("Google sign-up failed. Please try again.");
      } catch {
        setError("Google sign-up failed. Please try again.");
      }
    };

    return (
    <div className="flex flex-col gap-6">
      <button onClick={handleGoogleSignUp} className={googleButton} type="button">
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">or with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          <div>
            <label htmlFor="firstName" className={fieldLabel}>First name</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              maxLength={NAME_MAX}
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="lastName" className={fieldLabel}>Last name</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              maxLength={NAME_MAX}
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldInput}
            />
          </div>
        </div>
        <div>
          <label htmlFor="email2" className={fieldLabel}>Email</label>
          <input
            id="email2"
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
          <label htmlFor="password2" className={fieldLabel}>Password</label>
          <div className="relative">
            <input
              id="password2"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldInput} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TermsAgreement id="agree" checked={agreed} onChange={setAgreed} />
        </div>

        {error && <p role="alert" className={errorText}>{error}</p>}

        <button type="submit" className={`${primaryButton} mt-2`} disabled={loading}>
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className={footerText}>
        Already have an account?{" "}
        <Link to="/login" className={footerLink}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterForm
