"use client";
// Ortasında loqo olan QR kod (error correction "H" — loqo kodun ~20%-ni örtsə də oxunur).

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("/")) img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("logo"));
    img.src = src;
  });
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export type QrOpts = { size?: number; fg?: string; bg?: string; logo?: string; logoText?: string; logoColor?: string; logoScale?: number };

export async function drawQr(canvas: HTMLCanvasElement, text: string, o: QrOpts = {}) {
  const QR = (await import("qrcode")).default;
  const size = o.size ?? 512;
  await QR.toCanvas(canvas, text || " ", { errorCorrectionLevel: "H", margin: 2, width: size, color: { dark: o.fg ?? "#0B132B", light: o.bg ?? "#ffffff" } });
  // qrcode kitabxanası inline width/height yazır; ölçünü CSS idarə etsin (yoxsa kod uzanır).
  canvas.style.removeProperty("width");
  canvas.style.removeProperty("height");
  const ctx = canvas.getContext("2d")!;
  const box = Math.round(size * (o.logoScale ?? 0.22));
  const x = Math.round((size - box) / 2);
  const pad = Math.round(box * 0.1);
  if (o.logo) {
    let img: HTMLImageElement | null = null;
    try {
      img = await loadImage(o.logo);
    } catch {
      try {
        img = await loadImage(`/api/proxy-image?url=${encodeURIComponent(o.logo)}`);
      } catch {
        img = null;
      }
    }
    if (img) {
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, x - pad, x - pad, box + pad * 2, box + pad * 2, Math.round(box * 0.22));
      ctx.fill();
      const s = Math.min(box / img.width, box / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, x + (box - w) / 2, x + (box - h) / 2, w, h);
      return;
    }
  }
  if (o.logoText) {
    ctx.fillStyle = o.logoColor ?? "#2456EE";
    roundRect(ctx, x - pad, x - pad, box + pad * 2, box + pad * 2, Math.round(box * 0.24));
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(box * 0.42)}px "Space Grotesk Variable", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.logoText, size / 2, size / 2 + 1);
  }
}
