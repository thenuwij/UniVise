import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeConfig } from 'flowbite-react'
import { Toaster } from 'react-hot-toast'
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
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3500,
            className:
              '!rounded-xl !border !border-slate-200 dark:!border-slate-700 !bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-slate-100 !shadow-xl !text-sm !font-medium',
            style: { padding: '12px 16px', borderLeftWidth: '4px' },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
              style: { borderLeftColor: '#16a34a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { borderLeftColor: '#ef4444' },
            },
          }}
        />
      </SurveyContextProvider>
    </AuthContextProvider>
  </StrictMode>,
)
