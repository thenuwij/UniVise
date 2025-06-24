import React, { useState,useEffect } from 'react'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { supabase } from '../supabaseClient';

function SurveyPage() {
  

  const {session, signOut} = UserAuth();
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      // v2: getUser()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error)
      } else if (user) {
        setMetadata(user.user_metadata)
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  if (loading) return <p>Loading…</p>
  if (!metadata) return <p>No metadata found.</p>

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/login")
    } catch (err) {
      console.error(err)
    }
  }
  console.log(session?.user?.user_metadata)

  return (
    <div>
      Survery
      <h1>Welcome {session?.user?.email}</h1>
      <h1>Your profile</h1>
      <p>First name: {metadata.first_name}</p>
      <p>Last name: {metadata.last_name}</p>
      <p>Gender: {metadata.gender}</p>
      <p>Date of birth: {metadata.dob}</p>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>

  )
}

export default SurveyPage