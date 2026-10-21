"""Agent configuration constants for SIGAP multi-agent system."""

# Default model for all agents
DEFAULT_MODEL = "gemini-3.5-flash"

# Vertex AI location for model serving
VERTEX_AI_LOCATION = "global"

# Agent names
AGENT_NAMES = {
    "orchestrator": "Wildfire_Response_Orchestrator",
    "perception_fusion": "perception_fusion",
    "risk_scoring": "risk_scoring",
    "verification": "verification_agent",
    "routing_dispatch": "routing_dispatch",
    "coordination": "coordination_agent",
    "feedback_learning": "feedback_learning",
}

# Tool configuration
FIRMS_DEFAULT_SOURCE = "VIIRS_SNPP_NRT"
MAX_CLOUD_COVER_PERCENT = 20.0
DBSCAN_EPS_KM = 1.0
DBSCAN_MIN_SAMPLES = 3
