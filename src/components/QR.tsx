"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The QR encodes a link to the verification page. On the LAN server this becomes e.g. http://192.168.1.10:3000/verify?ref=… */
export function verifyUrl(refNo: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${BASE}/verify?ref=${encodeURIComponent(refNo)}`;
}

export function QR({ refNo, size = 132, className }: { refNo: string; size?: number; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(verifyUrl(refNo), { margin: 1, width: size * 2, errorCorrectionLevel: "M" }).then(setSrc);
  }, [refNo, size]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={`QR code for ${refNo}`} width={size} height={size} className={className} /> : <div style={{ width: size, height: size }} className={className} />;
}
