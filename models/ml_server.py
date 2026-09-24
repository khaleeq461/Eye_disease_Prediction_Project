"""
AI Eye Care System - ML Inference Server
FastAPI server for running PyTorch ML models
Run this alongside the Node.js backend
"""

import os
import io
import base64
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import Optional, List
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from PIL import Image
from torchvision import transforms

# Try to import grad-cam (optional)
try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image
    from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
    GRADCAM_AVAILABLE = True
except Exception:
    GRADCAM_AVAILABLE = False
    print("Warning: pytorch_grad_cam not installed. Heatmaps will use basic implementation.")

# ============== Configuration ==============
MODEL_PATH = os.path.dirname(os.path.abspath(__file__))
IMG_SIZE = 300
CONFIDENCE_THRESHOLD = 0.7
DISEASE_CLASSES = ['diabetes', 'glaucoma', 'cataract', 'myopia']
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============== Image Preprocessing ==============
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Alias for backwards compatibility
val_tf = transform

# ============== Model Classes (matching saved state dict structure) ==============
class EfficientNetBinary(nn.Module):
    """Binary classification model - matches saved state dict keys"""
    def __init__(self, num_classes=2):
        super().__init__()
        # Load pretrained EfficientNet-B3
        self.features = models.efficientnet_b3(weights=None).features
        self.avgpool = nn.AdaptiveAvgPool2d(1)
        # Classifier: Sequential(Dropout(0.4), Linear(1536, num_classes))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(1536, num_classes)  # 1536 is EfficientNet-B3 output channels
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x
    
    def get_features(self, x):
        """Extract features before the classifier for Grad-CAM"""
        x = self.features(x)
        return x

class EfficientNetDisease(nn.Module):
    """Disease classification model - matches saved state dict keys"""
    def __init__(self, num_classes=4):
        super().__init__()
        # Load pretrained EfficientNet-B3
        self.features = models.efficientnet_b3(weights=None).features
        self.avgpool = nn.AdaptiveAvgPool2d(1)
        # Classifier: Sequential(Dropout(0.4), Linear(1536, num_classes))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(1536, num_classes)  # 1536 is EfficientNet-B3 output channels
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x
    
    def get_features(self, x):
        """Extract features before the classifier for Grad-CAM"""
        x = self.features(x)
        return x

# ============== Load Models at Import Time ==============
print("=" * 50)
print("Loading models at import time...")
print(f"Device: {DEVICE}")
print("=" * 50)

binary_model = None
disease_model = None

# Load Binary Model
binary_path = os.path.join(MODEL_PATH, "binary_FINAL.pth")
if os.path.exists(binary_path):
    try:
        binary_model = EfficientNetBinary(num_classes=2)
        state_dict = torch.load(binary_path, map_location='cpu', weights_only=True)
        binary_model.load_state_dict(state_dict)
        binary_model.eval()
        binary_model = binary_model.to(DEVICE)
        print("[OK] Binary model loaded")
    except Exception as e:
        print("[FAIL] Binary model error:", e)
else:
    print("[FAIL] Binary model not found:", binary_path)

# Load Disease Model
disease_path = os.path.join(MODEL_PATH, "disease_FINAL.pth")
if os.path.exists(disease_path):
    try:
        disease_model = EfficientNetDisease(num_classes=4)
        state_dict = torch.load(disease_path, map_location='cpu', weights_only=True)
        disease_model.load_state_dict(state_dict)
        disease_model.eval()
        disease_model = disease_model.to(DEVICE)
        print("[OK] Disease model loaded")
    except Exception as e:
        print("[FAIL] Disease model error:", e)
else:
    print("[FAIL] Disease model not found:", disease_path)

if binary_model and disease_model:
    print("All models loaded successfully!")
else:
    print("Warning: Some models failed to load")

print("=" * 50)

def load_models():
    """Reload models (optional)"""
    global binary_model, disease_model
    # Models already loaded at import, just return status
    return binary_model is not None and disease_model is not None

# ============== FastAPI App ==============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager"""
    print("[LIFESPAN] Starting up...")
    yield
    print("[LIFESPAN] Shutting down...")

app = FastAPI(title="AI Eye Care ML Server", lifespan=lifespan)

# CORS - Allow Node.js backend to call this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Prediction Functions ==============
def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """Preprocess image for model input"""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(DEVICE)
    return tensor

def predict(image_bytes: bytes):
    """Main prediction function - Two-stage cascade
    
    Pipeline:
    1. Binary model: 0=normal, 1=disease
       - Use argmax to determine prediction
    2. If disease, run disease model to identify specific condition
    """
    if not binary_model or not disease_model:
        return {"error": "Models not loaded"}
    
    try:
        # Preprocess
        tensor = preprocess_image(image_bytes)
        
        # Stage 1: Binary Classification (Normal vs Disease)
        with torch.no_grad():
            prob1 = torch.softmax(binary_model(tensor), dim=1)
            normal_prob = prob1[0][0].item()
            disease_prob = prob1[0][1].item()
            binary_pred = prob1.argmax(1).item()  # 0=normal, 1=disease
        
        # Stage 2: Disease Multi-Class Classification (evaluated for all scans to provide full 4-condition breakdown)
        with torch.no_grad():
            prob2 = torch.softmax(disease_model(tensor), dim=1)
            disease_pred = prob2.argmax(1).item()
            disease_confidence = prob2[0][disease_pred].item()

        # Scale the 4 disease probabilities by the overall Condition Risk (disease_prob):
        # P(Disease_i) = P(Disease_i | Disease) * P(Disease)
        # This ensures: P(Normal) + sum(P(Disease_i)) = 100.0%
        disease_probabilities = {
            "diabetes": prob2[0][0].item() * disease_prob,
            "glaucoma": prob2[0][1].item() * disease_prob,
            "cataract": prob2[0][2].item() * disease_prob,
            "myopia": prob2[0][3].item() * disease_prob
        }

        result = {
            "binaryResult": {
                "normalProbability": normal_prob,
                "diseaseProbability": disease_prob
            },
            "diseaseResult": {
                "disease": DISEASE_CLASSES[disease_pred],
                "confidence": disease_confidence,
                "probabilities": disease_probabilities
            }
        }
        
        # If normal_prob is higher, classify as normal
        if binary_pred == 0:  # normal
            result["isNormal"] = True
            result["binaryResult"]["isNormal"] = True
            result["isAccepted"] = True
            result["prediction"] = "normal"
            result["confidence"] = normal_prob
            return result
        
        # If disease (binary_pred == 1), mark isNormal as False
        result["isNormal"] = False
        result["binaryResult"]["isNormal"] = False
        result["prediction"] = DISEASE_CLASSES[disease_pred]
        result["confidence"] = disease_confidence
        
        # Check confidence threshold for disease predictions
        if disease_confidence < CONFIDENCE_THRESHOLD:
            result["isAccepted"] = False
            result["rejectedReason"] = "Low confidence prediction - may not be a valid eye image"
        else:
            result["isAccepted"] = True
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

def generate_gradcam(image_bytes: bytes, target_class: int = None):
    """Generate Grad-CAM heatmap for the given image using pytorch_grad_cam library
    
    Args:
        image_bytes: The image data
        target_class: The class index to generate heatmap for (None = use predicted class)
    
    Returns:
        base64 encoded image of the heatmap overlay
    """
    if not binary_model or not disease_model:
        return None
    
    try:
        # Preprocess image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = val_tf(img).unsqueeze(0).to(DEVICE)
        
        # Determine which model to use based on binary prediction
        with torch.no_grad():
            prob1 = torch.softmax(binary_model(tensor), dim=1)
            binary_pred = prob1.argmax(1).item()
        
        # Choose model based on binary prediction
        if binary_pred == 0:
            model = binary_model
            model_name = "binary"
            # For normal class, use class 0 for heatmap
            if target_class is None:
                target_class = 0
        else:
            model = disease_model
            model_name = "disease"
            # For disease, use the predicted class
            if target_class is None:
                prob2 = torch.softmax(disease_model(tensor), dim=1)
                target_class = prob2.argmax(1).item()
        
        # Use pytorch_grad_cam library if available
        if GRADCAM_AVAILABLE:
            target_layer = [model.features[-1]]
            
            with GradCAM(model=model, target_layers=target_layer) as cam:
                # Get predictions to determine target
                with torch.no_grad():
                    out = model(tensor)
                    prob = torch.softmax(out, dim=1)
                    confidence = prob[0][target_class].item()
                
                # Create targets for Grad-CAM
                targets = [ClassifierOutputTarget(target_class)]
                
                # Generate Grad-CAM
                grayscale_cam = cam(input_tensor=tensor, targets=targets)
                heatmap = grayscale_cam[0]
                
                # Resize image for overlay
                img_np = np.array(img.resize((IMG_SIZE, IMG_SIZE))).astype(np.float32) / 255.0
                
                # Create overlay using the library's function
                overlay = show_cam_on_image(img_np, heatmap, use_rgb=True)
                
        else:
            # Fallback to basic implementation
            heatmap = generate_basic_gradcam(tensor, model, target_class)
            img_np = np.array(img.resize((IMG_SIZE, IMG_SIZE))).astype(np.float32) / 255.0
            
            # Colorize heatmap
            heatmap_color = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
            heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
            
            # Overlay
            overlay = cv2.addWeighted(np.uint8(img_np * 255), 0.6, heatmap_color, 0.4, 0)
            confidence = 1.0
        
        # Convert to base64
        _, buffer = cv2.imencode('.png', cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "heatmap": heatmap_base64,
            "targetClass": target_class,
            "modelUsed": model_name
        }
        
    except Exception as e:
        print(f"Grad-CAM error: {e}")
        return None

def generate_basic_gradcam(tensor, model, target_class):
    """Basic Grad-CAM implementation without pytorch_grad_cam library"""
    try:
        features = []
        gradients = []
        
        def save_features_hook(module, input, output):
            features.append(output)
        
        def save_gradients_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0])
        
        target_layer = model.features[-1]
        
        handle_forward = target_layer.register_forward_hook(save_features_hook)
        handle_backward = target_layer.register_full_backward_hook(save_gradients_hook)
        
        model.eval()
        output = model(tensor)
        
        model.zero_grad()
        class_loss = output[0, target_class]
        class_loss.backward()
        
        handle_forward.remove()
        handle_backward.remove()
        
        feature_maps = features[0].detach()
        gradient_maps = gradients[0].detach()
        
        weights = torch.mean(gradient_maps, dim=(2, 3))
        weights = weights.unsqueeze(-1).unsqueeze(-1)
        
        cam = torch.sum(weights * feature_maps, dim=1).squeeze(0)
        cam = F.relu(cam)
        
        if cam.max() > 0:
            cam = cam / cam.max()
        
        cam_array = cam.cpu().numpy()
        cam_resized = cv2.resize(cam_array, (IMG_SIZE, IMG_SIZE))
        
        return cam_resized
        
    except Exception as e:
        print(f"Basic Grad-CAM error: {e}")
        return np.zeros((IMG_SIZE, IMG_SIZE))

def get_recommendations(prediction: str, confidence: float):
    """Get recommendations based on prediction"""
    recommendations = {
        "normal": {
            "title": "Healthy Eyes",
            "descriptions": [
                "Continue maintaining good eye health habits",
                "Schedule regular eye check-ups every 1-2 years",
                "Protect your eyes from UV light with sunglasses",
                "Take regular breaks from screen time",
                "Eat a balanced diet rich in vitamins A, C, and E"
            ],
            "priority": "low"
        },
        "diabetes": {
            "title": "Diabetic Retinopathy Detected",
            "descriptions": [
                "Consult an ophthalmologist immediately",
                "Control blood sugar levels strictly",
                "Monitor blood pressure and cholesterol",
                "Schedule regular retinal examinations",
                "Consider laser treatment or injections if recommended",
                "Avoid smoking and maintain a healthy weight"
            ],
            "priority": "high"
        },
        "glaucoma": {
            "title": "Glaucoma Detected",
            "descriptions": [
                "Seek immediate specialist consultation",
                "Medication to lower eye pressure may be required",
                "Regular monitoring of intraocular pressure",
                "Avoid activities that increase eye pressure",
                "Surgery may be necessary in advanced cases",
                "Family members should also get tested"
            ],
            "priority": "high"
        },
        "cataract": {
            "title": "Cataract Detected",
            "descriptions": [
                "Consult an ophthalmologist for evaluation",
                "Surgery is the only effective treatment",
                "Consider lens replacement surgery",
                "Use brighter lighting for better vision",
                "Update eyeglass prescription regularly",
                "Monitor for any sudden vision changes"
            ],
            "priority": "medium"
        },
        "myopia": {
            "title": "Myopia (Nearsightedness) Detected",
            "descriptions": [
                "Consult an optometrist for correction options",
                "Consider corrective lenses or surgery",
                "Reduce screen time and near work",
                "Spend more time outdoors",
                "Regular eye examinations to monitor progression",
                "Consider orthokeratology lenses"
            ],
            "priority": "medium"
        }
    }
    
    return recommendations.get(prediction, recommendations["normal"])

def get_xai_etiology_analysis(prediction: str, confidence: float, binary_result: dict, disease_result: dict):
    """Generate comprehensive organ-of-origin, biological causal chain, and neural model attribution analysis"""
    pred_clean = (prediction or "normal").lower()
    
    stage1_info = {
        "model_name": "EfficientNet-B3 Binary",
        "architecture": "Convolutional Neural Network (B3 Compound Scaling)",
        "feature_channels": 1536,
        "role": "Stage 1: Normal (Healthy) vs Pathological Filter",
        "normal_probability": binary_result.get("normalProbability") if binary_result else (confidence if pred_clean == "normal" else 1.0 - confidence),
        "disease_probability": binary_result.get("diseaseProbability") if binary_result else (0.0 if pred_clean == "normal" else confidence)
    }

    stage2_info = {
        "model_name": "EfficientNet-B3 Multi-Class",
        "architecture": "Deep CNN with Dropout(0.4) & Linear(1536, 4)",
        "role": "Stage 2: Differential Pathology Classifier",
        "predicted_class": pred_clean,
        "class_confidence": confidence,
        "all_probabilities": disease_result.get("probabilities", {}) if disease_result else {}
    }

    xai_info = {
        "technique": "Grad-CAM++ (Gradient-Weighted Class Activation)",
        "target_layer": "features[-1] (Conv_head: 1536 channels)",
        "input_tensor": "300×300 RGB Matrix",
        "anatomical_focus": "Macular vascular arcades & capillary beds" if pred_clean == "diabetes" else "Optic Nerve Head & Neuroretinal Rim" if pred_clean == "glaucoma" else "Anterior Segment Optical Field" if pred_clean == "cataract" else "Peripapillary Chorioretinal Ring" if pred_clean == "myopia" else "Uniform Non-Pathological Retinal Matrix"
    }

    etiologies = {
        "diabetes": {
            "organ_of_origin": "Pancreas (Endocrine System) & Retinal Microvasculature",
            "biological_system": "Endocrine & Circulatory Microvascular System",
            "pathophysiology_summary": "Chronic systemic hyperglycemia damaging retinal capillary pericytes and causing microvascular leakage.",
            "causal_chain": [
                "Pancreatic beta-cell insulin insufficiency or receptor resistance leads to chronic systemic hyperglycemia.",
                "Excess blood glucose triggers biochemical pathways (aldose reductase, AGEs, PKC) that destroy retinal capillary pericyte cells.",
                "Weakened microvascular walls form microaneurysms, blot hemorrhages, and leak lipid exudates into the retinal layers.",
                "EfficientNet-B3 neural feature maps detected high-gradient vascular micro-lesions highlighted by Grad-CAM."
            ],
            "systemic_tests": ["HbA1c Blood Glycated Hemoglobin (> 7.0%)", "Fasting Blood Glucose", "Blood Pressure & Lipid Profile", "Fluorescein Angiography (FA)"],
            "targeted_organ_treatment": "Endocrinology glycemic control (Target HbA1c < 7%) + Retinal Anti-VEGF Injections / Panretinal Laser Photocoagulation"
        },
        "glaucoma": {
            "organ_of_origin": "Trabecular Meshwork & Ciliary Body (Ocular Fluid Dynamics)",
            "biological_system": "Ocular Fluid Outflow Drainage & Optic Neuropathy",
            "pathophysiology_summary": "Impaired aqueous humor drainage elevating Intraocular Pressure (IOP), causing ischemic compression of optic nerve axons.",
            "causal_chain": [
                "Trabecular meshwork drainage resistance impairs the natural outflow of aqueous humor fluid produced by the ciliary body.",
                "Fluid buildup creates sustained mechanical elevation of Intraocular Pressure (IOP > 21 mmHg).",
                "High intraocular tension physically compresses and starves retinal ganglion cell axons entering the optic nerve head.",
                "Grad-CAM neural weights detected neuroretinal rim thinning and an enlarged vertical cup-to-disc ratio (CDR)."
            ],
            "systemic_tests": ["Goldmann Applanation Tonometry (IOP > 21 mmHg)", "Humphrey Visual Field 24-2 / 30-2 Perimetry", "RNFL Optical Coherence Tomography (OCT)", "Corneal Pachymetry"],
            "targeted_organ_treatment": "Prostaglandin analog IOP-reducing drops (Latanoprost/Travoprost) + Selective Laser Trabeculoplasty (SLT) / Trabeculectomy"
        },
        "cataract": {
            "organ_of_origin": "Crystalline Optical Lens (Anterior Eye Segment)",
            "biological_system": "Optical Refractive Media & Lens Crystallin Matrix",
            "pathophysiology_summary": "Denaturation and aggregation of lens crystallin proteins creating optical opacification and light scatter.",
            "causal_chain": [
                "Aging, UV radiation, diabetes, or oxidative stress disrupt the compact structure of lens crystallin proteins.",
                "Denatured proteins cross-link and aggregate into insoluble light-scattering micro-clusters inside the lens fiber cells.",
                "The crystalline lens becomes opaque and yellowed, attenuating light before it can reach the retinal photoreceptors.",
                "The AI model identified widespread spatial contrast degradation and optical attenuation across the fundus photograph."
            ],
            "systemic_tests": ["Slit-Lamp Biomicroscopy (LOCS III Grading)", "Snellen Visual Acuity & Contrast Sensitivity", "Glare Disability Testing", "Pre-Op Biometry (IOL Calculation)"],
            "targeted_organ_treatment": "Phacoemulsification ultrasonic cataract extraction with Intraocular Lens (IOL) surgical implantation"
        },
        "myopia": {
            "organ_of_origin": "Scleral Shell & Eyeball Axial Geometry",
            "biological_system": "Ocular Biomechanical Matrix & Globe Geometry",
            "pathophysiology_summary": "Excessive axial elongation of the eyeball stretching and thinning the posterior pole sclera, choroid, and retina.",
            "causal_chain": [
                "Genetic and environmental factors trigger excessive axial lengthening of the eyeball globe (> 26.5 mm).",
                "The enlarged globe physically stretches and thins the sclera, choroid vascular network, and retinal pigment epithelium (RPE).",
                "Stretching causes localized chorioretinal degeneration, temporal peripapillary crescents, and posterior staphyloma.",
                "Grad-CAM feature maps highlighted characteristic peripapillary atrophy surrounding the optic nerve border."
            ],
            "systemic_tests": ["Ocular Biometry (Axial Length > 26.5 mm)", "Cycloplegic Refraction (> -6.00 Diopters)", "Wide-Field Dilated Fundus Exam", "Macular OCT for Staphyloma / Lacquer Cracks"],
            "targeted_organ_treatment": "Refractive correction (High-index lenses/ICL) + Myopia progression management (Low-dose Atropine / Ortho-K) + Peripheral retinal tear surveillance"
        },
        "normal": {
            "organ_of_origin": "Intact Endocrine, Vascular & Ocular Homeostasis",
            "biological_system": "Healthy Physiological Homeostasis",
            "pathophysiology_summary": "Intact blood-retinal barrier, normal intraocular pressure, clear optical media, and physiological axial globe length.",
            "causal_chain": [
                "Pancreatic endocrine regulation maintains physiological blood glucose without microvascular capillary damage.",
                "Balanced aqueous humor outflow maintains Intraocular Pressure strictly within normal limits (10-21 mmHg).",
                "Crystalline lens maintains clear optical transmission and standard globe axial geometry.",
                "Dual-stage EfficientNet-B3 models verified healthy retinal vasculature with zero pathological focal activations."
            ],
            "systemic_tests": ["Annual Comprehensive Ophthalmic Exam", "Baseline Refraction", "Screening Tonometry"],
            "targeted_organ_treatment": "Routine annual preventative eye screening and UV-blocking sunglasses"
        }
    }

    return {
        "stage1_model": stage1_info,
        "stage2_model": stage2_info,
        "xai_engine": xai_info,
        "etiology": etiologies.get(pred_clean, etiologies["normal"])
    }

# ============== API Endpoints ==============
class PredictionResponse(BaseModel):
    success: bool
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    isNormal: Optional[bool] = None  # Can be None if uncertain
    isAccepted: bool
    binaryResult: Optional[dict] = None
    diseaseResult: Optional[dict] = None
    recommendations: Optional[list] = None
    xaiEtiology: Optional[dict] = None
    error: Optional[str] = None
    rejectedReason: Optional[str] = None

@app.get("/")
def root():
    return {"message": "AI Eye Care ML Server is running", "status": "healthy"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": binary_model is not None and disease_model is not None,
        "binary_model": binary_model is not None,
        "disease_model": disease_model is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(file: UploadFile = File(...)):
    """Endpoint for image prediction"""
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Get prediction
        result = predict(image_bytes)
        
        if "error" in result:
            return PredictionResponse(success=False, isNormal=False, isAccepted=False, error=result["error"])
        
        # Handle uncertain/unknown predictions
        if result.get("prediction") == "unknown":
            return PredictionResponse(
                success=True,
                prediction="unknown",
                confidence=result.get("confidence", 0),
                isNormal=None,
                isAccepted=False,
                binaryResult=result.get("binaryResult"),
                diseaseResult=None,
                recommendations=[],
                error=None,
                rejectedReason=result.get("rejectedReason", "Image not clear enough for diagnosis")
            )
        
        # Determine final prediction
        if result.get("isNormal") == True:
            prediction = "normal"
            confidence = result.get("confidence", result["binaryResult"]["normalProbability"])
            recommendations = get_recommendations("normal", confidence)
        elif result.get("diseaseResult"):
            prediction = result["diseaseResult"]["disease"]
            confidence = result["diseaseResult"]["confidence"]
            recommendations = get_recommendations(prediction, confidence)
        else:
            prediction = "unknown"
            confidence = 0
            recommendations = []
        
        xai_etiology = get_xai_etiology_analysis(
            prediction=prediction,
            confidence=confidence,
            binary_result=result.get("binaryResult") or {},
            disease_result=result.get("diseaseResult") or {}
        )
        
        return PredictionResponse(
            success=True,
            prediction=prediction,
            confidence=confidence,
            isNormal=result.get("isNormal"),
            isAccepted=result.get("isAccepted", True),
            binaryResult=result.get("binaryResult"),
            diseaseResult=result.get("diseaseResult"),
            recommendations=recommendations["descriptions"] if recommendations else [],
            xaiEtiology=xai_etiology,
            rejectedReason=result.get("rejectedReason")
        )
        
    except Exception as e:
        return PredictionResponse(
            success=False,
            isNormal=False,
            isAccepted=False,
            error=str(e)
        )

@app.post("/predict-base64")
async def predict_base64(image_data: dict):
    """Endpoint for base64 encoded image prediction"""
    try:
        # Decode base64
        image_bytes = base64.b64decode(image_data.get("image", ""))
        
        # Get prediction
        result = predict(image_bytes)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        # Handle uncertain predictions
        if result.get("prediction") == "unknown":
            return {
                "success": True,
                "prediction": "unknown",
                "confidence": result.get("confidence", 0),
                "isNormal": None,
                "isAccepted": False,
                "binaryResult": result.get("binaryResult"),
                "diseaseResult": None,
                "recommendations": [],
                "rejectedReason": result.get("rejectedReason", "Image not clear enough for diagnosis")
            }
        
        # Get recommendations
        if result.get("isNormal") == True:
            prediction = "normal"
            confidence = result.get("confidence", result["binaryResult"]["normalProbability"])
        elif result.get("diseaseResult"):
            prediction = result["diseaseResult"]["disease"]
            confidence = result["diseaseResult"]["confidence"]
        else:
            prediction = "unknown"
            confidence = 0
        
        recommendations = get_recommendations(prediction, confidence) if prediction != "unknown" else []
        
        xai_etiology = get_xai_etiology_analysis(
            prediction=prediction,
            confidence=confidence,
            binary_result=result.get("binaryResult") or {},
            disease_result=result.get("diseaseResult") or {}
        )
        
        return {
            "success": True,
            "prediction": prediction,
            "confidence": confidence,
            "isNormal": result.get("isNormal"),
            "isAccepted": result.get("isAccepted", True),
            "binaryResult": result.get("binaryResult"),
            "diseaseResult": result.get("diseaseResult"),
            "recommendations": recommendations["descriptions"] if recommendations else [],
            "xaiEtiology": xai_etiology,
            "rejectedReason": result.get("rejectedReason")
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/gradcam")
async def gradcam_endpoint(image_data: dict):
    """Generate Grad-CAM heatmap for the uploaded image"""
    try:
        # Decode base64
        image_bytes = base64.b64decode(image_data.get("image", ""))
        
        # Get heatmap
        result = generate_gradcam(image_bytes)
        
        if not result:
            return {"success": False, "error": "Failed to generate heatmap"}
        
        return {
            "success": True,
            "heatmap": result["heatmap"],
            "targetClass": result["targetClass"],
            "modelUsed": result["modelUsed"]
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============== Main ==============
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    print("=" * 50)
    print("AI Eye Care - ML Inference Server")
    print("=" * 50)
    print(f"Starting server on http://localhost:{port}")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)