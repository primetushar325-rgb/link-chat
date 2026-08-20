# LINK — Realtime Chat & Social Messaging — Build Plan

**Stack:** React Native + Expo (managed, TypeScript, Expo Router) | Node.js / Express REST API + standalone WebSocket server | Next.js Admin Panel | File-backed DB adapter (swappable to SQL) | Backblaze B2 via @aws-sdk/client-s3 | Expo SecureStore + JWT + bcrypt | Google OAuth | WebRTC | Expo Notifications

---

## Phase 0 — Scaffold & Tooling (Day 0)
- Monorepo layout:
  ```
  /                      ← Expo mobile app (EAS root)
  ├─ app/                ← Expo Router
  ├─ components/ assets/ lib/ stores/ hooks/
  ├─ backend/            ← Express REST + WS (service-layer, zod, rate-limit, CSRF)
  ├─ admin/              ← Next.js 14 Admin Dashboard
  ├─ .github/workflows/eas-build.yml
  ├─ app.json / eas.json / package.json
  └─ .env.example / README / INSTALLATION
  ```
- `app.json` referencing `assets/images/icon.png`, `adaptive-icon.png`, `splash-icon.png`
- `eas.json` with `preview` profile (`distribution: internal`, `android.buildType: apk`)
- `.env.example` with every var + comments
- Typed API client (`lib/api.ts`) with envelope `{ success, data, error, meta }`
- File DB adapter interface (`backend/src/db/adapter.ts` → `FileStore` → swap to Prisma/SQL)
- S3 adapter (`backend/src/lib/s3.ts`) for B2 with `B2_*` envs only

## Phase 1 — Auth (Email/Password + Google OAuth) — NO phone/SMS
- Backend: `POST /api/auth/register`, `/login`, `/google` (verify id_token with Google), JWT access(15m)+refresh(7d), bcrypt, `jti` rotation, SecureStore on mobile
- `zod` validation, rate-limit (login 5/min IP), CSRF double-submit for mutating routes
- Mobile: `app/(auth)/login.tsx` + `register.tsx`, `expo-auth-session` for Google, `expo-secure-store`, Zustand `authStore` + React Query
- Middleware `authenticate` verifies JWT; WebSocket ticket `POST /api/ws/ticket` returns 60s JWT

## Phase 2 — Realtime 1:1 & Group Chat
- Data: `conversations`, `participants`, `messages` (replyToId, editedAt, deletedAt soft-delete), `reactions`, `readReceipts`
- REST: `GET/POST /api/conversations`, `GET/POST /api/conversations/:id/messages` (cursor pagination), `PATCH /messages/:id` (edit), `DELETE`, `POST /reactions`
- WS events: `message:new`, `message:edit`, `message:delete`, `typing:start/stop`, `receipt:delivered/seen`, `reaction:add/remove`, `conversation:created`
- Mobile: `app/(tabs)/chats.tsx`, `app/chat/[id].tsx` with FlashList, typing indicator, ticks ✓✓, emoji reactions, reply/edit/delete swipe
- Offline-optimistic updates via Zustand + React Query

## Phase 3 — Media Upload (Backblaze B2)
- `expo-image-picker` + `expo-av` (voice), presigned flow: `POST /api/media/presign` → client PUT to B2 → `POST /api/media/confirm`
- S3 client configured ONLY for B2 (`endpoint: B2_ENDPOINT`, `region: us-east-005`, `forcePathStyle:false`)
- `imageUrl` uses `B2_PUBLIC_URL`; video/voice streaming; validation mime/size, rate-limit 20/h

## Phase 4 — Stories (24h expiry + view tracking)
- `POST /api/stories` (photo/video/text), `GET /api/stories/feed` (friends only, not expired), `POST /api/stories/:id/view`
- Cron `purgeExpiredStories()` every hour; mobile `app/(tabs)/stories.tsx` + `app/story/[id].tsx` with progress bar
- View tracking: `{ storyId, viewerId, viewedAt }` deduped

## Phase 5 — Friend/Follow + Push + Calls
- Friend requests: `POST /api/friends/request/:userId`, `accept/decline`, `GET /friends`, `GET /requests`
- Push: `expo-notifications` token saved `POST /api/push/token`, sent via Expo Push API on new message/call
- WebRTC: `react-native-webrtc`, WS signaling `call:offer/answer/ice/candidate`, `app/call/[id].tsx`

## Phase 6 — Admin Panel (separate Next.js `admin/`)
- Auth: admin-only JWT (`role: admin`), login page
- Pages: Dashboard, User Management (suspend/ban), Reports Queue, **App Badge** (`imageUrl, linkUrl, enabled`), Conversation Review (audit-logged)
- Every `GET /api/admin/conversations/:id` logs `{ adminId, conversationId, timestamp, reason }` to `auditLogs`
- Badge API: `GET /api/settings/badge` (public, app fetches on launch), `PUT /api/admin/settings/badge` (admin, uploads via B2)

## Phase 7 — Polish & Ship
- EAS Build: `eas build --platform android --profile preview` → free APK; GitHub Action triggers on `push: main`
- Security: Helmet, CORS, zod, rate-limit, CSRF, audit logs
- Docs: README + INSTALLATION (GitHub push, EAS login, B2 bucket, Google OAuth, APK trigger)

### Order of implementation
1. Scaffold (app.json, eas.json, adapters, envelope, validators)
2. Auth → 3. Chat + WS → 4. Media B2 → 5. Stories → 6. Friends/Push/Call → 7. Admin + Badge + Audit
