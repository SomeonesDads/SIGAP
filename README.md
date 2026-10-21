# SIGAP — Agen Karhutla
### Autonomous Wildfire Investigation & Response Prioritization Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-Multi--Agent-4285F4?style=flat&logo=google&logoColor=white)](https://google.github.io/adk-docs/)
[![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-U--Net-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**SIGAP (Agen Karhutla)** is an AI-powered autonomous platform for wildfire monitoring, investigation, and operational response prioritization in Indonesia. The system unifies real-time thermal hotspot anomaly detection, multi-spectral satellite imagery acquisition, deep learning-based burned area segmentation, spectral burn severity analysis (dNBR), and multi-criteria risk ranking into a streamlined multi-agent workflow.

Unlike conventional passive monitoring dashboards, SIGAP incorporates a **Multi-Agent AI System** powered by [Google ADK](https://google.github.io/adk-docs/) with **6 specialized agents** orchestrated by a root Wildfire Response Orchestrator running on **Gemini 3.5 Flash**. The system goes beyond detection and notification — it performs strategic resource allocation across thousands of simultaneous hotspots, continuously adapting as conditions change.

**Key architectural difference from rule-based systems:**

> **Traditional:** Hotspot detected → match nearest village → create ticket → alert team → escalate if no response. *Linear, static, per-ticket.*
>
> **Agentic:** Hotspot detected → Perception Agent assesses credibility → Verification Agent checks if confirmation is needed → Risk Scoring Agent scores *relative to ALL active hotspots* → Routing Agent optimizes team assignments *across all available resources* → Coordination Agent executes and monitors → if conditions change, *the entire plan is recomposed*. *Cyclic, adaptive, cross-ticket.*

---

## 🎯 Target Users & Operational Stakeholders

- **BPBD (Badan Penanggulangan Bencana Daerah)** — Regional disaster management agencies coordinating emergency ground response and community evacuation.
- **Manggala Agni (KLHK)** — Fire brigade under the Ministry of Environment and Forestry tasked with ground suppression, firebreaks, and mop-up operations.
- **KPH (Kesatuan Pengelolaan Hutan)** — Forest Management Units responsible for monitoring forest concessions and community forest perimeters.
- **Fire Analysis & GIS Teams** — Remote sensing analysts assessing post-fire damage, carbon loss estimation, and environmental compliance.

---

## 🤖 Multi-Agent Architecture (6 Agents)

| Agent | Role |
|---|---|
| **1. Perception & Fusion** | Fuses data from FIRMS, Sipongi, BMKG, and field reports. Resolves conflicts across sensors and assesses *"what is the probability this is a real fire?"* |
| **2. Risk Scoring** | Dynamic priority scoring using reasoning over land type, wind direction, settlement proximity, cluster growth trends, and historical fire recurrence. Weights adapt by season/context. |
| **3. Verification** | Decides whether a hotspot needs pre-dispatch verification (drone, hi-res imagery, community confirmation) by weighing false-positive cost vs. delayed-response risk. |
| **4. Routing & Dispatch** | Solves many-to-many assignment optimization: given N teams and M priority hotspots, which combination minimizes total loss? Uses real road access, water sources, and terrain — not straight-line distance. |
| **5. Coordination** | Two-way communication with field crews, real-time ETA updates, obstacle handling, and human supervisor escalation for high-risk decisions (e.g., civilian evacuation). |
| **6. Feedback & Learning** | Post-incident evaluation: were the priorities correct? How accurate was the initial confidence? Results update Risk Scoring weights — the system improves over time. |

> See [`agents.md`](agents.md) for the full agent architecture documentation.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Natural Language Command** | Multi-turn conversational interface accepting Indonesian commands (e.g. *"Analisis potensi kebakaran di Pulang Pisau 7 hari terakhir, prioritaskan lahan gambut"*). Formulates and executes multi-step investigation plans. |
| **Hotspot Detection & Clustering** | Ingests near-real-time thermal anomaly data from **NASA FIRMS** (VIIRS / MODIS) and performs spatial clustering (DBSCAN / distance heuristics) to identify high-density ignition candidates. |
| **Autonomous Satellite Retrieval** | Automatically queries and downloads pre- and post-fire **Landsat 8/9** and **Sentinel-2** surface reflectance bands via **Google Earth Engine (GEE)** with automatic cloud-mask evaluation and fallback date selection. |
| **Burned Area Segmentation** | Employs a custom deep learning **U-Net (PyTorch)** model trained on Indonesian tropical forest/peatland datasets to produce high-resolution pixel-level burn scar segmentation masks. |
| **Fire Severity Assessment (dNBR)** | Computes Differenced Normalized Burn Ratio to categorize burn severity based on standard USGS classifications. |
| **Risk-Based Prioritization** | Scores and ranks investigation targets according to proximity to peatlands (*lahan gambut*), human settlements (*permukiman*), conservation forests, and current wind vectors. |
| **Automated AI Briefings & Reports** | Generates exportable investigation dossiers and PDF field briefings (via WeasyPrint) containing spatial maps, calculated burned hectares, confidence scores, and audit trails. |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Styling & UI:** Tailwind CSS, Lucide React
- **Geospatial Visualization:** Leaflet / MapLibre GL, React-Leaflet
- **State & Data Fetching:** React hooks

### Backend & Agent Orchestration
- **API Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Agent Framework:** [Google ADK](https://google.github.io/adk-docs/) (Agent Development Kit)
- **LLM Engine:** [Gemini 3.5 Flash](https://ai.google.dev/) via Vertex AI (global endpoint)
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
├── agent/                          # Google ADK multi-agent system
│   ├── agent.py                    # Agent definitions (6 sub-agents + orchestrator)
│   ├── config.py                   # Agent configuration constants
│   ├── tools/                      # ADK tool wrappers
│   │   ├── firms_tool.py           # FIRMS data retrieval
│   │   ├── earth_engine_tool.py    # GEE imagery tools
│   │   ├── unet_tool.py            # U-Net inference
│   │   ├── geospatial_tool.py      # dNBR, area, overlay
│   │   ├── priority_tool.py        # Risk scoring
│   │   └── dispatch_tool.py        # Route optimization
│   └── prompts/                    # Per-agent instruction templates
├── backend/                        # FastAPI REST API
│   ├── main.py                     # Application entrypoint
│   ├── config.py                   # Settings (pydantic-settings)
│   ├── api/routes/                 # Route handlers
│   ├── models/                     # Pydantic schemas
│   └── services/                   # Business logic
├── frontend/                       # Next.js 15 web application
│   ├── src/app/                    # App Router (5 pages)
│   ├── src/components/             # UI, chat, map, dashboard
│   ├── src/hooks/                  # Custom React hooks
│   └── src/lib/                    # API client, types, utils
├── ml/                             # PyTorch U-Net pipeline
│   └── unet/                       # Model, train, predict, pre/post-processing
├── data/                           # Data integration clients
│   ├── firms/                      # NASA FIRMS API client
│   ├── earth_engine/               # Google Earth Engine client
│   └── geospatial/                 # dNBR, clustering, priority scoring
├── tests/                          # Test suite
├── docs/                           # Architecture documentation
├── scripts/                        # Setup & utility scripts
├── agents.md                       # Agent architecture documentation
├── pyproject.toml                  # Python dependencies & tooling
├── docker-compose.yml              # Local dev stack
└── .env.example                    # Environment variable template
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure the following tools and accounts are available on your system:
- **Python:** 3.11 or higher
- **Node.js:** 20.x or higher (with `npm` or `pnpm`)
- **Docker & Docker Compose:** Latest stable release
- **Google Cloud Project:** With Vertex AI API enabled and Application Default Credentials configured.
- **Google Earth Engine Account:** Registered Google Cloud Project with Earth Engine API enabled and Service Account JSON key.
- **NASA FIRMS MAP Key:** Free API key obtained from [NASA FIRMS API Key](https://firms.modaps.eosdis.nasa.gov/api/map_key/).

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
   GOOGLE_CLOUD_PROJECT=your-gcp-project-id
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
