import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { MenuBar } from '../components/MenuBar';
import { DashboardNavBar } from '../components/DashboardNavBar';
import {
  Button,
  Card,
  Accordion,
  AccordionPanel,
  AccordionTitle,
  AccordionContent,
  ListGroup,
  Badge,
  ListGroupItem
} from 'flowbite-react'
import { IoChevronBackCircleSharp } from "react-icons/io5";

function RecommendationPage() {

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  
  const { id } = useParams()
  const { session } = UserAuth()
  const navigate = useNavigate();
  const userType = session?.user?.user_metadata?.student_type
  const [recommendationDetails, setRecommendationDetails] = useState([]);
  const [error, setError] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [insights, setInsights] = useState([]);
  const [scoreBreakdown, setScoreBreakown] = useState([]);
  const [specialisations, setSpecialisations] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [entryRequirements, setEntryRequirements] = useState([]);
  const [summary, setSummary] = useState('');
  const [nextSteps, setNextSteps] = useState([]);
  const [resources, setResources] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobOpp, setJobOpp] = useState('');
  
  const location = useLocation()
  const { rec } = location.state || {}
  let recommendation = {}
  if (rec) {
    if (userType === 'high_school') {
      recommendation = {
        title: rec.degree_name,
        subtitle: rec.university_name,
        badges: [
          { color: 'info', label: `ATAR: ${rec.atar_requirement}` },
          { color: 'success', label: `Score: ${rec.suitability_score}` },
          { color: 'purple', label: `Est. ${rec.est_completion_years} yrs` },
        ],
      }
    } else {
      recommendation = {
        title: rec.career_title,
        subtitle: rec.industry || rec.job_opportunity,
        badges: [
          { color: 'info', label: rec.education_required },
          { color: 'success', label: `Salary: ${rec.avg_salary_range}` },
        ],
      }
    }
  }



  useEffect(() => {
    if (!id || !userType) return

    const fetchDetails = async () => {
      const table =
        userType.toLowerCase().includes('high_school')
          ? 'degree_rec_details'
          : 'career_rec_details'

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Fetch error:', error)
        setError(error)
      } else {
        console.log(data)
        setExplanation(data.explanation)
        setInsights(data.insights)
        setScoreBreakown(data.score_breakdown)
        setNextSteps(data.next_steps)
        setResources(data.resources)
        setSpecialisations(data.specialisations)
        setCareerPaths(data.career_pathways)
        setEntryRequirements(data.entry_requirements)
        setCompanies(data.companies)
        setJobOpp(data.job_opportunity)
        setRecommendationDetails(data)
        setSummary(data.summary)
      }
    }

    fetchDetails()
  }, []);

  console.log(specialisations)
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className='flex'>
        <Button pill className='ml-10 mt-5' size='lg' onClick={() => navigate('/dashboard')}>Back</Button>
      </div>
      <main className="mx-auto p-6 flex gap-10 h-screen ml-5 items-start">
        <div className='flex flex-col w-3/5 gap-4'>
          <Card>
            <h2 className="text-5xl font-bold text-blue-700">
              {recommendation.title}
            </h2>
            <p className="text-2xl text-blue-900">
              {recommendation.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {recommendation.badges.map((badge, idx) => (
                <Badge key={idx} color={badge.color} size="lg">
                  {badge.label}
                </Badge>
              ))}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Summary</h3>
            <p className="text-gray-700 leading-relaxed text-lg">{summary}</p>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-gray-800">Our Insights</h3>
              <p className="text-gray-700 leading-relaxed text-lg">{explanation}</p>
          </Card>
        </div>
        
        <Accordion className='w-1/3'>
          <AccordionPanel>
            <AccordionTitle>Score Breakdown?</AccordionTitle>
            <AccordionContent>
              <p className='mb-5 text-lg'>
                Here is a breakdown to why we believe this is the right fit for you!
              </p>
              <p className="mb-2 text-gray-500 dark:text-gray-400">
                {scoreBreakdown.academic_match}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {scoreBreakdown.interest_fit}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {scoreBreakdown.career_outlook}
              </p>
            </AccordionContent>
          </AccordionPanel>
          {
            userType === 'high_school' ? 
            (
              <AccordionPanel>
                <AccordionTitle>Specialisations</AccordionTitle>
                  {specialisations.length > 0 && (
                    <AccordionContent>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {specialisations.map((spec, idx) => (
                          <li key={idx}>
                            {spec}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  )}
              </AccordionPanel>
            ) : 
            (
              <AccordionPanel>
                  <AccordionTitle>Companies</AccordionTitle>
                    {companies.length > 0 && (
                      <AccordionContent>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          {companies.map((company, idx) => (
                            <li key={idx}>
                              {company}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    )}
                </AccordionPanel>
            )
          }

          {
            userType == 'high_school' ? (
              <AccordionPanel>
                <AccordionTitle>Career Pathways</AccordionTitle>
                  {careerPaths.length > 0 && (
                    <AccordionContent>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {careerPaths.map((path, idx) => (
                          <li key={idx}>
                            {path}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  )}
              </AccordionPanel>
            ) 
            : (
              <AccordionPanel>
                <AccordionTitle>Career Pathways</AccordionTitle>
                  {jobOpp.length > 0 && (
                    <AccordionContent>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {jobOpp.map((job, idx) => (
                          <li key={idx}>
                            {job}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  )}
              </AccordionPanel>
            )
          }

          

          <AccordionPanel>
            <AccordionTitle>Next Steps</AccordionTitle>
            {nextSteps.length > 0 && (
              <AccordionContent>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  {nextSteps.map((step, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300">
                      {step}
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            )}
          </AccordionPanel>

          
          <AccordionPanel>
            <AccordionTitle>Resources</AccordionTitle>
            {resources.length > 0 && (
              <AccordionContent>
                <ListGroup>
                  {resources.map((res, idx) => (
                    <ListGroupItem key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        {res}
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </AccordionContent>
            )}
          </AccordionPanel>
          
        </Accordion>
      </main>
    </div>
  )
}

export default RecommendationPage