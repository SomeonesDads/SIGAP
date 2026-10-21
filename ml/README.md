# SIGAP Machine Learning Pipeline: U-Net Burned Area Segmentation

This directory contains the deep learning pipeline used by **SIGAP (Agen Karhutla)** to detect and delineate wildfire burn scars from multi-spectral satellite imagery (Landsat 8/9 and Sentinel-2).

---

## 1. Architecture Overview

We implement a standard 2D U-Net encoder-decoder network with skip connections:
- **Encoder (Contracting Path):** 4 downsampling blocks consisting of repeated 3x3 double convolutions, batch normalization, and ReLU activations, followed by 2x2 max-pooling.
- **Bottleneck:** Captures high-level contextual semantics of burn scars across diverse landscape biomes (peatland, degraded forest, mineral soils).
- **Decoder (Expanding Path):** 4 upsampling stages using transposed convolutions / bilinear interpolation followed by feature concatenation from corresponding encoder skip connections and double convolutions.
- **Output Layer:** 1x1 convolution mapping latent representations to a single-channel logits map representing pixel-level burned area probability.

### Why U-Net for Burn Scar Mapping?
Wildfire burn scars in tropical peatlands and forests have complex, irregular perimeters. Standard classification algorithms often produce salt-and-pepper noise or fail along diffuse smoke/burn transitions. U-Net preserves fine spatial boundaries via skip connections while leveraging contextual information to differentiate burned soil from water bodies, shadow, or agricultural harvesting.

---

## 2. Satellite Data Requirements

The default U-Net model expects **6 spectral channels** corresponding to standard Landsat surface reflectance:

| Band Index | Landsat 8/9 Band | Sentinel-2 Band Equivalent | Wavelength (µm) | Role in Burn Detection |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Band 2 (Blue) | Band 2 (Blue) | ~0.48 | Atmospheric scattering, smoke discrimination |
| **1** | Band 3 (Green) | Band 3 (Green) | ~0.56 | Healthy vegetation reflectance peak |
| **2** | Band 4 (Red) | Band 4 (Red) | ~0.65 | Chlorophyll absorption |
| **3** | Band 5 (NIR) | Band 8 (NIR) | ~0.86 | Canopy cell structure (drops sharply when burned) |
| **4** | Band 6 (SWIR-1) | Band 11 (SWIR-1) | ~1.61 | Moisture and char/ash sensitivity |
| **5** | Band 7 (SWIR-2) | Band 12 (SWIR-2) | ~2.20 | Strongest contrast for charcoal, ash, and bare peat |

Input tensors are shaped as `(Batch, 6, Height, Width)`, typically sliced into `256 x 256` or `512 x 512` spatial tiles.

---

## 3. Directory Layout

```
ml/
├── __init__.py
├── README.md                  # This documentation
├── unet/
│   ├── __init__.py
│   ├── model.py               # PyTorch UNet, DoubleConv, Down, Up, OutConv
│   ├── train.py               # Dataset loader, BCEDiceLoss, IoU/Dice, training loop
│   ├── predict.py             # Model checkpoint loader and georeferenced raster inference
│   ├── preprocessing.py       # Band normalization (min-max/reflectance) and patch tiling
│   └── postprocessing.py      # Vectorization to GeoDataFrame, area calculation (ha), filtering
└── weights/
    └── .gitkeep               # Directory where .pth model checkpoints are saved
```

---

## 4. Preprocessing and Normalization

Raw satellite rasters often have integer reflectance values scaled by 10,000 (e.g. Landsat Collection 2 Level 2). `preprocessing.py` provides:
- **Reflectance Normalization:** Clamps values to `[0, 10000]` and divides by `10000.0`.
- **Min-Max / Standardize:** Per-channel scaling for arbitrary sensors.
- **Tiling (Patches):** Breaks large satellite scenes (e.g., 7000 x 7000 pixels) into overlapping or non-overlapping tiles with configurable strides.

---

## 5. Training

To train the U-Net on prepared paired image and mask patches:

```bash
python ml/unet/train.py \
    --data_dir data/training_dataset \
    --epochs 50 \
    --batch_size 16 \
    --learning_rate 0.0001 \
    --output_dir ml/weights \
    --in_channels 6
```

### Metrics & Loss
- **Loss:** Combined `BCEDiceLoss` (\(0.5 \times \text{BCE} + 0.5 \times \text{Dice}\)) addressing severe class imbalance common in wildfire scars.
- **Metrics:** Jaccard Index (IoU) and Dice Similarity Coefficient (F1-Score).
- **Checkpoints:** Automatically saves `latest_checkpoint.pth` and `best_model.pth` based on peak validation IoU.

---

## 6. Inference and Geospatial Postprocessing

### Running Prediction
```python
from ml.unet.predict import load_model, predict_with_georef
from ml.unet.postprocessing import mask_to_polygons, filter_small_polygons, compute_area

# Load trained weights
model = load_model("ml/weights/best_model.pth", in_channels=6, device="cuda")

# Inference directly on a GeoTIFF scene preserving geographic CRS
mask, profile = predict_with_georef(
    model=model,
    raster_path="data/imagery/landsat_pulang_pisau_post.tif",
    output_path="data/imagery/burn_mask.tif",
    threshold=0.5
)

# Vectorize to GeoDataFrame polygons
gdf = mask_to_polygons(mask, transform=profile["transform"], crs=profile["crs"])

# Filter false positive noise (< 0.5 hectares)
gdf_clean = filter_small_polygons(gdf, min_area_ha=0.5)

# Calculate total area in hectares (equal-area projected)
total_ha = compute_area(gdf_clean)
print(f"Total burned area: {total_ha:.2f} hectares across {len(gdf_clean)} polygons")
```

---

## 7. Important Operational Notes

1. **Peatland Smoldering Caveat:** Smoldering ground fires in tropical peatlands might burn under the surface root layer with minimal immediate canopy loss. U-Net visual detection should always be triangulated with FIRMS thermal hotspots and dNBR difference layers.
2. **Cloud and Cloud Shadows:** Areas with thick cloud coverage or shadow artifacts may trigger false positives. Mask out clouds using the satellite QA pixel band (e.g., `QA_PIXEL` in Landsat) prior to inference.
3. **Validation:** Predictions serve as decision-support indicators for field ground-check teams (Manggala Agni / BPBD) and should not replace ground truth verification.
