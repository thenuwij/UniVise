import HandbookRedirect from "./features/explore/pages/HandbookRedirect";
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import TermsPage from "./features/auth/pages/TermsPage";
import PrivacyPage from "./features/auth/pages/PrivacyPage";
import SurveyPage from "./features/onboarding/pages/SurveyPage";
import SetupPage from "./features/onboarding/pages/SetupPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import PrivateRoute from "./app/PrivateRoute";
import ChatbotPage from './features/chat/pages/ChatbotPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import RoadmapPage from "./features/roadmap/pages/RoadmapPage";
import LoadingRoadmapPage from "./features/roadmap/pages/LoadingRoadmapPage";
import RoadmapUNSWPage from "./features/roadmap/pages/RoadmapUNSWPage";
import LoadingRoadmapEntryPage from "./features/roadmap/pages/LoadingRoadmapEntryPage";
import SavedItemsPage from "./features/saved/pages/SavedItemsPage";
import ComparePage from "./features/transfer/pages/ComparePage";
import AuthCallback from "./features/auth/pages/AuthCallback";
import { roadmapStepUrl } from "./features/roadmap/utils/roadmapSteps";




export const router = createBrowserRouter([
  { path: "/", element: <LoginPage/> },
  { path: "/login", element: <LoginPage/> },
  { path: "/register", element: <RegisterPage/> },
  { path: "/terms", element: <TermsPage/> },
  { path: "/privacy", element: <PrivacyPage/> },
  { path: "/survey", element: <PrivateRoute requireProgram={false}><SurveyPage/></PrivateRoute>},
  { path: "/setup", element: <PrivateRoute requireProgram={false}><SetupPage/></PrivateRoute>},
  { path: "/dashboard", element: <PrivateRoute><DashboardPage/></PrivateRoute>},
  { path: "/chat/:conversationId?", element: <PrivateRoute><ChatbotPage /></PrivateRoute>},
  { path: "/profile", element: <PrivateRoute requireProgram={false}><ProfilePage/></PrivateRoute>},
  { path: "/recommendation/:id", element: <Navigate to={roadmapStepUrl("careers")} replace /> },
  { path: "/handbook", element: <HandbookRedirect /> },
  { path: "/explore-by-degree", element: <HandbookRedirect /> },
  { path: "/explore-by-specialisation", element: <HandbookRedirect /> },
  { path: "/explore-by-course", element: <HandbookRedirect /> },
  { path: "/degrees/:degreeId", element: <HandbookRedirect kind="programs" /> },
  { path: "/course/:courseId", element: <HandbookRedirect kind="courses" /> },
  { path: "/roadmap", element: <PrivateRoute><RoadmapPage /></PrivateRoute> },
  { path: "/roadmap-loading", element: <PrivateRoute><LoadingRoadmapPage /></PrivateRoute> },
  { path: "/roadmap/school", element: <Navigate to="/roadmap" replace /> },
  { path: "/roadmap/unsw", element: <PrivateRoute><RoadmapUNSWPage /></PrivateRoute> },
  { path: "/careers", element: <PrivateRoute><RoadmapUNSWPage view="careers" /></PrivateRoute> },
  { path: "/roadmap-entryload", element: <PrivateRoute><LoadingRoadmapEntryPage /></PrivateRoute> },
  { path: "/planner", element: <Navigate to="/dashboard" replace /> },
  { path: "/planner/school", element: <Navigate to="/dashboard" replace /> },
  { path: "/specialisation/major/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/specialisation/minor/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/specialisation/honours/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/saved", element: <PrivateRoute><SavedItemsPage /></PrivateRoute> },
  { path: "/compare", element: <PrivateRoute><ComparePage /></PrivateRoute> },
  { path: "/progress", element: <Navigate to="/compare" replace /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  
]);
