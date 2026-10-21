"""Sample Data Downloader and Test Generator for SIGAP.

Downloads active fire hotspots from NASA FIRMS or generates realistic synthetic
multi-band satellite scenes and ground-truth masks for local development and testing.

Usage:
    # Generate synthetic mock data for local testing (no API keys needed)
    python scripts/download_sample_data.py --mock --output-dir data/samples

    # Query live NASA FIRMS API
    python scripts/download_sample_data.py \
        --firms-key YOUR_MAP_KEY \
        --region IDN \
        --start-date 2023-09-15 \
        --days 3 \
        --output-dir data/samples
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SIGAP.Scripts.DownloadSample")


def generate_mock_hotspots(count: int = 25, center_lat: float = -2.85, center_lon: float = 114.15) -> List[Dict[str, Any]]:
    """Generate realistic synthetic VIIRS hotspot records for Central Kalimantan."""
    np.random.seed(42)
    hotspots: List[Dict[str, Any]] = []
    base_date = datetime.now() - timedelta(days=2)

    for i in range(count):
        # Generate tight clusters with a few outliers
        if i < int(count * 0.7):
            dlat = np.random.normal(0, 0.015)
            dlon = np.random.normal(0, 0.015)
        else:
            dlat = np.random.uniform(-0.06, 0.06)
            dlon = np.random.uniform(-0.06, 0.06)

        acq_time = f"{np.random.randint(4, 8):02d}{np.random.randint(0, 59):02d}"
        hotspots.append({
            "latitude": round(center_lat + dlat, 5),
            "longitude": round(center_lon + dlon, 5),
            "brightness": round(float(np.random.uniform(320.0, 365.0)), 1),
            "scan": 0.4,
            "track": 0.36,
            "acq_date": base_date.strftime("%Y-%m-%d"),
            "acq_time": acq_time,
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high" if np.random.rand() > 0.25 else "nominal",
            "version": "2.0NRT",
            "bright_ti5": round(float(np.random.uniform(290.0, 310.0)), 1),
            "frp": round(float(np.random.exponential(25.0) + 5.0), 1),
            "daynight": "D",
        })

    return hotspots


def generate_mock_imagery_patch(
    height: int = 256,
    width: int = 256,
    channels: int = 6,
) -> tuple[np.ndarray, np.ndarray]:
    """Generate synthetic 6-band satellite reflectance patch and binary burn scar mask.

    Channels:
        0: Blue, 1: Green, 2: Red, 3: NIR, 4: SWIR-1, 5: SWIR-2
    """
    np.random.seed(101)

    # Background healthy vegetation / peat swamp
    # High NIR (~4000-5000), Low SWIR (~1000-1500), Low Visible (~300-800)
    image = np.zeros((channels, height, width), dtype=np.float32)
    image[0] = np.random.normal(400, 50, (height, width))   # Blue
    image[1] = np.random.normal(700, 80, (height, width))   # Green
    image[2] = np.random.normal(500, 60, (height, width))   # Red
    image[3] = np.random.normal(4500, 300, (height, width)) # NIR (high)
    image[4] = np.random.normal(1200, 150, (height, width)) # SWIR1 (low)
    image[5] = np.random.normal(700, 100, (height, width))  # SWIR2 (low)

    # Create synthetic burn scar patch in center
    mask = np.zeros((1, height, width), dtype=np.float32)
    cy, cx = height // 2, width // 2
    y, x = np.ogrid[:height, :width]
    dist_from_center = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

    # Irregular burn shape
    noise = np.random.normal(0, 10, (height, width))
    burn_pixels = (dist_from_center + noise) < 55
    mask[0, burn_pixels] = 1.0

    # In burned area: NIR drops sharply (~800), SWIR increases dramatically (~3500-4500)
    image[3, burn_pixels] = np.random.normal(900, 120, np.sum(burn_pixels))
    image[4, burn_pixels] = np.random.normal(3800, 250, np.sum(burn_pixels))
    image[5, burn_pixels] = np.random.normal(4200, 300, np.sum(burn_pixels))

    image = np.clip(image, 0, 10000)
    return image, mask


async def fetch_live_firms_data(
    api_key: str,
    region: str,
    date_start: str,
    day_range: int,
    output_path: Path,
) -> None:
    """Fetch live data from NASA FIRMS API."""
    from data.firms.client import FIRMSClient

    client = FIRMSClient(api_key=api_key)
    logger.info("Fetching FIRMS hotspots for region %s, start=%s, days=%d", region, date_start, day_range)
    hotspots = await client.get_hotspots(region=region, date_start=date_start, day_range=day_range)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(hotspots, f, indent=2)
    logger.info("Saved %d live hotspots to %s", len(hotspots), output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download or generate sample wildfire data.")
    parser.add_argument("--mock", action="store_true", help="Generate synthetic mock hotspots and imagery.")
    parser.add_argument("--firms-key", type=str, default=os.getenv("FIRMS_API_KEY"), help="NASA FIRMS MAP_KEY")
    parser.add_argument("--region", type=str, default="IDN", help="Country code or bbox (default 'IDN')")
    parser.add_argument("--start-date", type=str, default=datetime.now().strftime("%Y-%m-%d"), help="Start date (YYYY-MM-DD)")
    parser.add_argument("--days", type=int, default=1, help="Day range (1-10)")
    parser.add_argument("--output-dir", type=str, default="data/samples", help="Destination folder")

    args = parser.parse_args()
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.mock or not args.firms_key:
        if not args.mock and not args.firms_key:
            logger.warning("No FIRMS_API_KEY provided. Defaulting to synthetic mock data generation.")

        # 1. Generate synthetic hotspots
        hotspots = generate_mock_hotspots(count=30)
        hotspot_file = out_dir / "sample_hotspots.json"
        with open(hotspot_file, "w", encoding="utf-8") as f:
            json.dump(hotspots, f, indent=2)
        logger.info("Generated %d synthetic hotspots -> %s", len(hotspots), hotspot_file)

        # 2. Generate synthetic satellite patch and mask
        images_dir = out_dir / "images"
        masks_dir = out_dir / "masks"
        images_dir.mkdir(parents=True, exist_ok=True)
        masks_dir.mkdir(parents=True, exist_ok=True)

        for patch_idx in range(4):
            img_arr, mask_arr = generate_mock_imagery_patch()
            np.save(images_dir / f"patch_{patch_idx}_img.npy", img_arr)
            np.save(masks_dir / f"patch_{patch_idx}_mask.npy", mask_arr)

        logger.info("Generated 4 synthetic 6-band imagery patches and ground truth masks in %s", out_dir)
        print(f"[SUCCESS] Sample data generated in {out_dir.resolve()}")

    else:
        # Fetch live FIRMS data
        hotspot_file = out_dir / f"firms_{args.region}_{args.start_date}.json"
        asyncio.run(
            fetch_live_firms_data(
                api_key=args.firms_key,
                region=args.region,
                date_start=args.start_date,
                day_range=args.days,
                output_path=hotspot_file,
            )
        )
        print(f"[SUCCESS] FIRMS data downloaded to {hotspot_file.resolve()}")


if __name__ == "__main__":
    main()
