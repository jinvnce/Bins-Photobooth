import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  label?: string;
}

export default function QRCodeDisplay({ url, size = 120, label }: QRCodeDisplayProps) {
  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <QRCodeSVG
        value={url}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin={true}
      />
      {label && (
        <p className="text-xs text-gray-500 text-center">{label}</p>
      )}
    </div>
  );
}