import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SurveyPage from "./pages/SurveyPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';
import RecommendationPage from "./pages/RecommendationPage";
import PersonalityQuizPage from "./pages/PersonalityQuizPage";
import PersonalityResultPage from "./pages/PersonalityResultPage";
import LoadingPersonalityPage from "./pages/LoadingPersonalityPage";
import ExploreByDegreePage from "./pages/ExploreByDegreePage";
import ExploreByMajorPage from "./pages/ExploreByMajorPage";
import ExploreByCoursePage from "./pages/ExploreByCoursePage";
import DegreeDetailPage from "./pages/DegreeDetailPage";
import RoadmapPage from "./pages/RoadmapPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LoadingRoadmapPage from "./pages/LoadingRoadmapPage";
import RoadmapSchoolPage from "./pages/RoadmapSchoolPage";
import RoadmapUNSWPage from "./pages/RoadmapUNSWPage";
import RoadmapTranscriptPage from "./pages/RoadmapTranscriptPage";
import LoadingRoadmapEntryPage from "./pages/LoadingRoadmapEntryPage";


export const router = createBrowserRouter([
  { path: "/", element: <App/> },
  { path: "/login", element: <LoginPage/> },
  { path: "/register", element: <RegisterPage/> },
  { path: "/survey", element: <PrivateRoute><SurveyPage/></PrivateRoute>},
  { path: "/dashboard", element: <PrivateRoute><DashboardPage/></PrivateRoute>},
  { path: "/chat", element: <PrivateRoute><ChatbotPage /></PrivateRoute>},
  { path: "/chat/:conversationId", element: <PrivateRoute><ChatbotPage /></PrivateRoute>},
  { path: "/profile", element: <PrivateRoute><ProfilePage/></PrivateRoute>},
  { path: "/recommendation/:id" , element: <PrivateRoute><RecommendationPage/></PrivateRoute>},
  { path: "/quiz", element: <PrivateRoute><PersonalityQuizPage /></PrivateRoute>},
  { path: "/quiz/result", element: <PrivateRoute><PersonalityResultPage /></PrivateRoute>},
  { path: "/quiz/loading", element: <PrivateRoute><LoadingPersonalityPage /></PrivateRoute> },
  { path: "/explore-by-degree", element: <PrivateRoute><ExploreByDegreePage /></PrivateRoute> },
  { path: "/explore-by-major", element: <PrivateRoute><ExploreByMajorPage /></PrivateRoute> },
  { path: "/explore-by-course", element: <PrivateRoute><ExploreByCoursePage /></PrivateRoute> },
  { path: "/degrees/:degreeId", element: <PrivateRoute><DegreeDetailPage /></PrivateRoute> },
  { path: "/course/:courseId", element: <PrivateRoute><CourseDetailPage /></PrivateRoute> },
  { path: "/roadmap", element: <PrivateRoute><RoadmapPage /></PrivateRoute> },
  { path: "/roadmap-loading", element: <PrivateRoute><LoadingRoadmapPage /></PrivateRoute> },
  { path: "/roadmap/school", element: <PrivateRoute><RoadmapSchoolPage /></PrivateRoute> },
  { path: "/roadmap/unsw", element: <PrivateRoute><RoadmapUNSWPage /></PrivateRoute> },
  { path: "/roadmap/transcript", element: <PrivateRoute><RoadmapTranscriptPage /></PrivateRoute> },
  { path: "/roadmap-entryload", element: <PrivateRoute><LoadingRoadmapEntryPage /></PrivateRoute> }
]);