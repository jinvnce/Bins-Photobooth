import type { BgColor } from '../../types'
import { BG_COLORS } from '../../lib/canvasUtils'

interface ColorPickerProps {
  selected: BgColor
  onChange: (color: BgColor) => void
}

const COLOR_LABELS: Record<BgColor, string> = {
  blue: 'sky blue',
  red: 'rose red',
  brown: 'warm brown',
}

const COLORS: BgColor[] = ['blue', 'red', 'brown']

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker">
      <h3 className="editor-section-title">background color</h3>
      <p className="editor-section-desc">choose a color for your photo strip</p>

      <div className="color-options">
        {COLORS.map(color => (
          <button
            key={color}
            className={`color-swatch ${selected === color ? 'selected' : ''}`}
            style={{ backgroundColor: BG_COLORS[color] }}
            onClick={() => onChange(color)}
            title={COLOR_LABELS[color]}
          >
            {selected === color && <span className="color-check">✓</span>}
            <span className="color-label">{COLOR_LABELS[color]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}