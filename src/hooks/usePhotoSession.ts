import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { BgColor, FrameStyle, PhotoSession } from '../types'

export function usePhotoSession(userId: string) {
  const [session, setSession] = useState<PhotoSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(
    async (frameStyle: FrameStyle = 'classic', bgColor: BgColor = 'blue') => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('photo_sessions')
        .insert({ user_id: userId, frame_style: frameStyle, bg_color: bgColor })
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else {
        setSession(data as PhotoSession)
      }
      setLoading(false)
      return data as PhotoSession | null
    },
    [userId]
  )

  const updateSession = useCallback(
    async (updates: Partial<PhotoSession>) => {
      if (!session) return
      const { data, error } = await supabase
        .from('photo_sessions')
        .update(updates)
        .eq('id', session.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else {
        setSession(data as PhotoSession)
      }
    },
    [session]
  )

  const completeSession = useCallback(async () => {
    await updateSession({ status: 'complete' })
  }, [updateSession])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photo_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setLoading(false)
    if (error) { setError(error.message); return [] }
    return data as PhotoSession[]
  }, [userId])

  return {
    session,
    loading,
    error,
    createSession,
    updateSession,
    completeSession,
    fetchSessions,
  }
}