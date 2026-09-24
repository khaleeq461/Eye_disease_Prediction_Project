FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install system dependencies for OpenCV and image operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only first for fast download and small image footprint
RUN pip install --no-cache-dir \
    torch==2.1.2+cpu torchvision==0.16.2+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir \
    fastapi==0.109.0 \
    uvicorn==0.27.0 \
    pydantic==2.5.3 \
    python-multipart==0.0.6 \
    Pillow==10.2.0 \
    opencv-python-headless==4.9.0.80 \
    numpy==1.26.3 \
    grad-cam==1.4.8

# Copy model files and server script
COPY binary_FINAL.pth /app/binary_FINAL.pth
COPY disease_FINAL.pth /app/disease_FINAL.pth
COPY ml_server.py /app/ml_server.py

EXPOSE 7860

CMD ["python", "ml_server.py"]
