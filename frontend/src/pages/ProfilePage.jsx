import React, { useEffect } from 'react'
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { FileUpload } from '../components/FileUpload'
import { Button, Checkbox, Dropdown, DropdownItem, Label, TextInput } from "flowbite-react";
import { data } from 'react-router-dom'

function ProfilePage() {

  const [ firstName, setFirstName ] = useState('Not Specified');
  const [ lastName, setLastName ] = useState('Not Specified');
  const [ email, setEmail ] = useState('Not Specified');
  const [ dob, setDob ] = useState('Not Specified');
  const [ gender, setGender ] = useState('Not Specified');
  const [ studentType, setStudentType ] = useState('Not Specified');
  const [ careerInterests, setCareerInterests ] = useState('Not Specified');
  const [ degreeInterests, setDegreeInterests] = useState([]);
  const [ year, setYear ] = useState('Not Specified');
  const [ academicStrengths, setAcademicStrengths ] = useState('Not Specified');
  const [confidence, setConfidence] = useState('Not Specified')
  const [ hobbies, setHobbies ] = useState([]);
  const [ university, setUniversity ] = useState('Not Specified');
  const [ isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ atar, setAtar ] = useState('Not Specified');
  const [ degreeStage, setDegreeStage] = useState('Not Specified')
  const [ degreeField, setDegreeField] = useState('Not Specified')
  const [ wam, setWam] = useState('Not Specified')

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const handleSave = () => {
    return
  }

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

          setAtar(data.atar)
          setYear(data.year)
          setAcademicStrengths(data.academicStrengths)
          setCareerInterests(data.career_interests)
          setDegreeInterests(data.degree_interest)
          setHobbies(data.hobbies)
          setConfidence(data.confidence)
          setStudentType('High School')
        } else if (studentType === 'university') {
          const { data } = await supabase
          .from("student_uni_data")
          .select("*")
          .eq("user_id",user.id)
          .single();

          setStudentType('University')
          setWam(data.wam)
          setDegreeField(data.degree_field)
          setDegreeStage(data.degree_stage)
          setCareerInterests(data.interest_areas)
          setHobbies(data.hobbies)
          setConfidence(data.confidence)
          setYear(data.academic_year)
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
          <Button pill className='mr-10' onClick={() => setIsEditing(true)}>Edit</Button>
        </div>
      </div>
      <div>
        {
          isEditing ? 
          (
          <form onSubmit={handleSave}>
            <div className='flex gap-4 m-6 ml-20 h-screen'>
              <div className='bg-white p-6 rounded-lg shadow-md mt-4 w-1/3 h-2/3'>
                <h2 className='text-2xl font-semibold mb-4'>About Me</h2>
                <TextInput id='firstName' placeholder={firstName}/>
                <TextInput id='lastName' placeholder={lastName}/>
                <TextInput id='email' placeholder={email}/>
                <TextInput id='gender' placeholder={gender}/>
                <TextInput id='dob' placeholder={dob} />
                <TextInput id='hobby' placeholder={hobbies} />
                <h2 className='text-2xl font-semibold mb-4'>Academic Information</h2>
                <div className='flex'>
                  <Dropdown label="Student Type" inline>
                    <DropdownItem>University</DropdownItem>
                    <DropdownItem>High School</DropdownItem>
                  </Dropdown>
                  {
                    studentType === "University" ? 
                    (
                      <Dropdown label="Year" inline>
                        <DropdownItem>Year 1</DropdownItem>
                        <DropdownItem>Year 2</DropdownItem>
                        <DropdownItem>Year 3</DropdownItem>
                        <DropdownItem>Year 4</DropdownItem>
                        <DropdownItem>Year 5+</DropdownItem>
                        <DropdownItem>Postgraduate/Other</DropdownItem>
                      </Dropdown>
                    ) : (
                      <Dropdown label="Grade" inline>
                        <DropdownItem>Year 10</DropdownItem>
                        <DropdownItem>Year 11</DropdownItem>
                        <DropdownItem>Year 12</DropdownItem>
                      </Dropdown>
                    )
                  }
                </div>
                <TextInput id="careerInterests" placeholder={careerInterests}/>
                <TextInput id="degreeInterests" placeholder={degreeInterests}/>
              </div>
             </div> 
          </form>
          ) 
          : 
          (
            <div className='flex gap-4 m-6 ml-20 h-screen'>
              <div className='bg-white p-6 rounded-lg shadow-md mt-4 w-1/3 h-2/3'>
                <h2 className='text-2xl font-semibold my-3'>About Me</h2>
                <p><strong>First Name:</strong> {firstName}</p>
                <p><strong>Last Name:</strong> {lastName}</p>
                <p><strong>Email:</strong> {email}</p>
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
                
                
                <h2 className='text-2xl font-semibold my-3'>Academic Information</h2>
                <p><strong>Academic Type:</strong> {year} ({studentType})</p>
                {
                  studentType === "High School" ? (
                    <>
                      <p><strong>ATAR:</strong> {atar}</p>
                      <p><strong>Academic Strengths: {academicStrengths}</strong></p>
                      <p><strong>Career Interests:</strong> {careerInterests}</p>
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
                      <p><strong>Confidence:</strong>{confidence}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Degree Stage:</strong> {degreeStage}</p>
                      <p><strong>Degree Field:</strong> {degreeField}</p>
                      <p><strong>WAM:</strong> {wam}</p>
                      <p><strong>Career Interests</strong> {careerInterests}</p>
                      <p><strong>Confidence:</strong> {confidence}</p>
                    </>
                  )
                }
              </div>
              <div className='bg-white p-3 rounded-lg shadow-md mt-4 w-1/3 h-2/5'>
                <h2 className='text-2xl font-semibold mb-4'>Transcript/Report</h2>
                <FileUpload/>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ProfilePage
