import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import { useAuth } from '../hooks/useAuth'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)

  if (loading) return null
  if (user) return <Navigate to="/booth" replace />

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon"></span>
          <h1 className="auth-brand-name">BINS FOUR CATS</h1>
          <p className="auth-brand-tagline">your digital photobooth</p>
        </div>

        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitch={() => setIsLogin(true)} />
        )}
      </div>

      <div className="auth-bg-decoration" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="auth-bg-dot" />
        ))}
      </div>
    </div>
  )
}