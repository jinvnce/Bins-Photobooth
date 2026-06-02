import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useCamera } from '../hooks/useCamera'

// ─── Effect definitions ────────────────────────────────────────────────────────

type EffectId =
  | 'none' | 'vintage' | 'noir' | 'neon' | 'glitch'
  | 'rainbow' | 'mirror' | 'pixelate' | 'vignette'
  | 'fisheye' | 'sparkle' | 'hologram'

interface Effect {
  id: EffectId
  label: string
  emoji: string
  cssFilter?: string
}

const EFFECTS: Effect[] = [
  { id: 'none',      label: 'Normal',    emoji: '📷' },
  { id: 'vintage',   label: 'Vintage',   emoji: '🎞️', cssFilter: 'sepia(0.6) contrast(1.1) brightness(1.05) saturate(0.8)' },
  { id: 'noir',      label: 'Noir',      emoji: '🎬', cssFilter: 'grayscale(1) contrast(1.4) brightness(0.9)' },
  { id: 'neon',      label: 'Neon',      emoji: '🌈', cssFilter: 'saturate(3) hue-rotate(30deg) contrast(1.2) brightness(1.1)' },
  { id: 'glitch',    label: 'Glitch',    emoji: '👾' },
  { id: 'rainbow',   label: 'Rainbow',   emoji: '🌊', cssFilter: 'hue-rotate(var(--hue, 0deg)) saturate(2)' },
  { id: 'mirror',    label: 'Mirror',    emoji: '🪞' },
  { id: 'pixelate',  label: 'Pixel',     emoji: '🟦' },
  { id: 'vignette',  label: 'Vignette',  emoji: '🌑' },
  { id: 'fisheye',   label: 'Fisheye',   emoji: '🐟' },
  { id: 'sparkle',   label: 'Sparkle',   emoji: '✨' },
  { id: 'hologram',  label: 'Holo',      emoji: '🔮' },
]

// ─── Overlay stickers ──────────────────────────────────────────────────────────

type StickerId = 'none' | 'bunny' | 'crown' | 'sunglasses' | 'cowboy' | 'devil' | 'angel'

interface Sticker {
  id: StickerId
  label: string
  emoji: string
}

const STICKERS: Sticker[] = [
  { id: 'none',       label: 'None',       emoji: '🚫' },
  { id: 'bunny',      label: 'Bunny',      emoji: '🐰' },
  { id: 'crown',      label: 'Crown',      emoji: '👑' },
  { id: 'sunglasses', label: 'Shades',     emoji: '😎' },
  { id: 'cowboy',     label: 'Cowboy',     emoji: '🤠' },
  { id: 'devil',      label: 'Devil',      emoji: '😈' },
  { id: 'angel',      label: 'Angel',      emoji: '😇' },
]

// ─── Canvas effect renderer ────────────────────────────────────────────────────

function applyCanvasEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  effect: EffectId,
  frame: number
) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  switch (effect) {
    case 'glitch': {
      const slices = 6
      for (let i = 0; i < slices; i++) {
        const y = Math.floor(Math.random() * h)
        const sh = Math.floor(Math.random() * 20) + 2
        const shift = Math.floor(Math.random() * 40) - 20
        const strip = ctx.getImageData(0, y, w, sh)
        ctx.putImageData(strip, shift, y)
      }
      // color channel offset
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < 0.01) {
          d[i] = d[i + 8] ?? d[i]    // shift R channel
          d[i + 2] = d[i - 8] ?? d[i + 2] // shift B channel
        }
      }
      ctx.putImageData(imageData, 0, 0)
      break
    }

    case 'pixelate': {
      const size = 10
      ctx.imageSmoothingEnabled = false
      const tmp = document.createElement('canvas')
      tmp.width = Math.floor(w / size)
      tmp.height = Math.floor(h / size)
      const tc = tmp.getContext('2d')!
      tc.drawImage(ctx.canvas, 0, 0, tmp.width, tmp.height)
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(tmp, 0, 0, w, h)
      break
    }

    case 'vignette': {
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.75)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'fisheye': {
      // draw raw pixels with barrel distortion approximation via ctx transform
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.transform(1, 0, 0, 1, 0, 0)
      const scaleX = 1 + 0.12 * Math.sin(Math.PI * 0.5)
      ctx.scale(scaleX, 1.08)
      ctx.translate(-w / 2, -h / 2)
      const snap = ctx.getImageData(0, 0, w, h)
      ctx.restore()
      ctx.putImageData(snap, 0, 0)
      // radial stretch overlay
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(1.18, 1.18)
      ctx.globalCompositeOperation = 'destination-over'
      ctx.restore()
      break
    }

    case 'mirror': {
      ctx.save()
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(ctx.canvas, w / 2, 0, w / 2, h, 0, 0, w / 2, h)
      ctx.restore()
      break
    }

    case 'sparkle': {
      const count = 18
      for (let i = 0; i < count; i++) {
        const angle = (frame * 0.04 + i * (Math.PI * 2 / count))
        const r = 40 + Math.sin(frame * 0.05 + i) * 30
        const x = w / 2 + Math.cos(angle) * (w * 0.35 + r)
        const y = h / 2 + Math.sin(angle) * (h * 0.4 + r)
        const size = 2 + Math.sin(frame * 0.1 + i) * 1.5
        ctx.save()
        ctx.globalAlpha = 0.7 + Math.sin(frame * 0.08 + i) * 0.3
        ctx.fillStyle = `hsl(${(frame * 3 + i * 30) % 360}, 100%, 75%)`
        ctx.beginPath()
        // 4-point star
        for (let p = 0; p < 8; p++) {
          const a = (p * Math.PI) / 4
          const rad = p % 2 === 0 ? size * 3 : size
          const px = x + Math.cos(a) * rad
          const py = y + Math.sin(a) * rad
          p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      break
    }

    case 'hologram': {
      // scanline + color shift
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = `rgba(0, 255, 200, ${0.04 + Math.sin(y * 0.1 + frame * 0.05) * 0.02})`
        ctx.fillRect(0, y, w, 2)
      }
      ctx.strokeStyle = `rgba(0,255,200,0.3)`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, (frame * 3) % h)
      ctx.lineTo(w, (frame * 3) % h)
      ctx.stroke()
      // flicker
      ctx.globalAlpha = 0.04 + Math.random() * 0.04
      ctx.fillStyle = 'rgba(0,200,255,1)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
      break
    }

    case 'rainbow': {
      // animated gradient overlay
      const g = ctx.createLinearGradient(0, 0, w, h)
      const hueShift = (frame * 2) % 360
      g.addColorStop(0, `hsla(${hueShift}, 100%, 50%, 0.15)`)
      g.addColorStop(0.33, `hsla(${(hueShift + 120) % 360}, 100%, 50%, 0.15)`)
      g.addColorStop(0.66, `hsla(${(hueShift + 240) % 360}, 100%, 50%, 0.15)`)
      g.addColorStop(1, `hsla(${hueShift}, 100%, 50%, 0.15)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
  }
}

// ─── SVG Sticker drawers (canvas) ─────────────────────────────────────────────

function drawSticker(ctx: CanvasRenderingContext2D, w: number, _h: number, sticker: StickerId) {
  const cx = w / 2
  const headTop = _h * 0.08

  switch (sticker) {
    case 'bunny': {
      // two tall ovals
      ctx.save()
      ctx.fillStyle = '#ffb6c1'
      ctx.strokeStyle = '#e8799a'
      ctx.lineWidth = 3
      ;[-1, 1].forEach(side => {
        ctx.beginPath()
        ctx.ellipse(cx + side * 38, headTop + 15, 14, 45, side * 0.15, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        // inner
        ctx.beginPath()
        ctx.fillStyle = '#ff9ab0'
        ctx.ellipse(cx + side * 38, headTop + 20, 7, 30, side * 0.15, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffb6c1'
      })
      ctx.restore()
      break
    }

    case 'crown': {
      ctx.save()
      const cw = 160, ch = 60
      const x0 = cx - cw / 2
      const y0 = headTop - 10
      // gold crown shape
      ctx.fillStyle = '#FFD700'
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x0, y0 + ch)
      ctx.lineTo(x0, y0 + 20)
      ctx.lineTo(x0 + cw * 0.25, y0 + ch * 0.5)
      ctx.lineTo(x0 + cw * 0.5, y0)
      ctx.lineTo(x0 + cw * 0.75, y0 + ch * 0.5)
      ctx.lineTo(x0 + cw, y0 + 20)
      ctx.lineTo(x0 + cw, y0 + ch)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // gems
      const gemColors = ['#FF3366', '#00BFFF', '#39FF14']
      ;[0.2, 0.5, 0.8].forEach((t, i) => {
        ctx.beginPath()
        ctx.arc(x0 + cw * t, y0 + ch * 0.6, 8, 0, Math.PI * 2)
        ctx.fillStyle = gemColors[i]
        ctx.fill()
      })
      ctx.restore()
      break
    }

    case 'sunglasses': {
      ctx.save()
      const gy = _h * 0.34
      ctx.fillStyle = '#111'
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 3
      // left lens
      ctx.beginPath()
      ctx.roundRect(cx - 120, gy - 22, 90, 44, 12)
      ctx.fill()
      ctx.stroke()
      // right lens
      ctx.beginPath()
      ctx.roundRect(cx + 30, gy - 22, 90, 44, 12)
      ctx.fill()
      ctx.stroke()
      // bridge
      ctx.beginPath()
      ctx.moveTo(cx - 30, gy)
      ctx.lineTo(cx + 30, gy)
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 4
      ctx.stroke()
      // arms
      ctx.beginPath()
      ctx.moveTo(cx - 120, gy)
      ctx.lineTo(cx - 160, gy - 10)
      ctx.moveTo(cx + 120, gy)
      ctx.lineTo(cx + 160, gy - 10)
      ctx.stroke()
      // lens glare
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.ellipse(cx - 85, gy - 8, 20, 10, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx + 75, gy - 8, 20, 10, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }

    case 'cowboy': {
      ctx.save()
      const hy = headTop + 10
      // brim
      ctx.fillStyle = '#8B4513'
      ctx.strokeStyle = '#5C2D0A'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(cx, hy + 55, 130, 22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // crown
      ctx.beginPath()
      ctx.moveTo(cx - 80, hy + 55)
      ctx.quadraticCurveTo(cx - 90, hy + 10, cx - 60, hy)
      ctx.quadraticCurveTo(cx, hy - 30, cx + 60, hy)
      ctx.quadraticCurveTo(cx + 90, hy + 10, cx + 80, hy + 55)
      ctx.fill()
      ctx.stroke()
      // band
      ctx.fillStyle = '#D2691E'
      ctx.fillRect(cx - 78, hy + 40, 156, 10)
      ctx.restore()
      break
    }

    case 'devil': {
      ctx.save()
      const dy = headTop - 5
      // two horns
      ;[-1, 1].forEach(side => {
        ctx.fillStyle = '#CC0000'
        ctx.strokeStyle = '#880000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx + side * 30, dy + 30)
        ctx.quadraticCurveTo(cx + side * 38, dy - 10, cx + side * 45, dy - 25)
        ctx.quadraticCurveTo(cx + side * 55, dy - 5, cx + side * 50, dy + 20)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      })
      ctx.restore()
      break
    }

    case 'angel': {
      ctx.save()
      const ay = headTop - 18
      // halo ring
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 6
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.ellipse(cx, ay, 60, 14, 0, 0, Math.PI * 2)
      ctx.stroke()
      // glow
      ctx.strokeStyle = 'rgba(255,215,0,0.4)'
      ctx.lineWidth = 14
      ctx.beginPath()
      ctx.ellipse(cx, ay, 60, 14, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      break
    }
  }
}

// ─── CameraWithEffects component ──────────────────────────────────────────────

interface CameraWithEffectsProps {
  onCapture: (dataUrl: string) => void
  photoCount: number
  maxPhotos: number
  activeEffect: EffectId
  activeSticker: StickerId
}

function CameraWithEffects({ onCapture, photoCount, maxPhotos, activeEffect, activeSticker }: CameraWithEffectsProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  // Start camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setReady(true)
        }
      })
      .catch(console.error)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  // RAF render loop
  useEffect(() => {
    if (!ready) return
    const video = videoRef.current!
    const canvas = canvasRef.current!
    const overlay = overlayRef.current!
    const ctx = canvas.getContext('2d')!
    const octx = overlay.getContext('2d')!

    const render = () => {
      frameRef.current++
      const f = frameRef.current
      const w = canvas.width
      const h = canvas.height

      // draw video (mirrored by default)
      ctx.save()
      if (activeEffect !== 'mirror') {
        ctx.translate(w, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, w, h)
      ctx.restore()

      // CSS-based effects are on the video element; canvas handles custom ones
      applyCanvasEffect(ctx, w, h, activeEffect, f)

      // overlay canvas (stickers)
      octx.clearRect(0, 0, w, h)
      if (activeSticker !== 'none') drawSticker(octx, w, h, activeSticker)

      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [ready, activeEffect, activeSticker])

  const handleShoot = useCallback(() => {
    if (countdown !== null) return
    let c = 3
    setCountdown(c)
    const tick = setInterval(() => {
      c--
      if (c === 0) {
        clearInterval(tick)
        setCountdown(null)
        // flash
        setFlash(true)
        setTimeout(() => setFlash(false), 300)
        // composite: canvas + overlay -> output
        const w = canvasRef.current!.width
        const h = canvasRef.current!.height
        const out = document.createElement('canvas')
        out.width = w; out.height = h
        const oc = out.getContext('2d')!
        oc.drawImage(canvasRef.current!, 0, 0)
        oc.drawImage(overlayRef.current!, 0, 0)
        onCapture(out.toDataURL('image/jpeg', 0.92))
      } else {
        setCountdown(c)
      }
    }, 1000)
  }, [countdown, onCapture])

  const cssFilter = EFFECTS.find(e => e.id === activeEffect)?.cssFilter || ''

  return (
    <div className="camera-wrapper">
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <div className="camera-display" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: ['vintage','noir','neon'].includes(activeEffect) ? cssFilter : undefined,
            display: 'block',
            borderRadius: '12px',
          }}
        />
        <canvas
          ref={overlayRef}
          width={1280}
          height={720}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '12px' }}
        />
        {/* flash overlay */}
        {flash && <div style={{ position: 'absolute', inset: 0, background: 'white', borderRadius: '12px', zIndex: 10 }} />}
        {/* countdown */}
        {countdown !== null && (
          <div className="countdown-badge">{countdown}</div>
        )}
        {/* shot counter */}
        <div className="shot-dots">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <span key={i} className={`shot-dot ${i < photoCount ? 'filled' : ''}`} />
          ))}
        </div>
      </div>
      <button
        className="shutter-btn"
        onClick={handleShoot}
        disabled={countdown !== null || photoCount >= maxPhotos}
      >
        <span className="shutter-inner" />
      </button>
    </div>
  )
}

// ─── Main BoothPage ────────────────────────────────────────────────────────────

export default function BoothPage() {
  const navigate = useNavigate()
  const { setPhotos, setSessionId, photoCount: storePhotoCount } = useSessionStore()
  const maxPhotos = storePhotoCount || Number(sessionStorage.getItem('photo_count')) || 4
  const guestSessionId = sessionStorage.getItem('guest_session_id')
  const guestEmail = sessionStorage.getItem('guest_email')
  const guestName = sessionStorage.getItem('guest_name')

  const { photos, addPhoto, isFull, photoCount, resetPhotos } = useCamera(maxPhotos)

  const [activeEffect, setActiveEffect] = useState<EffectId>('none')
  const [activeSticker, setActiveSticker] = useState<StickerId>('none')
  const [tab, setTab] = useState<'effects' | 'stickers'>('effects')

  useEffect(() => {
    if (!guestSessionId) navigate('/')
  }, [guestSessionId, navigate])

  const handleProceed = async () => {
    if (!isFull) return
    setPhotos(photos)
    if (guestSessionId) setSessionId(guestSessionId)
    navigate('/editor')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #13131a;
          --border: rgba(255,255,255,0.08);
          --accent: #e8ff00;
          --accent2: #ff3cac;
          --text: #f0f0f0;
          --muted: rgba(240,240,240,0.45);
          --radius: 14px;
        }

        .booth-root {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          display: flex;
          flex-direction: column;
        }

        /* topbar */
        .booth-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          border-bottom: 1px solid var(--border);
        }
        .booth-topbar-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: 0.08em;
          color: var(--accent);
        }
        .booth-topbar-user {
          font-size: 0.85rem;
          color: var(--muted);
        }

        /* body */
        .booth-body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 0;
          max-height: calc(100vh - 57px);
          overflow: hidden;
        }

        /* left: camera + header + footer */
        .booth-left {
          display: flex;
          flex-direction: column;
          padding: 20px 24px;
          gap: 16px;
          overflow: hidden;
        }

        .booth-head {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-ghost {
          background: none;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.82rem;
          font-family: inherit;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

        .booth-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
        }
        .booth-subtitle {
          font-size: 0.82rem;
          color: var(--muted);
          margin-top: 2px;
        }

        /* camera */
        .camera-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          min-height: 0;
        }
        .camera-display {
          flex: 1;
          width: 100%;
          min-height: 0;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: #000;
        }
        .camera-display canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }

        .countdown-badge {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 8rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 0 40px rgba(0,0,0,0.8);
          pointer-events: none;
          z-index: 5;
          animation: countPop 0.4s ease;
        }
        @keyframes countPop {
          from { transform: scale(1.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        .shot-dots {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 4;
        }
        .shot-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.6);
          background: transparent;
          transition: background 0.2s;
        }
        .shot-dot.filled { background: var(--accent); border-color: var(--accent); }

        /* shutter */
        .shutter-btn {
          width: 70px; height: 70px;
          border-radius: 50%;
          background: white;
          border: 4px solid rgba(255,255,255,0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.1s, background 0.15s;
          outline: 4px solid rgba(255,255,255,0.12);
        }
        .shutter-btn:active { transform: scale(0.92); }
        .shutter-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .shutter-inner {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: #e8e8e8;
          display: block;
        }

        /* proceed */
        .btn-proceed {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius);
          border: none;
          background: var(--accent);
          color: #000;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          letter-spacing: 0.02em;
        }
        .btn-proceed:disabled {
          background: var(--surface);
          color: var(--muted);
          cursor: not-allowed;
          border: 1px solid var(--border);
        }
        .btn-proceed:not(:disabled):hover { opacity: 0.88; transform: translateY(-1px); }

        /* right panel */
        .booth-panel {
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
        }
        .panel-tab {
          flex: 1;
          padding: 13px;
          background: none;
          border: none;
          color: var(--muted);
          font-family: 'Syne', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: color 0.15s, border-bottom 0.15s;
          border-bottom: 2px solid transparent;
        }
        .panel-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

        .panel-grid {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-content: start;
        }
        .panel-grid::-webkit-scrollbar { width: 4px; }
        .panel-grid::-webkit-scrollbar-track { background: transparent; }
        .panel-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .effect-chip {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          text-align: center;
        }
        .effect-chip:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .effect-chip.active { border-color: var(--accent); background: rgba(232,255,0,0.07); }
        .effect-chip .emoji { font-size: 1.6rem; line-height: 1; }
        .effect-chip .chip-label {
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .effect-chip.active .chip-label { color: var(--accent); }

        /* photo strip preview */
        .strip-preview {
          padding: 16px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }
        .strip-preview::-webkit-scrollbar { height: 3px; }
        .strip-thumb {
          width: 60px; height: 45px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }
        .strip-thumb-empty {
          width: 60px; height: 45px;
          border-radius: 6px;
          border: 1px dashed var(--border);
          flex-shrink: 0;
          background: var(--surface);
        }

        @media (max-width: 768px) {
          .booth-body {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            max-height: none;
          }
          .booth-panel {
            border-left: none;
            border-top: 1px solid var(--border);
            max-height: 260px;
          }
          .booth-left { padding: 12px; }
        }
      `}</style>

      <div className="booth-root">
        {/* topbar */}
        <div className="booth-topbar">
          <span className="booth-topbar-logo">BINS FOUR CATS</span>
          <span className="booth-topbar-user">{guestName || guestEmail}</span>
        </div>

        <div className="booth-body">
          {/* left */}
          <div className="booth-left">
            <div className="booth-head">
              <button className="btn-ghost" onClick={() => { resetPhotos(); navigate('/frame-pick') }}>
                ← change layout
              </button>
              <div>
                <h1 className="booth-title">take your photos</h1>
                <p className="booth-subtitle">{maxPhotos} shot{maxPhotos > 1 ? 's' : ''} for your strip</p>
              </div>
            </div>

            <CameraWithEffects
              onCapture={addPhoto}
              photoCount={photoCount}
              maxPhotos={maxPhotos}
              activeEffect={activeEffect}
              activeSticker={activeSticker}
            />

            <button className="btn-proceed" onClick={handleProceed} disabled={!isFull}>
              {isFull
                ? 'go to editor →'
                : `need ${maxPhotos - photoCount} more shot${maxPhotos - photoCount !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* right panel */}
          <div className="booth-panel">
            <div className="panel-tabs">
              <button className={`panel-tab ${tab === 'effects' ? 'active' : ''}`} onClick={() => setTab('effects')}>
                🎨 Effects
              </button>
              <button className={`panel-tab ${tab === 'stickers' ? 'active' : ''}`} onClick={() => setTab('stickers')}>
                🎭 Stickers
              </button>
            </div>

            {tab === 'effects' && (
              <div className="panel-grid">
                {EFFECTS.map(e => (
                  <button
                    key={e.id}
                    className={`effect-chip ${activeEffect === e.id ? 'active' : ''}`}
                    onClick={() => setActiveEffect(e.id)}
                  >
                    <span className="emoji">{e.emoji}</span>
                    <span className="chip-label">{e.label}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === 'stickers' && (
              <div className="panel-grid">
                {STICKERS.map(s => (
                  <button
                    key={s.id}
                    className={`effect-chip ${activeSticker === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSticker(s.id)}
                  >
                    <span className="emoji">{s.emoji}</span>
                    <span className="chip-label">{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* strip preview */}
            <div className="strip-preview">
              {Array.from({ length: maxPhotos }).map((_, i) =>
                photos[i]
                  ? <img key={i} className="strip-thumb" src={photos[i]} alt={`shot ${i + 1}`} />
                  : <div key={i} className="strip-thumb-empty" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}