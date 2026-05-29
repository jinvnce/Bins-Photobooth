import { useEffect, useRef, useState } from 'react'
import type { BgColor, FrameStyle, FilterStyle } from '../../types'
import { compositePhotoStrip } from '../../lib/canvasUtils'
import Loader from '../ui/Loader'

interface CanvasProps {
  photos: string[]
  frameStyle: FrameStyle
  bgColor: BgColor
  filterStyle: FilterStyle
  onReady: (blob: Blob) => void
}

export default function Canvas({ photos, frameStyle, bgColor, filterStyle, onReady }: CanvasProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blobRef = useRef<Blob | null>(null)

  // read orientation so useEffect reacts when it changes
  const orientation = sessionStorage.getItem('photo_orientation') ?? '2x2'

  useEffect(() => {
    if (photos.length === 0) return

    let cancelled = false
    setLoading(true)
    setError(null)

    compositePhotoStrip(photos, frameStyle, bgColor, filterStyle)
      .then(blob => {
        if (cancelled) return
        blobRef.current = blob
        const url = URL.createObjectURL(blob)
        setPreviewUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
        onReady(blob)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [photos, frameStyle, bgColor, filterStyle, orientation, onReady])

  if (loading) return <Loader message="compositing your strip..." />
  if (error) return <p className="error-text">canvas error: {error}</p>

  return (
    <div className="canvas-preview">
      <h3 className="editor-section-title">preview</h3>
      {previewUrl ? (
        <img src={previewUrl} alt="Photo strip preview" className="strip-preview-img" />
      ) : (
        <div className="canvas-placeholder">complete the steps above to preview</div>
      )}
    </div>
  )
}