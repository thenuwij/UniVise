import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { MenuBar } from '../components/MenuBar';
import { DashboardNavBar } from '../components/DashboardNavBar';
import {
  Card,
  Accordion,
  AccordionPanel,
  AccordionTitle,
  AccordionContent,
  ListGroup,
  Badge,
  ListGroupItem
} from 'flowbite-react'

function RecommendationPage() {

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  
  const { id } = useParams()
  const { session } = UserAuth()
  const userType = session?.user?.user_metadata?.student_type
  const [recommendationDetails, setRecommendationDetails] = useState([]);
  const [error, setError] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [insights, setInsights] = useState([]);
  const [scoreBreakdown, setScoreBreakown] = useState([]);
  const [specialisations, setSpecialisations] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [entryRequirements, setEntryRequirements] = useState([]);
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
      }
    }

    fetchDetails()
  }, []);

  console.log(specialisations)
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavBar onMenuClick={openDrawer} />
      <MenuBar isOpen={isOpen} handleClose={closeDrawer} />

      <main className="container mx-auto p-6">
        <Card className="mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {recommendation.title}
          </h2>
          <p className="mt-2 text-lg text-gray-700">
            {recommendation.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {recommendation.badges.map((badge, idx) => (
              <Badge key={idx} color={badge.color} size="lg">
                {badge.label}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Why?</h3>
          <p className="text-gray-700 leading-relaxed">{explanation}</p>
        </Card>

        <Accordion>
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
            userType == 'high_school' ? 
            (
            <>
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
              </>

              
            ) : 
            (
            <>
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
            </>
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
                <ListGroup flush>
                  {resources.map((res, idx) => (
                    <ListGroupItem key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <a
                        href={res.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {res}
                      </a>
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