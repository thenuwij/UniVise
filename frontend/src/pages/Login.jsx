import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { LoginForm } from "../components/LoginForm";
import { Header } from "../components/Header";

function Login() {
  return (
    <>
    <Header/>
    <div className="flex flex-col items-center h-screen">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
          Welcome to Univise!
      </h1>
      <p className="text-lg text-black-300 dark:text-gray-800 text-center mt-3 mb-3">
        Your journey to the perfect career starts right here. <br/>
        Log in to explore tailored recommendations, connect with our AI assistant Eunice, and take control of your future.
      </p>
      <LoginForm/>
    </div>
    </>
  );
}

export default Login