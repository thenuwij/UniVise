import { Button } from "flowbite-react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { LoginForm } from "../components/LoginForm";

function LoginPage() {
  return (
    <div className="min-h-screen">
      <Header/>
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
            Welcome to UniVise!
        </h1>
        <p className="text-lg text-center p-3">
          Your journey to the perfect career starts right here. <br/>
          Log in to explore tailored recommendations, connect with our AI assistant Eunice, and take control of your future!
        </p>
        <LoginForm/>
        <div className="flex items-center gap-3 my-6">
          <h1 className="text-lg">New to UniVise?</h1>
            <Link to="/register">
              <Button pill >
                Join Now
              </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage