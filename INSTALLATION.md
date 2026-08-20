# INSTALLATION — LINK

## 1) Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial LINK scaffold"
gh repo create link-chat --public --source=. --remote=origin --push
# or manually:
git remote add origin https://github.com/YOUR_USERNAME/link-chat.git
git branch -M main
git push -u origin main
```

## 2) Connect to EAS
```bash
npm install -g eas-cli
npx eas login
npx eas build:configure
# verify:
npx eas project:info
```

## 3) Cloudinary Setup (replaces B2)
1. https://cloudinary.com/ → Sign up (free) → **Dashboard**
2. Go to **Settings → API Keys** (https://console.cloudinary.com/settings/api-keys)
   - Copy **Cloud name** → `CLOUDINARY_CLOUD_NAME` (already: `xku0l7uc`)
   - Copy **API Key** → `CLOUDINARY_API_KEY` (already: `725198571393975`)
   - Click **View API Secret** → `CLOUDINARY_API_SECRET` (already: `zDIczZZd_ySyVSXVQPvtQcLao7w`)
3. Set env (already prefilled in `.env.example` / `.env.local` / `backend/.env` for immediate dev):
   ```
   CLOUDINARY_CLOUD_NAME=xku0l7uc
   CLOUDINARY_API_KEY=725198571393975
   CLOUDINARY_API_SECRET=zDIczZZd_ySyVSXVQPvtQcLao7w
   ```
4. Uploads go to folder `link/media` with `resource_type: auto` (image/video/audio). Thumbnails are auto-generated via `eager: [{w:320,h:320,c:fill,q_auto,f_auto}]` + `f_auto/q_auto` optimization — no extra config needed.
5. (Optional) Enable **Auto optimization** in Cloudinary Settings → Transformations → set default to `f_auto,q_auto` for even faster delivery.

## 4) Google OAuth Setup
1. https://console.cloud.google.com/ → New Project `LINK` → Enable **Google Identity** API
2. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `LINK Expo`
   - Authorized redirect URIs:
     ```
     https://auth.expo.io/@your-expo-username/link-chat
     http://localhost:19006
     https://api.link.example.com/api/auth/google/callback
     ```
3. Copy **Client ID** → `GOOGLE_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, **Client Secret** → `GOOGLE_CLIENT_SECRET`
4. Backend verifies `id_token` via `https://oauth2.googleapis.com/tokeninfo?id_token=...`.

## 5) Trigger Free APK Build
```bash
eas build --platform android --profile preview
# Or push to main triggers .github/workflows/eas-build.yml
git push origin main
# Add repo secret EAS_TOKEN (expo.dev → Access Tokens) to GitHub → Settings → Secrets
```

## Local Dev Checklist
- [ ] `backend/data/db.json` auto-created on first run
- [ ] `assets/images/icon.png` replaced with branding
- [ ] Test media: pick image → `POST /api/media/upload` with JSON `{dataUri}` → Cloudinary `secure_url` → message shows thumbnail
- [ ] Test badge: Admin → Badge → upload → Cloudinary URL saved → app fetches `GET /api/settings/badge`
- [ ] Verify no B2 vars remain: `grep -r B2_ .` should be empty

## Troubleshooting
- **Cloudinary 401**: Check cloud_name/key/secret match Dashboard, no extra spaces.
- **Upload 413**: File >50MB — reduce or increase multer limit in `backend/src/routes/media.ts`.
- **Google 400 redirect_uri_mismatch**: Add exact Expo proxy URI to Cloud Console.
- **WS 401**: Ticket expired (60s) — request new `POST /api/ws/ticket`.
