"""
Model Conversion Script for AI Eye Care System

This script converts PyTorch models to ONNX format for deployment with Node.js backend.
Run this script in the models/venv virtual environment.

Usage:
    python convert_models.py --model binary --input binary_FINAL.pth --output binary_FINAL.onnx
    python convert_models.py --model disease --input disease_FINAL.pth --output disease_FINAL.onnx
"""

import torch
import torch.nn as nn
import torchvision.models as models
import argparse
import os
from pathlib import Path

# Disease class mapping
DISEASE_CLASSES = ['diabetes', 'glaucoma', 'cataract', 'myopia']

class BinaryEfficientNet(nn.Module):
    """Binary classification model (Normal vs Disease)"""
    def __init__(self, num_classes=2):
        super().__init__()
        self.model = models.efficientnet_b3(weights=None)
        in_features = self.model.classifier[1].in_features
        self.model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, num_classes)
        )
    
    def forward(self, x):
        return self.model(x)

class DiseaseEfficientNet(nn.Module):
    """Disease classification model (4 classes)"""
    def __init__(self, num_classes=4):
        super().__init__()
        self.model = models.efficientnet_b3(weights=None)
        in_features = self.model.classifier[1].in_features
        self.model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, num_classes)
        )
    
    def forward(self, x):
        return self.model(x)

def convert_to_onnx(model_path, output_path, model_type='binary', img_size=300):
    """
    Convert PyTorch model to ONNX format
    
    Args:
        model_path: Path to .pth file
        output_path: Path for .onnx output
        model_type: 'binary' or 'disease'
        img_size: Input image size (default 300)
    """
    print(f"Converting {model_type} model...")
    print(f"Input: {model_path}")
    print(f"Output: {output_path}")
    
    # Create model based on type
    if model_type == 'binary':
        model = BinaryEfficientNet(num_classes=2)
        num_classes = 2
    else:
        model = DiseaseEfficientNet(num_classes=4)
        num_classes = 4
    
    # Load weights
    state_dict = torch.load(model_path, map_location='cpu')
    model.load_state_dict(state_dict)
    model.eval()
    
    # Create dummy input (batch_size=1, channels=3, height=300, width=300)
    dummy_input = torch.randn(1, 3, img_size, img_size)
    
    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    print(f"✓ Model converted successfully!")
    print(f"  Output size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
    
    # Verify the model
    verify_model(output_path, model_type, img_size)

def verify_model(onnx_path, model_type, img_size):
    """Verify the converted ONNX model"""
    import onnx
    from onnx import helper
    
    print("\nVerifying ONNX model...")
    model = onnx.load(onnx_path)
    onnx.checker.check_model(model)
    
    # Get input/output info
    input_tensor = model.graph.input[0]
    output_tensor = model.graph.output[0]
    
    print(f"  Input shape: {[dim.dim_value for dim in input_tensor.type.tensor_type.shape.dim]}")
    print(f"  Output shape: {[dim.dim_value for dim in output_tensor.type.tensor_type.shape.dim]}")
    print("✓ Model verification passed!")

def test_inference(onnx_path, model_type):
    """Test ONNX model inference"""
    try:
        import onnxruntime as ort
        
        print("\nTesting ONNX inference...")
        session = ort.InferenceSession(onnx_path)
        
        # Create random test input
        test_input = torch.randn(1, 3, 300, 300).numpy()
        
        # Run inference
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        result = session.run([output_name], {input_name: test_input})
        
        print(f"  Inference successful!")
        print(f"  Output shape: {result[0].shape}")
        print(f"  Output probabilities: {result[0][0]}")
        
    except ImportError:
        print("onnxruntime not installed. Install with: pip install onnxruntime")
    except Exception as e:
        print(f"Inference test failed: {e}")

def main():
    parser = argparse.ArgumentParser(description='Convert PyTorch models to ONNX')
    parser.add_argument('--model', type=str, choices=['binary', 'disease'], required=True,
                        help='Model type: binary or disease')
    parser.add_argument('--input', type=str, required=True,
                        help='Path to input .pth file')
    parser.add_argument('--output', type=str, required=True,
                        help='Path to output .onnx file')
    parser.add_argument('--img-size', type=int, default=300,
                        help='Input image size (default: 300)')
    parser.add_argument('--test', action='store_true',
                        help='Test inference after conversion')
    
    args = parser.parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        return
    
    # Convert model
    convert_to_onnx(args.input, args.output, args.model, args.img_size)
    
    # Test inference if requested
    if args.test:
        test_inference(args.output, args.model)

if __name__ == '__main__':
    main()