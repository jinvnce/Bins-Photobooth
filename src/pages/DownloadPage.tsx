import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { QRCodeSVG } from "qrcode.react";
import { useSessionStore } from "../store/sessionStore";

export default function DownloadPage() {
  const navigate = useNavigate();
  const { finalStripUrl, reset } = useSessionStore();
  const guestEmail = sessionStorage.getItem("guest_email");
  const guestName = sessionStorage.getItem("guest_name");
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleDownload = () => {
    if (!finalStripUrl) return;
    saveAs(finalStripUrl, `life4cuts-${Date.now()}.png`);
  };

  const handleNew = () => {
    reset();
    sessionStorage.clear();
    navigate("/");
  };

  const qrUrl = finalStripUrl || window.location.href;

  return (
    <div className="page-layout">
      <div className="guest-topbar">
        <span className="guest-topbar-logo">BINS FOUR CATS</span>
        <span className="guest-topbar-user">{guestName || guestEmail}</span>
      </div>
      <main className="download-page">
        <div className="download-content">
          <h1 className="page-title">
            Your strip is ready, {guestName || guestEmail?.split("@")[0]}!
          </h1>{" "}
          <p className="page-subtitle">
            we'll send a copy to <strong>{guestEmail}</strong>
          </p>
          {finalStripUrl && !imgError ? (
            <div style={{ position: "relative", minHeight: 200 }}>
              {!imgLoaded && (
                <p style={{ textAlign: "center", opacity: 0.5 }}>
                  loading strip...
                </p>
              )}
              <img
                src={finalStripUrl}
                alt="Your final photo strip"
                className="download-preview"
                crossOrigin="anonymous"
                onLoad={() => setImgLoaded(true)}
                onError={(e) => {
                  console.error("Image failed to load:", finalStripUrl, e);
                  setImgError(true);
                }}
                style={{ display: imgLoaded ? "block" : "none" }}
              />
            </div>
          ) : imgError ? (
            <div className="download-placeholder">
              strip saved but preview failed —{" "}
              <a
                href={finalStripUrl!}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                open directly
              </a>
            </div>
          ) : (
            <div className="download-placeholder">no strip found</div>
          )}
          {finalStripUrl && (
            <div className="download-qr">
              <p className="download-qr-label">scan to save on your phone</p>
              <QRCodeSVG
                value={qrUrl}
                size={140}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
                includeMargin={true}
              />
            </div>
          )}
          <div className="download-actions">
            <button className="btn-primary btn-lg" onClick={handleDownload}>
              ↓ download strip
            </button>
            <button className="btn-ghost" onClick={handleNew}>
              + new session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
