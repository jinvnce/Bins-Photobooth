import { useRef, useCallback, useState, useEffect } from "react";
import Webcam from "react-webcam";
import CountdownTimer from "./CountdownTimer";

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
  photoCount: number;
  maxPhotos?: number;
}
// ── SVG icon components — add above the CameraView function ──

const IconFlash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconTimer = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconMirror = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <path d="M3 9l4-4 4 4"/>
    <path d="M3 15l4 4 4-4"/>
    <path d="M21 9l-4-4-4 4"/>
    <path d="M21 15l-4 4-4-4"/>
  </svg>
)
export default function CameraView({
  onCapture,
  photoCount,
  maxPhotos = 4,
}: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(0);
  const [flash, setFlash] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then((allDevices) => {
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0)
          setSelectedDeviceId(videoDevices[0].deviceId);
      })
      .catch(() => setPermissionDenied(true));
  }, []);

  const captureNow = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    onCapture(imageSrc);
  }, [onCapture]);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const label =
      devices
        .find((d) => d.deviceId === e.target.value)
        ?.label?.toLowerCase() || "";
    const isBack = label.includes("back") || label.includes("rear");
    setCameraReady(false);
    setSelectedDeviceId(e.target.value);
    setIsMirrored(!isBack);
  };

  const isFull = photoCount >= maxPhotos;

  const videoConstraints = {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    width: 1280,
    height: 720,
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("obs")) return "🎥";
    if (l.includes("phone") || l.includes("iphone") || l.includes("android"))
      return "📱";
    if (l.includes("droid") || l.includes("continuity")) return "📱";
    if (l.includes("back") || l.includes("rear")) return "📷";
    if (l.includes("front") || l.includes("facetime")) return "🤳";
    return "📹";
  };

  const selectedLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label ||
    "Select camera";

  if (permissionDenied) {
    return (
      <div className="camera-permission-denied">
        <span>🚫</span>
        <h3>camera access denied</h3>
        <p>
          please allow camera access in your browser settings and refresh the
          page
        </p>
      </div>
    );
  }

  return (
    <div className="camera-wrapper">
      {/* Camera dropdown selector */}
      <div className="camera-dropdown-wrapper">
        <label className="camera-dropdown-label" htmlFor="camera-select">
          camera source
        </label>
        <div className="camera-dropdown-box">
          <span className="camera-dropdown-icon">
            {getDeviceIcon(selectedLabel)}
          </span>
          <select
            id="camera-select"
            className="camera-dropdown"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            disabled={devices.length === 0}
          >
            {devices.length === 0 && (
              <option value="">detecting cameras...</option>
            )}
            {devices.map((device, i) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
          <span className="camera-dropdown-arrow">▾</span>
        </div>
      </div>

      {/* Camera feed */}
      <div className="camera-frame">
        {selectedDeviceId && (
          <Webcam
            key={selectedDeviceId}
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={() => setCameraReady(true)}
            onUserMediaError={() => setCameraReady(false)}
            className="webcam-video"
            mirrored={isMirrored}
          />
        )}

        {flash && <div className="camera-flash" />}

        {!cameraReady && (
          <div className="camera-loading">
            <div className="camera-loading-spinner" />
            <span>connecting camera...</span>
          </div>
        )}

        <div className="camera-corners">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </div>

        <div className="shot-counter">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <span
              key={i}
              className={`shot-dot ${i < photoCount ? "taken" : ""}`}
            />
          ))}
        </div>

        {cameraReady && (
          <div className="camera-live-badge">
            <span className="live-dot" />
            LIVE
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="camera-controls">
        {timerSeconds > 0 ? (
          <CountdownTimer seconds={timerSeconds} onComplete={captureNow} />
        ) : (
         <button
  className="btn-capture"
  onClick={captureNow}
  disabled={isFull || !cameraReady}
>
  <IconCamera />
  {isFull ? "all done!" : "capture"}
</button>
        )}

        {/* Timer selector */}
        <div style={{ display: "flex", gap: "6px" }}>
          {([0, 3, 5, 10] as const).map((s) => (
  <button
    key={s}
    className={`btn-timer-toggle ${timerSeconds === s ? "active" : ""}`}
    onClick={() => setTimerSeconds(s)}
    title={s === 0 ? "no timer" : `${s}s timer`}
  >
    {s === 0 ? <IconFlash /> : (
      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', fontWeight: 700 }}>
        <IconTimer />{s}s
      </span>
    )}
  </button>
))}
        </div>

        {/* Mirror toggle */}
        <button
  className="btn-timer-toggle"
  onClick={() => setIsMirrored((prev) => !prev)}
  title="mirror"
  disabled={!cameraReady}
>
  <IconMirror />
</button>
      </div>

      <p className="camera-hint">
        {isFull
          ? "go to editor to finish your strip!"
          : `${maxPhotos - photoCount} shot${maxPhotos - photoCount !== 1 ? "s" : ""} left`}
      </p>
    </div>
  );
}
