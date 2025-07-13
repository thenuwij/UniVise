import React, { useEffect } from 'react'
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { useState } from 'react'
import { supabase } from '../supabaseClient'

function ProfilePage() {

  const [ firstName, setFirstName ] = useState('');
  const [ lastName, setLastName ] = useState('');
  const [ email, setEmail ] = useState('');
  const [ dob, setDob ] = useState('');
  const [ gender, setGender ] = useState('');
  const [ studentType, setStudentType ] = useState('');
  const [ interests, setInterests ] = useState('');
  const [ university, setUniversity ] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);


  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          console.error("No user found");
          return;
        }
        console.log("User fetched successfully:", user);
        const firstName = user.user_metadata.first_name || '';
        const lastName = user.user_metadata.last_name || '';
        const email = user.email || '';
        const dob = user.user_metadata.dob || '';
        const studentType = user.user_metadata.student_type || '';
        const gender = user.user_metadata.gender || ''

        setFirstName(firstName);
        setLastName(lastName);
        setEmail(email);
        setGender(gender)
        setDob(dob);
        if (studentType === 'high_school') {
          setStudentType('High School')
        } else if (studentType === 'university') {
          setStudentType('University')
        }

      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUserInfo();
  },[]);

  return (
    <div>
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className='ml-20 text-4xl font-bold mt-10 mb-4'>
        <h1 className='text-sky-800 text-4xl'>My Account</h1>
      </div>
      <div>
        <div className='flex flex-col gap-4 ml-20 mr-20 max-w-1/3'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-semibold mb-4'>About Me</h2>
            <p><strong>First Name:</strong> {firstName}</p>
            <p><strong>Last Name:</strong> {lastName}</p>
            <p><strong>Gender:</strong> {gender}</p>
            <p><strong>Date of Birth:</strong> {dob}</p>
            <p><strong>Academic Type:</strong> {studentType}</p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md mt-4'>
            <h2 className='text-2xl font-semibold mb-4'>Additional Information</h2>
            <p><strong>Interests:</strong> {interests || 'Not specified'}</p>
            <p><strong>University:</strong> {university || 'Not specified'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
