import type { FilterStyle } from "../../types";

interface FilterSelectorProps {
  selected: FilterStyle;
  onChange: (filter: FilterStyle) => void;
  previewSrc?: string;
}

export const FILTER_CSS: Record<FilterStyle, string> = {
  none: "none",
  vintage: "sepia(0.55) contrast(1.1) brightness(0.95) saturate(0.85)",
  noir: "grayscale(1) contrast(1.4) brightness(0.88)",
  fade: "brightness(1.12) saturate(0.55) contrast(0.82)",
  warm: "sepia(0.25) saturate(1.5) brightness(1.05) hue-rotate(-10deg)",
  cool: "saturate(1.2) brightness(1.05) hue-rotate(25deg)",
  vivid: "saturate(1.9) contrast(1.2) brightness(1.05)",
  dreamy: "brightness(1.12) saturate(0.85) contrast(0.88) blur(0.7px)",
  lomo: "contrast(1.6) saturate(1.4) brightness(0.82)",
  polaroid: "sepia(0.3) brightness(1.12) contrast(0.92) saturate(1.1)",
  y2k: "saturate(1.6) contrast(1.1) brightness(1.12) hue-rotate(8deg)",
  disposable: "sepia(0.18) contrast(1.25) brightness(1.08) saturate(1.15)",
  // new filters
  sunset: "sepia(0.4) saturate(1.8) brightness(1.05) hue-rotate(-20deg)",
  mint: "saturate(1.3) brightness(1.08) hue-rotate(100deg) contrast(0.95)",
  dusk: "brightness(0.85) saturate(0.7) contrast(1.2) hue-rotate(200deg)",
  golden: "sepia(0.6) saturate(2) brightness(1.1) contrast(1.05)",
  cinema: "contrast(1.35) saturate(0.75) brightness(0.92)",
  neon: "saturate(2.5) brightness(1.1) contrast(1.3) hue-rotate(15deg)",
  pastel: "brightness(1.2) saturate(0.6) contrast(0.85)",
  chrome: "grayscale(0.3) contrast(1.4) brightness(1.05) saturate(1.3)",
  matte: "contrast(0.9) brightness(1.05) saturate(0.8)",
  infrared: "hue-rotate(120deg) saturate(2) brightness(1.05) contrast(1.2)",
  velvet: "brightness(0.88) saturate(1.4) contrast(1.25) hue-rotate(330deg)",
  kodak:
    "sepia(0.2) contrast(1.15) brightness(1.08) saturate(1.35) hue-rotate(-5deg)",
    oldvintage: 'sepia(0.85) contrast(0.85) brightness(0.88) saturate(0.6) hue-rotate(-15deg)',

};

const FILTERS: { id: FilterStyle; label: string; desc: string }[] = [
  { id: "none", label: "original", desc: "no filter" },
  { id: "vintage", label: "vintage", desc: "warm faded film" },
  { id: "noir", label: "noir", desc: "b&w drama" },
  { id: "fade", label: "fade", desc: "washed out" },
  { id: "warm", label: "warm", desc: "golden hour" },
  { id: "cool", label: "cool", desc: "icy blue" },
  { id: "vivid", label: "vivid", desc: "punchy & bold" },
  { id: "dreamy", label: "dreamy", desc: "soft glow" },
  { id: "lomo", label: "lomo", desc: "high contrast" },
  { id: "polaroid", label: "polaroid", desc: "instant cam" },
  { id: "y2k", label: "y2k", desc: "early digicam" },
  { id: "disposable", label: "disposable", desc: "flash grit" },
  { id: "sunset", label: "sunset", desc: "warm dusk tones" },
  { id: "mint", label: "mint", desc: "fresh green tint" },
  { id: "dusk", label: "dusk", desc: "moody blue night" },
  { id: "golden", label: "golden", desc: "rich amber" },
  { id: "cinema", label: "cinema", desc: "filmic grade" },
  { id: "neon", label: "neon", desc: "electric pop" },
  { id: "pastel", label: "pastel", desc: "soft & airy" },
  { id: "chrome", label: "chrome", desc: "sharp metallic" },
  { id: "matte", label: "matte", desc: "flat finish" },
  { id: "infrared", label: "infrared", desc: "alien landscape" },
  { id: "velvet", label: "velvet", desc: "deep magenta" },
  { id: "kodak", label: "kodak", desc: "classic film stock" },
  { id: 'oldvintage', label: 'old film', desc: '1970s worn print' },
];

export default function FilterSelector({
  selected,
  onChange,
  previewSrc,
}: FilterSelectorProps) {
  const selectedFilter = FILTERS.find((f) => f.id === selected)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h3 className="editor-section-title">filter</h3>
        <p className="editor-section-desc">choose your vibe</p>
      </div>

      {/* Selected filter pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--accent-light)",
          border: "1.5px solid var(--accent)",
          borderRadius: 999,
          padding: "5px 14px",
          alignSelf: "flex-start",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--accent-dark)",
          }}
        >
          {selectedFilter.label}
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          — {selectedFilter.desc}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
          maxHeight: "420px",
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {FILTERS.map((filter) => {
          const isSelected = selected === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onChange(filter.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "4px 3px 6px",
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                borderRadius: 10,
                background: isSelected
                  ? "var(--accent-light)"
                  : "var(--surface-2)",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s",
                outline: "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--surface-3)",
                  boxShadow: isSelected ? "0 0 0 1px var(--accent)" : "none",
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={filter.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: FILTER_CSS[filter.id],
                      pointerEvents: "none",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      filter: FILTER_CSS[filter.id],
                      background: "var(--surface-3)",
                    }}
                  >
                    📷
                  </div>
                )}
              </div>

              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected
                    ? "var(--accent-dark)"
                    : "var(--text-muted)",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
              >
                {filter.label}
              </span>

              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 5,
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 14,
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.55rem",
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
