import { useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import { QRCodeSVG } from 'qrcode.react'
import { useSessionStore } from '../store/sessionStore'

export default function DownloadPage() {
  const navigate = useNavigate()
  const { finalStripUrl, reset } = useSessionStore()
  const guestEmail = sessionStorage.getItem('guest_email')
  const guestName = sessionStorage.getItem('guest_name')

  const handleDownload = () => {
    if (!finalStripUrl) return
    saveAs(finalStripUrl, `life4cuts-${Date.now()}.png`)
  }

  const handleNew = () => {
    reset()
    sessionStorage.clear()
    navigate('/')
  }

  // QR points to the current page URL — user can scan to re-open/download on their phone
  const qrUrl = finalStripUrl || window.location.href

  return (
    <div className="page-layout">
      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>
      <main className="download-page">
        <div className="download-content">
          <h1 className="page-title">your strip is ready!</h1>
          <p className="page-subtitle">
            we'll send a copy to <strong>{guestEmail}</strong>
          </p>

          {finalStripUrl ? (
            <img src={finalStripUrl} alt="Your final photo strip" className="download-preview" />
          ) : (
            <div className="download-placeholder">no strip found</div>
          )}

          {/* QR Code — scan to get the strip directly on your phone */}
          {finalStripUrl && (
            <div className="download-qr">
              <p className="download-qr-label">scan to save on your phone</p>
              <QRCodeSVG
                value={qrUrl}
                size={140}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
                includeMargin={true}
              />
            </div>
          )}

          <div className="download-actions">
            <button className="btn-primary btn-lg" onClick={handleDownload}>
              ↓ download strip
            </button>
            <button className="btn-ghost" onClick={handleNew}>
              + new session
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}