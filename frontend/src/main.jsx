import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeConfig } from 'flowbite-react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { SurveyContextProvider } from './context/SurveyContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <SurveyContextProvider>
        <ThemeConfig/> 
        <RouterProvider router={router} />
      </SurveyContextProvider>
    </AuthContextProvider>
  </StrictMode>,
)
