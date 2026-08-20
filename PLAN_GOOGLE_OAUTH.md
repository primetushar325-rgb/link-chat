# Google OAuth Login Plan — Expo (expo-auth-session + expo-web-browser) + JWT

**Credentials provided:**
- GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID_PLACEHOLDER
- GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET_PLACEHOLDER
- Target: unified JWT session (same as email/password), no phone OTP

### 1. Env Setup
- **`.env.local`** (dev, gitignored): add both vars WITH values for immediate use
  ```
  GOOGLE_CLIENT_ID=6150...
  GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET
  EXPO_PUBLIC_GOOGLE_CLIENT_ID=6150...  # exposed to Expo (public)
  ```
  Also `backend/.env` needs same `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for server verification
- **`.env.example`** (committed): add var NAMES without values + comments where to get them (Google Cloud Console > Credentials)
  ```
  GOOGLE_CLIENT_ID= # Google Cloud Console > ... > Client ID
  GOOGLE_CLIENT_SECRET=
  EXPO_PUBLIC_GOOGLE_CLIENT_ID= # same as GOOGLE_CLIENT_ID
  ```
- Keep `CLOUDINARY_*`, `JWT_*` untouched

### 2. Mobile App — expo-auth-session Google Provider
**Files:** `app/(auth)/login.tsx`, `app/_layout.tsx`, `lib/constants.ts`, `package.json`, `app.json`

- Ensure deps: `expo-auth-session` (already), `expo-web-browser` (add), `expo-secure-store` (already)
- Add `expo-web-browser` to `package.json` if missing + `npx expo install`
- `app.json`: confirm `scheme: "link"`, `slug: "link-chat"` (already set)
- Implementation pattern (recommended, works in Expo Go + EAS):
  ```ts
  import * as WebBrowser from 'expo-web-browser';
  import * as Google from 'expo-auth-session/providers/google';
  WebBrowser.maybeCompleteAuthSession();
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    // For Expo Go proxy
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    responseType: 'id_token', // get id_token directly
    scopes: ['openid','profile','email']
  });
  // On response: if (response?.type==='success') { id_token = response.params.id_token }
  // Fallback: useIdTokenAuthRequest for newer SDK
  ```
- Alternative robust flow used now: `useIdTokenAuthRequest` (gets id_token without access_token exchange)
- On success → `POST /api/auth/google { idToken }` via `api` client → receive `{ user, accessToken, refreshToken }` → `saveAuth()` → `authStore`
- Error handling: show Alert if `response.type !== success` or backend fails
- Warm up WebBrowser with `WebBrowser.warmUpAsync()` on Android

### 3. Backend — Verify id_token + Find-or-Create + Issue App JWT
**Files:** `backend/src/routes/auth.ts`, `backend/.env`

- Existing `POST /api/auth/google` already:
  1. Validates `{ idToken }` via zod
  2. Fetches `https://oauth2.googleapis.com/tokeninfo?id_token=...`
  3. Checks `aud === GOOGLE_CLIENT_ID`, `email_verified`, expiry
  4. Find user by email, else create `{ id: uuid, name, email, avatarUrl: picture, role: user, status: active, passwordHash: '' }`
  5. Issue `signAccess({id,email,role})` + `signRefresh({id})` — **identical** to `/login` & `/register`
- Improvements to apply:
  - Add `aud` check explicitly (prevent token for other client)
  - Add fallback verify via `https://www.googleapis.com/oauth2/v3/tokeninfo` if needed
  - Log `picture` → `avatarUrl`
  - Handle `status !== active` (suspended/banned) → 403
  - Ensure same envelope `{ success, data: { user, accessToken, refreshToken } }`
- No new DB fields needed; `FileStore` handles it

### 4. Redirect URI to Add in Google Cloud Console
- **Expo Go (dev):** `https://auth.expo.io/@<your-expo-username>/link-chat`
  - Find username: `npx eas whoami` or `expo.dev` profile URL
  - Currently app.json slug = `link-chat`, scheme = `link`
  - If username unknown, placeholder: `https://auth.expo.io/@anonymous/link-chat` — replace `anonymous` with real username
- **Local web (optional):** `http://localhost:19006` (Expo web)
- **Backend callback (if using code flow later):** `http://localhost:4000/api/auth/google/callback` (not needed for id_token flow)
- **Native (EAS Build, no proxy):** `link://` (scheme from app.json) — auto-handled by `makeRedirectUri({ useProxy: false, native: "link://" })`
- Show exact strings to copy-paste, and warn to enable "Google Identity Services" API

### 5. Login Screen UI — "Continue with Google"
**File:** `app/(auth)/login.tsx`

- Keep existing email/password form (inputs + Login button)
- Add divider `— or —` then `<Pressable>` with Google colors, disabled until `request` ready
- Call `promptAsync({ useProxy: true, showInRecents: true })` on press
- Use `useEffect` to watch `response` → handle `response.type === 'success'` → extract `id_token` → call `loginGoogle(id_token)` from `stores/authStore`
- Loading state: spinner on button
- Also add to `app/(auth)/register.tsx` optional secondary button (not required, but consistent)
- Ensure `useAuthStore.loginGoogle` already exists (it does) → saves tokens via SecureStore, sets user, navigates to `/(tabs)/chats`

### 6. Verification Steps
- `npx expo start` → Login screen shows "Continue with Google"
- Tap → system browser opens → select Gmail → redirects back via `auth.expo.io`
- Backend logs `POST /api/auth/google` 200 + returns app JWT
- Subsequent `GET /api/me` with `Authorization: Bearer <accessToken>` succeeds regardless of login method
- Same JWT format verified by `authenticate` middleware for chat/media/stories

### Execution Order
1. Update `.env.example` + `.env.local` + `backend/.env`
2. Ensure `expo-web-browser` installed + `app.json` scheme
3. Patch `app/(auth)/login.tsx` to use `expo-auth-session/providers/google` + `useIdTokenAuthRequest`
4. Harden `backend/src/routes/auth.ts` verification (`aud` check)
5. Update docs: `README.md`/`INSTALLATION.md` Google section lists exact redirect URIs
6. Smoke test (no rebuild needed for env, but EAS build needs scheme)

