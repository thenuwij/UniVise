import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SurveyPage from "./pages/SurveyPage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';

export const router = createBrowserRouter([
  { path: "/", element: <App/> },
  { path: "/login", element: <LoginPage/> },
  { path: "/register", element: <RegisterPage/> },
  { path: "/survey", element: <PrivateRoute><SurveyPage/></PrivateRoute>},
  { path: "/dashboard", element: <PrivateRoute><DashboardPage/></PrivateRoute>},
  { path: "/chatbot", element: <PrivateRoute><ChatbotPage /></PrivateRoute>},
  { path: "/profile", element: <PrivateRoute><ProfilePage/></PrivateRoute>}
]);