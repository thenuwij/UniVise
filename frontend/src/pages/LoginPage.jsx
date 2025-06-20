import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { LoginForm } from "../components/LoginForm";
import { Header } from "../components/Header";
import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <>
    <Header/>
    <div className="flex flex-col items-center">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
          Welcome to UniVise!
      </h1>
      <p className="text-lg text-black-300 dark:text-gray-800 text-center mt-5 mb-5 p-3">
        Your journey to the perfect career starts right here! <br/>
        Log in to explore tailored recommendations, connect with our AI assistant Eunice, and take control of your future.
      </p>
      <LoginForm/>
      <div className="flex items-center gap-3 mt-7">
        <h1 className="text-lg text-gray-80">New to UniVise?</h1>
          <Link to="/register">
            <Button pill className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br focus:ring-blue-300 dark:focus:ring-blue-800">
              Join Now
            </Button>
          </Link>
      </div>
    </div>
    </>
  );
}

export default LoginPage