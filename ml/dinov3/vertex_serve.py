"""Google Cloud Vertex AI Custom Prediction Server for DINOv3 BurnSeg.

Implements the Vertex AI Custom Container HTTP contract:
  - Health route: `GET ${AIP_HEALTH_ROUTE:-/health}` -> `{"status": "healthy"}`
  - Predict route: `POST ${AIP_PREDICT_ROUTE:-/predict}` -> `{"predictions": [...]}`
  - Port: `${AIP_HTTP_PORT:-8080}`
"""

import os
from typing import Any, Dict, List
import numpy as np
import torch
from fastapi import FastAPI, Request

from ml.dinov3.predict import get_cached_dinov3, _fetch_stac_patch_tensor

app = FastAPI(title="SIGAP DINOv3 BurnSeg — Vertex AI Prediction Server")

HEALTH_ROUTE = os.getenv("AIP_HEALTH_ROUTE", "/health")
PREDICT_ROUTE = os.getenv("AIP_PREDICT_ROUTE", "/predict")


@app.on_event("startup")
def _warmup_model() -> None:
    """Preload DINOv3 BurnSeg checkpoint into memory at container startup."""
    get_cached_dinov3()


@app.get(HEALTH_ROUTE)
def health() -> Dict[str, str]:
    """Vertex AI health check endpoint."""
    return {"status": "healthy"}


@app.post(PREDICT_ROUTE)
async def predict(request: Request) -> Dict[str, List[Dict[str, Any]]]:
    """Vertex AI online prediction endpoint accepting `{"instances": [...]}`."""
    body = await request.json()
    instances = body.get("instances", [])
    model, config, metrics = get_cached_dinov3()
    device = next(model.parameters()).device

    predictions: List[Dict[str, Any]] = []
    for inst in instances:
        if isinstance(inst, dict) and "bands_6ch" in inst:
            arr = np.asarray(inst["bands_6ch"], dtype=np.float32)
        else:
            lat = float(inst.get("center_lat", -2.85)) if isinstance(inst, dict) else -2.85
            lon = float(inst.get("center_lon", 114.12)) if isinstance(inst, dict) else 114.12
            arr, _ = _fetch_stac_patch_tensor(lat, lon, size=64)

        tensor = torch.from_numpy(arr).unsqueeze(0).to(device)
        with torch.no_grad():
            logits = model(tensor)
            prob = torch.sigmoid(logits).squeeze().cpu().numpy()

        predictions.append(
            {
                "prob_map": np.round(prob, 4).tolist(),
                "config": config,
                "metrics": metrics,
            }
        )

    return {"predictions": predictions}
