
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../supabaseClient";


export function LoginForm() {

  const [email,setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('false');
  const navigate = useNavigate();
  const [remember, setRemember] = useState(false)

  const { signInUser } = UserAuth();

  // Check if user is already logged in 
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has completed survey (has student_type)
        const { data: userData } = await supabase.auth.getUser();
        const hasStudentType = userData?.user?.user_metadata?.student_type;
        
        if (!hasStudentType) {
          // Incomplete profile - needs to complete survey
          navigate("/survey");
        } else {
          // Complete profile - go to dashboard
          navigate("/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInUser(email,password, remember);
      if (result.success) {
        console.log("Succusefuly logged in", result)
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Login Error", error)
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      });
      if (error) {
        console.error("Google login error:", error);
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="w-2/5 flex flex-col justify-start items-center mt-6 py-8 card-base">
      <h1 className="text-4xl font-bold  align-text-top mb-3">Sign In</h1>
      <h2 className="text-lg">Please login with your email and password</h2>
      <form className="flex w-2/5 flex-col gap-4 mt-3">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="email1" className="text-md">Your email</Label>
          </div>
          <TextInput 
            id="email1" 
            type="email" 
            placeholder="Email / Username" 
            required 
            sizing="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1" className="text-md">Your password</Label>
          </div>
          <TextInput 
            id="password1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password" 
            required 
            placeholder="Password"
            sizing="md"
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button onClick={handleLogin} size="lg" pill className="w-full" type="submit">Sign In</Button>

          {/* Divider */}
          <div className="flex items-center w-full my-2">
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
            <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">or</span>
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
          </div>
          {/* Google Sign-In Button */}
          <Button 
            onClick={handleGoogleLogin} 
            size="lg" 
            pill 
            color="gray"
            className="w-full"
            type="button"
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>
        </div>
      </form>
    </div>
  );
}
