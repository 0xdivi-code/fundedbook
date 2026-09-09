/**
 * Screenshot preparation for database storage.
 *
 * Uploaded screenshots used to live in localStorage (where quota forced the
 * old store to drop them). Now that trades are persisted in Postgres, we
 * still keep rows lean by downscaling large images and re-encoding them as
 * JPEG before they ever leave the browser. Compression is best-effort: if it
 * fails for any reason, the original data URL is used unchanged.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
/** Data URLs below this length are cheap enough to store as-is. */
const SMALL_ENOUGH = 350_000;

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/**
 * Read an image file and return a storage-friendly data URL: downscaled to
 * fit `maxDim` on its longest side and re-encoded as JPEG. Falls back to the
 * original data URL whenever anything goes wrong.
 */
export async function compressImageFile(
  file: File,
  maxDim = MAX_DIMENSION,
  quality = JPEG_QUALITY
): Promise<string> {
  const original = await readAsDataUrl(file);
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    if (scale >= 1 && original.length < SMALL_ENOUGH) return original;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", quality);
    return compressed.length < original.length ? compressed : original;
  } catch {
    return original;
  }
}
