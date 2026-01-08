# The Bean Keeper - Notion Integration Setup Guide

This guide will help you set up The Bean Keeper to work directly with Notion (no PostgreSQL required).

## Architecture Overview

The app now uses **Notion-only storage**:
- All coffee entries are stored directly in your Notion database
- No local PostgreSQL database needed
- Real-time sync - every save goes directly to Notion
- Your Notion workspace is the single source of truth

## Step 1: Create Notion Internal Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: The Bean Keeper
   - **Logo**: (optional)
   - **Associated workspace**: Select your workspace
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (starts with `secret_`)

## Step 2: Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder with your actual token:

```env
# Notion Internal Integration
NOTION_API_KEY=secret_REPLACE_WITH_YOUR_ACTUAL_TOKEN_HERE
```

3. Save the file

## Step 3: Test the Connection

Run the test script to verify your API key works:

```bash
npx tsx test-notion-setup.ts
```

You should see:
```
✅ NOTION_API_KEY is set
✅ Successfully connected to Notion API
```

## Step 4: Create Parent Page in Notion

1. Open your Notion workspace
2. Create a new page (this will be the parent for your coffee database)
3. Name it something like **"The Bean Keeper"** or **"Coffee Collection"**
4. Click the **"..."** menu in the top right
5. Select **"Add connections"**
6. Choose **"The Bean Keeper"** integration

## Step 5: Get Page ID

From your parent page URL, extract the page ID:

**URL Format:**
```
https://www.notion.so/Your-Page-Name-1234567890abcdef1234567890abcdef
```

**Page ID:**
```
1234567890abcdef1234567890abcdef
```

Note: Remove any hyphens if present. The page ID is a 32-character hexadecimal string.

## Step 6: Create Coffee Database

Use the API endpoint to create the database structure:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/notion/create-database \
  -H "Content-Type: application/json" \
  -d '{"parentPageId": "YOUR_PAGE_ID_HERE"}'
```

**Response:**
```json
{
  "databaseId": "abc123...",
  "message": "Database created successfully"
}
```

**Save the `databaseId`** - you'll need it for the frontend!

## Step 7: Start the App

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Frontend Integration

The frontend needs to send two headers with every API request:

```typescript
// In your API client
headers: {
  'X-Notion-Database-Id': 'YOUR_DATABASE_ID_HERE',
  'Content-Type': 'application/json'
}
```

## Database Structure

The Notion database includes these properties:

### Core Fields
- **Name** (Title): Auto-generated from roaster + origin
- **Roaster** (Text): Roaster name
- **App ID** (Text): Internal UUID for tracking

### Roaster Info
- **Website** (URL): Roaster website
- **Address** (Text): Physical location

### Coffee Details
- **Farm** (Text): Farm name
- **Origin** (Select): Country of origin
- **Variety** (Multi-select): Coffee varieties
- **Process** (Select): Processing method
- **Roast Date** (Date): When it was roasted

### User Input
- **Rating** (Number): 1-5 star rating
- **Tasting Notes** (Text): Your tasting notes
- **Flavor Notes** (Multi-select): Detected flavors
- **Weight** (Text): Package weight
- **Price** (Text): Purchase price
- **Purchase Again** (Checkbox): Would buy again?

### Photos
- **Front Photo** (URL): Front of bag
- **Back Photo** (URL): Back of bag

### System
- **Created** (Created Time): Auto-generated timestamp

## How It Works

### Create Flow
1. User scans coffee bag with camera
2. Groq AI extracts text from OCR
3. Form auto-fills with extracted data
4. User clicks "Save Entry"
5. Entry created **directly in Notion** (no local DB)
6. Notion page ID returned and used for future updates

### Read Flow
1. App requests all entries: `GET /api/coffee-entries`
2. Backend queries Notion database
3. Results sorted by creation date (newest first)
4. Data displayed in app

### Update Flow
1. User edits entry in app
2. `PATCH /api/coffee-entries/:id` called
3. Notion page updated directly using page ID
4. Updated data returned

### Delete Flow
1. User deletes entry
2. `DELETE /api/coffee-entries/:id` called
3. Notion page archived (soft delete)

## Troubleshooting

### "NOTION_API_KEY not set"
- Make sure you updated `.env` with your actual token
- Restart the dev server after changing `.env`

### "Database not initialized" error
- Check that you sent the `X-Notion-Database-Id` header
- Verify the database ID is correct

### "unauthorized" error from Notion
- Double-check your API key in `.env`
- Make sure the integration is connected to your parent page
- Token should start with `secret_`

### Entries not appearing
- Verify the database was created successfully
- Check that the frontend is sending the database ID header
- Look at server logs for Notion API errors

## Benefits of Notion-Only Architecture

✅ **No PostgreSQL setup required** - Works immediately with just Notion
✅ **Visual database in Notion** - See and edit your coffee collection in Notion
✅ **Real-time sync** - Every save goes directly to Notion
✅ **Single source of truth** - No sync conflicts or data drift
✅ **Notion features** - Use filters, sorts, views in Notion workspace
✅ **Simpler deployment** - No database hosting needed

## Next Steps

After setup is complete:
1. Test creating a coffee entry through the app
2. Verify it appears in your Notion database
3. Try editing and deleting entries
4. Explore the Notion database views and filters
