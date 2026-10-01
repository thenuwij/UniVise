import { LoginForm } from "../components/LoginForm";
import { Header } from "@/shared/layout/Header";

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col app-page">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">

          {/* Branding */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 whitespace-nowrap">
              Welcome to UniVise!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
              Your AI-powered academic planning platform
            </p>
          </div>

          {/* Card */}
          <LoginForm />

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
