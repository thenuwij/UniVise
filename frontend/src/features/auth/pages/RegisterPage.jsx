import RegisterForm from '../components/RegisterForm'
import AuthLayout from '../components/AuthLayout'

function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Join UniVise and start planning your degree.">
      <RegisterForm />
    </AuthLayout>
  )
}

export default RegisterPage
