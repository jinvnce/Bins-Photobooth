import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface LoginFormProps {
  onSwitch: () => void
}

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2 className="auth-title">welcome back ♡</h2>
      <p className="auth-subtitle">sign in to your photobooth</p>
      {error && <div className="auth-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="login-email">email</label>
        <input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">password</label>
        <input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'signing in...' : 'sign in'}
      </button>
      <p className="auth-switch">
        don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="link-btn">sign up</button>
      </p>
    </form>
  )
}