/**
 * PackAndFilm Format-Aware Document & KYC Pre-Processor (v3.4)
 *
 * Implements safe, format-specific client-side pre-processing:
 * 1. PDF: Passed through untouched as raw binary base64 (preserves vector clarity for CORs/agreements).
 * 2. PNG: Preserves lossless transparency and text; downscales large PNGs (>1MB) to max 1600px.
 * 3. JPEG/JPG: Calibrated scale to max 1600px with 0.82 quality (preserves small ID serial numbers and signatures).
 * 4. HEIC/HEIF: Three-tier support (native canvas decode on iOS/macOS -> safe binary upload fallback on Windows/Android -> Admin Drive view).
 * 5. Safety bounds: Max 5MB per file, Max 10MB total batch payload to protect Apps Script runtime memory.
 */

export interface ProcessedDocumentResult {
  success: boolean;
  base64: string;
  fileName: string;
  mimeType: string;
  originalSizeBytes: number;
  processedSizeBytes: number;
  wasCompressed: boolean;
  error?: string;
}

export const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_BATCH_BASE64_BYTES = 10 * 1024 * 1024; // 10 MB total payload

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf'
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf']);

/**
 * Validates file extension and MIME type.
 */
export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_SINGLE_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds the 5 MB limit. Please upload a smaller file.`
    };
  }

  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const mimeType = (file.type || '').toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.has(extension);
  const isAllowedMime = ALLOWED_MIME_TYPES.has(mimeType);

  // iOS sometimes supplies empty MIME or generic octet-stream for HEIC files
  const isHeicByExt = extension === 'heic' || extension === 'heif';

  if (!isAllowedExt && !isAllowedMime && !isHeicByExt) {
    return {
      isValid: false,
      error: 'Please upload a valid JPG, PNG, HEIC, or PDF document.'
    };
  }

  return { isValid: true };
}

/**
 * Reads a File into a raw base64 data URL string.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Calibrated image downscaler using HTMLCanvasElement.
 * Constrains maximum dimension to 1600px while maintaining strict aspect ratio.
 */
function compressImageCanvas(
  dataUrl: string,
  targetMime: 'image/jpeg' | 'image/png',
  quality: number,
  maxDimension = 1600
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // If 2d context unavailable, return uncompressed dataUrl
          return resolve(dataUrl);
        }

        // Clean white background for transparency fallback in JPEG
        if (targetMime === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL(targetMime, quality);
        resolve(compressedDataUrl);
      } catch (err) {
        // Fallback to original on any canvas processing error
        console.warn('Canvas compression error, falling back to original dataUrl:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      // Rejection allows caller to handle format-specific fallbacks (e.g. HEIC on Chrome)
      reject(new Error('Image decoding failed in browser engine.'));
    };
    img.src = dataUrl;
  });
}

/**
 * Process any submitted document according to format-specific rules.
 */
export async function processDocumentFile(file: File): Promise<ProcessedDocumentResult> {
  const validation = validateDocumentFile(file);
  if (!validation.isValid) {
    return {
      success: false,
      base64: '',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      originalSizeBytes: file.size,
      processedSizeBytes: 0,
      wasCompressed: false,
      error: validation.error
    };
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const mimeType = (file.type || '').toLowerCase();

  // 1. PDF: Raw binary pass-through untouched
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return {
      success: true,
      base64: originalDataUrl,
      fileName: file.name,
      mimeType: 'application/pdf',
      originalSizeBytes: file.size,
      processedSizeBytes: originalDataUrl.length,
      wasCompressed: false
    };
  }

  // 2. PNG: Preserve lossless unless oversized (> 1 MB)
  if (mimeType === 'image/png' || extension === 'png') {
    if (file.size <= 1024 * 1024) {
      return {
        success: true,
        base64: originalDataUrl,
        fileName: file.name,
        mimeType: 'image/png',
        originalSizeBytes: file.size,
        processedSizeBytes: originalDataUrl.length,
        wasCompressed: false
      };
    }
    try {
      const compressedPng = await compressImageCanvas(originalDataUrl, 'image/png', 0.9, 1600);
      return {
        success: true,
        base64: compressedPng,
        fileName: file.name,
        mimeType: 'image/png',
        originalSizeBytes: file.size,
        processedSizeBytes: compressedPng.length,
        wasCompressed: true
      };
    } catch {
      // Fallback to original PNG if canvas fails
      return {
        success: true,
        base64: originalDataUrl,
        fileName: file.name,
        mimeType: 'image/png',
        originalSizeBytes: file.size,
        processedSizeBytes: originalDataUrl.length,
        wasCompressed: false
      };
    }
  }

  // 3. HEIC/HEIF: Three-tier support
  if (mimeType === 'image/heic' || mimeType === 'image/heif' || extension === 'heic' || extension === 'heif') {
    try {
      // Tier 1: Attempt native browser canvas decode (iOS Safari / WebKit)
      const convertedJpeg = await compressImageCanvas(originalDataUrl, 'image/jpeg', 0.82, 1600);
      return {
        success: true,
        base64: convertedJpeg,
        fileName: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
        mimeType: 'image/jpeg',
        originalSizeBytes: file.size,
        processedSizeBytes: convertedJpeg.length,
        wasCompressed: true
      };
    } catch {
      // Tier 2: Browser cannot decode HEIC (e.g. Chrome on Windows) -> Pass through original binary
      console.info('Native HEIC canvas conversion unavailable in this browser; storing original binary in Drive.');
      return {
        success: true,
        base64: originalDataUrl,
        fileName: file.name,
        mimeType: 'image/heic',
        originalSizeBytes: file.size,
        processedSizeBytes: originalDataUrl.length,
        wasCompressed: false
      };
    }
  }

  // 4. JPEG/JPG: Empirical calibration (1600px max, 0.82 quality)
  try {
    const compressedJpeg = await compressImageCanvas(originalDataUrl, 'image/jpeg', 0.82, 1600);
    return {
      success: true,
      base64: compressedJpeg,
      fileName: file.name,
      mimeType: 'image/jpeg',
      originalSizeBytes: file.size,
      processedSizeBytes: compressedJpeg.length,
      wasCompressed: true
    };
  } catch (err) {
    console.warn('JPEG compression fallback to original:', err);
    return {
      success: true,
      base64: originalDataUrl,
      fileName: file.name,
      mimeType: 'image/jpeg',
      originalSizeBytes: file.size,
      processedSizeBytes: originalDataUrl.length,
      wasCompressed: false
    };
  }
}

/**
 * Validates cumulative payload size across all files before dispatching to Google Apps Script.
 */
export function validateBatchPayloadSize(payload: Record<string, any>): { isSafe: boolean; totalBytes: number; error?: string } {
  let totalBytes = 0;
  for (const key of Object.keys(payload)) {
    const val = payload[key];
    if (typeof val === 'string' && val.startsWith('data:')) {
      totalBytes += val.length;
    }
  }

  if (totalBytes > MAX_BATCH_BASE64_BYTES) {
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return {
      isSafe: false,
      totalBytes,
      error: `Total document batch size (${totalMb} MB) exceeds server safety limit. Please upload smaller files or PDFs.`
    };
  }

  return { isSafe: true, totalBytes };
}

