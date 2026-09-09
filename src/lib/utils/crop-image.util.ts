import type { Area } from "react-easy-crop";

/**
 * Creates a DOM Image element loaded from a source URL.
 */
export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // Setting crossOrigin on blob: or data: URLs can trigger CORS rejection in some browsers
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      image.setAttribute("crossOrigin", "anonymous");
    }
    image.src = url;
  });
}

export interface CroppedImageResult {
  file: File;
  previewUrl: string;
}

/**
 * Generates a cropped File and preview URL from source image and pixel coordinates.
 * Renders onto an output canvas sized exactly to outputWidth × outputHeight.
 *
 * @param imageSrc Source image URL or Object URL
 * @param pixelCrop Crop coordinates in natural pixels provided by react-easy-crop (optional fallback to center)
 * @param outputWidth Target output width (defaults to 500)
 * @param outputHeight Target output height (defaults to 500)
 * @param mimeType Output MIME type (defaults to image/jpeg)
 * @param originalFileName Original file name to derive cropped file name
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area | null,
  outputWidth: number = 500,
  outputHeight: number = 500,
  mimeType: string = "image/jpeg",
  originalFileName: string = "image.jpg"
): Promise<CroppedImageResult> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas 2D rendering context");
  }

  // Use high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fill with white background in case image has transparent areas and is saved as JPEG
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  // Calculate safe source coordinates
  let sx = 0;
  let sy = 0;
  let sWidth = image.naturalWidth;
  let sHeight = image.naturalHeight;

  if (pixelCrop && pixelCrop.width > 0 && pixelCrop.height > 0) {
    sx = pixelCrop.x;
    sy = pixelCrop.y;
    sWidth = pixelCrop.width;
    sHeight = pixelCrop.height;
  } else {
    // Fallback: center-crop to desired aspect ratio
    const targetAspect = outputWidth / outputHeight;
    const imgAspect = image.naturalWidth / image.naturalHeight;
    if (imgAspect > targetAspect) {
      sHeight = image.naturalHeight;
      sWidth = image.naturalHeight * targetAspect;
      sx = (image.naturalWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = image.naturalWidth;
      sHeight = image.naturalWidth / targetAspect;
      sx = 0;
      sy = (image.naturalHeight - sHeight) / 2;
    }
  }

  // Draw the cropped region from the source image onto the target canvas
  ctx.drawImage(
    image,
    sx,
    sy,
    sWidth,
    sHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  // Normalize file name with proper extension based on mimeType
  const cleanBaseName = originalFileName.replace(/\.[^/.]+$/, "");
  const extension =
    mimeType === "image/png"
      ? ".png"
      : mimeType === "image/webp"
        ? ".webp"
        : ".jpg";
  const outputFileName = `${cleanBaseName}-cropped${extension}`;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed to produce an image"));
          return;
        }
        const file = new File([blob], outputFileName, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      },
      mimeType,
      0.92
    );
  });
}
