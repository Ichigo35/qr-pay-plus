import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

/** Partage natif iOS/Android (fallback Web Share / téléchargement). */
export async function shareQRImage(dataUrl: string, title: string, text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const fileName = `qr-pay-${Date.now()}.png`;
    const written = await Filesystem.writeFile({
      path: fileName,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Cache,
    });
    await Share.share({ title, text, url: written.uri, dialogTitle: title });
    return;
  }

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "qr-pay.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ title, text, files: [file] });
    return;
  }
  downloadDataUrl(dataUrl, "qr-pay.png");
}

/** Enregistre l'image du QR (galerie sur mobile, téléchargement en web). */
export async function saveQRImage(dataUrl: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const fileName = `qr-pay-${Date.now()}.png`;
    await Filesystem.writeFile({
      path: fileName,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Documents,
    });
    return fileName;
  }
  downloadDataUrl(dataUrl, "qr-pay.png");
  return "qr-pay.png";
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
