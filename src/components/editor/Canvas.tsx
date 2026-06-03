import { useEffect, useRef, useState } from "react";
import type { BgColor, FrameStyle, FilterStyle } from "../../types";
import { compositePhotoStrip } from "../../lib/canvasUtils";
import Loader from "../ui/Loader";

interface CanvasProps {
  photos: string[];
  frameStyle: FrameStyle;
  bgColor: BgColor;
  filterStyle: FilterStyle;
  onReady: (blob: Blob) => void;
}

function StripPlaceholder({
  frameStyle,
  photos,
}: {
  frameStyle: FrameStyle;
  photos: string[];
}) {
  const layout = Number(sessionStorage.getItem("photo_layout")) || 4;
  const orientation = sessionStorage.getItem("photo_orientation") ?? "2x2";
  const isDuplex = [6, 8, 10].includes(layout);

  const cellAspect =
    orientation === "2x1"
      ? 280 / 220
      : orientation === "1x4" || orientation === "1x2"
        ? 260 / 380
        : frameStyle === "pastel"
          ? 280 / 400
          : 1;

  // ── Duplex: two strips side by side ──
  if (isDuplex) {
    const half = layout / 2;
    const stripMode = sessionStorage.getItem("strip_mode") ?? "mirrored";

    const renderStrip = (side: 0 | 1) =>
      Array.from({ length: half }).map((_, i) => {
        const photoIndex = side === 0 ? i : stripMode === "mirrored" ? i : i + half;
        return (
          <div
            key={i}
            style={{
              aspectRatio: `1 / 1.2`,
              background: "rgba(255,255,255,0.25)",
              borderRadius: "4px",
              border: photos[photoIndex]
                ? "none"
                : "1.5px dashed rgba(255,255,255,0.5)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: "1rem",
            }}
          >
            {photos[photoIndex] ? (
              <img
                src={photos[photoIndex]}
                alt={`photo ${photoIndex + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "+"
            )}
          </div>
        );
      });

    return (
      <div className="canvas-preview">
        <h3 className="editor-section-title">preview</h3>
        <div
          style={{
            display: "flex",
            gap: "6px",
            padding: "12px",
            background: "#a8c8f0",
            borderRadius: "8px",
            width: "100%",
            maxWidth: "320px",
            margin: "0 auto",
          }}
        >
          {([0, 1] as (0 | 1)[]).map((side) => (
            <div
              key={side}
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr",
                gridTemplateRows: `repeat(${half}, 1fr)`,
                gap: "6px",
              }}
            >
              {renderStrip(side)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Normal layouts ──
  let cols: number;
  let rows: number;

  if (layout === 1) {
    cols = 1;
    rows = 1;
  } else if (frameStyle === "pastel") {
    cols = 1;
    rows = layout;
  } else if (orientation === "1x4" || orientation === "1x2") {
    cols = 1;
    rows = layout;
  } else if (orientation === "2x1") {
    cols = layout;
    rows = 1;
  } else {
    cols = 2;
    rows = Math.ceil(layout / 2);
  }

  return (
    <div className="canvas-preview">
      <h3 className="editor-section-title">preview</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "8px",
          padding: "12px",
          background: "#a8c8f0",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "320px",
          margin: "0 auto",
        }}
      >
        {Array.from({ length: layout }).map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: `1 / ${cellAspect}`,
              background: "rgba(255,255,255,0.25)",
              borderRadius: "4px",
              border: photos[i] ? "none" : "1.5px dashed rgba(255,255,255,0.5)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: "1.5rem",
            }}
          >
            {photos[i] ? (
              <img
                src={photos[i]}
                alt={`photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "+"
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Canvas({
  photos,
  frameStyle,
  bgColor,
  filterStyle,
  onReady,
}: CanvasProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  const orientation = sessionStorage.getItem("photo_orientation") ?? "2x2";

  useEffect(() => {
    const layout = Number(sessionStorage.getItem("photo_layout")) || 4;
    if (photos.length < layout) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    compositePhotoStrip(photos, frameStyle, bgColor, filterStyle)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        onReadyRef.current(blob);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [photos, frameStyle, bgColor, filterStyle, orientation]);

  const layout = Number(sessionStorage.getItem("photo_layout")) || 4;
  if (photos.length < layout)
    return <StripPlaceholder frameStyle={frameStyle} photos={photos} />;
  if (loading) return <Loader message="compositing your strip..." />;
  if (error) return <p className="error-text">canvas error: {error}</p>;

  return (
    <div className="canvas-preview">
      <h3 className="editor-section-title">preview</h3>
      <img
        src={previewUrl!}
        alt="Photo strip preview"
        className="strip-preview-img"
      />
    </div>
  );
}
