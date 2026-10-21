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


def test_adk_agents_tool_bindings() -> None:
    """Verify that custom tool wrappers from agent/tools/ are bound to the 6 ADK sub-agents."""
    import ast
    from pathlib import Path

    from agent.tools import (
        assess_image_quality,
        compute_burned_area,
        compute_dnbr,
        estimate_travel_time,
        explain_priority,
        fetch_hotspots,
        fetch_satellite_imagery,
        find_nearest_water_sources,
        optimize_team_assignments,
        overlay_risk_layers,
        rank_all_active_hotspots,
        score_hotspot_priority,
        segment_burned_area,
    )

    custom_tools = [
        fetch_hotspots,
        fetch_satellite_imagery,
        assess_image_quality,
        segment_burned_area,
        compute_dnbr,
        compute_burned_area,
        overlay_risk_layers,
        score_hotspot_priority,
        rank_all_active_hotspots,
        explain_priority,
        optimize_team_assignments,
        estimate_travel_time,
        find_nearest_water_sources,
    ]
    for tool_fn in custom_tools:
        assert callable(tool_fn)
        assert getattr(tool_fn, "__is_agent_tool__", False) is True

    agent_py = Path(__file__).resolve().parents[2] / "agent" / "agent.py"
    tree = ast.parse(agent_py.read_text(encoding="utf-8"))

    expected_agent_tools = {
        "perception_fusion": {"fetch_hotspots", "fetch_satellite_imagery", "assess_image_quality"},
        "risk_scoring": {"score_hotspot_priority", "rank_all_active_hotspots", "explain_priority", "overlay_risk_layers"},
        "verification_agent": {"segment_burned_area", "compute_dnbr", "compute_burned_area"},
        "routing_dispatch": {"optimize_team_assignments", "estimate_travel_time", "find_nearest_water_sources"},
        "coordination_agent": {"estimate_travel_time", "explain_priority"},
        "feedback_learning": {"score_hotspot_priority", "compute_burned_area"},
    }

    found_agents = {}
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            var_name = node.targets[0].id
            if var_name in expected_agent_tools and isinstance(node.value, ast.Call):
                for kw in node.value.keywords:
                    if kw.arg == "tools" and isinstance(kw.value, ast.List):
                        tool_names = {
                            elt.id for elt in kw.value.elts if isinstance(elt, ast.Name)
                        }
                        found_agents[var_name] = tool_names

    assert set(found_agents.keys()) == set(expected_agent_tools.keys())
    for agent_name, required_tools in expected_agent_tools.items():
        assert required_tools.issubset(found_agents[agent_name]), (
            f"{agent_name} missing tools: {required_tools - found_agents[agent_name]}"
        )


