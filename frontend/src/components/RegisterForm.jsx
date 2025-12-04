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
    const [loading, setLoading] = useState('');
    const [openModal, setOpenModal] = useState(false)
    
    const navigate = useNavigate() 
    const { session, registerNewUser } = UserAuth();

    const handleRegister = async (e) => {
      e.preventDefault();

      if (password != confirmPassword) {
        return (
        <Alert color="failure">
          <span>Passwords did not match. Try Again.</span>
        </Alert>)
      }

      setLoading(true);
      try { 
        const result = await registerNewUser(email, password, firstName, lastName, dob, gender);
        if (result.error) {
          setError(result.error.message);
          return;
        }
        if (result.data) {
          console.log("User registered successfully:", result.data);
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
    <form className="flex w-100 flex-col gap-3">
      <div>
        <div className="mb-2 block">
          <Label htmlFor='firstName'>First Name</Label>
        </div>
        <TextInput 
          id="firstName" 
          type="text" 
          placeholder="Enter First Name" 
          required 
          shadow 
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor='lastName'>Last Name</Label>
        </div>
        <TextInput 
          id="lastName" 
          type="text" 
          placeholder="Enter Last Name" 
          required 
          shadow 
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="email2">Your Email</Label>
        </div>
        <TextInput 
          id="email2" 
          type="email" 
          placeholder="email@domain.com" 
          required 
          shadow 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor='dob'>Date of Birth</Label>
        </div>
        <TextInput 
          id="dob" 
          type="date" 
          required 
          shadow 
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          />
      </div>
      <div>
        <div>
          <Label className="mb-2 block" htmlFor="gender">Gender</Label>
        </div>
          <Select 
            id="gender" 
            name="gender" 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Femal">Female</option>
            <option value="Other">Other</option>
          </Select>
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="password2">Your Password</Label>
        </div>
        <TextInput 
          id="password2" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          shadow 
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="repeat-password">Confirm Password</Label>
        </div>
        <TextInput 
        id="repeat-password" 
        type="password" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required 
        shadow 
        />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Checkbox 
        id="agree"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
        />
        <Label htmlFor="agree" className="flex">
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
              <TermsText/>
          </ModalBody>
        </Modal>
      </div>
      <div className="flex justify-center mb-7">
        <Link>
          <Button onClick={handleRegister} size="xl" pill type="submit">Register new account</Button>
        </Link>  
      </div>

      {/* Divider */}
      <div className="flex items-center w-full my-2">
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
        <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">or</span>
        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
      </div>

      {/* Google Sign-Up Button */}
      <div className="flex justify-center mb-7">
        <Button 
          onClick={handleGoogleSignUp} 
          size="xl" 
          pill 
          color="gray"
          type="button"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Sign up with Google
        </Button>
      </div>

    </form>
  );
}

export default RegisterForm