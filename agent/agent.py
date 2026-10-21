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
      'Agent specialized in performing Google searches.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool to find information on the web.',
  tools=[
    GoogleSearchTool()
  ],
)
perception___fusion_agent_url_context_agent = LlmAgent(
  name='Perception___Fusion_Agent_url_context_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Agent specialized in fetching content from URLs.'
  ),
  sub_agents=[],
  instruction='Use the UrlContextTool to retrieve content from provided URLs.',
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
  instruction='You are the Perception and Fusion Agent. Resolve conflicting sensor data and multi-satellite reports (such as FIRMS, Sipongi, BMKG, and field reports). Assess the true confidence level and likelihood of actual fire for each detected hotspot instead of just displaying raw coordinates.',
  tools=[
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
  instruction='You are the Risk Scoring Agent. Calculate dynamic priority scores for detected fire clusters using situational reasoning. Evaluate critical factors including land type (peatland vs. mineral), distance to settlements, wind direction, cluster expansion rates, and historical fire recurrence. Adapt factor weights dynamically according to seasonal severity and local context.',
  tools=[],
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
  instruction='You are the Verification Agent. Determine whether a potential hotspot requires preliminary verification (e.g., drone surveillance, high-resolution satellite imagery, or local community confirmation) prior to dispatching ground crews. Weigh the resource cost of false-positive deployments against the danger of delayed intervention.',
  tools=[],
)

# ---------------------------------------------------------------------------
# Agent 4: Routing & Dispatch
# ---------------------------------------------------------------------------

routing___dispatch_agent_google_search_agent = LlmAgent(
  name='Routing___Dispatch_Agent_google_search_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Agent specialized in performing Google searches.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool to find information on the web.',
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
  instruction='You are the Routing and Dispatch Agent. Solve global multi-resource allocation problems by matching available firefighting teams to priority hotspots. Minimize total estimated loss (burned area and community risk) by evaluating actual road accessibility, terrain friction, and proximity to water sources rather than simple straight-line distances.',
  tools=[
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
  instruction='You are the Coordination Agent. Draft operational messages and updates for field personnel. Track operational progress, update ETAs when obstacles arise, and flag critical situations (such as urgent civilian evacuations) for immediate human supervisor escalation.',
  tools=[],
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
  instruction='You are the Feedback and Learning Agent. Review post-incident data to compare initial confidence assessments and risk scores against actual field outcomes. Recommend adjustments to scoring weights and dispatch logic to continuously enhance system decision accuracy.',
  tools=[],
)

# ---------------------------------------------------------------------------
# Root Orchestrator + its helper sub-agents
# ---------------------------------------------------------------------------

wildfire_response_orchestrator_google_search_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator_google_search_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Agent specialized in performing Google searches.'
  ),
  sub_agents=[],
  instruction='Use the GoogleSearchTool to find information on the web.',
  tools=[
    GoogleSearchTool()
  ],
)
wildfire_response_orchestrator_url_context_agent = LlmAgent(
  name='Wildfire_Response_Orchestrator_url_context_agent',
  model=GlobalGemini(model='gemini-3.5-flash'),
  description=(
      'Agent specialized in fetching content from URLs.'
  ),
  sub_agents=[],
  instruction='Use the UrlContextTool to retrieve content from provided URLs.',
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
  instruction='You are the primary Wildfire Response Orchestrator for managing forest and land fire operations. Coordinate the response workflow by delegating tasks to your specialized sub-agents. Delegate raw hotspot consolidation and confidence assessment to the **Perception & Fusion Agent**. Delegate multi-factor contextual risk modeling to the **Risk Scoring Agent**. Delegate pre-dispatch checking decisions to the **Verification Agent**. Delegate team-to-target assignment optimization to the **Routing & Dispatch Agent**. Delegate field briefing drafts and escalation alerts to the **Coordination Agent**. Delegate post-incident evaluations and parameter adjustments to the **Feedback & Learning Agent**. Synthesize comprehensive situation reports and actionable recommendations for decision-makers.',
  tools=[
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_google_search_agent),
    agent_tool.AgentTool(agent=wildfire_response_orchestrator_url_context_agent)
  ],
)
