import { useState, useCallback } from 'react'
import { removeBackground } from '@imgly/background-removal'

export function useBgRemoval() {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const removeBg = useCallback(async (dataUrl: string): Promise<string> => {
    setProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const blob = await removeBackground(dataUrl, {
        progress: (_key: string, current: number, total: number) => {
          setProgress(Math.round((current / total) * 100))
        },
      })
      const url = URL.createObjectURL(blob)
      setProgress(100)
      return url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Background removal failed'
      setError(msg)
      throw err
    } finally {
      setProcessing(false)
    }
  }, [])

  const removeBgAll = useCallback(
    async (dataUrls: string[]): Promise<string[]> => {
      const results: string[] = []
      for (const url of dataUrls) {
        const result = await removeBg(url)
        results.push(result)
      }
      return results
    },
    [removeBg]
  )

  return { removeBg, removeBgAll, processing, progress, error }
}