import { createContext, useContext, useState, ReactNode } from 'react'
import type { BgColor, FrameStyle, FilterStyle } from '../types'  // add FilterStyle

interface SessionState {
  photos: string[]
  processedPhotos: string[]
  frameStyle: FrameStyle
  bgColor: BgColor
  filterStyle: FilterStyle   // ← add
  sessionId: string | null
  finalStripUrl: string | null
  photoCount: number
}

interface SessionContextValue extends SessionState {
  setPhotos: (p: string[]) => void
  setProcessedPhotos: (p: string[]) => void
  setFrameStyle: (f: FrameStyle) => void
  setBgColor: (c: BgColor) => void
  setFilterStyle: (f: FilterStyle) => void  // ← add
  setSessionId: (id: string) => void
  setFinalStripUrl: (url: string) => void
  setPhotoCount: (n: number) => void
  reset: () => void
}

const defaultState: SessionState = {
  photos: [],
  processedPhotos: [],
  frameStyle: 'classic',
  bgColor: 'blue',
  filterStyle: 'none',       // ← add
  sessionId: null,
  finalStripUrl: null,
  photoCount: 4,
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    ...defaultState,
    photoCount: Number(sessionStorage.getItem('photo_count') ?? 4),
  })

  const update = <K extends keyof SessionState>(key: K, value: SessionState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  const reset = () => setState(defaultState)

  return (
    <SessionContext.Provider value={{
      ...state,
      setPhotos: p => update('photos', p),
      setProcessedPhotos: p => update('processedPhotos', p),
      setFrameStyle: f => update('frameStyle', f),
      setBgColor: c => update('bgColor', c),
      setSessionId: id => update('sessionId', id),
      setFinalStripUrl: url => update('finalStripUrl', url),
      setPhotoCount: n => update('photoCount', n),
      setFilterStyle: f => update('filterStyle', f),
      reset,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionStore() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionStore must be used within SessionProvider')
  return ctx
}