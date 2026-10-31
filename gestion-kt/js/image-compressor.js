/**
 * Compresión de imágenes en el navegador, antes de subirlas a Supabase.
 * - Redimensiona a un máximo de `maxSize` px por lado.
 * - Convierte a WebP y baja la calidad hasta pesar menos de `targetKB`.
 */
window.KT = window.KT || {};

KT.compressImage = async function (file, opts) {
  opts = Object.assign({ maxSize: 1200, quality: 0.85, minQuality: 0.5, targetKB: 200 }, opts || {});
  if (!file || !file.type.startsWith('image/')) throw new Error('El archivo no es una imagen');

  var bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    bmp = await new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('No se pudo leer la imagen')); };
      img.src = URL.createObjectURL(file);
    });
  }

  var w = bmp.width, h = bmp.height;
  var scale = Math.min(1, opts.maxSize / Math.max(w, h));
  var cw = Math.round(w * scale), ch = Math.round(h * scale);

  var canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, cw, ch);

  function toBlob(q) {
    return new Promise(function (res) { canvas.toBlob(res, 'image/webp', q); });
  }

  var q = opts.quality, blob = await toBlob(q);
  while (blob && blob.size > opts.targetKB * 1024 && q > opts.minQuality) {
    q = Math.max(opts.minQuality, q - 0.07);
    blob = await toBlob(q);
  }
  // Si aún pesa mucho, reduce dimensiones una vez más
  if (blob && blob.size > opts.targetKB * 1024 * 1.5) {
    canvas.width = Math.round(cw * 0.75); canvas.height = Math.round(ch * 0.75);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    blob = await toBlob(opts.minQuality);
  }
  if (!blob) throw new Error('No se pudo comprimir la imagen');
  return { blob: blob, width: canvas.width, height: canvas.height, originalSize: file.size, size: blob.size };
};
