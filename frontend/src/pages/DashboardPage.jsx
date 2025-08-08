import React, { useEffect } from 'react'
import { Button } from 'flowbite-react'
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DashboardNavBar } from '../components/DashboardNavBar';
import { MenuBar } from '../components/MenuBar';
import { useState } from 'react';
import { RecommendationTable } from '../components/RecommendationTable';

function DashboardPage() {

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-100
">
  

      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className="flex flex-col justify-center h-full mx-20">
        <h1 className='my-5'>
          <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
            Your Dashboard
          </span>
        </h1>
        <h2 className='mb-10'>
          <span className="text-2xl font-semibold text-gray-700">
            Here's what Eunice's recommendations are for you!
          </span>
        </h2>
        <RecommendationTable/>
      </div>
    </div>
  )
}

export default DashboardPage