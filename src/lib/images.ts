export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

export interface ImageBox {
  width: number;
  height: number;
}

export const LOGO_BOX: ImageBox = { width: 300, height: 300 };
export const HEADER_BOX: ImageBox = { width: 1920, height: 400 };

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGES.split(",").includes(file.type);
}

export async function fileToScaledDataUrl(file: File, box: ImageBox) {
  const source = await readAsDataUrl(file);
  if (file.type === "image/gif") return source;

  const image = await loadImage(source);
  const scale = Math.min(1, box.width / image.width, box.height / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);

  const encoded = canvas.toDataURL(
    file.type === "image/png" ? "image/png" : "image/jpeg",
    0.86,
  );
  return encoded.length < source.length ? encoded : source;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = src;
  });
}
