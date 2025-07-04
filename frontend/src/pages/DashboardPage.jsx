import React, { useEffect } from 'react'
import { Button } from 'flowbite-react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';
import { useState } from 'react';

function DashboardPage() {

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

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
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
    </div>
  )
}

export default DashboardPage