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

from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.genai import Client
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

# Custom ADK Domain Tool Wrappers
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
)
from agent.tools.dispatch_tool import (
    optimize_team_assignments,
    estimate_travel_time,
    find_nearest_water_sources,
)


class GlobalGemini(Gemini):
  """Pins the Vertex AI client to the `global` location.

  gemini-3 series models are only served from `global`; the default ADK
  `Gemini` integration constructs a `google.genai.Client` whose location
  defaults to the AgentEngine instance's region (e.g. `us-central1`) and
  fails with model-not-found for these models. Subclassing per the override
  pattern documented on `google.adk.models.google_llm.Gemini` lets the agent
  keep running in its regional AgentEngine instance while routing the model
  request to the global endpoint.
  """

  @cached_property
  def api_client(self) -> Client:
    return Client(vertexai=True, location="global")


# ---------------------------------------------------------------------------
# Sub-agent helpers: Google Search & URL Context
# ---------------------------------------------------------------------------

perception___fusion_agent_google_search_agent = LlmAgent(
  name='Perception___Fusion_Agent_google_search_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Menghitung skor prioritas dinamis berdasarkan jenis lahan, arah angin, histori kebakaran, dan jarak ke pemukiman.'
  ),
  sub_agents=[],
  instruction=f"{RISK_SCORING_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    score_hotspot_priority,
    rank_all_active_hotspots,
    explain_priority,
    overlay_risk_layers,
  ],
)

# ---------------------------------------------------------------------------
# Agent 3: Verification
# ---------------------------------------------------------------------------

verification_agent = LlmAgent(
  name='verification_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Mengevaluasi akurasi keputusan pasca-insiden untuk memperbarui bobot penilaian dan meningkatkan performa sistem di masa mendatang.'
  ),
  sub_agents=[],
  instruction=f"{FEEDBACK_LEARNING_INSTRUCTION}\n\n{DOMAIN_GUARDRAIL_INSTRUCTION}",
  tools=[
    score_hotspot_priority,
    compute_burned_area,
  ],
)

# ---------------------------------------------------------------------------
# Root Orchestrator + its helper sub-agents
# ---------------------------------------------------------------------------

wildfire_response_orchestrator_google_search_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator_google_search_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
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
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Mengorkestrasi seluruh alur respons penanggulangan karhutla dan mendelegasikan tugas ke 6 sub-agent spesialis.'
  ),
  sub_agents=[perception_fusion, risk_scoring, verification_agent, routing_dispatch, coordination_agent, feedback_learning],
  instruction=ORCHESTRATOR_INSTRUCTION,
  tools=[
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_google_search_agent),
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_url_context_agent)
  ],
)


