import { Modal, ModalBody, ModalHeader } from "flowbite-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { TermsText } from "./TermsText";
import { errorText, fieldInput, fieldLabel, footerLink, footerText, googleButton, primaryButton } from "./authStyles";


function RegisterForm() {

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false)
    
    const navigate = useNavigate() 
    const { registerNewUser } = UserAuth();

    // Set to true before deployment to enforce UNSW email
    const ENFORCE_UNSW_EMAIL = false;
    const isUnswEmail = (val) => /^[^\s@]+@(student\.)?unsw\.edu\.au$/i.test(val);

    const handleRegister = async (e) => {
      e.preventDefault();

      if (password !== confirmPassword) {
        setError("Passwords don't match. Please try again.");
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
        const result = await registerNewUser(email, password, firstName, lastName, dob, gender);
        if (result.error) {
          setError(result.error.message);
          return;
        }
        if (result.data) {
          setError('');
          navigate('/survey', { replace: true });
        }
      }catch {
        setError("An error occured")
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
        if (error) {
          console.error("Google sign up error:", error);
        }
      } catch (error) {
        console.error("Google sign up error:", error);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          <div>
            <label htmlFor="dob" className={fieldLabel}>Date of birth</label>
            <input
              id="dob"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="gender" className={fieldLabel}>Gender</label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={fieldInput}
            >
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          <div>
            <label htmlFor="password2" className={fieldLabel}>Password</label>
            <input
              id="password2"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInput}
            />
          </div>
          <div>
            <label htmlFor="repeat-password" className={fieldLabel}>Confirm password</label>
            <input
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldInput}
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-line accent-blue-600 cursor-pointer"
          />
          <label htmlFor="agree" className="text-sm text-ink">
            I agree with the{" "}
            <button
              type="button"
              className={footerLink}
              onClick={() => setOpenModal(true)}
            >
              terms and conditions
            </button>
          </label>
          <Modal show={openModal} onClose={() => setOpenModal(false)}>
            <ModalHeader>Terms & Conditions</ModalHeader>
            <ModalBody>
              <TermsText />
            </ModalBody>
          </Modal>
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
