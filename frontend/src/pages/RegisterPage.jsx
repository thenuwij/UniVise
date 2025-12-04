import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import RegisterForm from '../components/RegisterForm'

function RegisterPage() {
  return (
    <div>
      <Header/>
      <div className='flex flex-col items-center min-h-screen'>
        <h1 className='text-5xl font-bold mb-4'>Create your account</h1>
        <div className='flex mb-4'>
          <p className='text-sm mr-1'>Already have an account?</p>
          <Link to='/login' className='text-sm text-blue-600'> Sign in here</Link>
        </div>
        <RegisterForm/>
      </div>
    </div>
  )
}

export default RegisterPage 
