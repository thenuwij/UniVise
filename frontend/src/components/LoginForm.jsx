
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function LoginForm() {

  const [email,setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('false');
  const navigate = useNavigate();
  const [remember, setRemember] = useState(false)

  const { signInUser } = UserAuth();

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

  return (
    <div className="w-2/5 flex flex-col justify-start items-center mt-6 py-8 bg-white rounded-2xl shadow-2xl">
      <h1 className="text-4xl font-bold text-sky-950 align-text-top mb-3">Sign In</h1>
      <h2 className="text-lg text-gray-700">Please login with your email and password</h2>
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
          <Button onClick={handleLogin} size="lg" pill  className="w-full" type="submit">Sign In</Button>
        </div>
      </form>
    </div>
  );
}
