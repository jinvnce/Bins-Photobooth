import type { GalleryItem } from '../../types'
import GalleryItemCard from './GalleryItemCard'

interface GalleryGridProps {
  items: GalleryItem[]
  loading?: boolean
  onDelete?: (id: string) => void
}

export default function GalleryGrid({ items, loading, onDelete }: GalleryGridProps) {
  if (loading) {
    return (
      <div className="gallery-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="gallery-skeleton" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="gallery-empty-icon">📷</span>
        <p>no photos yet — go take some!</p>
      </div>
    )
  }

  return (
    <div className="gallery-grid">
      {items.map(item => (
        <GalleryItemCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  )
}