# Cloudinary Migration Plan — Replace Backblaze B2

**Goal:** Remove ALL B2/S3 code and switch to Cloudinary signed uploads with `secure_url` + `public_id` storage.

### 1. Remove B2 Adapter & Deps
- Delete `backend/src/lib/s3.ts` (S3Client, presignedPutUrl, B2_* envs)
- Remove from `backend/package.json`: `@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner`
- Remove from `backend/src/index.ts` / any import of `s3.ts`
- Grep & delete all `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_PUBLIC_URL`, `B2_REGION` refs
- Update `backend/.env.example` section

### 2. Install Cloudinary SDK
- `backend/package.json` add `cloudinary: ^2.5.1`
- `npm install` in backend (tsx watch unaffected)

### 3. New Storage Adapter `backend/src/lib/cloudinary.ts`
- `import { v2 as cloudinary } from 'cloudinary'`
- `cloudinary.config({ cloud_name, api_key, api_secret })` from env
- Export:
  ```ts
  export function signUploadParams(params) // for signed client uploads if needed
  export async function uploadBuffer(buffer, opts) // server-side signed upload
  export async function uploadFromUrl(url) // alternative
  export function thumbnailUrl(public_id, type) // eager transform helper
  export function optimizedUrl(public_id, resourceType)
  ```
- Signed server-side: backend receives multipart/file or base64, uploads via `cloudinary.uploader.upload`, returns `{ secure_url, public_id, thumbnailUrl }`
- No client-side unsigned preset; all signing server-side

### 4. DB Schema Update — store `secure_url` + `public_id`
- Messages: replace `mediaUrl` (B2 URL) + `key` → `{ mediaUrl: secure_url, public_id, thumbnailUrl?, resourceType }`
- Stories: same — `mediaUrl` now = secure_url, add `public_id`
- `backend/src/db/fileStore.ts` already stores generic objects — no migration needed, new fields used going forward
- Update Zod schemas / types in `backend/src/lib/validators.ts` and `lib/types.ts`

### 5. Routes Update
- `backend/src/routes/media.ts`:
  - REMOVE `POST /presign` (B2 presigned PUT)
  - ADD `POST /upload` (multipart via `multer` or base64 JSON) → `cloudinary.uploader.upload` with `folder: link/media`, `resource_type: auto` (image/video/audio), `eager: [{w:320,h:320,c:"fill", q:"auto", f:"auto"}]` for thumbnails
  - `POST /confirm` now expects `{ conversationId, secure_url, public_id, resourceType }` or direct `POST /upload` creates message
  - Return `{ secure_url, public_id, thumbnailUrl }`
- Update `backend/src/routes/stories.ts` & `conversations.ts` media handling similarly
- Mobile: `app/chat/[id].tsx` — replace presigned PUT flow with `POST /api/media/upload` (FormData) + `expo-image-picker` / `expo-av`

### 6. Env Vars
- `.env.example` REMOVE all `B2_*` lines, ADD:
  ```
  CLOUDINARY_CLOUD_NAME=xku0l7uc
  CLOUDINARY_API_KEY=725198571393975
  CLOUDINARY_API_SECRET=zDIczZZd_ySyVSXVQPvtQcLao7w
  # Get from: https://console.cloudinary.com/settings/api-keys
  ```
- Create/update `.env.local` (and `backend/.env`) with same values for immediate dev
- Update `lib/constants.ts` if B2_PUBLIC_URL referenced

### 7. Docs
- `README.md`: replace B2 setup section with Cloudinary setup (create account, get cloud_name/api_key/secret, automatic optimization)
- `INSTALLATION.md`: Step 3 "Backblaze B2 Setup" → "Cloudinary Setup" with console link, dashboard path, eager transforms note
- Add note on thumbnail generation: `eager` + `f_auto,q_auto,w_320` etc.

### 8. Verification
- `grep -r B2_ backend lib --exclude-dir=node_modules` = 0 hits
- `grep -r @aws-sdk backend` = 0 hits
- `npm run dev` backend starts, `POST /api/media/upload` returns secure_url, app displays image via secure_url + thumbnailUrl
- Admin badge upload also uses Cloudinary (`admin/app/admin/badge/page.tsx`)

### Execution Order
1. Update `backend/package.json`
2. Create `backend/src/lib/cloudinary.ts`, delete `s3.ts`
3. Patch `media.ts`, `validators.ts`, `types.ts`, `fileStore` comments
4. Patch mobile `app/chat/[id].tsx` + `admin/badge` page
5. Update `.env.example` + `.env.local` / `backend/.env`
6. Update `README.md` / `INSTALLATION.md`
