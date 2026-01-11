---
description: Deploy MediaPipe Object Detection to AWS Lambda via Container Image
---

# Deploying MediaPipe Object Detection to AWS Lambda

Because MediaPipe and its ML models exceed the 50MB direct upload limit of AWS Lambda, the recommended way to deploy is using a **Docker Container Image**.

## 1. Project Structure
Create the following files in your folder:
- `app.py` (The code from the notebook's lambda_handler section)
- `Dockerfile`
- `requirements.txt`
- `efficientdet_lite0.tflite` (The model file)

## 2. Requirements File
Create `requirements.txt`:
```text
mediapipe
opencv-python-headless
Pillow
```

## 3. Dockerfile
Create a `Dockerfile` based on the AWS Lambda Python image:
```dockerfile
FROM public.ecr.aws/lambda/python:3.10

# Install system dependencies for OpenCV
RUN yum install -y Mesa-libGL

# Copy requirements and install
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy model and code
COPY efficientdet_lite0.tflite .
COPY app.py .

# Set the CMD to your handler
CMD [ "app.lambda_handler" ]
```

## 4. Deployment Steps
1. **Build the image**:
   ```bash
   docker build -t mediapipe-lambda .
   ```
2. **Push to ECR**:
   - Create an ECR repository in AWS.
   - Login to ECR: `aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com`
   - Tag: `docker tag mediapipe-lambda:latest your-account-id.dkr.ecr.your-region.amazonaws.com/mediapipe-lambda:latest`
   - Push: `docker push your-account-id.dkr.ecr.your-region.amazonaws.com/mediapipe-lambda:latest`
3. **Create Lambda**:
   - In AWS Lambda Console, select "Create function" -> "Container image".
   - Select your image from ECR.
   - **Important**: Increase the timeout to at least 30 seconds and memory to 1024MB+ for ML inference.

## 5. Why this works?
- **Container Imaging**: Solves the library size issue.
- **headless-OpenCV**: `opencv-python-headless` is used because Lambda doesn't have a GUI/Display server.
- **高效Det**: Lightweight TFLite models are optimized for CPU environments like Lambda.
