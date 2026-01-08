# Notion OAuth Integration Setup Guide

## 🎯 Overview

This guide shows you how to set up **Notion OAuth** for The Bean Keeper, allowing users to:
- Click "Connect with Notion" button
- Authorize with their Notion account
- Automatically get a pre-configured coffee tracking database in their workspace
- Export all their coffee data with one click

## ✨ User Experience

### For Your Users:
1. Click "Connect with Notion"
2. Log in to Notion (if not already)
3. Grant permissions
4. Database automatically created in their workspace
5. Click "Export to Notion" to sync all coffee entries

**No API keys, no manual setup required!**

---

## 🎯 Notion-Native Architecture (Recommended)

This is the **recommended architecture** for The Bean Keeper where:
- Users store **all data** (including photos) in their own Notion workspace
- The app acts as a **scanning/entry tool** only
- **Zero backend storage** - you don't host any user data
- **Zero privacy concerns** - users own their data
- **Automatic backups** - Notion handles it
- **Scales infinitely** - each user's Notion handles their storage

### How It Works

**1. User Login Flow:**
```
User → Click "Login with Notion"
     → Authorize app
     → App creates coffee database in THEIR workspace
     → User stores entries in THEIR Notion
```

**2. Photo Storage:**
- Photos uploaded directly to user's Notion pages
- Notion hosts the photos (URLs expire after ~1 hour)
- App refreshes URLs when displaying entries
- No external storage (GCS/S3/Cloudinary) needed

**3. Data Flow:**
```
User takes photo
  → App uploads to Notion
  → Notion downloads and hosts
  → Entry saved in user's database
  → App reads from user's Notion when needed
```

### Implementation Phases

#### Phase 1: Register Public Integration (15 min)

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Choose **"Public Integration"** ⚠️ (not Internal!)
4. Configure:
   - **Name**: The Bean Keeper
   - **Logo**: Your app logo (optional)
   - **Associated workspace**: Your dev workspace
5. **Redirect URLs**: Add:
   ```
   http://localhost:3000/auth/notion/callback
   https://your-production-domain.com/auth/notion/callback
   ```
6. **Capabilities**: Enable all (Read, Update, Insert content)
7. Get credentials:
   - Copy **OAuth Client ID**
   - Copy **OAuth Client Secret**

#### Phase 2: Environment Setup

Add to `.env`:
```env
# Notion OAuth (Public Integration)
NOTION_OAUTH_CLIENT_ID=your-oauth-client-id
NOTION_OAUTH_CLIENT_SECRET=your-oauth-client-secret
NOTION_OAUTH_REDIRECT_URI=http://localhost:3000/auth/notion/callback

# Keep your Internal Integration for testing (optional)
NOTION_API_KEY=ntn_xxx
NOTION_DATABASE_ID=xxx-xxx-xxx
```

#### Phase 3: Activate OAuth Routes

The OAuth code already exists! Just need to enable it:

**Files to activate:**
- `server/notion-oauth-routes.ts` - OAuth endpoints (✅ exists)
- `server/notion-oauth.ts` - OAuth flow logic (✅ exists)
- `shared/notion-oauth-schema.ts` - User token schema (✅ exists)

**Update `server/index.ts`:**
```typescript
import { registerNotionOAuthRoutes } from './notion-oauth-routes';

// Add after registerRoutes
registerNotionOAuthRoutes(app);
```

#### Phase 4: Add Login UI

Create login page with "Login with Notion" button:

```tsx
// client/src/pages/Login.tsx
function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/notion';
  };

  return (
    <div>
      <h1>Welcome to The Bean Keeper</h1>
      <button onClick={handleLogin}>
        Login with Notion
      </button>
    </div>
  );
}
```

#### Phase 5: Handle OAuth Callback

Update `client/src/App.tsx` to handle OAuth callback:

```tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const credentials = urlParams.get('credentials');

  if (credentials) {
    const { accessToken, databaseId, workspace } = JSON.parse(atob(credentials));

    // Store in localStorage (or better: secure cookie)
    localStorage.setItem('notion_auth', JSON.stringify({
      accessToken,
      databaseId,
      workspace
    }));

    // Redirect to dashboard
    window.location.href = '/';
  }
}, []);
```

#### Phase 6: Use User's Token

Update API calls to use user's access token instead of internal integration:

```typescript
// Instead of using NOTION_API_KEY from env
const userAuth = JSON.parse(localStorage.getItem('notion_auth'));

fetch('/api/coffee-entries', {
  headers: {
    'Authorization': `Bearer ${userAuth.accessToken}`,
    'X-Notion-Database-Id': userAuth.databaseId
  }
});
```

#### Phase 7: Photo Upload to Notion

When creating entries, upload photos directly to Notion:

```typescript
// Backend: Upload photo to Notion's file hosting
async function uploadPhotoToNotion(userToken: string, photoBuffer: Buffer, pageId: string) {
  // 1. Create temporary public URL (ngrok in dev, deployed URL in prod)
  const tempUrl = await createTempPublicUrl(photoBuffer);

  // 2. Tell Notion to download from that URL
  const notion = new Client({ auth: userToken });
  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Front Photo": {
        files: [{
          name: "coffee-front.jpg",
          external: { url: tempUrl }
        }]
      }
    }
  });

  // 3. Notion downloads and hosts the file
  // 4. Clean up temp URL
}
```

#### Phase 8: Refresh Expired URLs

Before displaying photos, refresh if expired:

```typescript
async function getCoffeeEntryWithFreshUrls(entryId: string, userToken: string) {
  const notion = new Client({ auth: userToken });
  const page = await notion.pages.retrieve({ page_id: entryId });

  // Extract fresh URLs from Notion (they expire after ~1 hour)
  const frontPhotoUrl = page.properties["Front Photo"].files[0]?.file?.url;
  const backPhotoUrl = page.properties["Back Photo"].files[0]?.file?.url;

  return { ...entry, frontPhotoUrl, backPhotoUrl };
}
```

### Architecture Benefits

**For You (Developer):**
- ✅ Zero storage costs
- ✅ Zero data privacy liability
- ✅ No GDPR/compliance burden
- ✅ Scales infinitely
- ✅ Simple architecture

**For Users:**
- ✅ Own their data
- ✅ Can access in Notion directly
- ✅ Automatic Notion backups
- ✅ Use Notion's search/filters
- ✅ Export/share using Notion

### Temporary URL Solutions

For photo uploads in development (since Notion needs public URLs):

**Option 1: ngrok (Development)**
```bash
ngrok http 3000
# Use ngrok URL for photo uploads
```

**Option 2: Deployed Backend (Production)**
- Deploy backend to Vercel/Railway/Render
- Photos served from `https://your-app.com/api/local-files/...`
- Notion can access these URLs

**Option 3: Temporary File Host**
- Use tmpfiles.org or file.io
- Upload photo to temp host
- Give URL to Notion
- Notion downloads and hosts permanently

### Next Steps

1. ✅ Read existing OAuth files to understand the flow
2. ✅ Register Public Integration in Notion
3. ✅ Add OAuth credentials to `.env`
4. ✅ Enable OAuth routes in `server/index.ts`
5. ✅ Create login UI
6. ✅ Test OAuth flow locally
7. ✅ Implement photo upload to Notion
8. ✅ Add URL refresh logic
9. ✅ Test with real user workflow
10. ✅ Deploy and update redirect URLs

---

## 🚀 Setup Steps (Internal Integration - Legacy)

### Step 1: Create a Public Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: `The Bean Keeper`
   - **Logo**: Upload your app logo (optional)
   - **Associated workspace**: Select your development workspace
   - **Type**: Select **"Public integration"** ⚠️ (This is crucial!)

4. Click **"Submit"**

### Step 2: Configure OAuth Settings

After creating the integration, configure OAuth:

1. **Integration Type**: Ensure "Public" is selected
2. **Redirect URIs**: Add these URLs:
   ```
   http://localhost:5000/api/auth/notion/callback
   https://your-production-domain.com/api/auth/notion/callback
   ```

3. **Capabilities**: Enable these permissions:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content
   - ✅ Read user information including email addresses

4. **User Capabilities**: Select:
   - ✅ Read user information including email addresses

5. **Content Capabilities**: Select:
   - ✅ Read content
   - ✅ Update content
   - ✅ Insert content

### Step 3: Get Your OAuth Credentials

1. Copy your **OAuth client ID**
2. Copy your **OAuth client secret** (click "Show" to reveal)
3. Add them to your `.env` file:

```env
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here
NOTION_REDIRECT_URI=http://localhost:5000/api/auth/notion/callback
```

### Step 4: Configure Company Information

Notion requires this for public integrations:

1. **Company name**: Your company/app name
2. **Website/Homepage**: Your app's website
3. **Tagline**: Short description (e.g., "Track your coffee journey")
4. **Privacy Policy URL**: Your privacy policy
5. **Terms of Use URL**: Your terms of service
6. **Support email**: Contact email for support

### Step 5: Submit for Approval (Production Only)

For production deployment:
1. Fill out the "Distribution" section
2. Submit for Notion's review
3. Once approved, your integration can be used by anyone

For development, you can test immediately without approval!

---

## 📁 Files Created

### Backend Files
- ✅ `server/notion-oauth.ts` - OAuth flow implementation
- ✅ `server/notion-oauth-routes.ts` - OAuth API endpoints
- ✅ `shared/notion-oauth-schema.ts` - Database schema for user tokens
- ✅ Updated `server/routes.ts` - Registered OAuth routes

### Configuration
- ✅ Updated `.env` - Added OAuth credentials

---

## 🔌 API Endpoints

### OAuth Flow

**GET** `/api/auth/notion`
- Redirects user to Notion for authorization
- Generates CSRF state token for security

**GET** `/api/auth/notion/callback`
- Handles OAuth callback from Notion
- Exchanges code for access token
- Creates database in user's workspace
- Redirects to success page with credentials

### User Actions

**POST** `/api/export/notion`
```json
{
  "accessToken": "secret_xxx",
  "databaseId": "abc-123"
}
```
Response:
```json
{
  "success": true,
  "total": 25,
  "exported": 25,
  "failed": 0,
  "errors": []
}
```

**POST** `/api/auth/notion/test`
```json
{
  "accessToken": "secret_xxx"
}
```
Response:
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "avatar_url": "https://..."
  },
  "workspace": {
    "hasAccess": true,
    "accessiblePages": 10
  }
}
```

**POST** `/api/auth/notion/user`
```json
{
  "accessToken": "secret_xxx"
}
```
Response: Notion user object

**POST** `/api/auth/notion/revoke`
```json
{
  "accessToken": "secret_xxx"
}
```
Response:
```json
{
  "success": true,
  "message": "Notion access revoked successfully"
}
```

---

## 🎨 Frontend Implementation

### Add "Connect with Notion" Button

```tsx
// Example React component
function NotionConnectButton() {
  const handleConnect = () => {
    // Redirect to OAuth endpoint
    window.location.href = '/api/auth/notion';
  };

  return (
    <button onClick={handleConnect}>
      <img src="/notion-icon.svg" alt="Notion" />
      Connect with Notion
    </button>
  );
}
```

### Handle OAuth Callback

```tsx
// In your main App component or callback page
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const credentials = urlParams.get('credentials');

  if (credentials) {
    // Decode and store credentials
    const decoded = JSON.parse(atob(credentials));
    localStorage.setItem('notion_auth', JSON.stringify(decoded));

    // Show success message
    toast.success('Connected to Notion successfully!');

    // Clean up URL
    window.history.replaceState({}, '', '/');
  }
}, []);
```

### Export to Notion

```tsx
async function exportToNotion() {
  const auth = JSON.parse(localStorage.getItem('notion_auth') || '{}');

  const response = await fetch('/api/export/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: auth.accessToken,
      databaseId: auth.databaseId,
    }),
  });

  const result = await response.json();

  if (result.success) {
    alert(`Exported ${result.exported} coffee entries to Notion!`);
  }
}
```

---

## 🗂️ How It Works

### OAuth Flow Diagram

```
┌─────────┐          ┌──────────────┐          ┌────────────┐
│         │          │              │          │            │
│  User   │──────────│  Your App    │──────────│   Notion   │
│         │    1     │              │    2     │            │
└─────────┘          └──────────────┘          └────────────┘
     │                      │                         │
     │  Click "Connect"     │                         │
     │─────────────────────>│                         │
     │                      │  Redirect to OAuth      │
     │                      │────────────────────────>│
     │                      │                         │
     │              3. User authorizes app            │
     │<───────────────────────────────────────────────│
     │                      │                         │
     │  4. Callback with code                         │
     │─────────────────────>│                         │
     │                      │  5. Exchange code       │
     │                      │────────────────────────>│
     │                      │                         │
     │                      │  6. Access token        │
     │                      │<────────────────────────│
     │                      │                         │
     │  7. Database created │  8. Create database     │
     │     in workspace     │────────────────────────>│
     │<─────────────────────│                         │
```

### Database Creation

When a user connects for the first time:
1. App receives access token
2. Creates "The Bean Keeper" page in user's workspace
3. Creates database with pre-configured schema:
   - Name (Title)
   - Roaster (Rich Text)
   - Origin (Select)
   - Variety (Multi-select)
   - Process (Select)
   - Roast Date (Date)
   - Flavor Notes (Multi-select)
   - Rating (Number)
   - And more...

### Data Export

When user clicks "Export to Notion":
1. Fetches all coffee entries from local database
2. For each entry:
   - Converts to Notion page properties
   - Creates page in user's database
3. Returns export report (success/failed counts)

---

## 🔒 Security Best Practices

### Token Storage

**Development:**
- Store in localStorage or sessionStorage
- Include in API requests

**Production:**
- Store access tokens in secure HTTP-only cookies
- Use server-side sessions
- Encrypt tokens at rest
- Implement token refresh logic

### CSRF Protection

The OAuth flow includes state parameter for CSRF protection:
```typescript
const state = Math.random().toString(36).substring(7);
// Store state in session
// Verify on callback
```

### Environment Variables

Never commit these to git:
```env
NOTION_CLIENT_SECRET=secret_xxx  # Keep secret!
```

Add to `.gitignore`:
```
.env
.env.local
```

---

## 🧪 Testing

### Test OAuth Flow Locally

1. Start your server:
   ```bash
   npm run dev
   ```

2. Open browser to:
   ```
   http://localhost:5000/api/auth/notion
   ```

3. You should be redirected to Notion
4. Authorize the app
5. Get redirected back with credentials

### Test Export

```bash
curl -X POST http://localhost:5000/api/export/notion \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "secret_xxx",
    "databaseId": "abc-123"
  }'
```

### Test Connection

```bash
curl -X POST http://localhost:5000/api/auth/notion/test \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "secret_xxx"
  }'
```

---

## 🎯 Production Deployment

### Environment Variables

Set these in your production environment:
```env
NOTION_CLIENT_ID=prod_client_id
NOTION_CLIENT_SECRET=prod_client_secret
NOTION_REDIRECT_URI=https://yourdomain.com/api/auth/notion/callback
```

### Update Redirect URI

In Notion integration settings, add production URL:
```
https://yourdomain.com/api/auth/notion/callback
```

### Submit for Review

1. Complete all company information
2. Add logo and branding
3. Submit for Notion's review
4. Wait for approval (usually 1-2 weeks)

---

## 📊 Database Schema (User Tokens)

For production, store user tokens in database:

```typescript
// shared/notion-oauth-schema.ts
{
  userId: string (primary key)
  accessToken: string
  refreshToken: string
  botId: string
  workspaceId: string
  workspaceName: string
  databaseId: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

Run migration:
```bash
npm run db:push
```

---

## 🐛 Troubleshooting

### "Invalid client credentials"
- Check `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
- Verify they match your integration settings

### "Redirect URI mismatch"
- Ensure redirect URI in `.env` matches Notion integration settings
- Check for trailing slashes

### "User denied access"
- User clicked "Cancel" during authorization
- They can retry by clicking "Connect with Notion" again

### "Database creation failed"
- User needs to grant "Insert content" permission
- Check integration capabilities in Notion settings

### "No accessible pages found"
- User needs to share at least one page with the integration
- Or grant workspace-level access

---

## 💡 Tips

1. **Test in development first** - Use localhost redirect URI
2. **Handle token expiration** - Implement refresh token logic
3. **Store tokens securely** - Use HTTP-only cookies in production
4. **Provide clear error messages** - Help users troubleshoot
5. **Log OAuth events** - Track authorization and export success rates

---

## 📚 Resources

- [Notion OAuth Documentation](https://developers.notion.com/docs/authorization)
- [Notion API Reference](https://developers.notion.com/reference)
- [Public Integration Guide](https://norahsakal.com/blog/create-public-notion-integration/)

---

## 🎉 What You Get

After setup, users can:
- ✅ Connect Notion with one click
- ✅ Auto-created coffee tracking database
- ✅ Export all entries instantly
- ✅ Sync updates to Notion
- ✅ Access data from Notion mobile & desktop

**No technical knowledge required for users!**

---

## ⏭️ Next Steps

1. **Create public integration** in Notion
2. **Add OAuth credentials** to `.env`
3. **Test OAuth flow** locally
4. **Build frontend UI** for "Connect with Notion" button
5. **Test export** with sample data
6. **Deploy to production** and submit for review

Need help? Check the troubleshooting section or reach out!
