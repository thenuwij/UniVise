import { Alert, Button, Checkbox, Label, Modal, ModalBody, ModalHeader, Select, TextInput } from "flowbite-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { TermsText } from "./TermsText";


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
    const { session, registerNewUser } = UserAuth();

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
      }catch (err) {
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
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
      </div>

      {/* Google Sign-Up — top, matching LoginForm */}
      <Button
        onClick={handleGoogleSignUp}
        size="lg"
        color="light"
        className="w-full border border-gray-300 dark:border-gray-600"
        type="button"
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
        <span className="text-sm text-gray-400">or</span>
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" value="First Name" className="mb-1 block" />
            <TextInput
              id="firstName"
              type="text"
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName" value="Last Name" className="mb-1 block" />
            <TextInput
              id="lastName"
              type="text"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email2" value="Email" className="mb-1 block" />
          <TextInput
            id="email2"
            type="email"
            placeholder="you@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dob" value="Date of Birth" className="mb-1 block" />
            <TextInput
              id="dob"
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gender" value="Gender" className="mb-1 block" />
            <Select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="password2" value="Password" className="mb-1 block" />
          <TextInput
            id="password2"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="repeat-password" value="Confirm Password" className="mb-1 block" />
          <TextInput
            id="repeat-password"
            type="password"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <Label htmlFor="agree" className="flex text-sm">
            I agree with the&nbsp;
            <button
              type="button"
              className="text-blue-500 hover:underline"
              onClick={() => setOpenModal(true)}
            >
              terms and conditions
            </button>
          </Label>
          <Modal show={openModal} onClose={() => setOpenModal(false)}>
            <ModalHeader>Terms & Conditions</ModalHeader>
            <ModalBody>
              <TermsText />
            </ModalBody>
          </Modal>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isProcessing={loading}
          disabled={loading}
        >
          Create Account
        </Button>
      </form>
    </div>
  );
}

export default RegisterForm