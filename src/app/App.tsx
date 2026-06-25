import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { AuthBootstrap } from '@/components/auth/AuthBootstrap'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
      <AuthBootstrap>
        <AppRoutes />
      </AuthBootstrap>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
