import React from 'react'
import { Button } from 'flowbite-react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {

  const { signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    try {
      await signOut();
      navigate("/")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
        <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  )
}

export default DashboardPage