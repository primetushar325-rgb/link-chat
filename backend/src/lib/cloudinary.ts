import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinaryInstance = cloudinary;

// Signed server-side upload — handles image/video/audio (resource_type: auto)
// Returns secure_url + public_id + thumbnail url via eager/auto optimization
export async function uploadToCloudinary(
  file: string, // base64 data URI or remote URL or local path; for buffer use uploadBuffer
  opts: { folder?: string; resource_type?: 'auto' | 'image' | 'video' | 'raw' } = {}
) {
  const result = await cloudinary.uploader.upload(file, {
    folder: opts.folder || 'link/media',
    resource_type: opts.resource_type || 'auto',
    // Automatic optimization + eager thumbnail for chat previews & stories
    quality: 'auto',
    fetch_format: 'auto',
    eager: [
      { width: 320, height: 320, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
      { width: 640, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
    eager_async: false,
  });
  const thumb = result.eager?.[0]?.secure_url || thumbnailUrl(result.public_id, result.resource_type as any);
  return {
    secure_url: result.secure_url as string,
    public_id: result.public_id as string,
    resource_type: result.resource_type as string,
    thumbnailUrl: thumb as string,
    bytes: result.bytes,
    format: result.format,
  };
}

export async function uploadBuffer(
  buffer: Buffer,
  opts: { folder?: string; filename?: string; mimetype?: string } = {}
) {
  const b64 = `data:${opts.mimetype || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
  return uploadToCloudinary(b64, { folder: opts.folder || 'link/media', resource_type: 'auto' });
}

// Helper to build optimized/thumbnail URLs on the fly without re-upload
export function optimizedUrl(public_id: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
  // f_auto,q_auto for automatic format/quality
  return cloudinary.url(public_id, {
    resource_type: resourceType as any,
    secure: true,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
}

export function thumbnailUrl(public_id: string, resourceType: 'image' | 'video' = 'image') {
  return cloudinary.url(public_id, {
    resource_type: resourceType as any,
    secure: true,
    transformation: [{ width: 320, height: 320, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
  });
}

// For signed client uploads if needed (returns signature)
export function signUploadParams(params: Record<string, any>) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({ ...params, timestamp }, process.env.CLOUDINARY_API_SECRET!);
  return { timestamp, signature, api_key: process.env.CLOUDINARY_API_KEY, cloud_name: process.env.CLOUDINARY_CLOUD_NAME };
}
