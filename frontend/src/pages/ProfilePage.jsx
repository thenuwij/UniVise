import React, { useEffect } from 'react'
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { FileUpload } from '../components/FileUpload'
import { Button, Checkbox, Dropdown, DropdownItem, Label, TextInput, Avatar } from "flowbite-react";
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
          setAcademicStrengths(data.academic_strengths)
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
      <div className='ml-20 text-4xl font-bold mt-10'>
        <div className='flex justify-between'>
          <h1 className='text-sky-800 text-4xl ml-10'>My Account</h1>
          {
            isEditing ? (
              <div className='flex gap-3 mr-20 mb-10'>
                <Button pill color="light" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button pill>Save</Button>
              </div>
            ) : (
              <>
                <Button pill className='mr-20' onClick={() => setIsEditing(true)}>Edit</Button>
              </>
            )
          }
        </div>
      </div>
      <div>
        {
          isEditing ? 
          (
          <form onSubmit={handleSave} className='flex justify-center gap-6'>
              <div className='flex flex-col gap-4 w-1/2'>

                {/* Box 1 */}
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  <h2 className='text-2xl font-semibold mb-2'>About Me</h2>
                  <div className='flex flex-col gap-4'>
                    <TextInput id='firstName' placeholder={firstName}/>
                    <TextInput id='lastName' placeholder={lastName}/>
                    <TextInput id='email' placeholder={email}/>
                    <TextInput id='gender' placeholder={gender}/>
                    <TextInput id='dob' type='date' placeholder={dob} />
                    <TextInput id='hobby' placeholder={hobbies} />
                  </div>
                </div>

                {/* Box 2 */}
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  <h2 className='text-2xl font-semibold mb-2 mt-4'>Academic Information</h2>
                  <div className='flex flex-col gap-4'>
                    <div className='flex gap-2 w-2/3'>
                      <Dropdown label={studentType} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1' >
                        <DropdownItem>University</DropdownItem>
                        <DropdownItem>High School</DropdownItem>
                      </Dropdown>
                      {
                        studentType === "University" ? 
                        (
                          <div>
                            <Dropdown label={year} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem>Year 1</DropdownItem>
                              <DropdownItem>Year 2</DropdownItem>
                              <DropdownItem>Year 3</DropdownItem>
                              <DropdownItem>Year 4</DropdownItem>
                              <DropdownItem>Year 5+</DropdownItem>
                              <DropdownItem>Postgraduate/Other</DropdownItem>
                            </Dropdown>
                            <Dropdown label="Degree Stage" className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem>Bachelors Degree</DropdownItem>
                              <DropdownItem>Masters / Degree</DropdownItem>
                              <DropdownItem>PhD or Doctoral Program</DropdownItem>
                              <DropdownItem>Other</DropdownItem>
                            </Dropdown>
                            <TextInput label="Degree Field" placeholder={degreeField}/>

                          </div>
                        ) : (
                          <Dropdown label={year} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                            <DropdownItem>Year 10</DropdownItem>
                            <DropdownItem>Year 11</DropdownItem>
                            <DropdownItem>Year 12</DropdownItem>
                          </Dropdown>
                        )
                      }
                    </div>
                    {
                      studentType === "High School" ? (
                        <div className='flex flex-col gap-4'>
                          <div>
                            <p className='text-sm'>ATAR</p>
                            <TextInput label="ATAR" placeholder={atar}/>
                          </div>  
                          <div>
                            <p className='text-sm'>Academic Strengths</p>
                            <TextInput label="Academic Strengths" placeholder={academicStrengths}/>
                          </div>
                          <div>
                            <p className='text-sm'>Degree Interests</p>
                            <TextInput label="Degree Interests" placeholder={degreeInterests}/>
                          </div>
                          <div>
                            <p className='text-sm'>Career Interests</p>
                            <TextInput label="Career Interests" placeholder={careerInterests}/>
                          </div>
                          <div>
                            <p className='text-sm'>Confidence Level</p>
                            <Dropdown  label={confidence} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem>Very confident - I know what I want</DropdownItem>
                              <DropdownItem>Somewhat confident - I have ideas but unsure</DropdownItem>
                              <DropdownItem>Not confident - I need help figuring out</DropdownItem>
                            </Dropdown>
                          </div>


                        </div> 
                      ) : (
                        <div>
                          <TextInput label="WAM" placeholder={`${wam} WAM`}/>
                          <TextInput label="Career Interests" placeholder={careerInterests}/>
                        </div>
                      )
                    }
                  </div>
                </div>
              </div> 
              <div>
               <div className="flex flex-col gap-5">
                    <div className='bg-white p-6 rounded-lg shadow-md flex flex-col'>
                      <h2 className='text-2xl font-semibold'>Profile Picture</h2>
                      <Avatar rounded size='xl' className='py-5'/>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow-md flex flex-col'>
                        <div>
                          {
                            studentType === 'University' ? (
                              <div>  
                                <h2 className='text-2xl font-semibold'>Transcript</h2>
                                <p className='mb-2 font-light'>Upload your most recent transcript</p>
                              </div> 
                            ) 
                            :
                            (
                              <div>
                                <h2 className='text-2xl font-semibold'>School Report</h2>
                                <p className='mb-2 font-light'>Upload your most recent school report</p>
                              </div>
                            ) 
                            
                          }
                        </div>
                        <div>    
                          <FileUpload/>
                        </div>  
                    </div>
                </div>  
              </div>
          </form>
          ) 
          : 
          (
            <div className='flex gap-10 justify-center mt-10'>
              <div className='flex flex-col gap-5 w-1/2'>
                  <div className='bg-white p-6 rounded-lg shadow-md'>
                    <h2 className='text-2xl font-semibold my-3'>About Me</h2>
                    <div className='flex flex-col gap-4 text-xl font-light'>
                      <p>First Name: {firstName}</p>
                      <p>Last Name: {lastName}</p>
                      <p>Email: {email}</p>
                      <p>Gender: {gender}</p>
                      <p>Date of Birth: {dob}</p>
                      <p>
                        Hobbies:{' '}
                        {hobbies && hobbies.length > 0
                          ? hobbies.map((hobby, idx) => (
                            <span key={hobby}>
                              {hobby}
                              {idx < hobbies.length - 1 && ', '}
                            </span>
                          ))
                          : 'None specified'}
                      </p>
                    </div>
                  </div>
                  <div className='bg-white p-6 rounded-lg shadow-md text-xl'>
                    <h2 className='text-2xl font-semibold my-3 gap-4'>Academic Information</h2>
                    <p className='font-light'>Academic Type: {year} ({studentType})</p>
                    {studentType === "High School" ? (
                      <div className='flex flex-col gap-4 mt-4 font-light'>
                        <p>ATAR: {atar}</p>
                        <p>Academic Strengths:{' '}
                          {academicStrengths && academicStrengths.length > 0
                          ? academicStrengths.map((interest, idx) => (
                            <span key={interest}>
                              {interest}
                              {idx < academicStrengths.length - 1 && ', '}
                            </span>
                          ))
                          : 'None specified'}
                          </p>
                        <p>Career Interests:{' '} 
                          {careerInterests && careerInterests.length > 0
                          ? careerInterests.map((interest, idx) => (
                            <span key={interest}>
                              {interest}
                              {idx < careerInterests.length - 1 && ', '}
                            </span>
                          ))
                          : 'None specified'}
                        </p>
                        <p>
                          Degree Interests:{' '}
                          {degreeInterests && degreeInterests.length > 0
                            ? degreeInterests.map((interest, idx) => (
                              <span key={interest}>
                                {interest}
                                {idx < degreeInterests.length - 1 && ', '}
                              </span>
                            ))
                            : 'None specified'}
                        </p>
                        <p>Confidence: {confidence}</p>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-1'>
                        <p>Degree Stage: {degreeStage}</p>
                        <p>Degree Field: {degreeField}</p>
                        <p>WAM: {wam}</p>
                        <p>Career Interests {careerInterests}</p>
                        <p>Confidence: {confidence}</p>
                      </div>
                    )}
                  </div>
                </div>
                  <div className="flex flex-col gap-5 1/4">
                    <div className='bg-white p-6 rounded-lg shadow-md flex flex-col'>
                      <h2 className='text-2xl font-semibold'>Profile Picture</h2>
                      <Avatar rounded size='xl' className='py-5'/>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow-md flex flex-col'>
                        <div>
                          {
                            studentType === 'University' ? (
                              <div>  
                                <h2 className='text-2xl font-semibold'>Transcript</h2>
                                <p className='mb-2 font-light'>Upload your most recent transcript</p>
                              </div> 
                            ) 
                            :
                            (
                              <div>
                                <h2 className='text-2xl font-semibold'>School Report</h2>
                                <p className='mb-2 font-light'>Upload your most recent school report</p>
                              </div>
                            ) 
                            
                          }
                        </div>
                        <div>    
                          <FileUpload/>
                        </div>  
                    </div>
                </div>  
              </div>
            
          )
        }
      </div>
    </div>
  )
}

export default ProfilePage
