"""NASA FIRMS API client submodule for active fire hotspot detection."""

from data.firms.client import FIRMSClient, FIRMSAPIError

__all__ = ["FIRMSClient", "FIRMSAPIError"]
