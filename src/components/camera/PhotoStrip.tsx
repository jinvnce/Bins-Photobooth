import { QRCodeSVG } from 'qrcode.react'

interface PhotoStripProps {
  photos: string[]
  maxPhotos?: number
  onRemove?: (index: number) => void
  shareUrl?: string   // ← new prop
}

export default function PhotoStrip({
  photos,
  maxPhotos = 4,
  onRemove,
  shareUrl,
}: PhotoStripProps) {
  return (
    <div className="photo-strip">
      <div className="strip-header">
        <span className="strip-label">your strip</span>
        <span className="strip-count">{photos.length}/{maxPhotos}</span>
      </div>

      <div className="strip-slots">
        {Array.from({ length: maxPhotos }).map((_, i) => (
          <div key={i} className={`strip-slot ${photos[i] ? 'filled' : 'empty'}`}>
            {photos[i] ? (
              <>
                <img
                  src={photos[i]}
                  alt={`Photo ${i + 1}`}
                  className="strip-photo"
                />
                {onRemove && (
                  <button
                    className="strip-remove"
                    onClick={() => onRemove(i)}
                    title="remove"
                  >
                    ✕
                  </button>
                )}
                <span className="strip-number">{i + 1}</span>
              </>
            ) : (
              <span className="strip-placeholder">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Strip footer with branding + QR */}
      <div className="strip-footer">
        <span className="strip-footer-brand">BINS FOUR CATS</span>
        {shareUrl && (
          <QRCodeSVG
            value={shareUrl}
            size={40}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="M"
            includeMargin={false}
          />
        )}
      </div>
    </div>
  )
}