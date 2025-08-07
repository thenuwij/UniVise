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
    <div className="h-screen bg-gray-50 overflow-auto">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />
      <div className='flex'>
        <Button pill className='ml-10 mt-5 bg-gradient-to-br from-purple-600 to-blue-500
              text-white hover:bg-gradient-to-bl' size='md' onClick={() => navigate('/dashboard')}>Back</Button>
      </div>
      <main className="mx-auto p-6 flex gap-10 h-screen items-start ml-20">
        <div className='flex flex-col w-3/5 gap-5 '>
          <h2 className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 h-16">
            {recommendation.title}
          </h2>
          <Card className="bg-white shadow-lg p-4 mt-5">
            <h3 className="text-3xl text-gray-800">Summary</h3>
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
            <p className="text-gray-700 leading-relaxed text-lg">{summary}</p>
          </Card>
          <Card>
            <h3 className="text-xl text-gray-800">Our Insights</h3>
              <p className="text-gray-700 leading-relaxed text-lg">{explanation}</p>
          </Card>
          <Card>
            <h3 className="text-xl mb-2">Next Steps</h3>
            {nextSteps.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {nextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No next steps available.</p>
            )}
          </Card>
        </div>
        <div className='flex flex-col w-2/5 gap-5 mt-26 mr-10'>
         <div className="space-y-6">
            <Card>
              <h3 className="text-xl mb-2">Score Breakdown</h3>
              <p className='mb-5 text-lg'>
                Here is a breakdown to why we believe this is the right fit for you!
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{scoreBreakdown.academic_performance}</li>
                <li>{scoreBreakdown.skill_match}</li>
                <li>{scoreBreakdown.market_demand}</li>
              </ul>
            </Card>
          </div>  
          {
            userType === 'high_school' ? (
              <Card>
                <h3 className="text-xl mb-2">Specialisations</h3>
                {specialisations.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {specialisations.map((spec, idx) => (
                      <li key={idx}>{spec}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No specialisations available.</p>
                )}
              </Card>
            ) : (
              <Card>
                <h3 className="text-xl mb-2">Companies</h3>
                {companies.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {companies.map((company, idx) => (
                      <li key={idx}>{company}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="  text-gray-500">No companies available.</p>
                )}
              </Card>
            )
          }
          {
            userType === 'high_school' ? (
              <Card>
                <h3 className="text-xl mb-2">Career Pathways</h3>
                {careerPaths.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {careerPaths.map((path, idx) => (
                      <li key={idx}>{path}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No career pathways available.</p>
                )}
              </Card>
            ) : (
              <Card>
                <h3 className="text-xl mb-2">Job Opportunities</h3>
                {jobOpp ? (
                  <p>{jobOpp}</p>
                ) : (
                  <p className="text-gray-500">No job opportunities available.</p>
                )}
              </Card>
            )
          }
          <Card>
            <h3 className="text-xl mb-2">Resources</h3>
            {resources.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {resources.map((resource, idx) => (
                  <li key={idx}>{resource}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No resources available.</p>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

export default RecommendationPage