import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ColorPicker from '../components/editor/ColorPicker'
import FrameSelector from '../components/editor/FrameSelector'
import FilterSelector from '../components/editor/FilterSelector'
import RetakeCamera from '../components/editor/RetakeCamera'
import Canvas from '../components/editor/Canvas'
import Loader from '../components/ui/Loader'
import { useSessionStore } from '../store/sessionStore'
import { uploadFinalStrip } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { compositePhotoStrip } from '../lib/canvasUtils'

type Step = 'shots' | 'color' | 'frame' | 'filter'

const STEPS: { id: Step; label: string }[] = [
  { id: 'shots',  label: '① shots'        },
  { id: 'color',  label: '② pick color'   },
  { id: 'frame',  label: '③ choose frame' },
  { id: 'filter', label: '④ filter'       },
]

export default function EditorPage() {
  const navigate = useNavigate()
  const {
    photos,
    setPhotos,
    frameStyle,
    setFrameStyle,
    bgColor,
    setBgColor,
    filterStyle,
    setFilterStyle,
    sessionId,
    setFinalStripUrl,
  } = useSessionStore()

  const guestEmail = sessionStorage.getItem('guest_email') ?? ''
  const guestName  = sessionStorage.getItem('guest_name')  ?? ''

  const [step, setStep]           = useState<Step>('shots')
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved,  setSaved]        = useState(false)
const [retakingIndex, setRetakingIndex] = useState<number | null>(null)

  // photos is source of truth; processedPhotos not used (no bg removal)
  const [localPhotos, setLocalPhotos] = useState<string[]>(
    photos.length > 0 ? photos : []
  )

  const displayPhotos = localPhotos

  const handleRetake = useCallback((index: number, newDataUrl: string) => {
    setLocalPhotos(prev => {
      const updated = [...prev]
      updated[index] = newDataUrl
      return updated
    })
    setPhotos(localPhotos.map((p, i) => (i === index ? newDataUrl : p)))
    setRetakingIndex(null)
  }, [localPhotos, setPhotos])

  const handleCanvasReady = useCallback((blob: Blob) => {
    setFinalBlob(blob)
  }, [])

  const handleSave = async () => {
    if (!finalBlob || !guestEmail || saved) return
    setSaving(true)
    setSaved(true)
    try {
      const emailKey = guestEmail.replace('@', '_').replace('.', '_')
      const sid = sessionId ?? `session_${Date.now()}`

      const url = await uploadFinalStrip(finalBlob, emailKey, sid)

      const blobWithQR = await compositePhotoStrip(
        displayPhotos,
        frameStyle,
        bgColor,
        filterStyle,
        url
      )

      const finalUrl = await uploadFinalStrip(blobWithQR, emailKey, sid)
      setFinalStripUrl(finalUrl)

      const { error } = await supabase.from('gallery_items').insert({
        guest_session_id: sessionId,
        email: guestEmail,
        final_image_url: finalUrl,
        frame_style: frameStyle,
        bg_color: bgColor,
      })

      if (error) {
        console.error('Insert error:', error)
        setSaved(false)
        return
      }

      navigate('/download')
    } catch (err) {
      console.error('Save error:', err)
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>

      <main className="editor-page">
        <div className="editor-header">
          <h1 className="page-title">Edit your strip</h1>
          <div className="editor-steps">
            {STEPS.map(s => (
              <button
                key={s.id}
                className={`step-tab ${step === s.id ? 'active' : ''}`}
                onClick={() => { setRetakingIndex(null); setStep(s.id) }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-content">
          <div className="editor-panel">

            {/* ── SHOTS TAB ── */}
            {step === 'shots' && (
              retakingIndex !== null ? (
                <RetakeCamera
                  shotIndex={retakingIndex}
                  onRetake={handleRetake}
                  onCancel={() => setRetakingIndex(null)}
                />
              ) : (
                <div className="shots-tab">
                  <p className="editor-section-desc">
                    tap a shot to retake it — the rest stay saved.
                  </p>
                  <div className="shots-retake-grid">
                    {displayPhotos.map((src, i) => (
                      <button
                        key={i}
                        className="shots-retake-card"
                        onClick={() => setRetakingIndex(i)}
                      >
                        <img
                          src={src}
                          alt={`shot ${i + 1}`}
                          className="shots-retake-img"
                        />
                        <span className="shots-retake-badge">shot {i + 1}</span>
                        <span className="shots-retake-overlay">🔄 retake</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ── EDIT TABS ── */}
            {step === 'color' && (
              <ColorPicker selected={bgColor} onChange={setBgColor} />
            )}
            {step === 'frame' && (
              <FrameSelector selected={frameStyle} onChange={setFrameStyle} />
            )}
            {step === 'filter' && (
              <FilterSelector
                selected={filterStyle}
                onChange={setFilterStyle}
                previewSrc={displayPhotos[0]}
              />
            )}

            {/* ── NAV ── */}
            <div className="editor-nav">
              {step !== 'shots' && (
                <button className="btn-secondary" onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step)
                  setStep(STEPS[idx - 1].id)
                }}>← back</button>
              )}
              {step !== 'filter' ? (
                <button className="btn-primary" onClick={() => {
                  setRetakingIndex(null)
                  const idx = STEPS.findIndex(s => s.id === step)
                  setStep(STEPS[idx + 1].id)
                }}>next →</button>
              ) : (
                <>
                  {saving && <Loader message="saving your strip..." />}
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving || !finalBlob}
                  >
                    {saving ? 'saving...' : 'save & download →'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="editor-canvas-panel">
            <Canvas
              photos={displayPhotos}
              frameStyle={frameStyle}
              bgColor={bgColor}
              filterStyle={filterStyle}
              onReady={handleCanvasReady}
            />
          </div>
        </div>
      </main>
    </div>
  )
}