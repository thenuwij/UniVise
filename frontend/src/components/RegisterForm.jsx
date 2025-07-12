import { Alert, Button, Checkbox, Label, Select, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


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
    const navigate = useNavigate()

    const { session, registerNewUser } = UserAuth();
    console.log(session);
    
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
        if (result.success && result.data?.user?.id) {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: result.data.user.id,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dob,
            gender: gender,
          });
          
          if (insertError) {
            console.error("Error inserting profile:", insertError);
            setError("An error occurred storing your profile. Please try again.");
          } else {
            navigate("/survey");
          }
        } else {
          setError("An error occurred during registration.");
        }
      }catch (err) {
        setError("An error occured")
      } finally {
        setLoading(false)
      }
    }

    return (
    <form className="flex w-100 flex-col gap-4">
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
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
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
      <div className="flex items-center gap-2">
        <Checkbox 
        id="agree"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
        />
        <Label htmlFor="agree" className="flex">
          I agree with the&nbsp;
          <Link href="#" className="text-blue-400 hover:underline dark:text-cyan-500">
            terms and conditions
          </Link>
        </Label>
      </div>
      <div className="flex justify-center">
        <Link>
          <Button onClick={handleRegister} size="lg" pill type="submit">Register new account</Button>
        </Link>  
      </div>
    </form>
  );
}

export default RegisterForm