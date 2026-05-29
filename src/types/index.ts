export type BgColor = 'blue' | 'red' | 'brown'
export type FrameStyle = 'classic' | 'pastel' | 'film' | 'vintage' | 'neon' | 'minimal'
export type FilterStyle =
  | 'none'
  | 'vintage'
  | 'noir'
  | 'fade'
  | 'warm'
  | 'cool'
  | 'vivid'
  | 'dreamy'
  | 'lomo'
  | 'polaroid'
  | 'y2k'
  | 'disposable'
export type SessionStatus = 'active' | 'complete' | 'expired'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface PhotoSession {
  id: string
  user_id: string
  frame_style: FrameStyle
  bg_color: BgColor
  status: SessionStatus
  photo_count: number
  created_at: string
  expires_at: string
}

export interface SessionPhoto {
  id: string
  session_id: string
  storage_path: string
  bg_removed_path?: string
  position: number
  bg_removed: boolean
  captured_at: string
}

export interface GalleryItem {
  id: string
  user_id: string
  session_id?: string
  final_image_url: string
  frame_style?: FrameStyle
  bg_color?: BgColor
  is_public: boolean
  created_at: string
}