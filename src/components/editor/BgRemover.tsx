import { useState } from 'react'
import { useBgRemoval } from '../../hooks/useBgRemoval'
import Loader from '../ui/Loader'

interface BgRemoverProps {
  photos: string[]
  onComplete: (processed: string[]) => void
}

export default function BgRemover({ photos, onComplete }: BgRemoverProps) {
  const { removeBgAll, processing, progress, error } = useBgRemoval()
  const [done, setDone] = useState(false)

  const handleRemove = async () => {
    const results = await removeBgAll(photos)
    setDone(true)
    onComplete(results)
  }

  if (processing) {
    return (
      <Loader
        message={`removing backgrounds... ${progress}%`}
        progress={progress}
      />
    )
  }

  return (
    <div className="bg-remover">
      <h3 className="editor-section-title">background removal</h3>
      <p className="editor-section-desc">
        removes the background from all 4 photos automatically
      </p>

      <div className="bg-remover-previews">
        {photos.map((src, i) => (
          <img key={i} src={src} alt={`Photo ${i + 1}`} className="bg-remover-thumb" />
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        className="btn-primary"
        onClick={handleRemove}
        disabled={done}
      >
        {done ? 'backgrounds removed ✓' : 'remove backgrounds'}
      </button>
    </div>
  )
}