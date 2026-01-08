# The Bean Keeper - Notion Database Structure

## 📊 Database Overview

**Database Name:** "The Bean Keeper - Coffee Collection"

This database is automatically created in the user's Notion workspace when they connect via OAuth.

---

## 🗂️ Database Properties (15 Columns)

### 1. **Name** (Title)
- **Type:** Title (Primary field)
- **Format:** `[Roaster Name] - [Origin]`
- **Example:** "Blue Bottle Coffee - Ethiopia"
- **Required:** Yes

### 2. **Roaster** (Rich Text)
- **Type:** Rich Text
- **Description:** Coffee roaster/brand name
- **Example:** "Blue Bottle Coffee", "Intelligentsia", "Counter Culture"

### 3. **Website** (URL)
- **Type:** URL
- **Description:** Roaster's website
- **Example:** "https://bluebottlecoffee.com"
- **Clickable:** Yes

### 4. **Address** (Rich Text)
- **Type:** Rich Text
- **Description:** Full roaster address
- **Example:** "300 Webster St, Oakland, CA 94607"

### 5. **Farm** (Rich Text)
- **Type:** Rich Text
- **Description:** Farm or estate name
- **Example:** "Koke Washing Station", "Los Alpes Farm"

### 6. **Origin** (Select - Single Choice)
- **Type:** Select
- **Options with Colors:**
  - 🟢 Ethiopia (green)
  - 🟡 Colombia (yellow)
  - 🟠 Kenya (orange)
  - 🟤 Brazil (brown)
  - 🔴 Indonesia (red)
  - 🔵 Guatemala (blue)
  - 🟣 Costa Rica (purple)
  - 🩷 Peru (pink)
  - ⚫ Honduras (gray)

### 7. **Variety** (Multi-Select)
- **Type:** Multi-select (can select multiple)
- **Options with Colors:**
  - 🟤 Bourbon (brown)
  - 🟡 Typica (yellow)
  - 🟢 Gesha (green)
  - 🟠 Caturra (orange)
  - 🔴 SL28 (red)
  - 🩷 SL34 (pink)
  - 🟣 Heirloom (purple)

### 8. **Process** (Select - Single Choice)
- **Type:** Select
- **Options with Colors:**
  - 🔵 Washed (blue)
  - 🟢 Natural (green)
  - 🟡 Honey (yellow)
  - 🔴 Anaerobic (red)
  - 🟣 Carbonic Maceration (purple)

### 9. **Roast Date** (Date)
- **Type:** Date
- **Format:** MM/DD/YYYY
- **Example:** "12/01/2025"

### 10. **Flavor Notes** (Multi-Select)
- **Type:** Multi-select
- **Options with Colors:**
  - 🟤 Chocolate (brown)
  - 🟠 Citrus (orange)
  - 🩷 Floral (pink)
  - 🟣 Berry (purple)
  - 🟤 Nutty (brown)
  - 🟡 Caramel (yellow)
  - 🔴 Fruity (red)
  - 🟠 Spicy (orange)
  - 🟢 Herbal (green)
  - 🟢 Tea-like (green)

### 11. **Rating** (Number)
- **Type:** Number
- **Format:** 1-5 scale
- **Example:** 4.5

### 12. **Tasting Notes** (Rich Text)
- **Type:** Rich Text
- **Description:** User's personal tasting notes
- **Example:** "Bright acidity with blueberry sweetness. Clean finish with jasmine aroma."

### 13. **Weight** (Rich Text)
- **Type:** Rich Text
- **Description:** Package weight
- **Example:** "250g", "12oz", "1lb"

### 14. **Price** (Rich Text)
- **Type:** Rich Text
- **Description:** Price paid
- **Example:** "$18.99", "15€", "£12.50"

### 15. **Purchase Again** (Checkbox)
- **Type:** Checkbox
- **Description:** Would purchase again
- **Values:** ✅ Yes / ⬜ No

### 16. **Front Photo** (URL)
- **Type:** URL
- **Description:** Link to front coffee bag photo
- **Displays:** As image preview in Notion

### 17. **Back Photo** (URL)
- **Type:** URL
- **Description:** Link to back coffee bag photo
- **Displays:** As image preview in Notion

### 18. **App ID** (Rich Text)
- **Type:** Rich Text
- **Description:** UUID from The Bean Keeper app (for sync tracking)
- **Hidden:** Can be hidden in view
- **Example:** "a7b3c2d1-e4f5-6789..."

### 19. **Created** (Created Time)
- **Type:** Created Time (auto-populated)
- **Description:** When the entry was created in Notion
- **Auto-filled:** Yes

---

## 📋 Example Entry

Here's what a complete coffee entry looks like:

| Property | Value |
|----------|-------|
| **Name** | Blue Bottle Coffee - Ethiopia |
| **Roaster** | Blue Bottle Coffee |
| **Website** | https://bluebottlecoffee.com |
| **Address** | 300 Webster St, Oakland, CA 94607 |
| **Farm** | Koke Washing Station |
| **Origin** | 🟢 Ethiopia |
| **Variety** | 🟣 Heirloom |
| **Process** | 🔵 Washed |
| **Roast Date** | 12/01/2025 |
| **Flavor Notes** | 🟣 Berry, 🩷 Floral, 🟢 Tea-like |
| **Rating** | 5 ⭐ |
| **Tasting Notes** | Bright blueberry notes with jasmine aroma... |
| **Weight** | 12oz |
| **Price** | $18.99 |
| **Purchase Again** | ✅ |
| **Front Photo** | 🖼️ [Photo Link] |
| **Back Photo** | 🖼️ [Photo Link] |
| **App ID** | abc-123-def |
| **Created** | Dec 8, 2025 10:30 AM |

---

## 🎨 Default Database Views

The database comes with a default **Table View** showing all properties.

### Suggested Additional Views You Can Create:

#### 1. **Gallery View** (Photo Grid)
- Group by: Origin
- Card Preview: Front Photo
- Card Size: Large
- Properties shown: Name, Rating, Flavor Notes

#### 2. **By Origin** (Board View)
- Group by: Origin
- Sort by: Rating (descending)
- Show: Name, Roaster, Rating, Purchase Again

#### 3. **Favorites** (Filtered Table)
- Filter: Rating ≥ 4 OR Purchase Again = ✅
- Sort by: Rating (descending)

#### 4. **Recent Purchases** (Timeline)
- View as: Timeline
- Date property: Roast Date
- Group by: Month

#### 5. **By Roaster** (Board View)
- Group by: Roaster
- Sort by: Roast Date (newest first)

---

## 🔗 Data Mapping (App → Notion)

| App Field | Notion Property | Type | Notes |
|-----------|----------------|------|-------|
| `roasterName` | Name + Roaster | Title + Text | Combined in Name field |
| `roasterWebsite` | Website | URL | Clickable link |
| `roasterAddress` | Address | Rich Text | Full address |
| `farm` | Farm | Rich Text | Estate/farm name |
| `origin` | Origin | Select | Single choice |
| `variety` | Variety | Multi-select | Can be multiple |
| `processMethod` | Process | Select | Single choice |
| `roastDate` | Roast Date | Date | Converted to date format |
| `flavorNotes[]` | Flavor Notes | Multi-select | Array → tags |
| `rating` | Rating | Number | 1-5 scale |
| `tastingNotes` | Tasting Notes | Rich Text | Long form text |
| `weight` | Weight | Rich Text | With units |
| `price` | Price | Rich Text | With currency |
| `purchaseAgain` | Purchase Again | Checkbox | Boolean |
| `frontPhotoUrl` | Front Photo | URL | Image link |
| `backPhotoUrl` | Back Photo | URL | Image link |
| `id` | App ID | Rich Text | UUID reference |
| `createdAt` | Created | Created Time | Auto timestamp |

---

## 🎯 How to Access Your Database

Once you connect with Notion:

1. **Automatic Creation:**
   - OAuth flow creates database in your workspace
   - Named "The Bean Keeper - Coffee Collection"
   - Pre-configured with all properties

2. **Location:**
   - Lives in a page called "The Bean Keeper"
   - In your main workspace
   - Can be moved anywhere you want

3. **Customize:**
   - Add/remove properties
   - Create custom views
   - Change colors and icons
   - Set up filters and sorts

4. **Share:**
   - Share with team members
   - Embed in other Notion pages
   - Export to CSV if needed

---

## 📱 Visual Preview

```
┌────────────────────────────────────────────────────────────┐
│  🗂️  The Bean Keeper - Coffee Collection                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Table View  │  Gallery View  │  By Origin  │  Favorites  │
│  ──────────────────────────────────────────────────────   │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Name ▼           │ Origin     │ Rating │ 🖼️      │    │
│  ├──────────────────────────────────────────────────┤    │
│  │ Blue Bottle -    │ 🟢 Ethiopia │   5   │ [Photo] │    │
│  │ Ethiopia         │            │   ⭐⭐⭐⭐⭐ │         │    │
│  ├──────────────────────────────────────────────────┤    │
│  │ Intelligentsia - │ 🟡 Colombia │   4   │ [Photo] │    │
│  │ Colombia         │            │   ⭐⭐⭐⭐  │         │    │
│  ├──────────────────────────────────────────────────┤    │
│  │ Counter Culture -│ 🟠 Kenya    │   5   │ [Photo] │    │
│  │ Kenya            │            │   ⭐⭐⭐⭐⭐ │         │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  + New                                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Customization Options

Users can customize their database:

### Add Custom Properties:
- Brew methods used
- Grind size notes
- Best brewing temperature
- Coffee shop where purchased
- Gift vs. personal purchase
- Subscription info

### Create Formulas:
- Days since roast date
- Price per ounce
- Value rating (quality/price)
- Reorder reminder

### Add Relations:
- Link to brewing recipes
- Link to coffee shop database
- Link to origin country pages

---

## 📊 Statistics You Can Track

With this database structure, users can:
- 📈 See most common origins
- ⭐ Track average ratings by roaster
- 💰 Calculate total coffee spending
- 🔄 Identify most repurchased beans
- 📅 Monitor roast date freshness
- 🎨 Analyze favorite flavor profiles

---

## 🚀 Benefits of Notion Database

1. **Mobile Access** - View on phone/tablet
2. **Offline Access** - Works without internet
3. **Powerful Filtering** - Find specific coffees fast
4. **Custom Views** - Organize your way
5. **Sharing** - Share with friends
6. **Export** - CSV, PDF, Markdown
7. **AI Features** - Notion AI summaries
8. **Integrations** - Connect to other tools

---

## 💡 Pro Tips

1. **Use Gallery View** for a visual coffee collection
2. **Add covers** to make entries stand out
3. **Create templates** for quick entry
4. **Use formulas** for advanced tracking
5. **Link databases** to brewing notes
6. **Set reminders** to use beans before stale

---

This database structure is automatically created when users connect The Bean Keeper to Notion via OAuth!
