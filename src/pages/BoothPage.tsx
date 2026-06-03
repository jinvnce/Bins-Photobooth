import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraView from '../components/camera/CameraView'
import { useSessionStore } from '../store/sessionStore'
import { useCamera } from '../hooks/useCamera'

export default function BoothPage() {
  const navigate = useNavigate()
  const { setPhotos, setSessionId, photoCount: storePhotoCount } = useSessionStore()
  const rawCount = storePhotoCount || Number(sessionStorage.getItem('photo_count')) || 4
  const maxPhotos = [6, 8, 10].includes(rawCount) ? 10 : rawCount
  const guestSessionId = sessionStorage.getItem('guest_session_id')
  const guestEmail = sessionStorage.getItem('guest_email')
  const guestName = sessionStorage.getItem('guest_name')

  const [flashing, setFlashing] = useState(false)

  const { photos, addPhoto, isFull, photoCount, resetPhotos } = useCamera(maxPhotos)

  useEffect(() => {
    if (!guestSessionId) navigate('/')
  }, [guestSessionId, navigate])

  const handleCapture = (dataUrl: string) => {
    addPhoto(dataUrl)
    setFlashing(true)
    setTimeout(() => setFlashing(false), 150)
  }

  const handleProceed = async () => {
    if (!isFull) return
    setPhotos(photos)
    if (guestSessionId) setSessionId(guestSessionId)
    navigate('/editor')
  }

  return (
    <div className="page-layout">
      {/* flash overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'white',
        opacity: flashing ? 1 : 0,
        pointerEvents: 'none',
        transition: flashing ? 'none' : 'opacity 0.3s ease-out',
        zIndex: 9999,
      }} />

      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>

      <main className="booth-page">
        <div className="booth-header">
          <button
            className="btn-ghost"
            onClick={() => { resetPhotos(); navigate('/frame-pick') }}
          >
            ← change layout
          </button>
          <div>
            <h1 className="page-title">take your photos</h1>
            <p className="page-subtitle">
              {maxPhotos} shot{maxPhotos > 1 ? 's' : ''} for your strip
            </p>
          </div>
        </div>

        <div className="booth-content" style={{ gridTemplateColumns: '1fr', maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>
          <CameraView
            onCapture={handleCapture}
            photoCount={photoCount}
            maxPhotos={maxPhotos}
          />
        </div>

        <div className="booth-footer">
          <button
            className="btn-primary btn-proceed"
            onClick={handleProceed}
            disabled={!isFull}
          >
            {isFull
              ? 'go to editor →'
              : `need ${maxPhotos - photoCount} more shot${maxPhotos - photoCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </main>
    </div>
  )
}