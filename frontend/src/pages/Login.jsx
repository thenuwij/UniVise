import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { LoginForm } from "../components/LoginForm";
import { Header } from "../components/Header";

function Login() {
  return (
    <>
    <Header/>
    <div className="flex flex-col items-center h-screen">
      <h1>Please login with your email and password</h1>
      <LoginForm/>
    </div>
    </>
  );
}

export default Login