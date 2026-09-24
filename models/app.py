import gradio as gr
from ml_server import app

# User-friendly landing page when someone visits the Space in browser
with gr.Blocks(title="AI Retinal Disease Prediction API") as demo:
    gr.Markdown("# 👁️ Explainable AI Retinal Disease Detection Server")
    gr.Markdown("""
    Welcome to the ML Inference & Explainability backend for the **AI Eye Care System**.
    
    ### 🔬 Models Loaded:
    - **Binary Model**: Normal vs. Abnormal Retina (EfficientNet-B3)
    - **4-Class Disease Model**: Diabetic Retinopathy, Glaucoma, Cataract, Pathological Myopia (EfficientNet-B3)
    - **Explainability**: Grad-CAM attention heatmaps
    
    ### ⚡ Active Endpoints:
    - `GET /health` — Check server status
    - `POST /predict-base64` — Multi-class disease probability inference
    - `POST /gradcam` — Attention map generation
    """)

# Mount Gradio app onto FastAPI app
# Both the Gradio web UI AND the Node.js REST API endpoints work seamlessly!
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
