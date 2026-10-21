"""Tests for the NASA FIRMS tool and client schema validation."""

import pytest
from data.firms.client import FIRMSClient, FIRMSAuthError


def test_firms_tool_schema() -> None:
    """Validate FIRMS tool parameter schema and initialization constraints."""
    # Test valid client initialization
    client = FIRMSClient(api_key="valid_key_1234567890abcdef")
    assert client.api_key == "valid_key_1234567890abcdef"
    assert "https://firms.modaps.eosdis.nasa.gov" in client.base_url

    # Test missing / empty api_key raises ValueError
    with pytest.raises(ValueError):
        FIRMSClient(api_key="")

    # Test CSV parsing functionality
    sample_csv = (
        "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n"
        "-2.8541,114.1205,345.2,0.4,0.36,2023-09-20,0530,N,VIIRS,high,2.0NRT,298.1,24.8,D\n"
        "-2.8583,114.1248,352.0,0.4,0.36,2023-09-20,0530,N,VIIRS,nominal,2.0NRT,302.4,38.2,D\n"
    )

    parsed = client._parse_csv_response(sample_csv)
    assert len(parsed) == 2

    # Verify first row data types
    first = parsed[0]
    assert isinstance(first["latitude"], float)
    assert first["latitude"] == -2.8541
    assert isinstance(first["longitude"], float)
    assert first["longitude"] == 114.1205
    assert first["brightness"] == 345.2
    assert first["frp"] == 24.8
    assert first["confidence"] == "high"
    assert first["acq_date"] == "2023-09-20"
