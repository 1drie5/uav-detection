import os
import uuid
from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from werkzeug.utils import secure_filename


# Initialize Flask application
app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['RESULTS_FOLDER'] = os.path.join('static', 'results')
app.config['ALLOWED_IMAGE_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['ALLOWED_VIDEO_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'wmv'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload

# Create necessary directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)

# Initialize UAV detection model
# detector = UAVDetector()


def allowed_file(filename, allowed_extensions):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


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
    # Check if a file was included in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    # Check if the file was actually selected
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Generate a unique filename to avoid collisions
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

    # Check file type and process accordingly
    if file and file_extension:
        # Save the uploaded file
        file.save(upload_path)

        try:
            # Process based on file type
            if file_extension in app.config['ALLOWED_IMAGE_EXTENSIONS']:
                result_path, detections = process_image(upload_path)
            elif file_extension in app.config['ALLOWED_VIDEO_EXTENSIONS']:
                result_path, detections = process_video(upload_path)
            else:
                return jsonify({'error': 'File type not supported'}), 400

            # Return the results
            return jsonify({
                'success': True,
                'original_file': original_filename,
                'result_path': result_path,
                'detections': detections  # Number of UAVs detected
            })

        except Exception as e:
            # Log the exception for debugging
            app.logger.error(f"Error processing file: {str(e)}")
            return jsonify({'error': 'Error processing file'}), 500

    return jsonify({'error': 'Invalid file'}), 400

@app.route('/results/<filename>')
def get_result(filename):
    """Serve result files."""
    return send_from_directory(app.config['RESULTS_FOLDER'], filename)


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({'error': 'File too large'}), 413


@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors."""
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_server_error(error):
    """Handle 500 errors."""
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(debug=True)