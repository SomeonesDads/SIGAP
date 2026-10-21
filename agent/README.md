# SIGAP — Google ADK Multi-Agent Wildfire Response System

**SIGAP (Sistem Informasi dan Tanggap Cepat Karhutla)** multi-agent system is built on **Google Agent Development Kit (ADK)** using **Gemini 3.5 Flash** served via Vertex AI's `global` endpoint. It provides autonomous investigation, dynamic situational risk prioritization, and tactical dispatch orchestration for forest and peatland wildfire response in Indonesia (BPBD, Manggala Agni KLHK, and Satgas Karhutla).

---

## 1. System Architecture & Hierarchy

The system consists of **1 root orchestrator** and **6 specialized domain sub-agents**:

```text
Wildfire Response Orchestrator (root_agent)
├── 1. Perception & Fusion Agent (perception_fusion)
│   ├── Data fusion from FIRMS, Sipongi+, and BMKG feeds
│   └── Tools: GoogleSearchTool, UrlContextTool, firms_tool
├── 2. Risk Scoring Agent (risk_scoring)
│   ├── Dynamic multi-factor risk scoring (peat depth, settlements, wind, recurrence)
│   └── Tools: priority_tool, geospatial_tool
├── 3. Verification Agent (verification_agent)
│   ├── Pre-dispatch decision-making (drone, satellite, community spot-check)
│   └── Weighs false-alarm costs against peatland smoldering risks
├── 4. Routing & Dispatch Agent (routing_dispatch)
│   ├── Multi-resource optimal assignment (Manggala Agni, BPBD, MPA)
│   ├── Evaluates real road/canal friction and water source proximity
│   └── Tools: GoogleSearchTool, dispatch_tool
├── 5. Coordination Agent (coordination_agent)
│   ├── Field communications, radio briefs, and SITREP generation
│   └── Escalation triggers (civilian evacuations, hazardous PM2.5 / ISPU)
└── 6. Feedback & Learning Agent (feedback_learning)
    ├── Post-incident evaluations (After-Action Review)
    └── Algorithm calibration and weight adjustments
```

---

## 2. Directory Structure

```text
agent/
├── __init__.py                 # Exports root_agent
├── agent.py                    # Root orchestrator and 6 sub-agents definition (ADK)
├── config.py                   # Agent constants, model settings, and defaults
├── README.md                   # System documentation and operational guide
├── prompts/
│   ├── __init__.py             # Exports instruction templates
│   └── instructions.py         # In-depth system prompts with Indonesian wildfire context
└── tools/
    ├── __init__.py             # Defines and exports the @agent_tool decorator
    ├── firms_tool.py           # NASA FIRMS active fire query wrapper
    ├── earth_engine_tool.py    # Google Earth Engine satellite imagery & quality audit
    ├── unet_tool.py            # U-Net semantic segmentation inference wrapper
    ├── geospatial_tool.py      # dNBR burn severity, surface area, and risk overlay
    ├── priority_tool.py        # Dynamic priority scoring and 'Why This Area?' explanations
    └── dispatch_tool.py        # Optimal team matching, travel ETA friction, and water sources
```

---

## 3. The `GlobalGemini` Pattern

In Google ADK, models in the `gemini-3` and `gemini-3.5` series are served exclusively from the Vertex AI **`global`** location. The default ADK `Gemini` integration instantiates a `google.genai.Client` using the regional location of your AgentEngine instance (such as `us-central1`), which raises a model-not-found error for `gemini-3.5-flash`.

SIGAP implements the `GlobalGemini` subclass in [`agent/agent.py`](file:///c:/punyanael/SIGAP/SIGAP/agent/agent.py):

```python
from functools import cached_property
from google.adk.models import Gemini
from google.genai import Client

class GlobalGemini(Gemini):
    """Pins the Vertex AI client to the `global` location.

    Subclassing per the override pattern documented on
    `google.adk.models.google_llm.Gemini` allows the agent to run inside
    regional AgentEngine infrastructure while routing model inferences
    to the global endpoint.
    """
    @cached_property
    def api_client(self) -> Client:
        return Client(vertexai=True, location="global")
```

---

## 4. Running the Agent System

### Option A: Interactive ADK Web Interface (`adk web`)
Google ADK includes a built-in development UI for chatting with and evaluating multi-agent systems:

```bash
# Set your Google Cloud project and credentials
export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Launch ADK Web from the SIGAP directory
adk web agent
```

Navigate to `http://localhost:8000` in your browser to interact with the orchestrator, inspect tool calls, and trace sub-agent delegations.

### Option B: Integration with FastAPI Backend
To invoke `root_agent` from FastAPI routes:

```python
from fastapi import FastAPI
from agent.agent import root_agent

app = FastAPI(title="SIGAP Wildfire API")

@app.post("/api/v1/investigate")
async def run_investigation(query: str):
    # Execute query through ADK root_agent
    response = await root_agent.run_async(query)
    return {"response": response}
```

---

## 5. How to Add Custom Tools

SIGAP uses the `@agent_tool` decorator pattern located in [`agent/tools/__init__.py`](file:///c:/punyanael/SIGAP/SIGAP/agent/tools/__init__.py). ADK inspects Python function signatures, type annotations, and docstrings automatically to generate tool schemas for the LLM.

### Step 1: Define Your Tool Function
Create a function in `agent/tools/` with typed arguments and Google-style docstrings:

```python
from agent.tools import agent_tool

@agent_tool
def check_weather_forecast(kabupaten: str) -> dict:
    """Retrieves 3-day rainfall and wind forecast from BMKG.

    Args:
        kabupaten: Name of Regency (e.g., 'Pulang Pisau', 'Ogan Komering Ilir').

    Returns:
        dict: Weather metrics including precipitation probability and wind speed/direction.
    """
    # Tool logic or external API client call here
    return {
        "kabupaten": kabupaten,
        "rainfall_probability": 0.15,
        "wind_speed_kmh": 22.0,
        "wind_direction": "SE",
    }
```

### Step 2: Attach Tool to an Agent in `agent.py`
Add the function to the `tools` list of the target sub-agent:

```python
from agent.tools.weather_tool import check_weather_forecast

risk_scoring = LlmAgent(
    name='risk_scoring',
    model=GlobalGemini(model='gemini-3.5-flash'),
    description='Menghitung skor prioritas dinamis...',
    instruction=...,
    tools=[check_weather_forecast],
)
```

---

## 6. Environment Variables

Configure the following variables in your `.env` file:

| Variable | Description |
| :--- | :--- |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID registered with Vertex AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP Service Account JSON key |
| `FIRMS_MAP_KEY` | NASA FIRMS 32-character API key |
| `GEE_PROJECT_ID` | Earth Engine enabled Google Cloud Project ID |
