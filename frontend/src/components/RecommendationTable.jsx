
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "flowbite-react";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function RecommendationTable() {
  const { session } = UserAuth();
  const userType = session?.user?.user_metadata?.student_type
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  console.log(session)

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
          setRecommendations(response.data);
          console.log("Fetched recommendations:", response.data);}
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
        <Table className="w-full text-sm text-left rtl:text-right text-gray-900 dark:text-gray-400">
        <TableHead>
          <TableRow className="bg-gray-100 dark:bg-gray-800 dark:border-gray-700 border-gray-500 font-bold">
            <TableHeadCell>Degree Name</TableHeadCell>
            <TableHeadCell>University Name</TableHeadCell>
            <TableHeadCell>ATAR Requirement</TableHeadCell>
            <TableHeadCell>Suitability Score</TableHeadCell>
            <TableHeadCell>Est.Completion Years</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {loading ? (
            <TableRow>
              <TableCell colSpan="6" className="text-center">Loading...</TableCell>
            </TableRow>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <TableRow key={rec.id} className="hover:bg-gray-100 dark:hover:bg-gray-200 border-b-gray-300 text-md" onClick={() => navigate(`/recommendation/${rec.id}`)}>
                <TableCell>{rec.degree_name}</TableCell>
                <TableCell>{rec.university_name}</TableCell>
                <TableCell>{rec.atar_requirement}</TableCell>
                <TableCell>{rec.suitability_score}</TableCell>
                <TableCell>{rec.est_completion_years}</TableCell>
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
        <Table className="w-full text-sm text-left rtl:text-right text-gray-900 dark:text-gray-700">
        <TableHead>
          <TableRow className="bg-gray-100 dark:bg-gray-800 dark:border-gray-700 border-gray-500 font-bold">
            <TableHeadCell>Career</TableHeadCell>
            <TableHeadCell>Industry</TableHeadCell>
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
              <TableRow key={rec.id} className="hover:bg-gray-100 dark:hover:bg-gray-200 border-b-gray-300 text-md" onClick={() => navigate('/recommendation')}>
                <TableCell>{rec.career_title}</TableCell>
                <TableCell>{rec.industry}</TableCell>
                <TableCell>{rec.suitability_score}</TableCell>
                <TableCell>{rec.education_required}</TableCell>
                <TableCell>${rec.avg_salary_range}</TableCell>
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