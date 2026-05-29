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
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        background: color,
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 4px',
        border: '2px solid rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: '85%',
            flex: 1,
            background: 'rgba(0,0,0,0.08)',
            borderRadius: '3px',
            margin: '2px 0',
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
