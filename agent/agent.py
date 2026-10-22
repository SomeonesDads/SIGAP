"""SIGAP Multi-Agent System — Wildfire Response Orchestrator.

Defines 6 specialized sub-agents + 1 root orchestrator using Google ADK
with Gemini 3.5 Flash via Vertex AI (global endpoint).

Agent Hierarchy:
    Wildfire Response Orchestrator (root_agent)
    ├── 1. Perception & Fusion Agent — Data fusion and fire probability assessment
    ├── 2. Risk Scoring Agent — Dynamic priority scoring with contextual reasoning
    ├── 3. Verification Agent — Pre-dispatch verification decision-making
    ├── 4. Routing & Dispatch Agent — Multi-resource optimal assignment
    ├── 5. Coordination Agent — Field communication and escalation
    └── 6. Feedback & Learning Agent — Post-incident evaluation and weight updates
"""

from functools import cached_property
import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import Client
from google.genai import types as genai_types
from google.adk.tools import agent_tool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.tools import url_context

from agent.prompts.instructions import (
    COORDINATION_INSTRUCTION,
    DOMAIN_GUARDRAIL_INSTRUCTION,
    FEEDBACK_LEARNING_INSTRUCTION,
    ORCHESTRATOR_INSTRUCTION,
    PERCEPTION_FUSION_INSTRUCTION,
    RISK_SCORING_INSTRUCTION,
    ROUTING_DISPATCH_INSTRUCTION,
    VERIFICATION_INSTRUCTION,
)

# Custom ADK Domain Tool Wrappers (14 tools)
from agent.tools.firms_tool import fetch_hotspots
from agent.tools.earth_engine_tool import fetch_satellite_imagery, assess_image_quality
from agent.tools.unet_tool import segment_burned_area
from agent.tools.geospatial_tool import (
    compute_dnbr,
    compute_burned_area,
    overlay_risk_layers,
)
from agent.tools.priority_tool import (
    score_hotspot_priority,
    rank_all_active_hotspots,
    explain_priority,
    evaluate_fire_impact_loss,
)
from agent.tools.dispatch_tool import (
    optimize_team_assignments,
    estimate_travel_time,
    find_nearest_water_sources,
)

load_dotenv()
logger = logging.getLogger("SIGAP.Agent.Orchestrator")


class GlobalGemini(Gemini):
  """Configures the Vertex AI Gemini client with explicit GCP project and ADC/Service Account credentials."""

  model: str = "gemini-2.5-flash"

  def model_post_init(self, __context: Any) -> None:
    super().model_post_init(__context)
    if self.model == "gemini-3.5-flash":
      object.__setattr__(self, "model", os.getenv("ADK_GEMINI_MODEL", "gemini-2.5-flash"))

  @cached_property
  def api_client(self) -> Client:
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip() or "hackathon-primestep-04"
    location = os.getenv("VERTEX_ADK_LOCATION", "").strip() or (
        "global" if self.model.startswith("gemini-3") else "us-central1"
    )
    sa_json_raw = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "").strip()
    if sa_json_raw:
      try:
        from google.oauth2 import service_account

        sa_info = json.loads(sa_json_raw)
        creds = service_account.Credentials.from_service_account_info(
            sa_info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        return Client(
            vertexai=True,
            project=sa_info.get("project_id") or project_id,
            location=location,
            credentials=creds,
        )
      except Exception as exc:
        logger.debug("Fallback to standard ADC in GlobalGemini: %s", exc)

    return Client(vertexai=True, project=project_id, location=location)


# ---------------------------------------------------------------------------
# Sub-agent helpers: Google Search & URL Context
# ---------------------------------------------------------------------------

perception___fusion_agent_google_search_agent = LlmAgent(
  name='Perception___Fusion_Agent_google_search_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Agent specialized in performing Google searches for wildfire, hotspot, and meteorological reports.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool ONLY to find information related to Indonesian wildfires (karhutla), satellite hotspots, BMKG weather, or disaster reports. Refuse any off-topic web searches.',
  tools=[
    GoogleSearchTool()
  ],
)
perception___fusion_agent_url_context_agent = LlmAgent(
  name='Perception___Fusion_Agent_url_context_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Agent specialized in fetching wildfire and environmental content from URLs.'
  ),
  sub_agents=[],
  instruction='Use the UrlContextTool ONLY to retrieve content related to wildfires, satellite telemetry, weather, or disaster management.',
  tools=[
    url_context
  ],
)

# ---------------------------------------------------------------------------
# Agent 1: Perception & Fusion
# ---------------------------------------------------------------------------

perception_fusion = LlmAgent(
  name='perception_fusion',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Menyatukan data titik panas dari berbagai sumber (FIRMS, Sipongi, BMKG) dan menilai probabilitas kebakaran nyata.'
  ),
  sub_agents=[],
  instruction=f"{PERCEPTION_FUSION_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    fetch_hotspots,
    fetch_satellite_imagery,
    assess_image_quality,
    agent_tool.AgentTool(agent=perception___fusion_agent_google_search_agent),
    agent_tool.AgentTool(agent=perception___fusion_agent_url_context_agent)
  ],
)

# ---------------------------------------------------------------------------
# Agent 2: Risk Scoring
# ---------------------------------------------------------------------------

risk_scoring = LlmAgent(
  name='risk_scoring',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Menghitung skor prioritas dinamis berdasarkan jenis lahan, arah angin, histori kebakaran, jarak ke pemukiman, dan valuasi dampak.'
  ),
  sub_agents=[],
  instruction=f"{RISK_SCORING_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    score_hotspot_priority,
    rank_all_active_hotspots,
    explain_priority,
    overlay_risk_layers,
    evaluate_fire_impact_loss,
  ],
)

# ---------------------------------------------------------------------------
# Agent 3: Verification
# ---------------------------------------------------------------------------

verification_agent = LlmAgent(
  name='verification_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Menilai dan memutuskan perlunya verifikasi pendahuluan (drone, citra satelit resolusi tinggi, atau warga) sebelum tim darat dikirim.'
  ),
  sub_agents=[],
  instruction=f"{VERIFICATION_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    segment_burned_area,
    compute_dnbr,
    compute_burned_area,
  ],
)

# ---------------------------------------------------------------------------
# Agent 4: Routing & Dispatch
# ---------------------------------------------------------------------------

routing___dispatch_agent_google_search_agent = LlmAgent(
  name='Routing___Dispatch_Agent_google_search_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Agent specialized in performing Google searches for road access, terrain, and firefighting logistics.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool ONLY to find information on road accessibility, water sources, and emergency firefighting logistics. Refuse off-topic searches.',
  tools=[
    GoogleSearchTool()
  ],
)
routing_dispatch = LlmAgent(
  name='routing_dispatch',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Mengoptimalkan penugasan banyak tim ke banyak titik api berdasarkan akses medan riil dan ketersediaan sumber air.'
  ),
  sub_agents=[],
  instruction=f"{ROUTING_DISPATCH_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    optimize_team_assignments,
    estimate_travel_time,
    find_nearest_water_sources,
    agent_tool.AgentTool(agent=routing___dispatch_agent_google_search_agent)
  ],
)

# ---------------------------------------------------------------------------
# Agent 5: Coordination
# ---------------------------------------------------------------------------

coordination_agent = LlmAgent(
  name='coordination_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Menyusun komunikasi operasional lapangan, memantau pembaruan ETA, dan mengidentifikasi eskalasi darurat bagi pengambil keputusan.'
  ),
  sub_agents=[],
  instruction=f"{COORDINATION_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    estimate_travel_time,
    explain_priority,
  ],
)

# ---------------------------------------------------------------------------
# Agent 6: Feedback & Learning
# ---------------------------------------------------------------------------

feedback_learning = LlmAgent(
  name='feedback_learning',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Mengevaluasi akurasi keputusan pasca-insiden dan menghitung valuasi kerugian ekonomi/ekologis untuk memperbarui bobot sistem.'
  ),
  sub_agents=[],
  instruction=f"{FEEDBACK_LEARNING_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    score_hotspot_priority,
    compute_burned_area,
    evaluate_fire_impact_loss,
  ],
)

# ---------------------------------------------------------------------------
# Root Orchestrator + its helper sub-agents
# ---------------------------------------------------------------------------

wildfire_response_orchestrator_google_search_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator_google_search_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Agent specialized in performing Google searches for wildfire and disaster context.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool ONLY to find information related to Indonesian forest/land fires (karhutla), meteorology, and disaster response. Refuse any off-topic searches.',
  tools=[
    GoogleSearchTool()
  ],
)
wildfire_response_orchestrator_url_context_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator_url_context_agent',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Agent specialized in fetching wildfire and disaster content from URLs.'
  ),
  sub_agents=[],
  instruction='Use the UrlContextTool ONLY to retrieve content from URLs related to wildfire monitoring, weather, or emergency response.',
  tools=[
    url_context
  ],
)
root_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator',
  model=GlobalGemini(model='gemini-2.5-flash'),
  description=(
      'Mengorkestrasi seluruh alur respons penanggulangan karhutla dan mendelegasikan tugas ke 6 sub-agent spesialis.'
  ),
  sub_agents=[perception_fusion, risk_scoring, verification_agent, routing_dispatch, coordination_agent, feedback_learning],
  instruction=ORCHESTRATOR_INSTRUCTION,
  tools=[
    fetch_hotspots,
    score_hotspot_priority,
    evaluate_fire_impact_loss,
    optimize_team_assignments,
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_google_search_agent),
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_url_context_agent),
  ],
)

# ---------------------------------------------------------------------------
# Live Google ADK Session & Runner Singleton for Backend Integration
# ---------------------------------------------------------------------------

_ADK_APP_NAME = "sigap_wildfire_orchestrator"
_adk_session_service = InMemorySessionService()
_adk_runner = Runner(
    agent=root_agent,
    app_name=_ADK_APP_NAME,
    session_service=_adk_session_service,
)


async def run_adk_orchestrator_chat(
    session_id: str,
    user_message: str,
    telemetry_context: str = "",
    user_id: str = "sigap-commander",
) -> dict[str, Any]:
  """Execute a live turn through the Google ADK root_agent (Runner + InMemorySessionService).

  Tracks sub-agents invoked and ADK tools called during the multi-agent execution trace.
  """
  from google.adk.agents.run_config import RunConfig

  clean_session_id = (session_id or "inv-live-session").strip()
  existing = await _adk_session_service.get_session(
      app_name=_ADK_APP_NAME,
      user_id=user_id,
      session_id=clean_session_id,
  )
  if existing is None:
    await _adk_session_service.create_session(
        app_name=_ADK_APP_NAME,
        user_id=user_id,
        session_id=clean_session_id,
    )

  if telemetry_context:
    combined_prompt = (
        f"PERTANYAAN PENGGUNA: {user_message}\n\n"
        "INSTRUKSI EKSEKUSI CEPAT ADK:\n"
        "- Data telemetri satelit live (FIRMS, STAC Sentinel-2, DINOv3 BurnSeg, MCDA, Valuasi Kerugian, & 5 Sektor Taktis POS-1..POS-4/UDP-1) sudah tersedia di bawah.\n"
        "- WAJIB panggil tepat 1 tool ADK yang paling relevan dengan pertanyaan pengguna (`evaluate_fire_impact_loss` untuk kerugian/dampak, `score_hotspot_priority` untuk risiko/prioritas, atau `optimize_team_assignments` untuk alokasi taktis) tanpa transfer berantai ke sub-agent lain, lalu susun jawaban akhir komprehensif dalam Bahasa Indonesia.\n\n"
        f"[KONTEKS TELEMETRI SATELIT & SEKTOR TAKTIS LIVE SAAT INI]:\n{telemetry_context}"
    )
  else:
    combined_prompt = (
        f"PERTANYAAN PENGGUNA: {user_message}\n\n"
        "INSTRUKSI EKSEKUSI CEPAT ADK: Panggil maksimal 1-2 tool yang paling relevan (misalnya `fetch_hotspots`, `score_hotspot_priority`, `evaluate_fire_impact_loss`, atau `optimize_team_assignments`) langsung dari orkestrator lalu berikan laporan komprehensif dalam Bahasa Indonesia tanpa melakukan transfer sub-agent berulang."
    )

  content = genai_types.Content(
      role="user",
      parts=[genai_types.Part.from_text(text=combined_prompt)],
  )

  agents_invoked: list[str] = []
  tools_called: list[str] = []
  final_texts: list[str] = []
  all_texts: list[str] = []

  run_cfg = RunConfig(max_llm_calls=4)

  async for event in _adk_runner.run_async(
      user_id=user_id,
      session_id=clean_session_id,
      new_message=content,
      run_config=run_cfg,
  ):
    author = getattr(event, "author", None)
    if author and author not in agents_invoked:
      agents_invoked.append(str(author))

    evt_content = getattr(event, "content", None)
    parts = getattr(evt_content, "parts", None) or []
    for part in parts:
      fn_call = getattr(part, "function_call", None)
      if fn_call and getattr(fn_call, "name", None):
        fn_name = str(fn_call.name)
        if fn_name not in tools_called:
          tools_called.append(fn_name)
      txt = getattr(part, "text", None)
      if txt and str(txt).strip():
        all_texts.append(str(txt).strip())
        if hasattr(event, "is_final_response") and event.is_final_response():
          final_texts.append(str(txt).strip())

  response_text = "\n\n".join(final_texts).strip() if final_texts else ("\n\n".join(all_texts[-1:]).strip())
  return {
      "response": response_text,
      "agents_invoked": agents_invoked or ["Wildfire_Response_Orchestrator"],
      "tools_called": tools_called,
      "model_used": f"google-adk/{root_agent.model.model if isinstance(root_agent.model, GlobalGemini) else 'gemini-2.5-flash'}",
  }



