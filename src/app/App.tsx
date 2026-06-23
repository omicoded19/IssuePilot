import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { AuthBootstrap } from '@/components/auth/AuthBootstrap'

export function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <AppRoutes />
      </AuthBootstrap>
    </BrowserRouter>
  )
}
