import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { supabase } from '../lib/supabase'

export default function EmailEntryPage() {
  const navigate = useNavigate()
  const { setSessionId } = useSessionStore()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('guest_sessions')
        .insert({
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      setSessionId(data.id)
      sessionStorage.setItem('guest_email', email.trim().toLowerCase())
      sessionStorage.setItem('guest_name', name.trim())
      sessionStorage.setItem('guest_session_id', data.id)

      navigate('/frame-pick')
    } catch {
      setError('something went wrong, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-entry-page">
      <div className="email-entry-card">
        <div className="email-entry-brand">
          <span className="email-brand-icon"></span>
          <h1 className="email-brand-name">BINS FOUR CATS</h1>
          <p className="email-brand-tagline">Enter your email to get started</p>
        </div>

        <form onSubmit={handleStart} className="email-entry-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="name">your name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Maria"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'starting...' : 'next →'}
          </button>
        </form>

        <div className="email-entry-footer">
          <p>your photos will be sent to this email after the session</p>
        </div>
      </div>

      <div className="auth-bg-decoration" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="auth-bg-dot" />
        ))}
      </div>
    </div>
  )
}