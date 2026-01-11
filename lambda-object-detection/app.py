import json
import base64
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os

# Initialize detector globally for performance (warm start)
MODEL_PATH = 'efficientdet_lite0.tflite'
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.ObjectDetectorOptions(base_options=base_options, score_threshold=0.5)
detector = vision.ObjectDetector.create_from_options(options)

def lambda_handler(event, context):
    try:
        # Check if it's an API Gateway event or direct call
        body = json.loads(event['body']) if 'body' in event else event
        
        # Decode base64 image
        image_bytes = base64.b64decode(body['image'])
        temp_file = '/tmp/input.jpg'
        
        with open(temp_file, 'wb') as f:
            f.write(image_bytes)

        # Load as MediaPipe image
        image = mp.Image.create_from_file(temp_file)

        # Detect
        detection_result = detector.detect(image)
        
        # Cleanup temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

        # Format output
        results = []
        for detection in detection_result.detections:
            category = detection.categories[0]
            results.append({
                "label": category.category_name,
                "score": float(category.score),
                "box": {
                    "x": detection.bounding_box.origin_x,
                    "y": detection.bounding_box.origin_y,
                    "w": detection.bounding_box.width,
                    "h": detection.bounding_box.height
                }
            })

        return {
            'statusCode': 200,
            'body': json.dumps({'detections': results}),
            'headers': {'Content-Type': 'application/json'}
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
