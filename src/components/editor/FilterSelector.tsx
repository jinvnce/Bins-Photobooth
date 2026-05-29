import type { FilterStyle } from '../../types'

interface FilterSelectorProps {
  selected: FilterStyle
  onChange: (filter: FilterStyle) => void
  previewSrc?: string
}

export const FILTER_CSS: Record<FilterStyle, string> = {
  none:       'none',
  vintage:    'sepia(0.55) contrast(1.1) brightness(0.95) saturate(0.85)',
  noir:       'grayscale(1) contrast(1.4) brightness(0.88)',
  fade:       'brightness(1.12) saturate(0.55) contrast(0.82)',
  warm:       'sepia(0.25) saturate(1.5) brightness(1.05) hue-rotate(-10deg)',
  cool:       'saturate(1.2) brightness(1.05) hue-rotate(25deg)',
  vivid:      'saturate(1.9) contrast(1.2) brightness(1.05)',
  dreamy:     'brightness(1.12) saturate(0.85) contrast(0.88) blur(0.7px)',
  lomo:       'contrast(1.6) saturate(1.4) brightness(0.82)',
  polaroid:   'sepia(0.3) brightness(1.12) contrast(0.92) saturate(1.1)',
  y2k:        'saturate(1.6) contrast(1.1) brightness(1.12) hue-rotate(8deg)',
  disposable: 'sepia(0.18) contrast(1.25) brightness(1.08) saturate(1.15)',
}

const FILTERS: {
  id: FilterStyle
  label: string
  desc: string
}[] = [
  { id: 'none',       label: 'none',        desc: 'original'           },
  { id: 'vintage',    label: 'vintage',     desc: 'warm faded film'    },
  { id: 'noir',       label: 'noir',        desc: 'b&w drama'          },
  { id: 'fade',       label: 'fade',        desc: 'washed out'         },
  { id: 'warm',       label: 'warm',        desc: 'golden hour'        },
  { id: 'cool',       label: 'cool',        desc: 'icy blue'           },
  { id: 'vivid',      label: 'vivid',       desc: 'punchy & bold'      },
  { id: 'dreamy',     label: 'dreamy',      desc: 'soft & blurry'      },
  { id: 'lomo',       label: 'lomo',        desc: 'high contrast film' },
  { id: 'polaroid',   label: 'polaroid',    desc: 'instant camera'     },
  { id: 'y2k',        label: 'y2k',         desc: 'early digicam'      },
  { id: 'disposable', label: 'disposable',  desc: 'flash cam grit'     },
]

export default function FilterSelector({ selected, onChange, previewSrc }: FilterSelectorProps) {
  return (
    <div className="filter-selector">
      <h3 className="editor-section-title">filter</h3>
      <p className="editor-section-desc">choose your vibe</p>

      <div className="filter-options">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            className={`filter-option ${selected === filter.id ? 'selected' : ''}`}
            onClick={() => onChange(filter.id)}
          >
            <div className="filter-preview-wrap">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={filter.label}
                  className="filter-preview-img"
                  style={{
                    filter: FILTER_CSS[filter.id],
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <div
                  className="filter-preview-placeholder"
                  style={{ filter: FILTER_CSS[filter.id] }}
                >
                  <span>🤳</span>
                </div>
              )}
            </div>
            <span className="filter-label">{filter.label}</span>
            <span className="filter-desc">{filter.desc}</span>
            {selected === filter.id && <span className="filter-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}