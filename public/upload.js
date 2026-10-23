// upload.js — turns a chosen file or photo into something the helper can read.
// PDFs are sent as-is. Photos are shrunk first (phone photos are huge and the free
// hosting has a size limit), then sent as JPEG.

const MAX_SIDE = 1600;
const MAX_BYTES = 4 * 1024 * 1024; // keep each request comfortably under Vercel's limit

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function shrinkImage(file, maxSide = MAX_SIDE, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// A digital fingerprint of the exact file, so re-uploading the same file is recognized
// without sending it to the AI again. Only computed on the phone; never leaves it.
export async function fingerprint(file) {
  try {
    if (!crypto || !crypto.subtle) return null;
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

/** @returns {Promise<{name:string,type:string,data:string,size:number,hash:string|null}|{error:string}>} */
export async function prepareFile(file) {
  if (!file) return { error: 'No file chosen.' };
  const hash = await fingerprint(file);
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_BYTES * 0.74) return { error: 'This file is too large. Try a photo of the key pages.' };
    return { name: file.name, type: 'application/pdf', data: await toBase64(file), size: file.size, hash };
  }
  if (file.type.startsWith('image/')) {
    const { blob } = await shrinkImage(file);
    return { name: file.name || 'photo.jpg', type: 'image/jpeg', data: await toBase64(blob), size: blob.size, hash };
  }
  return { error: 'Fine Print can read PDFs and photos. Try one of those?' };
}

/**
 * Several photographed pages → images the helper can read in one go.
 * Shrinks harder if the pages together would be too big for one request.
 * @returns {Promise<{files:Array, totalBytes:number}|{error:string}>}
 */
export async function preparePages(photos) {
  const budget = MAX_BYTES * 0.7; // base64 adds about a third
  for (const [side, quality] of [[MAX_SIDE, 0.82], [1300, 0.72], [1000, 0.62]]) {
    const files = [];
    let total = 0;
    for (let i = 0; i < photos.length; i++) {
      const { blob } = await shrinkImage(photos[i], side, quality);
      total += blob.size;
      files.push({ name: `page-${i + 1}.jpg`, type: 'image/jpeg', data: await toBase64(blob), size: blob.size, hash: null });
    }
    if (total <= budget) return { files, totalBytes: total };
  }
  return { error: "That's a lot of pages for one go. Try photographing just the key pages." };
}
