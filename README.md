# SIGAP — Agen Karhutla
### Autonomous Wildfire Investigation & Response Prioritization Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent%20Orchestrator-blueviolet?style=flat)](https://langchain-ai.github.io/langgraph/)
[![PyTorch](https://img.shields.io/badge/PyTorch-U--Net-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**SIGAP (Agen Karhutla)** is an AI-powered autonomous platform for wildfire monitoring, investigation, and operational response prioritization in Indonesia. The system unifies real-time thermal hotspot anomaly detection, multi-spectral satellite imagery acquisition, deep learning-based burned area segmentation, spectral burn severity analysis (dNBR), and multi-criteria risk ranking into a streamlined agentic workflow.

Unlike conventional passive monitoring dashboards, SIGAP incorporates an **Agentic AI Orchestrator** powered by LangGraph. Operators can converse in natural language (Bahasa Indonesia) to trigger goal-oriented investigation plans. The agent autonomously selects appropriate geospatial tools, recovers from data hurdles (such as heavy tropical cloud cover), synthesizes spatial evidence, and generates actionable verification dossiers.

---

## 🎯 Target Users & Operational Stakeholders

- **BPBD (Badan Penanggulangan Bencana Daerah)** — Regional disaster management agencies coordinating emergency ground response and community evacuation.
- **Manggala Agni (KLHK)** — Fire brigade under the Ministry of Environment and Forestry tasked with ground suppression, firebreaks, and mop-up operations.
- **KPH (Kesatuan Pengelolaan Hutan)** — Forest Management Units responsible for monitoring forest concessions and community forest perimeters.
- **Fire Analysis & GIS Teams** — Remote sensing analysts assessing post-fire damage, carbon loss estimation, and environmental compliance.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Natural Language Command** | Multi-turn conversational interface accepting Indonesian commands (e.g. *"Analisis potensi kebakaran di Pulang Pisau 7 hari terakhir, prioritaskan lahan gambut"*). Formulates and executes multi-step investigation plans. |
| **Hotspot Detection & Clustering** | Ingests near-real-time thermal anomaly data from **NASA FIRMS** (VIIRS / MODIS) and performs spatial clustering (DBSCAN / distance heuristics) to identify high-density ignition candidates. |
| **Autonomous Satellite Retrieval** | Automatically queries and downloads pre- and post-fire **Landsat 8/9** and **Sentinel-2** surface reflectance bands via **Google Earth Engine (GEE)** with automatic cloud-mask evaluation and fallback date selection. |
| **Burned Area Segmentation** | Employs a custom deep learning **U-Net (PyTorch)** model trained on Indonesian tropical forest/peatland datasets to produce high-resolution pixel-level burn scar segmentation masks. |
| **Fire Severity Assessment (dNBR)** | Computes Differenced Normalized Burn Ratio ($\text{dNBR} = \text{NBR}_{\text{pre}} - \text{NBR}_{\text{post}}$) to categorize burn severity based on standard USGS classifications. |
| **Risk-Based Prioritization** | Scores and ranks investigation targets according to proximity to peatlands (*lahan gambut*), human settlements (*permukiman*), conservation forests, and current wind vectors. |
| **Automated AI Briefings & Reports** | Generates exportable investigation dossiers and PDF field briefings (via WeasyPrint) containing spatial maps, calculated burned hectares, confidence scores, and audit trails. |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Styling & UI:** Tailwind CSS, Radix UI / Shadcn, Lucide React
- **Geospatial Visualization:** Leaflet / MapLibre GL, React-Leaflet
- **State & Data Fetching:** TanStack React Query, Zustand

### Backend & Agent Orchestration
- **API Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Agent Framework:** [LangGraph](https://langchain-ai.github.io/langgraph/) & [LangChain](https://www.langchain.com/)
- **LLM Engine:** OpenAI GPT-4o (structured tool calling & JSON schema validation)
- **Data Validation & Settings:** Pydantic v2 & Pydantic-Settings
- **Background Worker & Cache:** Redis 7

### Machine Learning & Remote Sensing
- **Deep Learning:** [PyTorch](https://pytorch.org/) & torchvision (U-Net architecture)
- **Remote Sensing Data API:** Google Earth Engine (`earthengine-api`), NASA FIRMS API
- **Geospatial Processing:** Rasterio, GeoPandas, Shapely, NumPy, Pillow, Scikit-learn
- **Reporting Engine:** WeasyPrint (HTML to PDF compilation)

---

## 📂 Repository Structure

```text
SIGAP/
├── backend/                        # FastAPI backend & LangGraph agent
│   ├── app/
│   │   ├── agent/                  # LangGraph state machine & graph
│   │   │   ├── graph.py            # Workflow nodes, edges, & routing
│   │   │   ├── state.py            # AgentState definition
│   │   │   └── tools/              # Agent tools (FIRMS, GEE, U-Net, dNBR)
│   │   ├── api/                    # REST API endpoints & route handlers
│   │   ├── core/                   # Configuration, logging, & security
│   │   ├── ml/                     # PyTorch U-Net inference engine
│   │   │   ├── model.py            # U-Net model architecture
│   │   │   └── predict.py          # Segmentation pipeline
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/               # Geospatial, Earth Engine & FIRMS services
│   │   └── main.py                 # FastAPI application entrypoint
│   ├── tests/                      # Pytest unit and integration tests
│   ├── Dockerfile                  # Backend container specification
│   └── requirements.txt            # Python dependencies (exported from pyproject.toml)
├── frontend/                       # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/                    # Next.js App Router (pages & layouts)
│   │   ├── components/             # UI components, Chatbox, & Map viewer
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API client, geospatial helpers & utilities
│   │   └── types/                  # TypeScript interface definitions
│   ├── public/                     # Static assets, icons, base geojson
│   ├── Dockerfile                  # Frontend container specification
│   └── package.json                # Node.js dependencies
├── data/                           # Administrative boundaries, peat maps, samples
│   ├── raw/                        # Raw downloaded satellite & hotspot data
│   └── processed/                  # Processed AOI polygons & test rasters
├── weights/                        # PyTorch model checkpoints (*.pt, *.pth)
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Multi-container local development stack
├── pyproject.toml                  # Python package metadata & tool configuration
└── README.md                       # Main project documentation
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure the following tools and accounts are available on your system:
- **Python:** 3.11 or higher
- **Node.js:** 20.x or higher (with `npm` or `pnpm`)
- **Docker & Docker Compose:** Latest stable release
- **Google Earth Engine Account:** Registered Google Cloud Project with Earth Engine API enabled and Service Account JSON key.
- **NASA FIRMS MAP Key:** Free API key obtained from [NASA FIRMS API Key](https://firms.modaps.eosdis.nasa.gov/api/map_key/).
- **OpenAI API Key:** Access to `gpt-4o` or compatible models.

---

### Step 1: Clone & Configure Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/sigap.git
   cd sigap
   ```

2. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and provide your credentials:
   ```env
   OPENAI_API_KEY=sk-...
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/gee-service-account.json
   EARTH_ENGINE_PROJECT=your-gcp-project-id
   NASA_FIRMS_API_KEY=your-firms-api-key
   DATABASE_URL=postgresql://sigap:sigap_password@localhost:5432/sigap_db
   REDIS_URL=redis://localhost:6379/0
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

---

### Step 2: Option A — Run via Docker Compose (Recommended)

Start the entire stack (FastAPI backend, Next.js frontend, Redis) with a single command:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Redis:** `localhost:6379`

---

### Step 3: Option B — Run Locally for Development

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Linux/macOS:
source .venv/bin/activate
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -e ".[dev]"  # or: pip install -r requirements.txt

# Run FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Run Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the interactive dashboard.

---

## 🧪 Testing & Code Quality

Run tests and linters for the backend:

```bash
# Run unit and integration tests
pytest

# Run Ruff linter and formatter checks
ruff check .
ruff format --check .

# Run static type checking
mypy app
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
