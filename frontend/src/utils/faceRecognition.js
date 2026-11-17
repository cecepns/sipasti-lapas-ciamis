/**
 * SIPASTI Face ID & Selfie Biometric Engine
 * Works 100% offline/locally in modern browsers without external CDN model failures.
 * Combines native FaceDetector API (when available) with YCbCr skin-region + luminance
 * geometry analysis and a 128-dim L2-normalized facial ROI descriptor (intensity + gradient).
 */

function isSkinPixel(r, g, b) {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cr >= 133 && cr <= 177 && cb >= 77 && cb <= 127 && r > 60 && g > 35 && b > 20;
}

export async function analyzeVideoFrame(videoEl) {
  if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth || !videoEl.videoHeight) {
    return { faceDetected: false, confidence: 0, message: 'Menunggu kamera siap...' };
  }

  // 1. Try native Chrome/Edge FaceDetector API if supported
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(videoEl);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        const relWidth = box.width / videoEl.videoWidth;
        if (relWidth < 0.16) {
          return { faceDetected: false, confidence: 40, message: 'Dekatkan wajah ke bingkai Face ID' };
        }
        return {
          faceDetected: true,
          confidence: 96,
          box,
          message: 'Wajah terdeteksi & sejajar — siap verifikasi',
        };
      }
      return { faceDetected: false, confidence: 10, message: 'Posisikan wajah di dalam bingkai oval' };
    } catch {
      // Fallback seamlessly to pixel geometry analyzer below
    }
  }

  // 2. Fallback robust center-oval YCbCr skin & contrast analyzer
  const sampleW = 160;
  const sampleH = 120;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoEl, 0, 0, sampleW, sampleH);

  // Inspect center oval (face guide region)
  const cx = sampleW / 2;
  const cy = sampleH * 0.48;
  const rx = sampleW * 0.24;
  const ry = sampleH * 0.34;
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

  let ovalPixels = 0;
  let skinPixels = 0;
  let lumSum = 0;
  let lumSqSum = 0;

  for (let y = 0; y < sampleH; y += 2) {
    for (let x = 0; x < sampleW; x += 2) {
      const norm = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
      if (norm <= 1) {
        const idx = (y * sampleW + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        ovalPixels += 1;
        lumSum += lum;
        lumSqSum += lum * lum;
        if (isSkinPixel(r, g, b)) skinPixels += 1;
      }
    }
  }

  if (ovalPixels === 0) {
    return { faceDetected: false, confidence: 0, message: 'Kamera tidak aktif' };
  }

  const meanLum = lumSum / ovalPixels;
  const variance = lumSqSum / ovalPixels - meanLum * meanLum;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const skinRatio = skinPixels / ovalPixels;

  if (meanLum < 32) {
    return { faceDetected: false, confidence: 15, message: 'Pencahayaan terlalu gelap, arahkan ke cahaya' };
  }
  if (stdDev < 12) {
    return { faceDetected: false, confidence: 20, message: 'Wajah belum terdeteksi di dalam bingkai' };
  }
  if (skinRatio >= 0.18 && stdDev >= 14) {
    const conf = Math.min(98, Math.round(70 + skinRatio * 45));
    return {
      faceDetected: true,
      confidence: conf,
      message: 'Wajah terdeteksi & sejajar — siap ambil Face ID',
    };
  }

  return {
    faceDetected: false,
    confidence: Math.round(skinRatio * 100),
    message: 'Posisikan wajah tepat di dalam bingkai oval',
  };
}

/**
 * Extracts a 128-dimensional L2-normalized facial ROI descriptor from the center face box.
 * 64 dims = normalized 8x8 luminance grid; 64 dims = 8x8 local Sobel edge magnitude grid.
 */
export function extractFaceDescriptor(canvasEl) {
  const srcW = canvasEl.width;
  const srcH = canvasEl.height;

  // Crop center facial ROI
  const cropW = Math.round(srcW * 0.48);
  const cropH = Math.round(srcH * 0.62);
  const cropX = Math.round((srcW - cropW) / 2);
  const cropY = Math.round((srcH - cropH) / 2);

  const size = 16; // 16x16 working grid -> pooled into 8x8 intensity + 8x8 gradient
  const work = document.createElement('canvas');
  work.width = size;
  work.height = size;
  const ctx = work.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvasEl, cropX, cropY, cropW, cropH, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const gray = new Float32Array(size * size);
  let mean = 0;

  for (let i = 0; i < size * size; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = g;
    mean += g;
  }
  mean /= size * size;

  let std = 0;
  for (let i = 0; i < gray.length; i++) {
    std += (gray[i] - mean) ** 2;
  }
  std = Math.sqrt(std / gray.length) || 1;
  for (let i = 0; i < gray.length; i++) {
    gray[i] = (gray[i] - mean) / std;
  }

  const descriptor = [];

  // 8x8 pooled intensity features (64 dims)
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      const sum =
        gray[(by * 2) * size + bx * 2] +
        gray[(by * 2) * size + bx * 2 + 1] +
        gray[(by * 2 + 1) * size + bx * 2] +
        gray[(by * 2 + 1) * size + bx * 2 + 1];
      descriptor.push(sum / 4);
    }
  }

  // 8x8 gradient magnitude features (64 dims)
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      const y = Math.min(size - 2, Math.max(1, by * 2));
      const x = Math.min(size - 2, Math.max(1, bx * 2));
      const gx = gray[y * size + (x + 1)] - gray[y * size + (x - 1)];
      const gy = gray[(y + 1) * size + x] - gray[(y - 1) * size + x];
      descriptor.push(Math.sqrt(gx * gx + gy * gy));
    }
  }

  // L2 normalize
  const norm = Math.sqrt(descriptor.reduce((acc, v) => acc + v * v, 0)) || 1;
  return descriptor.map((v) => Number((v / norm).toFixed(5)));
}

/**
 * Compares two 128-dim L2-normalized descriptors using cosine similarity mapped to 0..100%.
 */
export function compareFaceDescriptors(descA, descB) {
  if (!Array.isArray(descA) || !Array.isArray(descB) || descA.length !== descB.length || descA.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < descA.length; i++) {
    dot += descA[i] * descB[i];
    normA += descA[i] * descA[i];
    normB += descB[i] * descB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!denom) return 0;
  const cosine = dot / denom; // -1..1 (for similar faces typically 0.55..0.99)
  const score = Math.max(0, Math.min(100, ((cosine + 1) / 2) * 100));
  return Number(score.toFixed(2));
}

export function captureVideoToCanvas(videoEl, targetWidth = 640) {
  const ratio = videoEl.videoHeight / (videoEl.videoWidth || 1);
  const width = targetWidth;
  const height = Math.round(targetWidth * ratio) || 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // Mirror selfie horizontally for natural orientation
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, width, height);
  return canvas;
}

export function canvasToFile(canvasEl, filename = 'face-selfie.jpg') {
  return new Promise((resolve, reject) => {
    canvasEl.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Gagal mengambil gambar dari kamera'));
        const file = new File([blob], filename, { type: 'image/jpeg' });
        return resolve({ file, dataUrl: canvasEl.toDataURL('image/jpeg', 0.88) });
      },
      'image/jpeg',
      0.88
    );
  });
}
