import React, { useEffect } from 'react'
import { Button } from 'flowbite-react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function DashboardPage() {

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;
      console.log(token);
    };
    fetchSession();
  },[]);

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