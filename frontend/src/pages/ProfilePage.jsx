import React, { useEffect } from 'react'
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { FileUpload } from '../components/FileUpload'
import { Button } from 'flowbite-react'

function ProfilePage() {

  const [ firstName, setFirstName ] = useState('');
  const [ lastName, setLastName ] = useState('');
  const [ email, setEmail ] = useState('');
  const [ dob, setDob ] = useState('');
  const [ gender, setGender ] = useState('');
  const [ studentType, setStudentType ] = useState('');
  const [ careerInterests, setCareerInterests ] = useState('');
  const [ degreeInterests, setDegreeInterests] = useState([]);
  const [ year, setYear ] = useState('');
  const [ strengths, setStrengths ] = useState('');
  const [ hobbies, setHobbies ] = useState([]);
  const [ university, setUniversity ] = useState('');
  const [ isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ atar, setAtar ] = useState('');
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
          const { data } = await supabase
          .from("student_school_data")
          .select("*")
          .eq("user_id", user.id)
          .single();
          console.log("this is data",data)
          setCareerInterests(data.career_interests)
          setDegreeInterests(data.degree_interest)
          setYear(data.year)
          setHobbies(data.hobbies)
          setStudentType('High School')
          setAtar(data.atar)
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
        
        <div className='flex justify-between'>
          <h1 className='text-sky-800 text-4xl'>My Account</h1>
          <Button pill className='mr-10'>Edit</Button>
        </div>
        

      </div>
      <div>
        <div className='flex gap-4 m-6 ml-20 h-screen'>
          <div className='bg-white p-6 rounded-lg shadow-md mt-4 w-1/3 h-2/3'>
            <h2 className='text-2xl font-semibold mb-4'>About Me</h2>
            <p><strong>First Name:</strong> {firstName}</p>
            <p><strong>Last Name:</strong> {lastName}</p>
            <p><strong>Gender:</strong> {gender}</p>
            <p><strong>Date of Birth:</strong> {dob}</p>
            <p>
                <strong>Hobbies:</strong>{' '}
                  {hobbies && hobbies.length > 0
                    ? hobbies.map((hobby, idx) => (
                      <span key={hobby}>
                        {hobby}
                        {idx < hobbies.length - 1 && ', '}
                      </span>
                    ))
                  : 'None specified'}
              </p>
            
            <h2 className='text-2xl font-semibold mb-4'>Academic Information</h2>
            <p><strong>Academic Type:</strong> {year} ({studentType})</p>
            <p><strong>Career Interests:</strong> {careerInterests || 'Not specified'}</p>
              <p>
                <strong>Degree Interests:</strong>{' '}
                  {degreeInterests && degreeInterests.length > 0
                    ? degreeInterests.map((interest, idx) => (
                      <span key={interest}>
                        {interest}
                        {idx < degreeInterests.length - 1 && ', '}
                      </span>
                    ))
                  : 'None specified'}
              </p>
          </div>

          
          <div className='bg-white p-3 rounded-lg shadow-md mt-4 w-1/3 h-2/5'>
            <h2 className='text-2xl font-semibold mb-4'>Transcript/Report</h2>
            <FileUpload/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
