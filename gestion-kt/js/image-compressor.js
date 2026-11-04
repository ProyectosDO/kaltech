/**
 * Compresión de imágenes en el navegador, ANTES de subirlas a Supabase (plan gratuito: poco espacio).
 * - Redimensiona a un máximo de `maxSize` px por lado (la tienda muestra tarjetas pequeñas).
 * - Convierte a WebP (o JPEG si el navegador no soporta WebP) y baja la calidad primero,
 *   y las dimensiones después, hasta pesar menos de `targetKB`.
 * Una foto de celular de 4–8 MB termina en ~40–80 KB.
 */
window.KT = window.KT || {};

KT.compressImage = async function (file, opts) {
  opts = Object.assign({ maxSize: 900, quality: 0.8, minQuality: 0.4, targetKB: 80, minSize: 360 }, opts || {});
  if (!file || (file.type && !file.type.startsWith('image/'))) throw new Error('El archivo no es una imagen');

  var bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    bmp = await new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('No se pudo leer la imagen. Si es HEIC, tómala de nuevo o elige un JPG.')); };
      img.src = URL.createObjectURL(file);
    });
  }
  var w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var mime = 'image/webp';

  function draw(side) {
    var scale = Math.min(1, side / Math.max(w, h));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    ctx.fillStyle = '#ffffff';              // evita fondo negro si la imagen tiene transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  }
  function toBlob(q) {
    return new Promise(function (res) { canvas.toBlob(res, mime, q); });
  }

  var side = opts.maxSize, q = opts.quality;
  draw(side);
  var blob = await toBlob(q);
  // Navegadores sin WebP devuelven PNG (muy pesado): se usa JPEG
  if (blob && blob.type !== 'image/webp') { mime = 'image/jpeg'; blob = await toBlob(q); }

  var target = opts.targetKB * 1024, guard = 0;
  while (blob && blob.size > target && guard++ < 12) {
    if (q > opts.minQuality + 0.001) {
      q = Math.max(opts.minQuality, q - 0.1);
    } else if (side > opts.minSize) {
      side = Math.max(opts.minSize, Math.round(side * 0.85));
      draw(side);
    } else break;
    blob = await toBlob(q);
  }
  if (!blob) throw new Error('No se pudo comprimir la imagen');
  return { blob: blob, type: blob.type, width: canvas.width, height: canvas.height, originalSize: file.size, size: blob.size };
};
