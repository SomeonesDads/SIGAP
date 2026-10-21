"""SIGAP Agent — Google ADK Multi-Agent Wildfire Response System."""

from typing import Any

__all__ = ["root_agent"]


def __getattr__(name: str) -> Any:
    if name == "root_agent":
        from agent.agent import root_agent

        return root_agent
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

