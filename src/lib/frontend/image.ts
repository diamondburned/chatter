import type * as api from "#/lib/api/index.js";

const elementID = "frontend-image-preview";

function loadPreview(): HTMLElement {
  let div = document.getElementById(elementID);
  if (div) return div;

  div = document.createElement("div");
  div.id = elementID;
  document.body.appendChild(div);

  return div;
}

const preview = loadPreview();

// compressImage compress the given file to a smaller image and returns it in
// data URL format.
export async function compressImage(
  image: File,
  {
    targetMIME = "image/jpeg",
    quality = 0.7,
    maxWidth = null,
    maxHeight = null,
  }
): Promise<api.Resource | undefined> {
  // read all file
  const reader = new FileReader();
  const readPromise = new Promise((resolve) => {
    reader.addEventListener("load", (ev) => {
      resolve(ev.target.result);
    });
  });
  reader.readAsDataURL(image);

  const canvas = document.createElement("canvas");
  preview.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const img = new Image();
  // Wait for our file reader to finish reading the file.
  img.src = (await readPromise) as string;

  // Wait for the image to load.
  await new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve());
  });

  if (
    maxWidth &&
    maxHeight &&
    (img.width > maxWidth || img.height > maxHeight)
  ) {
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let dataURL: string | undefined = canvas.toDataURL(targetMIME, quality);
  if (dataURL == "data:,") {
    dataURL = undefined;
  }

  preview.removeChild(canvas);

  return dataURL as api.Resource | undefined;
}
