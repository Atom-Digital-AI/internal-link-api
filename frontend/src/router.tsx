import { Navigate, Route, Routes } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from './contexts/AuthContext'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Linki',
  url: 'https://getlinki.app',
  description: 'Smart internal linking tool with AI-powered suggestions',
}

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Pricing from './pages/Pricing'
import Account from './pages/Account'
import AppPage from './pages/AppPage'
import Home from './pages/Home'
import Features from './pages/Features'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import BlogList from './pages/BlogList'
import BlogPost from './pages/BlogPost'
import VsPage from './pages/VsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user && !isLoading) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function AppRouter() {
  return (
    <>
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
    </Helmet>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppPage />
          </ProtectedRoute>
        }
      />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route path="/linki-vs/:slug" element={<VsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
