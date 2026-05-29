import { supabase } from './supabase'

export async function uploadPhoto(
  file: Blob,
  userId: string,
  sessionId: string,
  position: number
): Promise<string> {
  const path = `${userId}/${sessionId}/photo_${position}_${Date.now()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(path, file, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function uploadBgRemovedPhoto(
  file: Blob,
  userId: string,
  sessionId: string,
  position: number
): Promise<string> {
  const path = `${userId}/${sessionId}/nobg_${position}_${Date.now()}.png`
  const { error } = await supabase.storage.from('photos').upload(path, file, {
    contentType: 'image/png',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function uploadFinalStrip(
  file: Blob,
  userId: string,
  sessionId: string
): Promise<string> {
  const path = `${userId}/${sessionId}/final_${Date.now()}.png`
  const { error } = await supabase.storage.from('gallery').upload(path, file, {
    contentType: 'image/png',
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from('gallery').getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}