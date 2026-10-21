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


__all__ = ["agent_tool"]
