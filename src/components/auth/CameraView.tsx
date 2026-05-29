import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'

interface CameraViewProps {
  onCapture: (imageSrc: string) => void
  photoCount: number
  maxPhotos?: number
}

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
}

export default function CameraView({
  onCapture,
  photoCount,
  maxPhotos = 4,
}: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null)
  const [mirrored, setMirrored] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) onCapture(imageSrc)
  }, [onCapture])

  const remaining = maxPhotos - photoCount
  const isFull = remaining <= 0

  return (
    <div className="camera-wrapper">
      <div className="camera-frame">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          mirrored={mirrored}
          onUserMedia={() => setCameraReady(true)}
          className="webcam-video"
        />

        {!cameraReady && (
          <div className="camera-loading">
            <span>loading camera...</span>
          </div>
        )}

        <div className="camera-overlay-corners">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </div>

        <div className="shot-counter">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <span
              key={i}
              className={`shot-dot ${i < photoCount ? 'taken' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="camera-controls">
        <button
          className="btn-mirror"
          onClick={() => setMirrored(m => !m)}
          title="flip camera"
        >
          ⇄
        </button>

        <button
          className="btn-capture"
          onClick={capture}
          disabled={isFull || !cameraReady}
        >
          {isFull ? 'all done!' : `take photo ${photoCount + 1}/${maxPhotos}`}
        </button>
      </div>

      <p className="camera-hint">
        {isFull
          ? 'proceed to the editor'
          : `${remaining} shot${remaining !== 1 ? 's' : ''} remaining`}
      </p>
    </div>
  )
}