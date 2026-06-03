import type { BgColor, FrameStyle, FilterStyle } from "../types";
import { FILTER_CSS } from "../components/editor/FilterSelector";
import QRCode from "qrcode";

export const BG_COLORS: Record<BgColor, string> = {
  blue: "#a8c8f0",
  red: "#f0a8a8",
  brown: "#c8a882",
};

export const FRAME_PATHS: Record<FrameStyle, string | null> = {
  classic: "/frames/05.22.26.png",
  pastel: "/frames/tryframe.png",
  film: "/frames/one.png",
  vintage: "/frames/two.png",
  neon: "/frames/three.png",
  minimal: null,
};

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateQRCanvas(
  url: string,
  size: number,
): Promise<HTMLCanvasElement> {
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: size,
    margin: 1,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });
  return qrCanvas;
}

export async function compositePhotoStrip(
  photos: string[],
  frameStyle: FrameStyle,
  bgColor: BgColor,
  filterStyle: FilterStyle = "none",
  shareUrl?: string,
): Promise<Blob> {
  const layout =
    Number(sessionStorage.getItem("photo_layout")) || photos.length;
  const orientation = sessionStorage.getItem("photo_orientation") ?? "2x2";
  const stripMode = sessionStorage.getItem("strip_mode") ?? "mirrored";

  const displayPhotos = photos.slice(0, layout);
  const count = displayPhotos.length;

  const isDuplex = [6, 8, 10].includes(layout) && frameStyle !== "pastel";

  // ── Cell / padding dimensions ──
  let CELL_W = 300;
  let CELL_H = 300;
  let PADDING_X = 12;
  let PADDING_Y = 12;
  let FOOTER_H = 64;

  if (frameStyle === "pastel") {
    CELL_W = 400;
    CELL_H = 280;
    PADDING_X = 18;
    PADDING_Y = 18;
    FOOTER_H = 64;
  } else if (orientation === "2x1") {
    CELL_W = 220;
    CELL_H = 280;
    PADDING_X = 10;
    PADDING_Y = 10;
    FOOTER_H = 56;
  } else if (orientation === "1x4" || orientation === "1x2") {
    CELL_W = 380;
    CELL_H = 260;
    PADDING_X = 12;
    PADDING_Y = 12;
    FOOTER_H = 64;
  } else if (isDuplex) {
    CELL_W = 519;
    CELL_H = 321;
    PADDING_X = 54;
    PADDING_Y = 75;
    FOOTER_H = 80;
  } else {
    CELL_W = 300;
    CELL_H = 300;
    PADDING_X = 12;
    PADDING_Y = 12;
    FOOTER_H = 64;
  }

  // ── Canvas dimensions ──
  let STRIP_W: number;
  let STRIP_H: number;
  let cols: number;
  let rows: number;

  if (isDuplex) {
    const half = layout / 2;
    STRIP_W = 1200;
    STRIP_H = 1800;
    cols = 1;
    rows = half;
    CELL_W = 520;
    CELL_H = 322;
    PADDING_X = 75;
    PADDING_Y = 372;
    FOOTER_H = 0;
  } else if (count === 1) {
    cols = 1;
    rows = 1;
    STRIP_W = cols * CELL_W + (cols + 1) * PADDING_X;
    STRIP_H = rows * CELL_H + (rows + 1) * PADDING_Y + FOOTER_H;
  } else if (frameStyle === "pastel") {
    cols = 1;
    rows = count;
    STRIP_W = cols * CELL_W + (cols + 1) * PADDING_X;
    STRIP_H = rows * CELL_H + (rows + 1) * PADDING_Y + FOOTER_H;
  } else if (orientation === "1x4" || orientation === "1x2") {
    cols = 1;
    rows = count;
    STRIP_W = cols * CELL_W + (cols + 1) * PADDING_X;
    STRIP_H = rows * CELL_H + (rows + 1) * PADDING_Y + FOOTER_H;
  } else if (orientation === "2x1") {
    cols = count;
    rows = 1;
    STRIP_W = cols * CELL_W + (cols + 1) * PADDING_X;
    STRIP_H = rows * CELL_H + (rows + 1) * PADDING_Y + FOOTER_H;
  } else {
    cols = 2;
    rows = Math.ceil(count / 2);
    STRIP_W = cols * CELL_W + (cols + 1) * PADDING_X;
    STRIP_H = rows * CELL_H + (rows + 1) * PADDING_Y + FOOTER_H;
  }

  const canvas = document.createElement("canvas");
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;
  const ctx = canvas.getContext("2d")!;

  const framePath = FRAME_PATHS[frameStyle];

  // ── Background ──
  if (framePath && frameStyle === "pastel") {
    try {
      const frameImg = await loadImage(framePath);
      const photoAreaH = STRIP_H - FOOTER_H;
      ctx.drawImage(frameImg, 0, 0, STRIP_W, photoAreaH);
    } catch {
      console.warn("Frame image not found");
      ctx.fillStyle = BG_COLORS[bgColor];
      ctx.fillRect(0, 0, STRIP_W, STRIP_H - FOOTER_H);
    }
  } else {
    ctx.fillStyle = BG_COLORS[bgColor];
    ctx.fillRect(0, 0, STRIP_W, STRIP_H);
  }

  // ── Photos ──
  if (isDuplex) {
    const half = layout / 2;
    const GAP_Y = 13;
    const RIGHT_X = 609;

    for (let side = 0; side < 2; side++) {
      const offsetX = side === 0 ? PADDING_X : RIGHT_X;

      for (let i = 0; i < half; i++) {
        const photoIndex =
          stripMode === "mirrored" ? i : side === 0 ? i : i + half;

        const x = offsetX;
        const y = PADDING_Y + i * (CELL_H + GAP_Y);

        const photoImg = await loadImage(displayPhotos[photoIndex]);
        const { sx, sy, sw, sh } = coverFit(
          photoImg.naturalWidth,
          photoImg.naturalHeight,
          CELL_W,
          CELL_H,
        );

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, x, y, CELL_W, CELL_H, 4);
        ctx.clip();
        const cssFilter = FILTER_CSS[filterStyle];
        if (cssFilter !== "none") ctx.filter = cssFilter;
        ctx.drawImage(photoImg, sx, sy, sw, sh, x, y, CELL_W, CELL_H);
        ctx.filter = "none";
        ctx.restore();
      }
    }
  } else {
    for (let i = 0; i < displayPhotos.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = PADDING_X + col * (CELL_W + PADDING_X);
      const y = PADDING_Y + row * (CELL_H + PADDING_Y);

      const photoImg = await loadImage(displayPhotos[i]);
      const { sx, sy, sw, sh } = coverFit(
        photoImg.naturalWidth,
        photoImg.naturalHeight,
        CELL_W,
        CELL_H,
      );

      ctx.save();
      ctx.beginPath();
      roundRect(ctx, x, y, CELL_W, CELL_H, 4);
      ctx.clip();
      const cssFilter = FILTER_CSS[filterStyle];
      if (cssFilter !== "none") ctx.filter = cssFilter;
      ctx.drawImage(photoImg, sx, sy, sw, sh, x, y, CELL_W, CELL_H);
      ctx.filter = "none";
      ctx.restore();
    }
  }

  // ── Frame overlay (non-pastel) ──
  if (frameStyle !== "pastel" && framePath) {
    try {
      const frameImg = await loadImage(framePath);
      ctx.drawImage(frameImg, 0, 0, STRIP_W, STRIP_H);
    } catch {
      console.warn("Frame image not found, skipping overlay");
    }
  }

  // ── Footer ──
  const QR_SIZE = 84;

  if (isDuplex) {
    if (shareUrl) {
      try {
        const qrCanvas = await generateQRCanvas(shareUrl, QR_SIZE);
        ctx.drawImage(qrCanvas, 1095, 1707, QR_SIZE, QR_SIZE);
      } catch {
        console.warn("QR generation failed");
      }
    }
  } else {
    const footerY = STRIP_H - FOOTER_H;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, footerY, STRIP_W, FOOTER_H);

    ctx.fillStyle = "#1a1a2e";
    ctx.font = 'bold 15px "Georgia", serif';
    ctx.textAlign = "left";
    ctx.fillText("BINS FOUR CATS", PADDING_X, footerY + FOOTER_H / 2 + 5);

    if (shareUrl) {
      try {
        const qrCanvas = await generateQRCanvas(shareUrl, QR_SIZE);
        const qrX = STRIP_W - QR_SIZE - PADDING_X;
        const qrY = footerY + (FOOTER_H - QR_SIZE) / 2;
        ctx.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);
      } catch {
        console.warn("QR generation failed");
      }
    }
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

function coverFit(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
) {
  const scale = Math.max(targetW / imgW, targetH / imgH);
  const sw = targetW / scale;
  const sh = targetH / scale;
  const sx = (imgW - sw) / 2;
  const sy = (imgH - sh) / 2;
  return { sx, sy, sw, sh };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
