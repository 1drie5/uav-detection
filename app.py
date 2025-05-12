import os
import uuid
import cv2
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import numpy as np
import pathlib
import shutil

# Initialize Flask application
app = Flask(__name__, 
           static_folder=os.path.abspath('static'), 
           template_folder=os.path.abspath('templates'))

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['RESULTS_FOLDER'] = os.path.join('static', 'results')
app.config['ALLOWED_IMAGE_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['ALLOWED_VIDEO_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'wmv'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload

app.config['UPLOAD_FOLDER'] = os.path.abspath(app.config['UPLOAD_FOLDER'])
app.config['RESULTS_FOLDER'] = os.path.abspath(app.config['RESULTS_FOLDER'])

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)

templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
os.makedirs(templates_dir, exist_ok=True)

# Load the YOLO model once 
try:
    model = YOLO('models/final.pt')
    app.logger.info("YOLO model loaded successfully")
except Exception as e:
    app.logger.error(f"Error loading YOLO model: {str(e)}")
    model = None

def allowed_file(filename, allowed_extensions):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def process_image(image_path):
    """Process an uploaded image using the UAV detection model."""
    results = model(image_path)
    
    result = results[0]
    
    img = cv2.imread(image_path)
    
    detections = []

    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
        
        # Get confidence score
        conf = float(box.conf[0].cpu().numpy())
        
        # Get class ID and name
        cls_id = int(box.cls[0].cpu().numpy())
        cls_name = result.names[cls_id]
        
        if cls_name.lower() == 'drone' or cls_name.lower() == 'uav' or conf > 0.5:
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            label = f"{cls_name}: {conf:.2f}"
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            detections.append({
                "label": cls_name,
                "confidence": conf,
                "bbox": [int(x1), int(y1), int(x2), int(y2)]
            })

    result_filename = f"result_{os.path.basename(image_path)}"
    result_path = os.path.join(app.config['RESULTS_FOLDER'], result_filename)
    cv2.imwrite(result_path, img)

    return url_for('static', filename=f'results/{result_filename}'), detections


def process_video(video_path):
    """Process an uploaded video using the UAV detection model."""
    try:
        base_filename = os.path.basename(video_path).rsplit('.', 1)[0]
        result_filename = f"{base_filename}_processed.mp4"  # always save as .mp4
        result_path = os.path.join(app.config['RESULTS_FOLDER'], result_filename)

        app.logger.info(f"Processing video at path: {video_path}")
        app.logger.info(f"Results will be saved to: {result_path}")

        # Run YOLO model on the video
        results = model.predict(
            source=video_path,
            save=True,
            project=app.config['RESULTS_FOLDER'],
            name="predict", 
            conf=0.25,
            imgsz=416,
            exist_ok=True
        )
        
        # Look for the processed video in the predict subdirectory
        predict_dir = os.path.join(app.config['RESULTS_FOLDER'], "predict")
        if not os.path.exists(predict_dir):
            app.logger.error(f"Predict directory not found: {predict_dir}")
            raise FileNotFoundError(f"Predict directory not found: {predict_dir}")
            
        # Find the processed video file (could be .avi or other format)
        processed_files = os.listdir(predict_dir)
        app.logger.info(f"Files in predict directory: {processed_files}")
        
        processed_video_path = None
        for file in processed_files:
            # Look for video files that contain the original filename
            if (file.endswith('.avi') or file.endswith('.mp4')) and base_filename in file:
                processed_video_path = os.path.join(predict_dir, file)
                app.logger.info(f"Found processed video: {processed_video_path}")
                break
        
        if not processed_video_path:
            app.logger.error("No processed video found in predict directory")
            raise FileNotFoundError("No processed video found in predict directory")
        
        # Convert AVI to MP4 
        if processed_video_path.endswith('.avi'):
            app.logger.info(f"Converting AVI to MP4: {processed_video_path} -> {result_path}")
            
            cap = cv2.VideoCapture(processed_video_path)
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 codec
            out = cv2.VideoWriter(result_path, fourcc, fps, (width, height))
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                out.write(frame)
            
            cap.release()
            out.release()
        else:
            # If already MP4, just copy it
            shutil.copy(processed_video_path, result_path)
        
        # Ensure file permissions are set correctly for web access
        os.chmod(result_path, 0o644)
        
        # Return the browser-accessible URL
        video_url = url_for('static', filename=f'results/{result_filename}')
        
        # Count total detections
        total_detections = sum(
            len(r.boxes) for r in results if hasattr(r, 'boxes') and r.boxes is not None
        )
        
        app.logger.info(f"Generated video URL: {video_url}")
        app.logger.info(f"Total detections: {total_detections}")
        
        # Verify file existence and size
        if not os.path.exists(result_path):
            app.logger.error(f"Result file does not exist: {result_path}")
        else:
            app.logger.info(f"Result file exists, size: {os.path.getsize(result_path)} bytes")
            
        return video_url, total_detections

    except Exception as e:
        app.logger.error(f"Error in process_video: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        raise

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/about')
def about():
    """Render the about page."""
    return render_template('about.html')

@app.route('/implementation')
def implementation():
    """Render the implementation details page."""
    return render_template('implementation.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and run UAV detection."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Check server logs.'}), 500

        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''

        is_image = file_extension in app.config['ALLOWED_IMAGE_EXTENSIONS']
        is_video = file_extension in app.config['ALLOWED_VIDEO_EXTENSIONS']
        
        if not (is_image or is_video):
            return jsonify({'error': f'Unsupported file format: {file_extension}. Only JPG, PNG, and MP4 files are supported'}), 400

        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

        # Save the uploaded file
        file.save(upload_path)
        app.logger.info(f"File saved to {upload_path}")

        # Process the file based on its type
        if is_image:
            app.logger.info(f"Processing image: {upload_path}")
            result_path, detections = process_image(upload_path)
            app.logger.info(f"Image processed, result path: {result_path}")
            
            # Return JSON response for AJAX handling
            return jsonify({
                'result_path': result_path,
                'detections': detections,
                'file_type': 'image'
            })
            
        elif is_video:
            app.logger.info(f"Processing video: {upload_path}")
            video_url, detections = process_video(upload_path)
            app.logger.info(f"Video processed, result URL: {video_url}")

            return jsonify({
                'result_path': video_url,
                'detections': detections,
                'file_type': 'video'
            })

    except Exception as e:
        app.logger.error(f"Error processing file: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Error processing file',
            'details': str(e)
        }), 500

# direct route to serve videos with proper MIME type
@app.route('/static/results/<path:filename>')
def serve_result_file(filename):
    """Serve a file from the results folder with proper MIME type."""
    file_path = os.path.join(app.config['RESULTS_FOLDER'], filename)
    
    app.logger.info(f"Serving file: {file_path}")
    
    if not os.path.exists(file_path):
        app.logger.error(f"File not found: {file_path}")
        return jsonify({'error': 'File not found'}), 404
    
    if filename.endswith('.mp4'):
        return send_from_directory(app.config['RESULTS_FOLDER'], filename, mimetype='video/mp4')
    else:
        return send_from_directory(app.config['RESULTS_FOLDER'], filename)

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    # static folder permissions to ensure files are readable by the web server
    app.logger.info(f"Ensuring static folder permissions are set correctly")
    for root, dirs, files in os.walk(app.static_folder):
        for d in dirs:
            try:
                os.chmod(os.path.join(root, d), 0o755)
            except Exception as e:
                app.logger.error(f"Could not set permissions on directory {d}: {str(e)}")
        for f in files:
            try:
                os.chmod(os.path.join(root, f), 0o644)
            except Exception as e:
                app.logger.error(f"Could not set permissions on file {f}: {str(e)}")
    
    app.run(debug=True)