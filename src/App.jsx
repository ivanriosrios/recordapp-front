import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'

import LoginPage from './pages/Login'
import OnboardingPage from './pages/Onboarding'
import DashboardPage from './pages/Dashboard'
import ClientsPage from './pages/Clients'
import RemindersPage from './pages/Reminders'
import SettingsPage from './pages/Settings'
import ServiceHistoryPage from './pages/ServiceHistory'
import AnalyticsPage from './pages/Analytics'
import BottomNav from './components/layout/BottomNav'

function AppShell({ children }) {
  return (
    <div className="app-shell">
      {children}
    </div>
  )
}

function AuthenticatedLayout() {
  return (
    <>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/clients/*" element={<ClientsPage />} />
          <Route path="/reminders/*" element={<RemindersPage />} />
          <Route path="/services/*" element={<ServiceHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  )
}

export default function App() {
  const { token, business } = useAppStore()
  const isAuthenticated = Boolean(token && business?.id)

  return (
    <BrowserRouter>
      <AppShell>
        {isAuthenticated ? (
          <AuthenticatedLayout />
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </AppShell>
    </BrowserRouter>
  )
}
