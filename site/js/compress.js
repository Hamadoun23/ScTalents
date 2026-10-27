// Compression des images dans le navigateur avant l'envoi :
// WebP qualité 0.8, 1600 px max + miniature 480 px. Repli JPEG si WebP n'est pas disponible.

// Le navigateur sait-il produire du WebP ?
const webpOk = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
export const FORMAT = webpOk ? { mime: 'image/webp', ext: 'webp' } : { mime: 'image/jpeg', ext: 'jpg' };

// source : ImageBitmap ou <video> (qui expose videoWidth / videoHeight)
async function redimensionner(source, max) {
  const w = source.videoWidth || source.width;
  const h = source.videoHeight || source.height;
  const r = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * r);
  canvas.height = Math.round(h * r);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Compression impossible'))), FORMAT.mime, 0.8));
}

// File image → { full, thumb, mime, ext }
export async function compresserImage(file) {
  // imageOrientation : respecte la rotation des photos de téléphone
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const full = await redimensionner(bitmap, 1600);
    const thumb = await redimensionner(bitmap, 480);
    // Photo déjà petite et compressée (ex. WhatsApp) : si la recompression l'alourdit, on garde l'original
    const dejaLegere = /^image\/(jpeg|webp)$/.test(file.type) && Math.max(bitmap.width, bitmap.height) <= 1600;
    if (dejaLegere && full.size >= file.size) {
      return { full: file, thumb, mime: file.type, ext: file.type === 'image/webp' ? 'webp' : 'jpg' };
    }
    return { full, thumb, mime: FORMAT.mime, ext: FORMAT.ext };
  } finally {
    bitmap.close();
  }
}

// Fichier vidéo MP4 → miniature (image prise à ~1 s), ou null si le navigateur n'y arrive pas
export function miniatureVideo(file) {
  return new Promise((ok) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const fin = (blob) => { URL.revokeObjectURL(url); ok(blob); };
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.src = url;
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
    v.onseeked = async () => {
      try { fin(await redimensionner(v, 480)); } catch { fin(null); }
    };
    v.onerror = () => fin(null);
    setTimeout(() => fin(null), 15000);
  });
}

export function taille(octets) {
  return octets > 1048576 ? `${(octets / 1048576).toFixed(1)} Mo` : `${Math.round(octets / 1024)} Ko`;
}
