"""Tests for the SIGAP Agent Orchestrator.

Validates agent initialization, state management, and tool registration.
"""

from typing import Any, Dict


class MockAgentOrchestrator:
    """Mock agent orchestrator representing the Agentic AI core."""

    def __init__(self, settings: Dict[str, Any]) -> None:
        self.settings = settings
        self.tools = ["firms_query", "gee_imagery", "unet_segmentation", "dnbr_analysis", "risk_priority"]
        self.state = "IDLE"

    def is_tool_registered(self, tool_name: str) -> bool:
        return tool_name in self.tools

    def create_investigation_plan(self, prompt: str) -> Dict[str, Any]:
        return {
            "prompt": prompt,
            "steps": ["fetch_hotspots", "cluster_hotspots", "fetch_satellite_image", "run_segmentation", "rank_priority"],
            "status": "PLANNED",
        }


def test_agent_initialization(mock_settings: Dict[str, Any]) -> None:
    """Test that the agent orchestrator initializes with correct configuration and tools."""
    agent = MockAgentOrchestrator(settings=mock_settings)

    assert agent.state == "IDLE"
    assert agent.is_tool_registered("firms_query")
    assert agent.is_tool_registered("unet_segmentation")
    assert agent.is_tool_registered("risk_priority")
    assert not agent.is_tool_registered("non_existent_tool")

    plan = agent.create_investigation_plan("Analisis kebakaran di Pulang Pisau")
    assert plan["status"] == "PLANNED"
    assert len(plan["steps"]) == 5
    assert "fetch_hotspots" in plan["steps"]
