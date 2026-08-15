import QRCode from "qrcode";

export interface GeneratedImage {
  dataUrl: string;
  size: number;
}

/** Génère une image QR à fort contraste, adaptée au scan depuis un écran. */
export async function renderQRImage(payload: string, size = 1024): Promise<GeneratedImage> {
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: { dark: "#000000ff", light: "#ffffffff" },
  });
  return { dataUrl, size };
}
