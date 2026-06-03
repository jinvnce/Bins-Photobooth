  import { useState, useCallback } from 'react'

  export function useCamera(maxPhotos = 4) {
    const [photos, setPhotos] = useState<string[]>([])
    const [isCapturing, setIsCapturing] = useState(false)

    const addPhoto = useCallback((dataUrl: string) => {
      setPhotos(prev => {
        if (prev.length >= maxPhotos) return prev
        return [...prev, dataUrl]
      })
    }, [maxPhotos])

    const removePhoto = useCallback((index: number) => {
      setPhotos(prev => prev.filter((_, i) => i !== index))
    }, [])

    const resetPhotos = useCallback(() => {
      setPhotos([])
    }, [])

    const isFull = photos.length >= maxPhotos

    return {
      photos,
      addPhoto,
      removePhoto,
      resetPhotos,
      isCapturing,
      setIsCapturing,
      isFull,
      photoCount: photos.length,
      maxPhotos,
    }
  }