"""ADK tool wrappers for SIGAP agent system."""

from functools import wraps
from typing import Any, Callable, Optional


def agent_tool(
    func: Optional[Callable[..., Any]] = None,
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> Any:
    """Decorator to mark a Python function as a Google ADK agent tool.

    Google ADK parses Python functions into tools using function signatures,
    type annotations, and docstrings. This decorator preserves signatures and docstrings
    while attaching ADK tool metadata for discovery and schema generation.

    Can be used with or without arguments:
        @agent_tool
        def my_tool(...) -> dict:
            ...

        @agent_tool(name="custom_name", description="Custom description")
        def my_tool(...) -> dict:
            ...
    """

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            return fn(*args, **kwargs)

        wrapper.__is_agent_tool__ = True
        wrapper.__tool_name__ = name or fn.__name__
        if description:
            wrapper.__doc__ = description
        return wrapper

    if func is not None and callable(func):
        return decorator(func)
    return decorator


__all__ = [
    "agent_tool",
    "fetch_hotspots",
    "fetch_satellite_imagery",
    "assess_image_quality",
    "segment_burned_area",
    "compute_dnbr",
    "compute_burned_area",
    "overlay_risk_layers",
    "score_hotspot_priority",
    "rank_all_active_hotspots",
    "explain_priority",
    "optimize_team_assignments",
    "estimate_travel_time",
    "find_nearest_water_sources",
]


def __getattr__(name: str) -> Any:
    if name == "fetch_hotspots":
        from agent.tools.firms_tool import fetch_hotspots

        return fetch_hotspots
    if name in ("fetch_satellite_imagery", "assess_image_quality"):
        from agent.tools import earth_engine_tool

        return getattr(earth_engine_tool, name)
    if name == "segment_burned_area":
        from agent.tools.unet_tool import segment_burned_area

        return segment_burned_area
    if name in ("compute_dnbr", "compute_burned_area", "overlay_risk_layers"):
        from agent.tools import geospatial_tool

        return getattr(geospatial_tool, name)
    if name in ("score_hotspot_priority", "rank_all_active_hotspots", "explain_priority"):
        from agent.tools import priority_tool

        return getattr(priority_tool, name)
    if name in ("optimize_team_assignments", "estimate_travel_time", "find_nearest_water_sources"):
        from agent.tools import dispatch_tool

        return getattr(dispatch_tool, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

