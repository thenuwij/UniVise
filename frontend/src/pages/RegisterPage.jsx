import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import RegisterForm from '../components/RegisterForm'

function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">

          {/* Branding */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 whitespace-nowrap">
              Create your account
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
              Join UniVise and start planning your academic journey
            </p>
          </div>

          {/* Form */}
          <RegisterForm />

          {/* Sign in link */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Sign in here
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default RegisterPage
