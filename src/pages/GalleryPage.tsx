import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/ui/Navbar'
import BgRemover from '../components/editor/BgRemover'
import FrameSelector from '../components/editor/FrameSelector'
import FilterSelector from '../components/editor/FilterSelector'
import Canvas from '../components/editor/Canvas'
import { useSessionStore } from '../store/sessionStore'
import { useAuth } from '../hooks/useAuth'
import { uploadFinalStrip } from '../lib/storage'
import { supabase } from '../lib/supabase'

type Step = 'bg' | 'color' | 'frame' | 'filter' | 'preview'

const STEPS: { id: Step; label: string }[] = [
  { id: 'bg',      label: '① remove bg'    },
  { id: 'color',   label: '② pick color'   },
  { id: 'frame',   label: '③ choose frame' },
  { id: 'filter',  label: '④ filter'       },
  { id: 'preview', label: '⑤ preview'      },
]

export default function EditorPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    photos,
    processedPhotos,
    setProcessedPhotos,
    frameStyle,
    setFrameStyle,
    bgColor,
    filterStyle,
    setFilterStyle,
    sessionId,
    setFinalStripUrl,
  } = useSessionStore()

  const [step, setStep] = useState<Step>('bg')
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)

  const handleBgDone = (processed: string[]) => {
    setProcessedPhotos(processed)
    setStep('color')
  }

  const handleCanvasReady = useCallback((blob: Blob) => {
    setFinalBlob(blob)
  }, [])

  const handleSave = async () => {
    if (!finalBlob || !user) return
    setSaving(true)
    try {
      const url = await uploadFinalStrip(finalBlob, user.id, sessionId ?? 'unsaved')
      setFinalStripUrl(url)

      await supabase.from('gallery_items').insert({
        user_id: user.id,
        session_id: sessionId,
        final_image_url: url,
        frame_style: frameStyle,
        bg_color: bgColor,
        is_public: false,
      })

      navigate('/download')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const displayPhotos = processedPhotos.length > 0 ? processedPhotos : photos
  const previewSrc = (processedPhotos[0] ?? photos[0]) ?? undefined

  return (
    <div className="page-layout">
      <Navbar />
      <main className="editor-page">
        <div className="editor-header">
          <h1 className="page-title">Edit your strip</h1>
          <div className="editor-steps">
            {STEPS.map(s => (
              <button
                key={s.id}
                className={`step-tab ${step === s.id ? 'active' : ''}`}
                onClick={() => setStep(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-content">
          <div className="editor-panel">
            {step === 'bg' && (
              <BgRemover photos={photos} onComplete={handleBgDone} />
            )}
            {step === 'frame' && (
              <FrameSelector selected={frameStyle} onChange={setFrameStyle} />
            )}
            {step === 'filter' && (
              <FilterSelector
                selected={filterStyle}
                onChange={setFilterStyle}
                previewSrc={previewSrc}
              />
            )}
            {step === 'preview' && (
              <div className="preview-actions">
                <p className="editor-section-desc">Your strip is ready!</p>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || !finalBlob}
                >
                  {saving ? 'saving...' : 'save & download →'}
                </button>
              </div>
            )}

            <div className="editor-nav">
              {step !== 'bg' && (
                <button className="btn-secondary" onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step)
                  setStep(STEPS[idx - 1].id)
                }}>← back</button>
              )}
              {step !== 'preview' && (
                <button className="btn-primary" onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step)
                  setStep(STEPS[idx + 1].id)
                }}>next →</button>
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