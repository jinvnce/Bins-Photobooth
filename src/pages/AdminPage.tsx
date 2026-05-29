import { useEffect, useState } from 'react'
import { saveAs } from 'file-saver'
import { supabase } from '../lib/supabase'

interface GuestSession {
  id: string
  email: string
  name: string | null
  status: string
  created_at: string
  gallery_items: GalleryItem[]
}

interface GalleryItem {
  id: string
  final_image_url: string
  created_at: string
  frame_style: string
  bg_color: string
}

// ─── Static sender info (hardcoded, not editable) ───────────────────────────
const SENDER_NAME = 'BINS FOUR CATS'
const SENDER_EMAIL = 'onboarding@resend.dev'

const DEFAULT_SUBJECT = 'your bins four cats photo strip is here!'
const DEFAULT_BODY = `Hi {name}! 

Thank you for joining our photobooth event!

Your photo strip is attached to this email. Feel free to save and share it!

With love,
Bins - Creator`

const SENT_KEY = 'admin_sent_items'
const SUBJECT_KEY = 'admin_email_subject'
const BODY_KEY = 'admin_email_body'

function getSentItems(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markItemSent(itemId: string) {
  const sent = getSentItems()
  sent.add(itemId)
  localStorage.setItem(SENT_KEY, JSON.stringify([...sent]))
}

function getSavedSubject(): string {
  return localStorage.getItem(SUBJECT_KEY) || DEFAULT_SUBJECT
}

function getSavedBody(): string {
  return localStorage.getItem(BODY_KEY) || DEFAULT_BODY
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<GuestSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [keyError, setKeyError] = useState('')

  const [sentItems, setSentItems] = useState<Set<string>>(getSentItems)

  const [showComposer, setShowComposer] = useState(false)
  const [emailSubject, setEmailSubject] = useState(getSavedSubject)
  const [emailBody, setEmailBody] = useState(getSavedBody)
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [saveConfirm, setSaveConfirm] = useState(false)

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminKey === ADMIN_PASSWORD) {
      setUnlocked(true)
      setKeyError('')
    } else {
      setKeyError('incorrect password')
    }
  }

  useEffect(() => {
    if (!unlocked) return
    fetchSessions()
  }, [unlocked])

  const fetchSessions = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase
      .from('guest_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: galleryData } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false })

    const sessionsWithPhotos = (sessionData ?? []).map(session => ({
      ...session,
      gallery_items: (galleryData ?? []).filter(
        item => item.email === session.email
      )
    }))

    setSessions(sessionsWithPhotos as GuestSession[])
    setLoading(false)
  }

  const handleSaveSettings = () => {
    localStorage.setItem(SUBJECT_KEY, emailSubject)
    localStorage.setItem(BODY_KEY, emailBody)
    setSaveConfirm(true)
    setTimeout(() => {
      setSaveConfirm(false)
      setShowComposer(false)
    }, 1500)
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('delete this session and all its photos?')) return
    await supabase.from('guest_sessions').delete().eq('id', sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const handleDownload = (url: string, email: string) => {
    saveAs(url, `life4cuts-${email}-${Date.now()}.png`)
  }

  const handleSendEmail = async (session: GuestSession, item: GalleryItem) => {
    setSendingTo(session.email)

    const personalizedBody = emailBody
      .replace('{name}', session.name || session.email)
      .replace('{email}', session.email)

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: session.email,
          name: session.name || session.email,
          imageUrl: item.final_image_url,
          subject: emailSubject,
          body: personalizedBody,
        }),
      })

      if (!res.ok) throw new Error('send failed')

      markItemSent(item.id)
      setSentItems(getSentItems())
      setSendSuccess(session.email)
      setTimeout(() => setSendSuccess(null), 3000)

    } catch (err) {
      alert(`failed to send to ${session.email} — check console`)
      console.error(err)
    } finally {
      setSendingTo(null)
    }
  }

  const handleSendAll = async () => {
    const sessionsWithPhotos = sessions.filter(s => s.gallery_items?.length > 0)
    if (sessionsWithPhotos.length === 0) {
      alert('no sessions with photos to send!')
      return
    }

    if (!confirm(`send emails to ${sessionsWithPhotos.length} people?`)) return

    for (const session of sessionsWithPhotos) {
      for (const item of session.gallery_items) {
        const personalizedBody = emailBody
          .replace('{name}', session.name || session.email)
          .replace('{email}', session.email)

        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: session.email,
              name: session.name || session.email,
              imageUrl: item.final_image_url,
              subject: emailSubject,
              body: personalizedBody,
            }),
          })

          markItemSent(item.id)
        } catch (err) {
          console.error(`failed for ${session.email}`, err)
        }
      }
    }

    setSentItems(getSentItems())
    alert('all emails sent!')
  }

  const filtered = sessions.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (!unlocked) {
    return (
      <div className="admin-lock-page">
        <div className="admin-lock-card">
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <h2>admin access</h2>
          <form onSubmit={handleUnlock} className="email-entry-form">
            {keyError && <div className="auth-error">{keyError}</div>}
            <div className="form-group">
              <label>password</label>
              <input
                type="password"
                placeholder="enter admin password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary">unlock</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="page-title">admin panel 🔧</h1>
          <p className="page-subtitle">{sessions.length} total sessions</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn-secondary" onClick={() => setShowComposer(c => !c)}>
            {showComposer ? 'hide settings' : '✉️ email settings'}
          </button>
          <button className="btn-primary" onClick={handleSendAll}>
            📨 send all emails
          </button>
          <button className="btn-secondary" onClick={fetchSessions}>↻ refresh</button>
        </div>
      </div>

      {showComposer && (
        <div className="email-composer">
          <h3 className="composer-title">Email settings</h3>
          <p className="composer-hint">
            use <code>{'{name}'}</code> and <code>{'{email}'}</code> in the message — they get replaced automatically
          </p>

          {/* Static sender info — read only */}
          <div className="composer-grid">
            <div className="form-group">
              <label>sending from</label>
              <div className="static-field">
                {SENDER_NAME} &lt;{SENDER_EMAIL}&gt;
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>email subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>email message</label>
              <textarea
                className="composer-textarea"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={8}
              />
            </div>
          </div>

          <div className="composer-preview">
            <p className="composer-preview-label">preview</p>
            <div className="composer-preview-box">
              <p><strong>from:</strong> {SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</p>
              <p><strong>to:</strong> guest@email.com</p>
              <p><strong>subject:</strong> {emailSubject}</p>
              <pre className="composer-preview-body">
                {emailBody.replace('{name}', 'Guest Name').replace('{email}', 'guest@email.com')}
              </pre>
            </div>
          </div>

          <button className="btn-primary" onClick={handleSaveSettings}>
            {saveConfirm ? '✓ saved!' : 'save settings ✓'}
          </button>
        </div>
      )}

      {sendSuccess && (
        <div className="send-success">
          ✅ email sent to {sendSuccess}!
        </div>
      )}

      <div className="admin-search">
        <input
          type="text"
          placeholder="search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      {loading ? (
        <div className="loader-wrapper">
          <div className="loader-spinner" />
          <p className="loader-message">loading sessions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="gallery-empty">
          <span className="gallery-empty-icon">📭</span>
          <p>no sessions found</p>
        </div>
      ) : (
        <div className="admin-sessions">
          {filtered.map(session => (
            <div key={session.id} className="admin-session-card">
              <div className="admin-session-header">
                <div className="admin-session-info">
                  <span className="admin-session-name">{session.name || 'guest'}</span>
                  <span className="admin-session-email">📧 {session.email}</span>
                  <span className="admin-session-date">
                    🕐 {new Date(session.created_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="admin-session-actions">
                  <span className={`admin-status-badge ${session.status}`}>
                    {session.status}
                  </span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(session.id)}
                    title="delete session"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {session.gallery_items?.length > 0 ? (
                <div className="admin-photos">
                  {session.gallery_items.map(item => {
                    const isSent = sentItems.has(item.id)
                    return (
                      <div key={item.id} className={`admin-photo-card ${isSent ? 'photo-sent' : ''}`}>
                        {isSent && (
                          <div className="sent-ribbon">
                            <span>✓ sent</span>
                          </div>
                        )}

                        <img
                          src={item.final_image_url}
                          alt="photo strip"
                          className="admin-photo-img"
                          crossOrigin="anonymous"
                        />

                        <div className={`photo-email-status ${isSent ? 'status-sent' : 'status-pending'}`}>
                          {isSent ? '✉️ email sent' : '⏳ not sent yet'}
                        </div>

                        <div className="admin-photo-actions">
                          <button
                            className="admin-download-btn"
                            onClick={() => handleDownload(item.final_image_url, session.email)}
                          >
                            ↓ download
                          </button>
                          <button
                            className={`admin-send-btn ${isSent ? 'btn-resend' : ''}`}
                            onClick={() => handleSendEmail(session, item)}
                            disabled={sendingTo === session.email}
                            title={isSent ? 'resend email' : 'send email'}
                          >
                            {sendingTo === session.email
                              ? 'sending...'
                              : isSent
                                ? '↩ resend'
                                : '✉️ send'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="admin-no-photos">no photos yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}