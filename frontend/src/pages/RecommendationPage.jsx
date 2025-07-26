import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';

function RecommendationPage() {

  const { id } = useParams()
  const { session } = UserAuth()
  const userType = session?.user?.user_metadata?.student_type
  const [rec, setRec] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || !userType) return

    const fetchDetails = async () => {
      const table =
        userType.toLowerCase().includes('high_school')
          ? 'degree_recommendations'
          : 'career_recommendations'

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Fetch error:', error)
        setError(error)
      } else {
        console.log('Fetched record:', data)
        setRec(data)
      }
    }

    fetchDetails()
  }, [id, userType])

  return (
    <div>RecommendationPage</div>
  )
}

export default RecommendationPage