# LINK — Realtime Chat & Social Messaging

Production-ready **React Native + Expo** mobile app + **Node.js REST API** + **Standalone WebSocket** + **Next.js Admin Panel**.

> Auth: Email/Password (JWT + SecureStore + bcrypt) & Google OAuth **only** — no phone/SMS OTP.

## Features
- **Auth**: Email+password (bcrypt, JWT access 15m / refresh 7d) + Google OAuth (Gmail) via `expo-auth-session` & backend verification
- **Chat**: 1:1 & group, WebSocket realtime, typing indicators, delivered/seen ticks, reactions, reply/edit/delete
- **Media**: `expo-image-picker` / `expo-av` → **Cloudinary** via signed server-side uploads (`cloudinary` SDK, `secure_url` + `public_id`)
- **Stories**: 24h expiring photo/video/text + view tracking + hourly purge + Cloudinary thumbnails
- **Social**: Friend/follow requests, push via `expo-notifications`
- **Calls**: WebRTC (`react-native-webrtc`) with WS signaling
- **Admin Panel** (`/admin` Next.js): user suspend/ban, reports, **appBadge** (imageUrl/linkUrl/enabled) editor, audit-logged conversation review
- **App Badge**: Chat header badge fetched at runtime `GET /api/settings/badge` — admin can change without rebuild (Cloudinary URL)

## Architecture

```
/ (Expo app root — EAS builds from here)
├── app/                Expo Router (tabs, auth, chat, story, call)
├── components/ lib/ stores/ hooks/
├── backend/            Express REST + WS (service-layer, zod, rate-limit, CSRF)
│   └── src/db/         FileStore adapter (swap to Prisma/SQL via interface)
│   └── src/lib/cloudinary.ts  Cloudinary adapter (signed uploads, eager thumbnails)
├── admin/              Next.js 14 Admin Dashboard (separate)
└── .github/workflows/eas-build.yml
```

- **DB adapter**: `backend/src/db/adapter.ts` interface → `FileStore` (JSON) → swap to SQL
- **Storage**: `backend/src/lib/cloudinary.ts` — signed uploads, stores `secure_url`+`public_id`, `eager` thumbnails (320x320), `f_auto/q_auto` optimization
- **API envelope**: `{ success: boolean, data?, error?, meta? }` + `zod` + rate-limit + CSRF
- **WS tickets**: `POST /api/ws/ticket` returns 60s JWT, WS server verifies before upgrade

## Quick Start

See **INSTALLATION.md** for full step-by-step (GitHub push, EAS, Cloudinary, Google OAuth, APK).

```bash
npm install
cd backend && npm install && cd ..
cd admin && npm install && cd ..

cp .env.example .env
cp .env.example backend/.env
cp .env.example admin/.env.local
# fill CLOUDINARY_*, GOOGLE_*, JWT_SECRET (Cloudinary values already prefilled for dev)

npm run start              # Expo
npm run dev --prefix backend  # API :4000 + WS :4001
npm run dev --prefix admin    # Admin :3000
```

Media upload: `POST /api/media/upload` (multipart `file` or JSON `dataUri`) → Cloudinary → returns `{ secure_url, public_id, thumbnailUrl }` + creates message if `conversationId` provided.

## Cloudinary
- Signed server-side uploads (`folder: link/media`, `resource_type: auto`)
- Automatic `f_auto,q_auto` optimization + eager 320x320 & 640w thumbnails for chat previews/stories
- Badge image also stored on Cloudinary

## EAS Free APK
```bash
npx eas login
npx eas build:configure
eas build --platform android --profile preview
# Or push to main → GitHub Action triggers EAS build
```

## License MIT
