import requests
import os
from PIL import Image
import io

# Test with a simple test image
test_image_path = r'c:\Users\moham\OneDrive\Desktop\Jawad\FYP\models\test_image.png'

# Create a test image if it doesn't exist
if not os.path.exists(test_image_path):
    from PIL import Image
    img = Image.new('RGB', (300, 300), color=(100, 100, 100))
    img.save(test_image_path)

# Test the health endpoint
print("Testing /health endpoint...")
response = requests.get("http://localhost:5001/health")
print("Health response:", response.json())

# Test the prediction endpoint
print("\nTesting /predict endpoint with test image...")
try:
    with open(test_image_path, 'rb') as f:
        files = {'file': ('test_image.png', f, 'image/png')}
        response = requests.post("http://localhost:5001/predict", files=files)
        result = response.json()
        print("Prediction response:")
        print("  isNormal:", result.get('isNormal'))
        print("  prediction:", result.get('prediction'))
        print("  confidence:", result.get('confidence'))
        print("  isAccepted:", result.get('isAccepted'))
        print("  binaryResult:", result.get('binaryResult'))
        print("  diseaseResult:", result.get('diseaseResult'))
        
        # Check the cascade logic
        if result.get('isNormal'):
            print("\n  [OK] Binary model correctly identified as NORMAL")
        else:
            print("\n  [INFO] Binary model identified as DISEASE")
            if result.get('diseaseResult'):
                print("  Disease type:", result.get('diseaseResult').get('disease'))
                print("  Disease confidence:", result.get('diseaseResult').get('confidence'))
except Exception as e:
    print("Error:", e)

print("\nTest complete!")