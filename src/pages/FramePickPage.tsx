import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export type PhotoLayout = 1 | 2 | 4 | 6 | 8 | 10

interface LayoutOption {
  count: PhotoLayout
  label: string
  desc: string
  preview: { cols: number; rows: number }
}

interface OrientationOption {
  id: string
  label: string
  desc: string
  cols: number
  rows: number
}

const LAYOUTS: LayoutOption[] = [
  { count: 1,  label: '1 photo',   desc: 'one big portrait',    preview: { cols: 1, rows: 1 } },
  { count: 2,  label: '2 photos',  desc: 'pick orientation',    preview: { cols: 1, rows: 2 } },
  { count: 4,  label: '4 photos',  desc: 'pick orientation',    preview: { cols: 1, rows: 4 } },
  { count: 6,  label: '6 photos',  desc: 'full grid',           preview: { cols: 2, rows: 3 } },
  { count: 8,  label: '8 photos',  desc: 'double quad',         preview: { cols: 2, rows: 4 } },
  { count: 10, label: '10 photos', desc: 'mega strip',          preview: { cols: 2, rows: 5 } },
]

const ORIENTATIONS: Partial<Record<PhotoLayout, OrientationOption[]>> = {
  2: [
    { id: '1x2', label: 'vertical',    desc: 'stacked strip',   cols: 1, rows: 2 },
    { id: '2x1', label: 'side by side', desc: 'horizontal pair', cols: 2, rows: 1 },
  ],
  4: [
    { id: '1x4', label: 'vertical strip', desc: 'tall 1×4',      cols: 1, rows: 4 },
    { id: '2x2', label: '2 + 2 grid',     desc: '2 top 2 bottom', cols: 2, rows: 2 },
  ],
}

const DEFAULT_ORIENTATION: Record<number, string> = {
  2: '1x2',
  4: '1x4',
}

export default function FramePickPage() {
  const navigate = useNavigate()
  const { setPhotoCount } = useSessionStore()
  const [selected, setSelected] = useState<PhotoLayout>(4)
  const [orientation, setOrientation] = useState<string>('1x4')
  const [loading, setLoading] = useState(false)

  const guestSessionId = sessionStorage.getItem('guest_session_id')
  const guestEmail = sessionStorage.getItem('guest_email')
  const guestName = sessionStorage.getItem('guest_name')

  const handleSelectLayout = (count: PhotoLayout) => {
    setSelected(count)
    // reset orientation to default when switching layout
    setOrientation(DEFAULT_ORIENTATION[count] ?? '1x4')
  }

  const getCurrentGrid = () => {
    const options = ORIENTATIONS[selected]
    if (!options) {
      const layout = LAYOUTS.find(l => l.count === selected)!
      return layout.preview
    }
    const picked = options.find(o => o.id === orientation)!
    return { cols: picked.cols, rows: picked.rows }
  }

 const getActualShotCount = (layout: PhotoLayout): number => {
  if (layout === 1 || layout === 2) return 4
  if (layout === 4) return 10
  return layout // 6, 8, 10 stay as-is
}

const handleStart = async () => {
  setLoading(true)
  const actualShots = getActualShotCount(selected)
  sessionStorage.setItem('photo_count', String(actualShots))
    sessionStorage.setItem('photo_layout', String(selected))   // ← ADD THIS
  sessionStorage.setItem('photo_orientation', orientation)

  await supabase
    .from('guest_sessions')
    .update({ photo_count: actualShots })
    .eq('id', guestSessionId)

  setPhotoCount(actualShots)
  navigate('/booth')
  setLoading(false)
}

  const currentGrid = getCurrentGrid()

  return (
    <div className="frame-pick-page">
      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>

      <main className="frame-pick-main">
        <div className="frame-pick-header">
          <h1 className="page-title">Choose your Layout</h1>
          <p className="page-subtitle">How many photos do you want in your strip?</p>
        </div>

        <div className="layout-grid">
          {LAYOUTS.map(layout => (
            <button
              key={layout.count}
              className={`layout-card ${selected === layout.count ? 'selected' : ''}`}
              onClick={() => handleSelectLayout(layout.count)}
            >
              <div className="layout-preview">
                <div
                  className="layout-preview-grid"
                  style={{
                    gridTemplateColumns: `repeat(${
                      selected === layout.count
                        ? currentGrid.cols
                        : layout.preview.cols
                    }, 1fr)`,
                    gridTemplateRows: `repeat(${
                      selected === layout.count
                        ? currentGrid.rows
                        : layout.preview.rows
                    }, 1fr)`,
                  }}
                >
                  {Array.from({ length: layout.count }).map((_, i) => (
                    <div key={i} className="layout-preview-cell">
                      <span className="layout-preview-icon">🤳</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="layout-info">
                <span className="layout-label">{layout.label}</span>
                <span className="layout-desc">{layout.desc}</span>
              </div>

              {selected === layout.count && <span className="layout-check">✓</span>}
            </button>
          ))}
        </div>

        {/* Orientation picker — only shows for 2 and 4 */}
        {ORIENTATIONS[selected] && (
          <div className="orientation-picker">
            <p className="orientation-title">pick orientation</p>
            <div className="orientation-options">
              {ORIENTATIONS[selected]!.map(opt => (
                <button
                  key={opt.id}
                  className={`orientation-option ${orientation === opt.id ? 'selected' : ''}`}
                  onClick={() => setOrientation(opt.id)}
                >
                  {/* Mini grid preview */}
                  <div
                    className="orientation-preview-grid"
                    style={{
                      gridTemplateColumns: `repeat(${opt.cols}, 1fr)`,
                      gridTemplateRows: `repeat(${opt.rows}, 1fr)`,
                      display: 'grid',
                      gap: '2px',
                      width: opt.cols === 1 ? '28px' : '44px',
                      height: opt.rows === 1 ? '28px' : '44px',
                    }}
                  >
                    {Array.from({ length: selected }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: orientation === opt.id
                            ? 'rgba(255,107,157,0.5)'
                            : 'rgba(0,0,0,0.15)',
                          borderRadius: '2px',
                        }}
                      />
                    ))}
                  </div>
                  <span className="orientation-label">{opt.label}</span>
                  <span className="orientation-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="frame-pick-footer">
          <button
  className="btn-primary btn-lg"
  onClick={handleStart}
  disabled={loading}
>
  {loading
    ? 'starting...'
    : `take ${getActualShotCount(selected)} shots, make ${selected} →`}
</button>
        </div>
      </main>
    </div>
  )
}