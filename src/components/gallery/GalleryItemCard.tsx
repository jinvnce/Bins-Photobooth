import { saveAs } from 'file-saver'
import type { GalleryItem } from '../../types'

interface GalleryItemProps {
  item: GalleryItem
  onDelete?: (id: string) => void
}

export default function GalleryItemCard({ item, onDelete }: GalleryItemProps) {
  const handleDownload = () => {
    saveAs(item.final_image_url, `life4cuts-${item.id.slice(0, 8)}.png`)
  }

  return (
    
    <div className="gallery-card">
      <div className="gallery-card-img-wrapper">
        <img
          src={item.final_image_url}
          alt="Photo strip"
          className="gallery-card-img"
          loading="lazy"
        />
      </div>

      <div className="gallery-card-footer">
        <span className="gallery-card-date">
          {new Date(item.created_at).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>

        <div className="gallery-card-actions">
          <button className="btn-download" onClick={handleDownload} title="download">
            ↓
          </button>
          {onDelete && (
            <button
              className="btn-delete"
              onClick={() => onDelete(item.id)}
              title="delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}