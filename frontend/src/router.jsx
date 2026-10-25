import HandbookRedirect from "./app/HandbookRedirect";
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import TermsPage from "./features/auth/pages/TermsPage";
import PrivacyPage from "./features/auth/pages/PrivacyPage";
import SurveyPage from "./features/onboarding/pages/SurveyPage";
import SetupPage from "./features/onboarding/pages/SetupPage";
import HomePage from "./features/home/pages/HomePage";
import PrivateRoute from "./app/PrivateRoute";
import EunicePage from './features/eunice/pages/EunicePage';
import AccountPage from './features/account/pages/AccountPage';
import ProgramPickerPage from "./features/program/pages/ProgramPickerPage";
import ProgramBuildPage from "./features/program/pages/ProgramBuildPage";
import ProgramPage from "./features/program/pages/ProgramPage";
import ProgramEntryPage from "./features/program/pages/ProgramEntryPage";
import ShortlistPage from "./features/shortlist/pages/ShortlistPage";
import AuthCallback from "./features/auth/pages/AuthCallback";




export const router = createBrowserRouter([
  { path: "/", element: <LoginPage/> },
  { path: "/login", element: <LoginPage/> },
  { path: "/register", element: <RegisterPage/> },
  { path: "/terms", element: <TermsPage/> },
  { path: "/privacy", element: <PrivacyPage/> },
  { path: "/survey", element: <PrivateRoute requireProgram={false}><SurveyPage/></PrivateRoute>},
  { path: "/setup", element: <PrivateRoute requireProgram={false}><SetupPage/></PrivateRoute>},
  { path: "/dashboard", element: <PrivateRoute><HomePage/></PrivateRoute>},
  { path: "/chat/:conversationId?", element: <PrivateRoute><EunicePage /></PrivateRoute>},
  { path: "/profile", element: <PrivateRoute requireProgram={false}><AccountPage/></PrivateRoute>},
  { path: "/handbook", element: <HandbookRedirect /> },
  { path: "/explore-by-degree", element: <HandbookRedirect /> },
  { path: "/explore-by-specialisation", element: <HandbookRedirect /> },
  { path: "/explore-by-course", element: <HandbookRedirect /> },
  { path: "/degrees/:degreeId", element: <HandbookRedirect kind="programs" /> },
  { path: "/course/:courseId", element: <HandbookRedirect kind="courses" /> },
  { path: "/roadmap", element: <PrivateRoute><ProgramPickerPage /></PrivateRoute> },
  { path: "/roadmap-loading", element: <PrivateRoute><ProgramBuildPage /></PrivateRoute> },
  { path: "/roadmap/unsw", element: <PrivateRoute><ProgramPage /></PrivateRoute> },
  { path: "/careers", element: <PrivateRoute><ProgramPage view="careers" /></PrivateRoute> },
  { path: "/roadmap-entryload", element: <PrivateRoute><ProgramEntryPage /></PrivateRoute> },
  { path: "/specialisation/major/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/specialisation/minor/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/specialisation/honours/:id", element: <HandbookRedirect kind="specialisations" /> },
  { path: "/saved", element: <PrivateRoute><ShortlistPage /></PrivateRoute> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
  
]);
