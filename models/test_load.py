"""Test if model loading works"""
import os
import sys
import traceback

sys.path.insert(0, r'c:\Users\moham\OneDrive\Desktop\Jawad\FYP\models')

print("=" * 60)
print("Testing load_models function directly")
print("=" * 60)

# Import the ml_server module
print("\nImporting ml_server module...")
try:
    import ml_server
    print("[OK] Module imported")
except Exception as e:
    print("[FAIL] Import error:", e)
    traceback.print_exc()
    sys.exit(1)

# Set MODEL_PATH if not already set
MODEL_PATH = r'c:\Users\moham\OneDrive\Desktop\Jawad\FYP\models'
print("MODEL_PATH:", MODEL_PATH)

# Check if model classes are available
print("\nChecking model classes...")
print("  EfficientNetBinary:", hasattr(ml_server, 'EfficientNetBinary'))
print("  EfficientNetDisease:", hasattr(ml_server, 'EfficientNetDisease'))

# Now try to load models
print("\nCalling load_models()...")
try:
    ml_server.load_models()
    print("[OK] load_models completed")
except Exception as e:
    print("[FAIL] load_models error:", e)
    traceback.print_exc()

# Check results
print("\nChecking loaded models...")
print("  binary_model:", ml_server.binary_model is not None)
print("  disease_model:", ml_server.disease_model is not None)

print("\n" + "=" * 60)
print("Test complete!")
print("=" * 60)