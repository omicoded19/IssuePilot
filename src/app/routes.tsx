import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrganizationsPage } from '@/pages/OrganizationsPage'
import { RepositoriesPage } from '@/pages/RepositoriesPage'
import { RepositoryAnalysisPage } from '@/pages/RepositoryAnalysisPage'
import { IssuesPage } from '@/pages/IssuesPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { DeveloperProfilePage } from '@/pages/DeveloperProfilePage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<DeveloperProfilePage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/repositories" element={<RepositoriesPage />} />
        <Route path="/repositories/:repositoryId" element={<RepositoryAnalysisPage />} />
        <Route path="/repositories/:repositoryId/issues" element={<IssuesPage />} />
        <Route path="/workspace/:owner/:repository/:issueNumber" element={<WorkspacePage />} />
        <Route path="/workspace/:issueId" element={<WorkspacePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
