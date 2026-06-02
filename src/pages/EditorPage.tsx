import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FrameSelector from "../components/editor/FrameSelector";
import FilterSelector from "../components/editor/FilterSelector";
import RetakeCamera from "../components/editor/RetakeCamera";
import Canvas from "../components/editor/Canvas";
import Loader from "../components/ui/Loader";
import { useSessionStore } from "../store/sessionStore";
import { uploadFinalStrip } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { compositePhotoStrip } from "../lib/canvasUtils";

type Step = "shots" | "frame" | "filter";

const STEPS: { id: Step; label: string }[] = [
  { id: "shots", label: "① shots" },
  { id: "frame", label: "② choose frame" },
  { id: "filter", label: "③ filter" },
];

export default function EditorPage() {
  const navigate = useNavigate();
  const {
    photos,
    setPhotos,
    frameStyle,
    setFrameStyle,
    bgColor,
    filterStyle,
    setFilterStyle,
    sessionId,
    setFinalStripUrl,
  } = useSessionStore();

  const guestEmail = sessionStorage.getItem("guest_email") ?? "";
  const guestName = sessionStorage.getItem("guest_name") ?? "";

  const [step, setStep] = useState<Step>("shots");
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retakingIndex, setRetakingIndex] = useState<number | null>(null);

  const [localPhotos, setLocalPhotos] = useState<string[]>(
    photos.length > 0 ? photos : [],
  );
  const photoLayout =
    Number(sessionStorage.getItem("photo_layout")) || localPhotos.length;

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const displayPhotos = useMemo(
    () => selectedIndices.map((i) => localPhotos[i]),
    [selectedIndices, localPhotos],
  );
  const slotsNeeded = photoLayout;
  const slotsLeft = slotsNeeded - selectedIndices.length;

  const handleRetake = useCallback(
    (index: number, newDataUrl: string) => {
      setLocalPhotos((prev) => {
        const updated = [...prev];
        updated[index] = newDataUrl;
        return updated;
      });
      setPhotos(localPhotos.map((p, i) => (i === index ? newDataUrl : p)));
      setRetakingIndex(null);
    },
    [localPhotos, setPhotos],
  );

  // Tap to select (adds one occurrence) or deselect (removes last occurrence).
  // Works even when the strip is full — tapping a selected photo always frees a slot.
  const handleToggleSelect = (i: number) => {
    setSelectedIndices((prev) => {
      const isSelected = prev.includes(i);
      if (isSelected) {
        // Remove the last occurrence of this index
        const lastPos = [...prev]
          .map((x, pos) => ({ x, pos }))
          .reverse()
          .find(({ x }) => x === i)?.pos ?? -1;
        if (lastPos === -1) return prev;
        return prev.filter((_, j) => j !== lastPos);
      } else {
        if (prev.length < slotsNeeded) return [...prev, i];
        return prev; // strip is full, do nothing
      }
    });
  };

  const handleCanvasReady = useCallback((blob: Blob) => {
    setFinalBlob(blob);
  }, []);

  const handleSave = async () => {
    if (!finalBlob || !guestEmail || saved) return;
    setSaving(true);
    setSaved(true);
    try {
      const emailKey = guestEmail.replace("@", "_").replace(".", "_");
      const sid = sessionId ?? `session_${Date.now()}`;

      const url = await uploadFinalStrip(finalBlob, emailKey, sid);

      const blobWithQR = await compositePhotoStrip(
        displayPhotos,
        frameStyle,
        bgColor,
        filterStyle,
        url,
      );

      const finalUrl = await uploadFinalStrip(blobWithQR, emailKey, sid);
      setFinalStripUrl(finalUrl);

      const { error } = await supabase.from("gallery_items").insert({
        guest_session_id: sessionId,
        email: guestEmail,
        final_image_url: finalUrl,
        frame_style: frameStyle,
        bg_color: bgColor,
      });

      if (error) {
        console.error("Insert error:", error);
        setSaved(false);
        return;
      }

      navigate("/download");
    } catch (err) {
      console.error("Save error:", err);
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-layout">
      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>

      <main className="editor-page">
        <div className="editor-header">
          <h1 className="page-title">Edit your strip</h1>
          <div className="editor-steps">
            {STEPS.map((s) => (
              <button
                key={s.id}
                className={`step-tab ${step === s.id ? "active" : ""}`}
                onClick={() => {
                  setRetakingIndex(null);
                  setStep(s.id);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-content">
          <div className="editor-panel">
            {/* ── SHOTS TAB ── */}
            {step === "shots" &&
              (retakingIndex !== null ? (
                <RetakeCamera
                  shotIndex={retakingIndex}
                  onRetake={handleRetake}
                  onCancel={() => setRetakingIndex(null)}
                />
              ) : (
                <div className="shots-tab">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <p className="editor-section-desc" style={{ margin: 0 }}>
                      tap to pick · tap again to remove.{" "}
                      {slotsLeft > 0 ? (
                        `${slotsLeft} more to go.`
                      ) : (
                        <strong style={{ color: "var(--accent-dark)" }}>
                          all set!
                        </strong>
                      )}
                    </p>
                    {selectedIndices.length > 0 && (
                      <button
                        onClick={() => setSelectedIndices([])}
                        style={{
                          background: "rgba(255,80,80,0.15)",
                          border: "1px solid rgba(255,80,80,0.4)",
                          borderRadius: "6px",
                          color: "#ff6060",
                          fontSize: "0.65rem",
                          padding: "3px 8px",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        clear all
                      </button>
                    )}
                  </div>

                  <div className="shots-retake-grid">
                    {localPhotos.map((src, i) => {
                      const isSelected = selectedIndices.includes(i);
                      const occurrences = selectedIndices.reduce<number[]>(
                        (acc, x, pos) => {
                          if (x === i) acc.push(pos + 1);
                          return acc;
                        },
                        [],
                      );

                      return (
                        <div key={i} style={{ position: "relative" }}>
                          <button
                            className="shots-retake-card"
                            style={{
                              border: isSelected
                                ? "2px solid var(--accent)"
                                : undefined,
                              width: "100%",
                            }}
                            onClick={() => handleToggleSelect(i)}
                          >
                            <img
                              src={src}
                              alt={`shot ${i + 1}`}
                              className="shots-retake-img"
                            />
                            <span className="shots-retake-badge">
                              shot {i + 1}
                            </span>

                            {isSelected ? (
                              <span
                                className="shots-retake-overlay"
                                style={{
                                  opacity: 1,
                                  background: "rgba(74,143,255,0.55)",
                                  fontSize: "1rem",
                                  gap: 4,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "center",
                                }}
                              >
                                {occurrences.map((pos) => (
                                  <span
                                    key={pos}
                                    style={{
                                      background: "rgba(0,0,0,0.35)",
                                      borderRadius: 4,
                                      padding: "1px 5px",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    #{pos}
                                  </span>
                                ))}
                              </span>
                            ) : selectedIndices.length < slotsNeeded ? (
                              <span className="shots-retake-overlay">
                                <svg
                                  width="22"
                                  height="22"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </span>
                            ) : (
                              <span
                                className="shots-retake-overlay"
                                style={{
                                  background: "rgba(0,0,0,0.6)",
                                  fontSize: "0.7rem",
                                }}
                              >
                                full
                              </span>
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndices((prev) =>
                                prev.filter((x) => x !== i),
                              );
                              setRetakingIndex(i);
                            }}
                            title="retake this shot"
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              zIndex: 10,
                              background: "rgba(0,0,0,0.7)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: "6px",
                              color: "white",
                              fontSize: "0.65rem",
                              padding: "2px 6px",
                              cursor: "pointer",
                              fontWeight: 600,
                              letterSpacing: "0.03em",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                            </svg>
                            retake
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {step === "frame" && (
              <FrameSelector selected={frameStyle} onChange={setFrameStyle} />
            )}
            {step === "filter" && (
              <FilterSelector
                selected={filterStyle}
                onChange={setFilterStyle}
                previewSrc={displayPhotos[0]}
              />
            )}

            {/* ── NAV ── */}
            <div className="editor-nav">
              {step !== "shots" && (
                <button
                  className="btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => {
                    const idx = STEPS.findIndex((s) => s.id === step);
                    setStep(STEPS[idx - 1].id);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                  back
                </button>
              )}
              {step !== "filter" ? (
                <button
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                  disabled={
                    step === "shots" && selectedIndices.length < slotsNeeded
                  }
                  onClick={() => {
                    setRetakingIndex(null);
                    const idx = STEPS.findIndex((s) => s.id === step);
                    setStep(STEPS[idx + 1].id);
                  }}
                >
                  {step === "shots" && selectedIndices.length < slotsNeeded
                    ? `pick ${slotsLeft} more`
                    : "next →"}
                </button>
              ) : (
                <>
                  {saving && <Loader message="saving your strip..." />}
                  <button
                    className="btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onClick={handleSave}
                    disabled={saving || !finalBlob}
                  >
                    {saving ? "saving..." : "save & download →"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="editor-canvas-panel">
            <Canvas
              photos={displayPhotos}
              frameStyle={frameStyle}
              bgColor={bgColor}
              filterStyle={filterStyle}
              onReady={handleCanvasReady}
            />
          </div>
        </div>
      </main>
    </div>
  );
}