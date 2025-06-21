import React from 'react'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';

function SurveyPage() {
  

  const {session, signOut} = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/login")
    } catch (err) {
      console.error(err)
    }
  }
  console.log(session)
  return (
    <div>
      Survery
      <h1>Welcome {session?.user?.email}</h1>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>

  )
}

export default SurveyPage