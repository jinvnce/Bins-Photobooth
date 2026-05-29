import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface SignupFormProps {
  onSwitch: () => void
}

export default function SignupForm({ onSwitch }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-form">
        <h2 className="auth-title">check your email ♡</h2>
        <p className="auth-subtitle">we sent a confirmation link to {email}</p>
        <button className="btn-primary" onClick={onSwitch}>
          back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSignup} className="auth-form">
      <h2 className="auth-title">create account ♡</h2>
      <p className="auth-subtitle">join the photobooth</p>

      {error && <div className="auth-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="fullName">name</label>
        <input
          id="fullName"
          type="text"
          placeholder="your name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">email</label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">password</label>
        <input
          id="password"
          type="password"
          placeholder="min 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'creating...' : 'create account'}
      </button>

      <p className="auth-switch">
        already have an account?{' '}
        <button type="button" onClick={onSwitch} className="link-btn">
          sign in
        </button>
      </p>
    </form>
  )
}