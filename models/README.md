# AI Eye Care System - ML Models

## Overview

This folder contains the trained ML models for the AI Eye Care System. The system uses a **two-stage hierarchical pipeline**:

### 1. Binary Classification Model (`binary_FINAL.pth`)
- **Architecture**: EfficientNet-B3
- **Purpose**: Classify eye images as Normal or Disease
- **Input**: 300x300 RGB fundus images
- **Output**: [normal_probability, disease_probability]
- **Training**: Transfer learning with frozen backbone (5 epochs) + fine-tuning (20 epochs)

### 2. Disease Classification Model (`disease_FINAL.pth`)
- **Architecture**: EfficientNet-B3
- **Purpose**: Classify disease type when disease is detected
- **Input**: 300x300 RGB fundus images
- **Output**: [diabetes_prob, glaucoma_prob, cataract_prob, myopia_prob]
- **Classes**: diabetes, glaucoma, cataract, myopia

## Model Conversion for Deployment

The original models are in PyTorch (.pth) format. For backend deployment with TensorFlow.js or ONNX:

### Option 1: TensorFlow.js
```bash
# Install dependencies
pip install torch tensorflow tensorflowjs

# Convert PyTorch to TensorFlow.js
import torch
import tensorflow as tf
import tensorflowjs as tfjs

# Load PyTorch model
model = models.efficientnet_b3(weights=None)
model.classifier = nn.Sequential(nn.Dropout(0.4), nn.Linear(model.classifier[1].in_features, 2))
model.load_state_dict(torch.load('binary_FINAL.pth'))
model.eval()

# Convert to TensorFlow
import torch.nn as nn
class EfficientNetWrapper(nn.Module):
    def __init__(self, original_model):
        super().__init__()
        self.features = original_model.features
        self.avgpool = original_model.avgpool
        self.classifier = original_model.classifier
    
    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

# Save as SavedModel
tf_model = EfficientNetWrapper(model)
tf.saved_model.save(tf_model, 'saved_model/')
tfjs.convert_tf_saved_model('saved_model/', '--output_format=tfjs_graph_model', 'tfjs_model/')
```

### Option 2: ONNX Runtime (Recommended for Node.js)
```bash
# Install onnxruntime
pip install onnx onnxruntime

# Convert to ONNX
python convert_to_onnx.py
```

## Model Specifications

| Model | Classes | Input Size | Accuracy | Download |
|-------|---------|------------|----------|----------|
| Binary | 2 (Normal/Disease) | 300x300 | ~95% | binary_FINAL.pth |
| Disease | 4 (Diabetes/Glaucoma/Cataract/Myopia) | 300x300 | ~94% | disease_FINAL.pth |

## Performance Metrics

### Binary Model
- **Precision**: 91%
- **Recall**: 93%
- **F1-Score**: 92%
- **Overfitting Gap**: 4.7%

### Disease Model (with 70% confidence threshold)
- **Precision**: 94%
- **Recall**: 94%
- **F1-Score**: 93%
- **Per-Class F1**:
  - Diabetes: 95%
  - Glaucoma: 85%
  - Cataract: 98%
  - Myopia: 96%

## Confidence Threshold

The system uses a **70% confidence threshold** for disease predictions:
- If model confidence < 70%, the image is flagged for manual review
- This ensures only high-confidence predictions are accepted
- Reduces false positives significantly

## Usage in Backend

```javascript
// Example: Using ONNX Runtime in Node.js
const { InferenceSession, Tensor } = require('onnxruntime-node');

const session = await InferenceSession.create('./disease_FINAL.onnx');

const inputTensor = new Tensor('float32', imageData, [1, 3, 300, 300]);
const outputs = await session.run([inputTensor]);
const predictions = outputs[0].data;
```

## Dataset

The models were trained on a balanced subset of the ODIR5K dataset:
- **Training**: 1000 images per class (5000 total)
- **Validation**: ~85 images per class (421 total)
- **Test**: ~85 images per class (422 total)

Classes: normal, diabetes, glaucoma, cataract, myopia

## Grad-CAM Visualization

The system includes Grad-CAM explainability for model predictions, showing which regions of the image influenced the classification decision.

## Notes

- Models require CUDA for optimal performance (trained on NVIDIA T4 GPU)
- Inference time: ~100ms per image on GPU, ~500ms on CPU
- Recommended batch size: 32 for GPU inference