# The Bean Keeper - User Flow

## 🎯 Simplified User Experience

### One-Time Setup (30 seconds)
1. User opens The Bean Keeper app
2. Clicks **"Connect with Notion"**
3. Logs in with Notion credentials
4. Authorizes the app
5. **Done!** Database automatically created in their Notion workspace

### Daily Use (15 seconds per coffee)
1. User clicks **"Add Coffee"**
2. Takes photo of coffee bag (front & back)
3. **Groq AI extracts data automatically** ⚡
4. Reviews/edits extracted information
5. Clicks **"Save Entry"**
6. **Entry automatically syncs to Notion** ✨

**No manual export. No sync buttons. It just works!**

---

## 📱 Detailed User Flow

### Flow 1: First-Time Setup

```
┌─────────────────┐
│  Open App       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  See Landing    │
│  Page           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Click          │
│  "Connect with  │
│   Notion"       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redirected to  │
│  Notion OAuth   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User logs in   │
│  to Notion      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User grants    │
│  permissions    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Callback       │
│  ↓              │
│  Access token   │
│  received       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  automatically  │
│  created in     │
│  user's Notion  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success!       │
│  Ready to use   │
└─────────────────┘
```

**Time: ~30 seconds**

---

### Flow 2: Adding Coffee (Scan & Sync)

```
┌─────────────────┐
│  Click          │
│  "+ Add Coffee" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Camera opens   │
│  (or file       │
│   picker)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Take photo of  │
│  coffee bag     │
│  (front)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Optional:      │
│  Take photo of  │
│  back label     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tesseract.js   │
│  extracts text  │
│  from photos    │
│  ⏱️ ~2-3 sec     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Groq AI        │
│  parses text    │
│  into fields    │
│  ⚡ ~0.5 sec     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Form           │
│  auto-fills:    │
│  • Roaster      │
│  • Origin       │
│  • Variety      │
│  • Process      │
│  • Flavors      │
│  • etc.         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User reviews   │
│  & edits        │
│  (if needed)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User adds:     │
│  • Rating       │
│  • Tasting notes│
│  • Purchase     │
│    again?       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Click          │
│  "Save Entry"   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend:                       │
│  1. Save to local PostgreSQL    │
│  2. Auto-sync to Notion ✨       │
│     (if connected)              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Success! ✅     │
│  Entry visible  │
│  in:            │
│  • App          │
│  • Notion       │
└─────────────────┘
```

**Time: ~15 seconds (including photo)**

---

## 🔄 Real-Time Sync Architecture

### How Auto-Sync Works

```
User clicks "Save"
        │
        ▼
┌───────────────────────┐
│  Frontend sends POST  │
│  to /api/coffee-      │
│  entries              │
│                       │
│  Headers:             │
│  • x-notion-access-   │
│    token              │
│  • x-notion-database- │
│    id                 │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Backend:             │
│  1. Validate data     │
│  2. Save to local DB  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Check if Notion      │
│  credentials present  │
└───────────┬───────────┘
            │
     Yes    │    No
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌───────────┐  ┌──────────┐
│ Auto-sync │  │ Skip     │
│ to Notion │  │ sync     │
└─────┬─────┘  └──────────┘
      │
      ▼
┌─────────────────────────┐
│  Create page in user's  │
│  Notion database with   │
│  all coffee data        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Return success to      │
│  frontend               │
└─────────────────────────┘
```

### Error Handling

- **If Notion sync fails**: Entry still saved locally
- **Network issues**: Entry queued for later sync
- **Invalid token**: User prompted to reconnect
- **Rate limit**: Exponential backoff retry

---

## 🎨 UI States & Feedback

### State 1: Not Connected to Notion
```
┌────────────────────────────────────┐
│  ☁️  Connect with Notion            │
│                                    │
│  Sync your coffee collection to   │
│  Notion automatically              │
│                                    │
│  [Connect with Notion Button]     │
└────────────────────────────────────┘
```

### State 2: Connected to Notion
```
┌────────────────────────────────────┐
│  ✅ Connected to Notion              │
│                                    │
│  Workspace: My Coffee Notes        │
│  Database: The Bean Keeper         │
│                                    │
│  [Disconnect]                      │
└────────────────────────────────────┘
```

### State 3: Saving Entry (with sync)
```
┌────────────────────────────────────┐
│  Saving entry...                   │
│                                    │
│  ✓ Saved locally                   │
│  ⏳ Syncing to Notion...            │
└────────────────────────────────────┘
```

### State 4: Save Complete
```
┌────────────────────────────────────┐
│  ✅ Entry saved & synced!            │
│                                    │
│  • Saved to app                    │
│  • Synced to Notion                │
│                                    │
│  [View in Notion] [Add Another]   │
└────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│   Camera     │
│   Photo      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Tesseract.js │ ──── OCR Text
│   (Client)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Groq AI    │ ──── Structured Data
│   (Server)   │      • Roaster: "Blue Bottle"
└──────┬───────┘      • Origin: "Ethiopia"
       │              • Variety: "Heirloom"
       │              • Process: "Washed"
       │              • Flavors: ["Berry", "Floral"]
       ▼
┌──────────────┐
│  Form Fields │ ──── User reviews & edits
│  Auto-filled │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ User clicks  │
│ "Save Entry" │
└──────┬───────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│ PostgreSQL   │                    │   Notion     │
│  Database    │                    │  Database    │
│  (Local)     │                    │  (Cloud)     │
└──────────────┘                    └──────────────┘
       │                                     │
       └─────────────┬───────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Success!    │
              │  Both synced │
              └──────────────┘
```

---

## 🔐 Security & Privacy

### User Data
- **Photos**: Stored in Google Cloud Storage (your infrastructure)
- **Coffee data**: Stored in user's own Notion workspace
- **Access tokens**: Stored securely in localStorage/cookies
- **No third-party sharing**: Data only goes to user's Notion

### Permissions Requested
- ✅ Read content (to verify database)
- ✅ Update content (to create entries)
- ✅ Insert content (to create database)
- ✅ Read user info (to show workspace name)

### What We DON'T Do
- ❌ Store coffee data on our servers (only in user's Notion)
- ❌ Access other Notion pages/databases
- ❌ Share data with third parties
- ❌ Read private messages or content

---

## 💡 Key Features

### 1. **Automatic Sync**
- No manual export buttons
- No "Sync to Notion" action needed
- Just save and forget!

### 2. **Offline Support**
- App works offline
- Entries saved locally first
- Syncs to Notion when back online

### 3. **Error Resilience**
- If Notion sync fails, entry still saved locally
- User can manually trigger sync later
- Retry logic for network issues

### 4. **Real-time Updates**
- Edit an entry → automatically updates in Notion
- Delete an entry → automatically removes from Notion
- No lag or manual sync needed

---

## 🎯 Success Metrics

Users should experience:
- ✅ **Setup in < 1 minute**
- ✅ **Add coffee in < 15 seconds**
- ✅ **Zero manual sync actions**
- ✅ **Instant visibility in Notion**
- ✅ **Works offline gracefully**

---

## 🚀 Future Enhancements

### Phase 2 (Optional)
- Background sync queue for offline entries
- Batch sync multiple entries
- Sync status dashboard
- Conflict resolution UI
- Two-way sync (Notion → App)

### Phase 3 (Advanced)
- Real-time webhooks from Notion
- Collaborative features
- Sharing coffee collections
- Public profiles

---

**This flow ensures users never think about syncing - it just happens automatically! ✨**
