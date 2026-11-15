import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CompareProvider } from './context/CompareContext'
import { ToastProvider } from './context/ToastContext'
import { AboutPage } from './pages/AboutPage'
import { AppDetailPage } from './pages/AppDetailPage'
import { ComparePage } from './pages/ComparePage'
import { DiagnosisPage } from './pages/DiagnosisPage'
import { DiagnosisResultPage } from './pages/DiagnosisResultPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CompareProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="diagnosis" element={<DiagnosisPage />} />
              <Route path="diagnosis/result" element={<DiagnosisResultPage />} />
              <Route path="apps/:id" element={<AppDetailPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CompareProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
