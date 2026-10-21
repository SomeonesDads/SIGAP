# SIGAP Backend — FastAPI REST API

The backend for **SIGAP (Agen Karhutla)** provides high-performance REST and streaming endpoints powering the Autonomous Wildfire Investigation & Response Prioritization Platform. It orchestrates real-time NASA FIRMS hotspot anomalies, Google Earth Engine (GEE) satellite retrieval, PyTorch U-Net burned area segmentation, and a **6-agent multi-agent system powered by Google ADK (Agent Development Kit)** and **Gemini 3.5 Flash**.

---

## 🚀 Getting Started

### 1. Requirements

- Python >= 3.11 (compatible with 3.10+)
- Virtual environment (`venv`) with dependencies installed (`fastapi`, `uvicorn`, `pydantic-settings`, etc.)

### 2. Environment Variables

Copy `.env.example` in the project root to `.env` and configure your credentials:

```bash
# Google Cloud & Earth Engine
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
EARTH_ENGINE_PROJECT=your-ee-project-id

# NASA FIRMS API
NASA_FIRMS_API_KEY=your-nasa-firms-api-key

# Database & Cache
DATABASE_URL=postgresql://user:pass@localhost:5432/sigap
REDIS_URL=redis://localhost:6379/0
```

### 3. Run the Development Server

From the project root (`SIGAP`):

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Readiness Check**: [http://localhost:8000/ready](http://localhost:8000/ready)

---

## 📡 API Routes Overview

All core endpoints are namespaced under the `/api` prefix:

| Method | Endpoint | Description |
|---|---|---|
| **Root & Health** | | |
| `GET` | `/` | Welcome and API index |
| `GET` | `/health` | Liveness health check |
| `GET` | `/ready` | Readiness check (configuration & services) |
| **Investigations** | `/api/investigations` | |
| `POST` | `/api/investigations/` | Trigger a new autonomous wildfire investigation |
| `GET` | `/api/investigations/` | List all investigation history |
| `GET` | `/api/investigations/{id}` | Get detailed status and results for an investigation |
| `POST` | `/api/investigations/{id}/verify` | Submit human verification verdict (`confirmed`, `unconfirmed`, `needs_field_check`) |
| **Chat & Agent Interaction** | `/api/chat` | |
| `POST` | `/api/chat/` | Send conversational commands to the Google ADK root orchestrator |
| `GET` | `/api/chat/{id}/stream` | Server-Sent Events (SSE) stream of real-time agent thoughts and pipeline progress |
| **Hotspots** | `/api/hotspots` | |
| `GET` | `/api/hotspots/` | Retrieve thermal anomalies by region, dates, and satellite sensor |
| `GET` | `/api/hotspots/clusters` | Spatially clustered hotspots (DBSCAN) with centroid and aggregate FRP |
| **Map & Remote Sensing** | `/api/map` | |
| `GET` | `/api/map/layers` | Available base layers and GIS overlays (peatlands, dNBR, satellites) |
| `GET` | `/api/map/imagery/{id}` | Pre- and post-fire Sentinel-2 / Landsat tile metadata |
| `GET` | `/api/map/segmentation/{id}` | Deep learning U-Net burned area scar polygon and metrics |
| **Reports** | `/api/reports` | |
| `GET` | `/api/reports/{id}` | Comprehensive investigation report metadata and synthesized sections |
| `GET` | `/api/reports/{id}/download` | Download synthesized PDF report |
| `GET` | `/api/reports/{id}/export` | Export investigation findings and vector geometries as GeoJSON |

---

## 🤖 Connection to Google ADK Multi-Agent System

SIGAP uses **Google ADK** (Agent Development Kit) rather than LangGraph to achieve autonomous, cyclic reasoning over multi-modal inputs. The FastAPI backend serves as the gateway to the agent hierarchy:

1. **Root Orchestrator (Gemini 3.5 Flash)**:
   - Receives commands from `/api/chat` and `/api/investigations`.
   - Generates dynamic execution plans and coordinates the 6 specialized agents.
2. **The 6 Specialized Agents**:
   - **Perception & Fusion Agent**: Reconciles NASA FIRMS, Sipongi, and BMKG weather feeds.
   - **Verification Agent**: Calculates the cost-benefit trade-off of pre-dispatch verification (drone vs. satellite).
   - **Risk Scoring Agent**: Evaluates peatland vulnerability, fuel moisture, wind vectors, and settlement proximity.
   - **Routing & Dispatch Agent**: Solves resource allocation for Manggala Agni and BPBD field teams.
   - **Coordination Agent**: Manages two-way field messaging and supervisor escalation.
   - **Feedback & Learning Agent**: Ingests field verification outcomes to refine risk weights over time.
3. **Streaming Agent Reasoning**:
   - The `/api/chat/{investigation_id}/stream` SSE endpoint streams step-by-step agent deliberations, tool invocations, and confidence updates directly to the Next.js frontend UI.

---

## 📁 Project Structure

```
backend/
├── __init__.py                # Package docstring
├── main.py                    # FastAPI application, CORS, lifespan, routes
├── config.py                  # Pydantic Settings & environment config
├── api/
│   ├── __init__.py
│   ├── deps.py                # Dependency injection (Settings, FIRMS, GEE)
│   └── routes/
│       ├── __init__.py
│       ├── chat.py            # Chat & SSE streaming endpoints
│       ├── hotspot.py         # Hotspot & clustering endpoints
│       ├── investigation.py   # Investigation lifecycle & human verification
│       ├── map.py             # Map layers, imagery, and segmentation results
│       └── report.py          # Report metadata, PDF download, and GeoJSON export
├── models/
│   ├── __init__.py
│   ├── hotspot.py             # Hotspot, HotspotCluster, HotspotQuery models
│   ├── investigation.py       # InvestigationCreate, Response, Verification models
│   └── report.py              # ReportMetadata, ReportContent models
├── services/
│   ├── __init__.py
│   └── investigation_service.py # Core business logic & agent pipeline orchestration
└── README.md                  # This file
```
