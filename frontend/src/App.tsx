import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { HRLayout } from '@/components/layout/HRLayout'
import { CandidateLayout } from '@/components/layout/CandidateLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { LandingPage } from '@/pages/LandingPage'
import { HRDashboardPage } from '@/pages/hr/DashboardPage'
import { QuestionsPage } from '@/pages/hr/QuestionsPage'
import { CandidatesPage } from '@/pages/hr/CandidatesPage'
import { OfferLettersPage } from '@/pages/hr/OfferLettersPage'
import { SubmissionsPage } from '@/pages/hr/SubmissionsPage'
import { CandidateDashboardPage } from '@/pages/candidate/DashboardPage'
import { CandidateQuestionsPage } from '@/pages/candidate/QuestionsPage'
import { CandidateOfferLetterPage } from '@/pages/candidate/OfferLetterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/hr" element={<ProtectedRoute role="hr_admin"><HRLayout /></ProtectedRoute>}>
        <Route index element={<HRDashboardPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="offer-letters" element={<OfferLettersPage />} />
        <Route path="submissions" element={<SubmissionsPage />} />
      </Route>

      <Route path="/candidate" element={<ProtectedRoute role="candidate"><CandidateLayout /></ProtectedRoute>}>
        <Route index element={<CandidateDashboardPage />} />
        <Route path="questions" element={<CandidateQuestionsPage />} />
        <Route path="offer-letter" element={<CandidateOfferLetterPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
