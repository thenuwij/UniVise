import { LoginForm } from "../components/LoginForm";
import AuthLayout from "../components/AuthLayout";

function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
