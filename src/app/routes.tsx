import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const OnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const OrganizationsPage = lazy(() =>
  import('@/pages/OrganizationsPage').then((module) => ({ default: module.OrganizationsPage })),
)
const RepositoriesPage = lazy(() =>
  import('@/pages/RepositoriesPage').then((module) => ({ default: module.RepositoriesPage })),
)
const RepositoryAnalysisPage = lazy(() =>
  import('@/pages/RepositoryAnalysisPage').then((module) => ({
    default: module.RepositoryAnalysisPage,
  })),
)
const IssuesPage = lazy(() =>
  import('@/pages/IssuesPage').then((module) => ({ default: module.IssuesPage })),
)
const WorkspacePage = lazy(() =>
  import('@/pages/WorkspacePage').then((module) => ({ default: module.WorkspacePage })),
)
const AnalyticsPage = lazy(() =>
  import('@/pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })),
)
const DeveloperProfilePage = lazy(() =>
  import('@/pages/DeveloperProfilePage').then((module) => ({
    default: module.DeveloperProfilePage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const AuthCallbackPage = lazy(() =>
  import('@/pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
)

function RouteLoadingFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-white/10" />
      <LoadingSkeleton lines={7} />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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
          <Route
            path="/workspace/:owner/:repository/:issueNumber"
            element={<WorkspacePage />}
          />
          <Route path="/workspace/:issueId" element={<WorkspacePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
