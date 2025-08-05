
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { supabase } from "../supabaseClient";
import { useEffect,useRef, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function RecommendationTable() {
  const { session } = UserAuth();
  const userType = session?.user?.user_metadata?.student_type
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    
    const fetchRecommendations = async () => {
      setLoading(true);

      try {
        let response;

        if (userType === "university") {
          response = await supabase
            .from("career_recommendations")
            .select("*")
            .eq("user_id", userId);
        } else if (userType === "high_school") {
          response = await supabase
            .from("degree_recommendations")
            .select("*")
            .eq("user_id", userId);
        }

        if (response?.error) {
          console.error("Error fetching recommendations:", response.error);
        } else {
          const recs = response.data;
          setRecommendations(
            recs.sort((a, b) => b.suitability_score - a.suitability_score)
          );
          console.log("Fetched recommendations:", response.data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userType && userId) {
      fetchRecommendations();
    } else {
      console.warn("User type or ID is not set, skipping recommendations fetch.");
    }
  }, [userType, userId]);





  const displayTable = () => {
    if (userType === "high_school") {
      return (
        <Table className="w-full text-md text-left rtl:text-right text-gray-900 dark:text-gray-700">
        <TableHead>
          <TableRow className="text-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 border-gray-500 font-semibold text-center">
            <TableHeadCell className="text-start">Degree</TableHeadCell>
            <TableHeadCell className="text-start">University Name</TableHeadCell>
            <TableHeadCell className="text-center">ATAR Requirement</TableHeadCell>
            <TableHeadCell className="text-center">Suitability (%)</TableHeadCell>
            <TableHeadCell className="text-center">Avg. Years</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {loading ? (
            <TableRow>
              <TableCell colSpan="6" className="text-center">Loading...</TableCell>
            </TableRow>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <TableRow key={rec.id} className="hover:bg-gray-100 dark:hover:bg-gray-200 border-b-gray-300 text-md" onClick={() => {navigate(`/recommendation/${rec.id}`, { state: { rec } })}}>
                <TableCell>{rec.degree_name}</TableCell>
                <TableCell>{rec.university_name}</TableCell>
                <TableCell className="text-center">{rec.atar_requirement}</TableCell>
                <TableCell className="text-center">{rec.suitability_score}</TableCell>
                <TableCell className="text-center">{rec.est_completion_years}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="6" className="text-center">No recommendations found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      )
    }
    else if (userType === "university") {
      return (
        <Table className="w-full text-md text-left rtl:text-right text-gray-900 dark:text-gray-700">
        <TableHead>
          <TableRow className="text-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 border-gray-500 font-semibold text-center">
            <TableHeadCell className="text-start">Career</TableHeadCell>
            <TableHeadCell className="text-start">Industry</TableHeadCell>
            <TableHeadCell>Suitability Score</TableHeadCell>
            <TableHeadCell>Education Required</TableHeadCell>
            <TableHeadCell>Average Salary</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {loading ? (
            <TableRow>
              <TableCell colSpan="4" className="text-center">Loading...</TableCell>
            </TableRow>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <TableRow key={rec.id} className="hover:bg-gray-100 dark:hover:bg-gray-200 border-b-gray-300 text-md" onClick={() => {navigate(`/recommendation/${rec.id}`, { state: { rec } })}}>
                <TableCell>{rec.career_title}</TableCell>
                <TableCell>{rec.industry}</TableCell>
                <TableCell className="text-center">{rec.suitability_score}</TableCell>
                <TableCell>{rec.education_required}</TableCell>
                <TableCell className="text-center">{rec.avg_salary_range}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="4" className="text-center">No recommendations found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      )
    }
    return null;
  };

  return (
  <>
    {!userType || !userId ? (
      <div>
        <p className="text-center text-gray-600">Loading user data...</p>
        <p>{userType}</p>
        <p>{userId}</p>
      </div>
    ) : (
      displayTable()
    )}
  </>
);

}