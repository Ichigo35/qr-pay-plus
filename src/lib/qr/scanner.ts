import jsQR from "jsqr";

/** Lecture d'un QR dans une image (traitement 100% local, aucune donnée envoyée). */
export async function scanImageFile(source: File | Blob | string): Promise<string | null> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const image = await loadImage(url);
    return scanImageElement(image);
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

function scanImageElement(img: HTMLImageElement): string | null {
  // Plusieurs échelles : améliore la détection sur photos floues / très grandes.
  for (const maxSize of [1600, 1000, 640]) {
    const result = scanAtScale(img, maxSize);
    if (result) return result;
  }
  return null;
}

function scanAtScale(img: HTMLImageElement, maxSize: number): string | null {
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const code =
    jsQR(data.data, width, height, { inversionAttempts: "attemptBoth" }) ?? null;
  return code?.data ?? null;
}

/** Décodage d'un dataURL de QR généré, utilisé pour la validation visuelle finale. */
export async function scanDataUrl(dataUrl: string): Promise<string | null> {
  return scanImageFile(dataUrl);
}
