<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/HuggingFace-API-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<h1 align="center">📄 PaperLens — AI Academic Paper Summarizer</h1>

<p align="center">
  <strong>Upload any research paper. Get instant multi-level AI summaries, ROUGE-scored quality metrics, and auto-generated literature reviews — all in one beautiful interface.</strong>
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture--data-flow">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-whats-unique">What's Unique</a>
</p>

---

## 🎯 Problem Statement

Researchers spend **hours** reading 30–50 page academic papers. PaperLens solves this by providing:

- **3-level AI summaries** (ELI5 → Technical → Expert) for any paper
- **Section-by-section analysis** — summarize just the methodology, results, or any section you need
- **Quantitative quality scores** — ROUGE-1, ROUGE-2, ROUGE-L metrics to measure summary accuracy
- **Literature review generation** — select multiple papers and get a comparative synthesis

> 💡 *Think of it as ChatGPT for research papers — but with section awareness, compression intelligence, and built-in quality evaluation.*

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📤 **Dual Input** | Upload PDF files or paste arXiv URLs/IDs — both work seamlessly |
| 🔍 **Section-Aware Parsing** | Auto-detects Abstract, Introduction, Methods, Results, Conclusion, and more |
| 🧠 **Multi-Level Summaries** | ELI5 (simple), Technical (standard), Expert (detailed) — one click, three perspectives |
| 📊 **ROUGE Score Evaluation** | ROUGE-1, ROUGE-2, ROUGE-L computed per summary against the original abstract |
| 📚 **Literature Review Generator** | Select 2+ papers → get an AI-generated comparative literature review |
| ⚡ **Smart Text Compression** | Custom extractive compressor reduces tokens by ~40–60% before summarization |
| 🔄 **Fallback Summarizer** | Graceful degradation — if the AI API is down, a local extractive summarizer takes over |
| 🛡️ **Duplicate Detection** | Won't re-process a paper you've already added from arXiv |
| 📈 **Live Stats Dashboard** | Real-time metrics: papers processed, summaries generated, tokens saved, compression ratio |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Responsive SPA with type safety |
| **Backend** | Express.js (Node.js) | REST API with structured routing |
| **Database** | MongoDB Atlas + Mongoose | Document storage with indexing |
| **AI Model** | HuggingFace (`facebook/bart-large-cnn`) | Abstractive summarization via free inference API |
| **Compression** | Custom JS Extractive Compressor | TF-IDF-style sentence scoring for token reduction |
| **PDF Parsing** | `pdf-parse` | Text extraction from uploaded PDFs |
| **Evaluation** | Custom ROUGE Implementation | N-gram overlap scoring (ROUGE-1, ROUGE-2, ROUGE-L) |

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  Dashboard  │  Paper Detail View  │  Literature Review Page     │
└──────┬──────┴────────┬────────────┴──────────┬──────────────────┘
       │               │                       │
       ▼               ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS REST API                             │
│  /api/papers  │  /api/summaries  │  /api/stats  │  /api/health  │
└──────┬────────┴────────┬─────────┴──────┬───────┴───────────────┘
       │                 │                │
       ▼                 ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│  arXiv API   │  │  Compressor │  │  MongoDB     │
│  + PDF Parse │  │  → HF API   │  │  Atlas       │
│              │  │  → ROUGE    │  │              │
└──────────────┘  └─────────────┘  └──────────────┘
```

### Summarization Pipeline

```
User uploads PDF / pastes arXiv URL
        ↓
  PDF text extraction  (pdf-parse / arXiv API)
        ↓
  Section-aware parsing  (regex-based detection of Abstract, Methods, etc.)
        ↓
  Paper saved to MongoDB
        ↓
  User clicks "Generate Summary"
        ↓
  JS compressor reduces tokens  (~40-60% reduction via TF-IDF scoring)
        ↓
  HuggingFace API generates 3 summaries  (ELI5 / Technical / Expert)
        ↓
  Summaries saved to MongoDB
        ↓
  ROUGE scores computed  (against original abstract)
        ↓
  Results displayed with compression stats
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** account ([free tier](https://www.mongodb.com/cloud/atlas/register) works perfectly)

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/AI-Research-Paper-Summarizer.git
cd AI-Research-Paper-Summarizer/paper-summarizer
```

Create `server/.env`:

```env
PORT=3001
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/paper-summarizer
```

### 2. Start the Backend

```bash
cd server
npm install
node src/index.js
# → API running at http://localhost:3001
```

### 3. Start the Frontend

```bash
cd client
npm install
npm run dev
# → App running at http://localhost:5173
```

> 🎉 Open [http://localhost:5173](http://localhost:5173) — upload a PDF or paste an arXiv ID like `2301.13848` to try it out!

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/papers` | List all papers |
| `GET` | `/api/papers/:id` | Get paper with sections & summaries |
| `POST` | `/api/papers/upload` | Upload PDF (multipart/form-data) |
| `POST` | `/api/papers/url` | Fetch from arXiv URL or ID |
| `DELETE` | `/api/papers/:id` | Delete paper + all summaries |
| `POST` | `/api/summaries/generate` | Generate 3-level summary (ELI5/Technical/Expert) |
| `GET` | `/api/summaries/:paperId` | Get all summaries for a paper |
| `GET` | `/api/summaries/rouge/:paperId` | Compute ROUGE scores vs abstract |
| `POST` | `/api/summaries/lit-review` | Generate comparative literature review |
| `GET` | `/api/summaries/lit-reviews/all` | List all literature reviews |
| `GET` | `/api/stats` | Global statistics (papers, summaries, tokens saved) |
| `GET` | `/api/health` | Health check |

---

## 🌟 What's Unique

These features go **beyond the original problem statement** and make PaperLens stand out:

### 1. 🔧 Custom JS Text Compressor (Replaced ScaleDown)
Built a **zero-dependency, in-process extractive compressor** using TF-IDF-style sentence scoring. No Python, no API keys, no latency — runs in milliseconds and achieves **40–60% token reduction**.

### 2. 📑 Section-by-Section Summarization
Not just full-paper summaries — users can generate **individual ELI5/Technical/Expert summaries for each detected section** (Introduction, Methodology, Results, etc.) with one click.

### 3. 📊 Per-Section ROUGE Evaluation
ROUGE-1, ROUGE-2, ROUGE-L scores are computed **per section and per summary level**, giving a granular view of where the summarizer excels and where it struggles.

### 4. 🛡️ Graceful Fallback Summarizer
If the HuggingFace API is unavailable (cold starts, rate limits), a **local position-weighted extractive summarizer** kicks in automatically — the app **never fails to produce a summary**.

### 5. 📈 Live Compression Stats Dashboard
Real-time aggregated metrics computed via MongoDB aggregation — total papers processed, summaries generated, tokens saved, and average compression ratio.

### 6. 🔍 Duplicate Paper Detection
When fetching from arXiv, the system checks if the paper already exists by `sourceId` and returns the existing record — preventing wasted storage and duplicate processing.

### 7. 🔗 Flexible arXiv Input Handling
Accepts **bare IDs** (`2301.13848`), **full URLs** (`https://arxiv.org/abs/2301.13848`), **PDF URLs**, and even **old-style IDs** (`cs/0701127`) with smart regex validation.

---

## 📂 Project Structure

```
paper-summarizer/
├── server/                              # Express Backend (port 3001)
│   ├── .env                             # PORT, MONGO_URI
│   ├── package.json
│   └── src/
│       ├── index.js                     # Entry point + stats endpoint
│       ├── config/db.js                 # MongoDB connection
│       ├── models/
│       │   ├── Paper.js                 # Paper schema (title, sections, tokens)
│       │   ├── Summary.js               # Summary schema (level, ROUGE, compression)
│       │   └── LitReview.js             # Literature review schema
│       ├── routes/
│       │   ├── papers.js                # Upload, arXiv fetch, CRUD
│       │   └── summaries.js             # Generate, ROUGE, lit review
│       └── services/
│           ├── arxiv.js                 # arXiv API integration
│           ├── pdfParser.js             # PDF text extraction
│           ├── sectionParser.js         # Regex-based section detection
│           ├── scaledown.js             # Custom extractive compressor
│           ├── summarizer.js            # HuggingFace API + fallback
│           └── rouge.js                 # ROUGE-1, ROUGE-2, ROUGE-L scorer
│
└── client/                              # React Frontend (port 5173)
    ├── package.json
    ├── index.html
    └── src/
        ├── main.tsx                     # Entry point
        ├── App.tsx                      # Router (3 routes)
        ├── index.css                    # Full design system (~1000+ lines)
        ├── lib/api.ts                   # Axios API client
        ├── pages/
        │   ├── Dashboard.tsx            # Stats + upload + paper grid
        │   ├── PaperView.tsx            # Summaries + ROUGE + section nav
        │   └── LitReview.tsx            # Multi-paper review generator
        └── components/
            ├── Header.tsx               # Nav bar
            ├── UploadPanel.tsx          # Drag-drop PDF + URL input
            ├── SummaryCard.tsx          # Summary with compression stats
            ├── LevelToggle.tsx          # ELI5 / Technical / Expert toggle
            ├── SectionNav.tsx           # Section sidebar navigator
            ├── RougeScores.tsx          # ROUGE bar chart visualization
            └── Toast.tsx                # Toast notifications + confirm modal
```

---

## 🧰 Dependencies

### Backend
`express` · `mongoose` · `cors` · `dotenv` · `multer` · `pdf-parse` · `xml2js` · `axios` · `nodemon`

### Frontend
`react` · `react-dom` · `react-router-dom` · `axios` · `typescript` · `vite`

---

<p align="center">
  Built with ❤️ for academic research
</p>
