import React from 'react'
import RegisterForm from '../components/RegisterForm'
import { Header } from '../components/Header'
import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <div>
      <Header/>
      <div className='flex flex-col items-center'>
        <h1 className='text-3xl font-bold mb-4'>Create your account</h1>
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
