import { Button, Label, TextInput } from "flowbite-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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
        navigate("/dashboard");
      } else {
        const msg = result.error?.toLowerCase() ?? "";
        if (msg.includes("already registered") || msg.includes("oauth")) {
          setError("This email is linked to a Google account. Please sign in with Google.");
        } else {
          setError(result.error || "Invalid email or password.");
        }
      }
    } catch (err) {
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
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In</h1>
      </div>

      <Button
        onClick={handleGoogleLogin}
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

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email" value="Email" className="mb-1 block" />
          <TextInput
            id="email"
            type="email"
            placeholder="you@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password" value="Password" className="mb-1 block" />
          <TextInput
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        New to UniVise?{" "}
        <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
