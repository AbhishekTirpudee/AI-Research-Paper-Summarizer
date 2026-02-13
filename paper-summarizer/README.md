# 📄 PaperLens — Academic Paper Summarizer

AI-powered academic paper summarizer with multi-level summaries, section-aware parsing, ROUGE score evaluation, and literature review generation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | Express + JavaScript |
| Database | MongoDB Atlas + Mongoose |
| Compression | JS extractive compressor |
| Summarization | HuggingFace free API (`facebook/bart-large-cnn`) |

## Features

- **Paper Input** — Upload PDF or paste arXiv URL/ID
- **Section-Aware Parsing** — Auto-detects Abstract, Introduction, Methods, Results, Conclusion
- **Multi-Level Summaries** — ELI5 (simple), Technical (standard), Expert (detailed)
- **ROUGE Scores** — ROUGE-1, ROUGE-2, ROUGE-L evaluation against the abstract
- **Literature Review** — Select 2+ papers to generate a comparative review
- **Text Compression** — Extractive compressor reduces tokens ~40-60% before summarization
- **Premium Dark UI** — Glassmorphism, gradient accents, micro-animations

## Project Structure

```
paper-summarizer/
├── server/                          # Express Backend (port 3001)
│   ├── .env                         # PORT, MONGO_URI
│   ├── package.json
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── config/db.js             # MongoDB connection
│   │   ├── models/
│   │   │   ├── Paper.js             # Paper schema
│   │   │   ├── Summary.js           # Summary schema (linked to Paper)
│   │   │   └── LitReview.js         # Literature review schema
│   │   ├── routes/
│   │   │   ├── papers.js            # Upload, arXiv fetch, CRUD
│   │   │   └── summaries.js         # Generate, ROUGE, lit review
│   │   └── services/
│   │       ├── arxiv.js             # arXiv API integration
│   │       ├── pdfParser.js         # PDF text extraction (pdf-parse)
│   │       ├── sectionParser.js     # Regex-based section detection
│   │       ├── scaledown.js         # JS extractive compressor
│   │       ├── summarizer.js        # HuggingFace API (bart-large-cnn)
│   │       └── rouge.js             # ROUGE-1, ROUGE-2, ROUGE-L
│   └── bridge/
│       └── compress.py              # (Legacy) Python bridge — not used
│
└── client/                          # React Frontend (port 5173)
    ├── package.json
    ├── index.html
    └── src/
        ├── main.tsx                 # Entry point
        ├── App.tsx                  # Router (3 routes)
        ├── index.css                # Full design system (dark theme)
        ├── lib/api.ts               # Axios API client
        ├── pages/
        │   ├── Dashboard.tsx        # Stats + upload + paper grid
        │   ├── PaperView.tsx        # Summaries + ROUGE + sections
        │   └── LitReview.tsx        # Multi-paper review generator
        └── components/
            ├── Header.tsx           # Nav bar
            ├── UploadPanel.tsx      # Drag-drop PDF + URL input
            ├── SummaryCard.tsx      # Summary with compression stats
            ├── LevelToggle.tsx      # ELI5/Technical/Expert toggle
            ├── SectionNav.tsx       # Section sidebar
            └── RougeScores.tsx      # ROUGE bar chart visualization
```

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Configure Environment

```bash
# server/.env
PORT=3001
MONGO_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/paper-summarizer
```

### 2. Start Backend

```bash
cd server
npm install
node src/index.js
# → http://localhost:3001
```

### 3. Start Frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/papers` | List all papers |
| `GET` | `/api/papers/:id` | Get paper with summaries |
| `POST` | `/api/papers/upload` | Upload PDF (multipart) |
| `POST` | `/api/papers/url` | Fetch from arXiv URL/ID |
| `DELETE` | `/api/papers/:id` | Delete paper + summaries |
| `POST` | `/api/summaries/generate` | Generate 3-level summary |
| `GET` | `/api/summaries/:paperId` | Get summaries for a paper |
| `GET` | `/api/summaries/rouge/:paperId` | ROUGE scores vs abstract |
| `POST` | `/api/summaries/lit-review` | Generate literature review |
| `GET` | `/api/summaries/lit-reviews/all` | List all reviews |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/stats` | Global statistics |

## Data Flow

```
User uploads PDF / pastes arXiv URL
        ↓
  Backend extracts text (pdf-parse / arXiv API)
        ↓
  Section parser splits into academic sections
        ↓
  Paper saved to MongoDB
        ↓
  User clicks "Generate Summary"
        ↓
  JS compressor reduces tokens (~50%)
        ↓
  HuggingFace API generates 3 summaries (ELI5, Technical, Expert)
        ↓
  Summaries saved to MongoDB
        ↓
  ROUGE scores computed against abstract
        ↓
  Results displayed in React UI
```

## Dependencies

### Backend (`server/package.json`)
`express` · `mongoose` · `cors` · `dotenv` · `multer` · `pdf-parse` · `xml2js` · `axios` · `nodemon`

### Frontend (`client/package.json`)
`react` · `react-dom` · `react-router-dom` · `axios` · `typescript` · `vite`
