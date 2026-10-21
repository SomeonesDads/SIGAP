"""Setup and Authentication Utility for Google Earth Engine (GEE).

Supports:
    - Interactive OAuth2 user authentication (ee.Authenticate())
    - Headless Service Account authentication with JSON key file
    - Verification of API connectivity and asset access

Usage:
    # Interactive OAuth setup
    python scripts/setup_gee.py --project your-gcp-project-id

    # Service Account setup
    python scripts/setup_gee.py \
        --project your-gcp-project-id \
        --service-account your-sa@your-project.iam.gserviceaccount.com \
        --key-file path/to/service_account_key.json
"""

import argparse
import os
import sys
from pathlib import Path


def setup_earth_engine(
    project_id: str,
    service_account: str = None,
    key_file: str = None,
    force_auth: bool = False,
) -> bool:
    """Authenticate and test Google Earth Engine connection."""
    print("=" * 60)
    print("SIGAP — Google Earth Engine Setup & Verification")
    print("=" * 60)

    try:
        import ee
    except ImportError:
        print("[ERROR] 'earthengine-api' is not installed in the current environment.")
        print("Please install it using: pip install earthengine-api")
        return False

    # 1. Service Account Authentication
    if service_account and key_file:
        key_path = Path(key_file)
        if not key_path.exists():
            print(f"[ERROR] Service account key file not found: {key_file}")
            return False

        print(f"[*] Authenticating using Service Account: {service_account}")
        try:
            credentials = ee.ServiceAccountCredentials(service_account, str(key_path))
            ee.Initialize(credentials, project=project_id)
            print("[SUCCESS] Initialized Earth Engine via Service Account.")
        except Exception as e:
            print(f"[ERROR] Service Account initialization failed: {e}")
            return False

    # 2. Interactive OAuth Flow
    else:
        if force_auth:
            print("[*] Launching Earth Engine browser authentication...")
            try:
                ee.Authenticate()
            except Exception as e:
                print(f"[ERROR] Authentication failed: {e}")
                return False

        print(f"[*] Initializing Earth Engine with project: {project_id or 'default'}")
        try:
            if project_id:
                ee.Initialize(project=project_id)
            else:
                ee.Initialize()
            print("[SUCCESS] Initialized Earth Engine.")
        except Exception as e:
            print(f"[WARNING] Standard initialization failed ({e}). Attempting ee.Authenticate()...")
            try:
                ee.Authenticate()
                if project_id:
                    ee.Initialize(project=project_id)
                else:
                    ee.Initialize()
                print("[SUCCESS] Authenticated and initialized Earth Engine.")
            except Exception as auth_err:
                print(f"[ERROR] Could not authenticate with Earth Engine: {auth_err}")
                return False

    # 3. Test Connectivity
    print("[*] Running API connectivity check...")
    try:
        # Fetch metadata of a lightweight global test asset
        test_image = ee.Image("USGS/SRTM90_V4")
        info = test_image.getInfo()
        asset_id = info.get("id", "USGS/SRTM90_V4")
        print(f"[SUCCESS] Successfully connected to Earth Engine! Verified test asset: {asset_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Connectivity test failed: {e}")
        return False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Authenticate and initialize Google Earth Engine.")
    parser.add_argument("--project", type=str, default=os.getenv("GEE_PROJECT_ID"), help="GCP project ID")
    parser.add_argument("--service-account", type=str, default=os.getenv("GEE_SERVICE_ACCOUNT"), help="Service account email")
    parser.add_argument("--key-file", type=str, default=os.getenv("GEE_KEY_FILE"), help="Path to JSON key file")
    parser.add_argument("--force-auth", action="store_true", help="Force interactive browser re-authentication")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    success = setup_earth_engine(
        project_id=args.project,
        service_account=args.service_account,
        key_file=args.key_file,
        force_auth=args.force_auth,
    )
    sys.exit(0 if success else 1)
