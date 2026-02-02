# Deprecated

This document is deprecated and kept for historical reference only.

Use the canonical OAuth guide instead:
- `NOTION_OAUTH_SETUP.md`

Schema reference:
- `NOTION_DATABASE_STRUCTURE.md`

<!--
# The Bean Keeper - Groq AI & Notion Integration Setup Guide

## 🎉 Implementation Complete!

This guide explains the Groq AI and Notion integration that has been added to The Bean Keeper app.

## ✅ What's Been Implemented

### Phase 1: Groq AI Integration (✓ Complete)
- ✅ Replaced OpenAI with Groq AI for coffee data extraction
- ✅ Using `llama-3.1-8b-instant` model for ultra-fast inference
- ✅ Maintains same extraction interface (drop-in replacement)
- ✅ Tested and working with sample coffee bag data

### Phase 2: Notion Integration (✓ Complete)
- ✅ Full Notion SDK integration
- ✅ Bidirectional sync capability
- ✅ Database schema mapping
- ✅ CRUD operations for Notion pages
- ✅ Sync endpoints added to API

### Phase 3: Database Updates (✓ Complete)
- ✅ Added `notionPageId` field to track Notion sync
- ✅ Added `updatedAt` timestamp for conflict resolution

---

## 🚀 Quick Start

### 1. Environment Variables

Your `.env` file has been created with the Groq API key. To enable Notion sync, add:

```env
# Groq AI (Already configured)
GROQ_API_KEY=your_groq_api_key_here

# Notion Integration (Add these)
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_database_id_here
```

### 2. Get Your Notion API Key

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Name it "The Bean Keeper"
4. Select the workspace
5. Copy the "Internal Integration Token" → This is your `NOTION_API_KEY`

### 3. Create Notion Database

**Option A: Create Manually in Notion**
1. Create a new page in Notion
2. Add a database to that page
3. Share the database with your integration (click "Share" → invite your integration)
4. Copy the database ID from the URL:
   - URL format: `https://www.notion.so/workspace/{database_id}?v=...`
   - The `database_id` is the part before `?v=`

**Option B: Create via API (Recommended)**
1. Create an empty page in Notion and copy its Page ID
2. Use the API endpoint to create the database:

```bash
curl -X POST http://localhost:5000/api/notion/create-database \
  -H "Content-Type: application/json" \
  -d '{"parentPageId": "your-page-id-here"}'
```

3. The response will include the `databaseId` - add this to your `.env`

### 4. Update Database Schema

Run the database migration to add the new Notion sync fields:

```bash
npm run db:push
```

### 5. Start the Server

```bash
npm run dev
```

---

## 📚 API Endpoints

### Groq AI Extraction

**POST** `/api/extract-coffee-info`
```json
{
  "text": "OCR text from coffee bag"
}
```

Response:
```json
{
  "roasterName": "Blue Bottle Coffee",
  "roasterWebsite": "bluebottlecoffee.com",
  "origin": "Ethiopia",
  "variety": "Heirloom Ethiopian Varieties",
  "processMethod": "Washed",
  "roastDate": "12/01/2025",
  "flavorNotes": ["Blueberry", "Jasmine", "Black Tea"]
}
```

### Notion Sync

**GET** `/api/sync/status`
Get current sync status:
```json
{
  "localCount": 5,
  "notionCount": 3,
  "lastSync": null,
  "notionConfigured": true
}
```

**POST** `/api/sync/notion`
Trigger full bidirectional sync:
```json
{
  "pushedToNotion": 5,
  "pulledFromNotion": 0,
  "conflicts": 0,
  "errors": []
}
```

**POST** `/api/coffee-entries/:id/sync`
Sync a single entry to Notion:
```json
{
  "success": true,
  "message": "Entry synced to Notion"
}
```

**POST** `/api/notion/create-database`
Create a new Notion database:
```json
{
  "parentPageId": "abc123..."
}
```

---

## 🗂️ Database Schema

### Local PostgreSQL Schema

```typescript
coffeeEntries {
  id: string (UUID)
  frontPhotoUrl: string
  backPhotoUrl: string?
  roasterName: string
  roasterWebsite: string?
  roasterAddress: string?
  farm: string?
  origin: string?
  variety: string?
  processMethod: string?
  roastDate: string?
  flavorNotes: string[]?
  rating: number (1-5)?
  tastingNotes: string?
  weight: string?
  price: string?
  purchaseAgain: boolean
  createdAt: timestamp
  notionPageId: string?      // NEW: Notion page reference
  updatedAt: timestamp       // NEW: For sync conflict resolution
}
```

### Notion Database Properties

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Roaster + Origin |
| Roaster | Rich Text | Roaster name |
| Website | URL | Roaster website |
| Address | Rich Text | Full address |
| Farm | Rich Text | Farm/estate name |
| Origin | Select | Country (Ethiopia, Colombia, etc.) |
| Variety | Multi-select | Coffee varieties |
| Process | Select | Processing method |
| Roast Date | Date | When roasted |
| Flavor Notes | Multi-select | Taste descriptors |
| Rating | Number | 1-5 stars |
| Tasting Notes | Rich Text | User notes |
| Weight | Rich Text | Package weight |
| Price | Rich Text | Price paid |
| Purchase Again | Checkbox | Would buy again |
| Front Photo | URL | Front photo link |
| Back Photo | URL | Back photo link |
| App ID | Rich Text | Local database ID |
| Created | Created Time | Auto timestamp |

---

## 🔄 How Sync Works

### Sync Strategy: Hybrid (Immediate Push + Manual Pull)

1. **Local → Notion (Automatic)**
   - When you create/update/delete a coffee entry locally
   - Can manually trigger with `POST /api/coffee-entries/:id/sync`

2. **Notion → Local (Manual)**
   - Trigger with `POST /api/sync/notion`
   - Compares all entries and syncs differences

3. **Conflict Resolution**
   - Last-write-wins based on `updatedAt` timestamp
   - Conflicts are logged in sync report

### Sync Flow

```
┌─────────────────┐         Push          ┌──────────────────┐
│                 │  ──────────────────>   │                  │
│  Local Database │                        │ Notion Database  │
│   (PostgreSQL)  │  <──────────────────   │                  │
└─────────────────┘         Pull          └──────────────────┘
```

---

## 🧪 Testing

### Test Groq Extraction

A test script has been created at `test-groq.ts`:

```bash
npx tsx test-groq.ts
```

Expected output:
```
✓ Roaster Name: Blue Bottle Coffee
✓ Website: bluebottlecoffee.com
✓ Origin: Ethiopia
✓ Farm: Koke Washing Station
✓ Variety: Heirloom Ethiopian Varieties
✓ Process: Washed
✓ Roast Date: 12/01/2025
✓ Flavor Notes: Blueberry, Jasmine, Black Tea

✅ Groq AI extraction test completed successfully!
```

### Test Notion Sync

Once you have Notion configured:

1. Create a coffee entry in your app
2. Check sync status:
   ```bash
   curl http://localhost:5000/api/sync/status
   ```

3. Trigger full sync:
   ```bash
   curl -X POST http://localhost:5000/api/sync/notion
   ```

4. Verify in Notion: The entry should appear in your database

---

## 📁 Files Modified/Created

### New Files
- ✅ `server/groq.ts` - Groq AI service (replaces OpenAI)
- ✅ `server/notion.ts` - Notion client and CRUD operations
- ✅ `server/sync.ts` - Bidirectional sync logic
- ✅ `.env` - Environment configuration
- ✅ `test-groq.ts` - Groq extraction test script
- ✅ `GROQ_NOTION_SETUP.md` - This guide

### Modified Files
- ✅ `server/routes.ts` - Import from groq, added Notion sync endpoints
- ✅ `shared/schema.ts` - Added `notionPageId` and `updatedAt` fields
- ✅ `package.json` - Added groq-sdk, @notionhq/client, dotenv

---

## 🎯 Next Steps

### Immediate (Required for Notion sync)
1. [ ] Get your Notion API key from https://www.notion.so/my-integrations
2. [ ] Create a Notion database or use the API endpoint
3. [ ] Add `NOTION_API_KEY` and `NOTION_DATABASE_ID` to `.env`
4. [ ] Run `npm run db:push` to update the database schema
5. [ ] Test the sync with `POST /api/sync/notion`

### Phase 3: Export/Import (Optional)
- [ ] Add JSON export endpoint (`GET /api/export/json`)
- [ ] Add CSV export endpoint (`GET /api/export/csv`)
- [ ] Add JSON import endpoint (`POST /api/import/json`)

### Phase 4: Map View (Optional)
- [ ] Add Google Maps Geocoding integration
- [ ] Add `latitude` and `longitude` fields to schema
- [ ] Create MapView component
- [ ] Display roaster locations on map

---

## 🤖 Groq AI Details

### Model Used
- **Model**: `llama-3.1-8b-instant`
- **Speed**: Ultra-fast (100+ tokens/sec on Groq's LPU)
- **Context**: 128K tokens
- **Features**: JSON mode, function calling
- **Cost**: Pay-as-you-go (free tier available)

### Why Groq?
- ⚡ **10x faster** than traditional cloud inference
- 💰 **Cost-effective** pricing
- 🔒 **OpenAI-compatible** API (easy migration)
- 🎯 **Structured output** with JSON mode
- 🚀 **No cold starts** (always-on infrastructure)

---

## 🔒 Security Notes

1. **API Keys**: Never commit `.env` file to git
2. **Notion Integration**: Uses internal integration (secure)
3. **Data Privacy**: Coffee data syncs only to your Notion workspace
4. **Database**: Add `notionPageId` index for performance (optional)

---

## 📊 Sync Report Example

```json
{
  "pushedToNotion": 12,
  "pulledFromNotion": 3,
  "conflicts": 1,
  "errors": [
    "Error syncing entry abc123: Missing required field 'roasterName'"
  ]
}
```

---

## 💡 Tips

1. **First Sync**: Always do a full sync after setup to push existing entries
2. **Regular Syncs**: Set up a cron job for periodic syncs (e.g., every hour)
3. **Backup**: Export to JSON regularly as backup
4. **Photos**: Notion doesn't host photos - they link to your cloud storage
5. **Conflicts**: Check sync report errors and resolve manually if needed

---

## 🐛 Troubleshooting

### "GROQ_API_KEY not set"
- Check `.env` file exists in project root
- Restart server after adding environment variable

### "NOTION_API_KEY not set"
- Add Notion API key to `.env`
- Ensure integration is created in Notion

### "Database not shared with integration"
- In Notion, click Share → Invite integration
- Database must be explicitly shared

### "Sync errors"
- Check `errors` array in sync report
- Verify all required fields are present
- Check Notion API rate limits (3 req/sec)

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review error messages in sync report
3. Check server logs for detailed errors
4. Verify environment variables are set correctly

---

## 🎉 Success Criteria

You'll know everything is working when:
- ✅ Groq extraction test passes
- ✅ Sync status shows `notionConfigured: true`
- ✅ Full sync completes without errors
- ✅ Entries appear in Notion database
- ✅ Updates sync bidirectionally

---

**Happy coffee tracking! ☕️**
-->
