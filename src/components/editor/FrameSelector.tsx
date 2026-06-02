import type { FrameStyle } from '../../types'

interface FrameSelectorProps {
  selected: FrameStyle
  onChange: (frame: FrameStyle) => void
}

const FRAME_IMAGES: Partial<Record<FrameStyle, string>> = {
  classic: '/frames/05.22.26.png',
  pastel: '/frames/tryframe.png',
}

const FRAMES: { id: FrameStyle; label: string; emoji: string; desc: string; color: string }[] = [
  { id: 'classic', label: 'classic', emoji: '🎀', desc: 'clean white border', color: '#f5f5f5' },
  { id: 'pastel', label: 'pastel', emoji: '🌸', desc: 'soft pink corners', color: '#ffd6e7' },
  { id: 'film', label: 'film', emoji: '🎞️', desc: 'retro film strip', color: '#2a2a2a' },
  { id: 'vintage', label: 'vintage', emoji: '📷', desc: 'old school vibes', color: '#e8d5b7' },
  { id: 'neon', label: 'neon', emoji: '✨', desc: 'bright & bold', color: '#d4f1f9' },
  { id: 'minimal', label: 'minimal', emoji: '🤍', desc: 'simple & clean', color: '#ffffff' },
]

function FramePlaceholder({ color, emoji }: { color: string; emoji: string }) {
  // Read the user's chosen layout
  const photoLayout = Number(sessionStorage.getItem('photo_layout')) || 4
  const orientation = sessionStorage.getItem('photo_orientation') ?? '2x2'

  let cols: number
  let rows: number

  if (photoLayout === 1) { cols = 1; rows = 1 }
  else if (orientation === '1x2') { cols = 1; rows = 2 }
  else if (orientation === '2x1') { cols = 2; rows = 1 }
  else if (orientation === '1x4') { cols = 1; rows = 4 }
  else if (orientation === '2x2') { cols = 2; rows = 2 }
  else if (photoLayout === 6)  { cols = 2; rows = 3 }
  else if (photoLayout === 8)  { cols = 2; rows = 4 }
  else if (photoLayout === 10) { cols = 2; rows = 5 }
  else { cols = 2; rows = Math.ceil(photoLayout / 2) }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        background: color,
        borderRadius: '6px',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '3px',
        padding: '6px',
        border: '2px solid rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: photoLayout }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(0,0,0,0.10)',
            borderRadius: '3px',
            minHeight: 0,
          }}
        />
      ))}
      <span
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          fontSize: '12px',
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    </div>
  )
}

export default function FrameSelector({ selected, onChange }: FrameSelectorProps) {
  return (
    <div className="frame-selector">
      <h3 className="editor-section-title">frame style</h3>
      <p className="editor-section-desc">pick your photo strip layout</p>

      <div className="frame-options">
        {FRAMES.map(frame => (
          <button
            key={frame.id}
            className={`frame-option ${selected === frame.id ? 'selected' : ''}`}
            onClick={() => onChange(frame.id)}
          >
            <div className="frame-preview" style={{ pointerEvents: 'none' }}>
              {FRAME_IMAGES[frame.id] ? (
                <img
                  src={FRAME_IMAGES[frame.id]}
                  alt={frame.label}
                  className="frame-thumb"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <FramePlaceholder color={frame.color} emoji={frame.emoji} />
              )}
            </div>

            <span className="frame-label">{frame.label}</span>
            <span className="frame-desc">{frame.desc}</span>
            {selected === frame.id && <span className="frame-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
