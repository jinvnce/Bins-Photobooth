import { useCallback } from "react";
import CameraView from "../camera/CameraView";
import { useCamera } from "../../hooks/useCamera";

interface Props {
  shotIndex: number;
  onRetake: (index: number, newDataUrl: string) => void;
  onCancel: () => void;
}

export default function RetakeCamera({ shotIndex, onRetake, onCancel }: Props) {
  const { photos, addPhoto, isFull, resetPhotos } = useCamera(1); // only 1 shot needed

  const captured = photos[0] ?? null;

  const handleCapture = useCallback(
    (dataUrl: string) => {
      addPhoto(dataUrl);
    },
    [addPhoto],
  );

  const handleRedo = () => {
    resetPhotos();
  };

  const handleConfirm = () => {
    if (!captured) return;
    onRetake(shotIndex, captured);
  };

  return (
    <div className="retake-camera">
      <div className="retake-header">
        <button className="btn-ghost" onClick={onCancel}>
          ← back to shots
        </button>
        <p className="retake-label">retaking shot {shotIndex + 1}</p>
      </div>

      {/* show camera until 1 shot is taken */}
      {!isFull ? (
        <CameraView
          onCapture={handleCapture}
          photoCount={photos.length}
          maxPhotos={1}
        />
      ) : (
        /* confirm screen — same pattern as booth proceed */
        <div className="retake-confirm">
          <img
            src={captured!}
            alt={`retake shot ${shotIndex + 1}`}
            className="retake-preview-img"
          />
          <p className="retake-label">looking good?</p>
          <div className="retake-actions">
            <button className="btn-secondary" onClick={handleRedo}>
              🔄 redo
            </button>
            <button className="btn-primary" onClick={handleConfirm}>
              ✓ use this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
