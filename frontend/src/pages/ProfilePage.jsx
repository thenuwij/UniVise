import React, { useEffect } from 'react'
import { MenuBar } from '../components/MenuBar'
import { DashboardNavBar } from '../components/DashboardNavBar'
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { FileUpload } from '../components/FileUpload'
import { Button, Checkbox, Dropdown, DropdownItem, Label, TextInput, Avatar, Tooltip, Badge } from "flowbite-react";
import { data } from 'react-router-dom'
import { HiX } from 'react-icons/hi'


function ProfilePage() {

  const [ firstName, setFirstName ] = useState('Not Specified');
  const [ lastName, setLastName ] = useState('Not Specified');
  const [ email, setEmail ] = useState('Not Specified');
  const [ dob, setDob ] = useState('Not Specified');
  const [ gender, setGender ] = useState('Not Specified');
  const [ studentType, setStudentType ] = useState('Not Specified');
  const [ careerInterests, setCareerInterests ] = useState(['']);
  const [ degreeInterests, setDegreeInterests] = useState(['']);
  const [ year, setYear ] = useState('Not Specified');
  const [ academicStrengths, setAcademicStrengths ] = useState(['']);
  const [confidence, setConfidence] = useState('Not Specified')
  const [hobbies, setHobbies] = useState([])
  const [ university, setUniversity ] = useState('Not Specified');
  const [ isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ atar, setAtar ] = useState('Not Specified');
  const [ degreeStage, setDegreeStage] = useState()
  const [ degreeField, setDegreeField] = useState('Not Specified')
  const [ wam, setWam] = useState()
  const [reportPath, setReportPath] = useState(null)
  const [userId, setUserId] = useState();

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      
        const { data: emailData, error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        if (emailError) {
          console.error('Error updating email:', emailError);
          return;
        }
      
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          dob,
          gender,
        },
        });
      if (authError) {
        console.error('Error updating auth metadata:', authError);
        return;
      } else {
        console.log('success', authData)
        setIsEditing(false)
      }

      if (studentType === 'High School') {

        const { data: { user }, error } = await supabase.auth.getUser();
        await supabase
          .from("student_school_data")
          .update({
            hobbies: hobbies,
            academic_strengths: academicStrengths,
            degree_interest: degreeInterests,
            career_interests: careerInterests,
            confidence: confidence
          })
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.log(error)
      return;
    }
  }

  function TagInput({ values, setValues, placeholder }) {
    const [next, setNext] = useState('')

    const addTag = () => {
      const t = next.trim()
      if (t && !values.includes(t)) {
        setValues([...values, t])
      }
      setNext('')
    }

    const removeTag = (i) => {
      setValues(values.filter((_, idx) => idx !== i))
    }

    const onKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addTag()
      } else if (e.key === 'Backspace' && !next) {
        // delete last tag when input empty
        removeTag(values.length - 1)
      }
    }

    return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput
          placeholder={placeholder}
          value={next}
          onChange={e => setNext(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button onClick={addTag} disabled={!next.trim()}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((tag, i) => (
          <Badge
            key={tag + i}
            size="sm"
            color="info"
          >
          <div className="flex items-center">  
            <span>{tag}</span>
            <HiX
              onClick={() => removeTag(i)}
            />
          </div>
          </Badge>
        ))}
      </div>
    </div>
  )
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
        
        setUserId(user.id)
        setFirstName(firstName);
        setLastName(lastName);
        setEmail(email);
        setGender(gender)
        setDob(dob);
        console.log(studentType)
        if (studentType === 'high_school') {
          const { data } = await supabase
          .from("student_school_data")
          .select("*")
          .eq("user_id", user.id)
          .single();

          setAtar(data.atar)
          setYear(data.year)
          setReportPath(data.report_path)

          const rawStrengths = data.academic_strengths
          const arrStrengths = Array.isArray(rawStrengths)
            ? rawStrengths : typeof rawStrengths === 'string'
            ? rawStrengths.split(',').map(h=> h.trim()).filter(Boolean) : []
          setAcademicStrengths(arrStrengths)

          const rawCareerInterests = data.career_interests
          const arrCareerInterests = Array.isArray(rawCareerInterests)
            ? rawCareerInterests : typeof rawCareerInterests === 'string'
            ? rawCareerInterests.split(',').map(h=> h.trim()).filter(Boolean) : []

          setCareerInterests(arrCareerInterests)

          const rawDegreeInterest = data.degree_interests
          const arrDegreeInterest = Array.isArray(rawDegreeInterest)
            ? rawDegreeInterest : typeof rawDegreeInterest === 'string'
            ? rawDegreeInterest.split(',').map(h=> h.trim()).filter(Boolean) : []

          setDegreeInterests(arrDegreeInterest)

          const rawHobbies = data.hobbies
          const arrHobbies = Array.isArray(rawHobbies) 
            ? rawHobbies : typeof rawHobbies === 'string'
            ? rawHobbies.split(',').map(h => h.trim()).filter(Boolean)
            : [];
          setHobbies(arrHobbies);

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
          setReportPath(data.report_path)
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
                <Button pill type='submit' form='profileForm'>Save</Button>
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
            
          <form id="profileForm" onSubmit={handleSave} className='flex justify-center gap-6'>
              <div className='flex flex-col gap-4 w-1/2'>

                {/* Box 1 */}
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  <h2 className='text-2xl font-semibold mb-2'>About Me</h2>
                  <div className='flex flex-col gap-4'>
                    <div className='text-sm'>
                      <p>First Name</p>
                      <TextInput id='firstName'type='text' placeholder={firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
                    </div>
                    <div className='text-sm'>
                      <p>Last Name</p>
                      <TextInput id='lastName' type='text' placeholder={lastName} value ={lastName} onChange={(e) => setLastName(e.target.value)}/>
                    </div>
                    <div className='text-sm'>
                      <p>Email</p>
                      <TextInput id='email' type = 'email' placeholder={email} value ={email} onChange={(e) => setEmail(e.target.value)}/>
                    </div>
                    <div className='text-sm'>
                      <p>Gender</p>
                      <Dropdown label={gender} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                        <DropdownItem onClick={() => setGender('Male')}>Male</DropdownItem>
                        <DropdownItem onClick={() => setGender('Female')}>Female</DropdownItem>
                        <DropdownItem onClick={() => setGender('Other')}>Other</DropdownItem>
                        <DropdownItem onClick={() => setGender('Prefer not to say')}>Prefer not to say</DropdownItem>
                      </Dropdown>
                    </div>
                    <div className='text-sm'>
                      <p>Date of Birth</p>
                      <TextInput id='dob' type='date' placeholder={dob} className='w-1/3' value={dob} onChange={(e) => setDob(e.target.value)}/>
                    </div>  
                    <div className='text-sm'>
                      <p>Hobbies</p>  
                      <TagInput 
                        values={hobbies}
                        setValues={setHobbies}
                        placeholder="Type Hobby and add"
                      />
                    </div>
                  </div>
                </div>

                {/* Box 2 */}
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  <h2 className='text-2xl font-semibold mb-2 mt-4'>Academic Information</h2>
                  <div className='flex flex-col gap-4'>
                    <div className='flex gap-2 w-2/3 text-sm'>
                      <div>
                        <p>School Type</p>
                        <Tooltip content="Cannot be changed.">
                          <Dropdown disabled label={studentType} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                            <DropdownItem onClick={() => setStudentType('University')}>University</DropdownItem>
                            <DropdownItem onClick={() => setStudentType('High School')}>High School</DropdownItem>
                          </Dropdown>
                        </Tooltip>  
                      </div>  
                      {
                        studentType === "University" ? 
                        (
                          <div className='text-sm'>
                            <p>Year</p>
                            <Dropdown label={year} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem onClick={() => setYear('Year 1')}>Year 1</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 2')}>Year 2</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 3')}>Year 3</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 4')}>Year 4</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 5')}>Year 5+</DropdownItem>
                              <DropdownItem onClick={() => setYear('Postgraduate/Other')}>Postgraduate/Other</DropdownItem>
                            </Dropdown>
                          </div>
                        ) : (
                          <div>
                            <p>Year</p>
                            <Dropdown label={year} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem onClick={() => setYear('Year 10')}>Year 10</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 11')}>Year 11</DropdownItem>
                              <DropdownItem onClick={() => setYear('Year 12')}>Year 12</DropdownItem>
                            </Dropdown>
                           </div> 
                        )
                      }
                    </div>
                    { 
                      studentType === "University" ? (
                        <>
                        <div className='text-sm'>
                          <p>Degree Stage</p>
                          <Dropdown label={degreeStage} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem onClick={() => setDegreeStage('Bachelors Degree')}>Bachelors Degree</DropdownItem>
                              <DropdownItem onClick={() => setDegreeStage('Masters Degree')}>Masters Degree</DropdownItem>
                              <DropdownItem onClick={() => setDegreeStage('PhD or Doctoral Program')}>PhD or Doctoral Program</DropdownItem>
                              <DropdownItem onClick={() => setDegreeStage('Other')}>Other</DropdownItem>
                            </Dropdown>
                        </div>
                        <div className='text-sm'>
                          <p>Degree Field</p>  
                          <TextInput label="Degree Field" placeholder={degreeField} value={degreeField} onChange={(e) => setDegreeField(e.target.value)}/>
                         </div> 
                        </>
                      ) : (<></>)
                    }
                    {
                      studentType === "High School" ? (
                        <div className='flex flex-col gap-4'>
                          <div>
                            <p className='text-sm'>ATAR</p>
                            <TextInput type='number' label="ATAR" placeholder={atar} value={atar} onChange={(e) => setAtar(e.target.value)}/>
                          </div>  
                          <div>
                            
                            <p className='text-sm'>Academic Strengths</p>
                               <TagInput 
                                  values={academicStrengths}
                                  setValues={setAcademicStrengths}
                                  placeholder="Type academic strengths and add"
                                />
                          </div>
                          <div>
                            <p className='text-sm'>Degree Interests</p>
                              <TagInput 
                                values={degreeInterests}
                                setValues={setDegreeInterests}
                                placeholder="Type degree interests and add"
                              />
                          </div>
                          <div>
                            <p className='text-sm'>Career Interests</p>
                             <TagInput 
                                values={careerInterests}
                                setValues={setCareerInterests}
                                placeholder="Type career interests and add"
                              />
                          </div>
                          <div>
                            <p className='text-sm'>Confidence Level</p>
                            <Dropdown  label={confidence} className='bg-gray-100 hover:bg-gray-200 text-gray-500 border-1'>
                              <DropdownItem onClick={() => setConfidence('Very confident - I know what I want')}>Very confident - I know what I want</DropdownItem>
                              <DropdownItem onClick={() => setConfidence('Somewhat confident - I have ideas but unsure')}>Somewhat confident - I have ideas but unsure</DropdownItem>
                              <DropdownItem onClick={() => setConfidence('Not confident - I need help figuring out')}>Not confident - I need help figuring out</DropdownItem>
                            </Dropdown>
                          </div>


                        </div> 
                      ) : (
                        <div className='gap-4 text-sm'>
                          <div className='mb-4'>
                            <p>Weighted Average Mark (WAM)</p>
                            <TextInput type="number" placeholder={wam} value={wam} onChange={(e) => setWam(e.target.value)}/>
                          </div>
                          <div>
                            <p>Career Interests</p>  
                             <TagInput 
                                values={careerInterests}
                                setValues={setCareerInterests}
                                placeholder="Type career interests and add"
                              />
                          </div>
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
                      <div className='flex flex-col gap-4 mt-4 font-light'>
                        <p>Degree Stage: {degreeStage}</p>
                        <p>Degree Field: {degreeField}</p>
                        <p>WAM: {wam}</p>
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
                          {
                            studentType === 'High School' || studentType === 'high_school' ? 
                            (
                               <FileUpload
                                  userId={userId}
                                  reportType = {"highschool_reports"}
                                  bucket="reports"
                                  table="student_school_data"
                                  column="report_path"
                                  onUpload={url => setReportPath(url)}
                                />
                            ) : (
                               <FileUpload
                                  userId={userId}
                                  reportType = {"uni_transcripts"}
                                  bucket="reports"
                                  table="student_uni_data"
                                  column="report_path"
                                  onUpload={url => setReportPath(url)}
                      
                                />
                            )
                          }
        
                          {reportPath && (
                            <a href={reportPath} target="_blank" className="mt-2 block underline">
                              View uploaded document
                            </a>
                          )}
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
