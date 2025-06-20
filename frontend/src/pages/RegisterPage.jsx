import React from 'react'
import RegisterForm from '../components/RegisterForm'
import { Header } from '../components/Header'

function RegisterPage() {
  return (
    <div>
      <Header/>
      <div className='flex flex-col items-center w-full'>
        <h1 className='text-3xl font-bold mb-4'>Create your account</h1>
        <RegisterForm/>
      </div>
    </div>
  )
}

export default RegisterPage