import { useRef, useCallback, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import CountdownTimer from './CountdownTimer'

interface CameraViewProps {
  onCapture: (imageSrc: string) => void
  photoCount: number
  maxPhotos?: number
}

export default function CameraView({
  onCapture,
  photoCount,
  maxPhotos = 4,
}: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [useTimer, setUseTimer] = useState(false)
  const [flash, setFlash] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isMirrored, setIsMirrored] = useState(true)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop())
        return navigator.mediaDevices.enumerateDevices()
      })
      .then(allDevices => {
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput')
        setDevices(videoDevices)
        if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId)
      })
      .catch(() => setPermissionDenied(true))
  }, [])

  const captureNow = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
    onCapture(imageSrc)
  }, [onCapture])

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const label = devices.find(d => d.deviceId === e.target.value)?.label?.toLowerCase() || ''
    const isBack = label.includes('back') || label.includes('rear')
    setCameraReady(false)
    setSelectedDeviceId(e.target.value)
    setIsMirrored(!isBack)
  }



  const isFull = photoCount >= maxPhotos

  const videoConstraints = {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    width: 1280,
    height: 720,
  }

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('obs')) return '🎥'
    if (l.includes('phone') || l.includes('iphone') || l.includes('android')) return '📱'
    if (l.includes('droid') || l.includes('continuity')) return '📱'
    if (l.includes('back') || l.includes('rear')) return '📷'
    if (l.includes('front') || l.includes('facetime')) return '🤳'
    return '📹'
  }

  const selectedLabel = devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Select camera'

  if (permissionDenied) {
    return (
      <div className="camera-permission-denied">
        <span>🚫</span>
        <h3>camera access denied</h3>
        <p>please allow camera access in your browser settings and refresh the page</p>
      </div>
    )
  }

  return (
    <div className="camera-wrapper">

      {/* Camera dropdown selector */}
      <div className="camera-dropdown-wrapper">
        <label className="camera-dropdown-label" htmlFor="camera-select">
          📹 camera source
        </label>
        <div className="camera-dropdown-box">
          <span className="camera-dropdown-icon">
            {getDeviceIcon(selectedLabel)}
          </span>
          <select
            id="camera-select"
            className="camera-dropdown"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            disabled={devices.length === 0}
          >
            {devices.length === 0 && (
              <option value="">detecting cameras...</option>
            )}
            {devices.map((device, i) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
          <span className="camera-dropdown-arrow">▾</span>
        </div>
      </div>

      {/* Camera feed */}
      <div className="camera-frame">
        {selectedDeviceId && (
          <Webcam
            key={selectedDeviceId}
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={() => setCameraReady(true)}
            onUserMediaError={() => setCameraReady(false)}
            className="webcam-video"
            mirrored={isMirrored}
          />
        )}

        {flash && <div className="camera-flash" />}

        {!cameraReady && (
          <div className="camera-loading">
            <div className="camera-loading-spinner" />
            <span>connecting camera...</span>
          </div>
        )}

        <div className="camera-corners">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </div>

        <div className="shot-counter">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <span key={i} className={`shot-dot ${i < photoCount ? 'taken' : ''}`} />
          ))}
        </div>

        {cameraReady && (
          <div className="camera-live-badge">
            <span className="live-dot" />
            LIVE
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="camera-controls">
        {useTimer ? (
          <CountdownTimer onComplete={captureNow} />
        ) : (
          <button
            className="btn-capture"
            onClick={captureNow}
            disabled={isFull || !cameraReady}
          >
            {isFull ? 'all done! ✨' : '📸 capture'}
          </button>
        )}
        <button
  className={`btn-timer-toggle ${useTimer ? 'active' : ''}`}
  onClick={() => setUseTimer(t => !t)}
  title="countdown timer"
>
  ⏱
</button>

{/* Mirror toggle */}
<button
  className="btn-timer-toggle"
  onClick={() => setIsMirrored(prev => !prev)}
  title="mirror"
  disabled={!cameraReady}
>
  🪞
</button>
      </div>

      <p className="camera-hint">
        {isFull
          ? 'go to editor to finish your strip!'
          : `${maxPhotos - photoCount} shot${maxPhotos - photoCount !== 1 ? 's' : ''} left`}
      </p>
    </div>
  )
}