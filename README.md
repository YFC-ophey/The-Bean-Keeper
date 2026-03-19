# The Bean Keeper

A mobile-first coffee tracking application that integrates multiple AI providers (Groq/Llama, Google Gemini, Tesseract OCR) to automatically extract, structure, and enrich coffee data from bag label photos.

![The Bean Keeper](client/public/logo.jpeg)

**Live:** [the-bean-keeper.onrender.com](https://the-bean-keeper.onrender.com)

## Why This Project

This started as a personal tool and became a proving ground for multi-provider AI integration. Each AI provider was selected for what it does best:

- **Groq (Llama 3.1 8B)** for structured data extraction: fast inference, JSON mode, low cost per call. Chosen over GPT/Claude for this task because extraction needs speed, not reasoning depth.
- **Google Gemini Pro** for video generation pipeline: multimodal capabilities for converting screen recordings into polished product demos.
- **Tesseract.js** for client-side OCR: runs in the browser, zero API cost, handles multilingual text (English + Chinese).
- **ElevenLabs** for voice synthesis in the video pipeline.

The architecture uses fallback logic between providers. If AI extraction fails, regex-based extraction catches common patterns. If cloud storage fails, local filesystem takes over. Every external dependency has a graceful degradation path.

## Features

- **AI-Powered Extraction**: Upload coffee bag photos. AI extracts roaster, origin, variety, process method, roast level, and more.
- **Bilingual Interface**: Full English and Traditional Chinese support with auto-detection
- **Notion OAuth**: Multi-user auth where each user gets their own isolated Notion database
- **Guest Mode**: Browse the owner's collection without logging in (read-only)
- **Advanced Filtering**: Filter by roast level, rating, origin with dynamic sort
- **AI Video Pipeline**: Converts screen recordings into product demos (Remotion + Gemini + ElevenLabs) at $0 cost
- **Mobile-First**: Dual photo upload (camera + file picker), responsive 2-5 column grid

## Tech Stack

### AI / ML Pipeline
| Layer | Provider | Why This Provider |
|-------|----------|-------------------|
| OCR | Tesseract.js (client-side) | Zero API cost, browser-native, multilingual |
| Data extraction | Groq AI (Llama 3.1 8B) | Fast inference, JSON mode, structured output |
| Video generation | Gemini Pro (Google) | Multimodal, long context for video scripts |
| Voice synthesis | ElevenLabs | Natural speech for product demos |
| Fallback | Regex patterns | Graceful degradation when AI fails |

### Application
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript, Notion SDK, Cloudinary
- **Auth**: Notion OAuth 2.0 with session management
- **Deployment**: Render.com with Cloudinary for persistent photo storage

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Groq API key ([groq.com](https://groq.com))
- Notion Internal Integration ([notion.so/my-integrations](https://notion.so/my-integrations))
- Google Maps API key (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/YFC-ophey/The-Bean-Keeper.git
cd the-bean-keeper

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

Visit `http://localhost:5000`

## 🔑 Environment Variables

Create a `.env` file with:

```env
# Required
GROQ_API_KEY=your_groq_api_key
NOTION_API_KEY=your_notion_internal_integration_token
NOTION_DATABASE_ID=your_notion_database_id

# Optional
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
PORT=5000
```

See [`.env.example`](.env.example) for details.

## 🗄️ Database Setup

### Option 1: Create Notion Database Automatically

```bash
# Create a page in Notion and get its ID
# Then run:
npx tsx create-database.ts <notion-page-id>
```

### Option 2: Manual Setup

See [`NOTION_DATABASE_STRUCTURE.md`](NOTION_DATABASE_STRUCTURE.md) for the complete schema.

## 📱 Deployment

### Deploy to Render (Free)

Full deployment guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)

Quick start: [`DEPLOY_QUICK_START.md`](DEPLOY_QUICK_START.md)

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push

# 2. Create web service on Render
# 3. Connect GitHub repository
# 4. Add environment variables
# 5. Deploy!
```

Auto-deploys on every `git push` to main branch.

## 🧪 Development

```bash
# Development server
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Production server
npm start

# Test Groq AI extraction
npx tsx test-groq.ts

# Test Notion connection
npx tsx test-notion-setup.ts
```

## 📸 Screenshots

### Dashboard
Mobile-first grid layout with Instagram-style coffee cards

### AI Extraction
Upload photo → AI extracts roaster, origin, variety, process, roast level

### Bilingual Support
Toggle between English and Traditional Chinese

### Statistics
Track your coffee journey with collection insights

## 🗂️ Project Structure

```
The-Bean-Keeper/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── i18n/          # Translations (EN/ZH)
│   │   └── lib/           # API client
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── index.ts           # Server entry
│   ├── routes.ts          # API endpoints
│   ├── groq.ts            # Groq AI client
│   ├── notion.ts          # Notion operations
│   └── notion-storage.ts  # Storage layer
├── shared/                # Shared types
│   └── schema.ts          # TypeScript + Zod schemas
├── DEPLOYMENT.md          # Full deployment guide
├── DEPLOY_QUICK_START.md  # Quick deployment steps
└── CLAUDE.md              # Development guide
```

## 🎨 Key Features Detail

### AI-Powered Extraction
- **OCR**: Tesseract.js extracts raw text from photos
- **AI Processing**: Groq Llama 3.1 8B structures the data
- **Smart Detection**: Automatically identifies roast level, origin, variety
- **Graceful Fallback**: Regex extraction if AI fails

### Internationalization
- Full bilingual support (EN + ZH 繁體中文)
- Automatic language detection
- LocalStorage persistence
- 6 translation namespaces

### Mobile-First Design
- Responsive 2-5 column grid
- Dual photo upload methods
- Touch-optimized interactions
- Vintage coffee journal aesthetic

### Collection Management
- Advanced filtering (roast, rating, origin)
- Multiple sort options
- Duplicate detection
- Statistics dashboard

## 🤝 Contributing

This is a portfolio project, but suggestions are welcome!

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 👨‍💻 Author

**Ophelia Chen**
- Portfolio: Coming Soon
- LinkedIn: https://www.linkedin.com/in/opheliandata/
- GitHub: @YFC-ophey

## 🙏 Acknowledgments

- [Claude Code](https://claude.ai/code) - My Fav Vibe Coding Tool
- [Groq](https://groq.com) - Lightning-fast AI inference
- [Notion](https://notion.so) - Database and API
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Clash Display](https://www.fontshare.com/fonts/clash-display) - Typography
- [Render](https://render.com/) - Cloud Application Platform
- [Cloudinary](https://cloudinary.com/) - Image and Media API Platform

---

**Built with ☕ and AI** | Powered by Groq + Notion
