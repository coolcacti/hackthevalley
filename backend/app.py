import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import google.generativeai as genai
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'webm', 'mp4', 'avi', 'mov'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables!")
    print("Set it with: export GEMINI_API_KEY='your-api-key-here'")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# System prompt for Gemini
SYSTEM_PROMPT = """You are an AI assistant that analyzes a video of a user throwing trash. Your task is to determine if the trash was successfully thrown into the garbage bin. If yes, return "yes"; if not, return "no". Also, classify the trash as one of: "compost", "recyclable", or "trash". Only return the output in JSON format: { "thrown_in_bin": "yes" | "no", "trash_type": "compost" | "recyclable" | "trash" }. Use visual cues from the video to decide if the trash lands in the bin, and classify common household waste correctly. Do not include any extra commentary."""


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_video_with_gemini(video_path):
    """
    Analyze video using Gemini API
    Returns parsed JSON response
    """
    try:
        print(f"Starting video analysis for: {video_path}")
        
        # Initialize Gemini model
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        print(f"Using model: gemini-2.0-flash")
        
        # Upload file using the correct API
        print("Uploading video to Gemini...")
        video_file = genai.upload_file(path=video_path)
        print(f"Upload complete. File name: {video_file.name}")
        
        # Wait for file to be processed
        print("Waiting for video processing...")
        while video_file.state.name == "PROCESSING":
            print("  Still processing...")
            time.sleep(5)
            video_file = genai.get_file(video_file.name)
        
        if video_file.state.name == "FAILED":
            raise Exception("Video processing failed on Gemini servers")
        
        print("Video processed successfully. Generating analysis...")
        
        # Generate content with video and prompt
        response = model.generate_content(
            [video_file, SYSTEM_PROMPT],
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
            )
        )
        
        # Get response text
        response_text = response.text.strip()
        print(f"Raw Gemini response:\n{response_text}\n")
        
        # Clean up response text (remove markdown if present)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON response
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If direct parsing fails, try to find JSON in the text
            import re
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError(f"Could not parse JSON from response: {response_text}")
        
        # Validate response structure
        if "thrown_in_bin" not in result or "trash_type" not in result:
            print(f"Warning: Invalid response structure: {result}")
            # Provide default structure
            result = {
                "thrown_in_bin": result.get("thrown_in_bin", "no"),
                "trash_type": result.get("trash_type", "trash"),
                "raw_response": response_text
            }
        
        print(f"Parsed result: {result}")
        
        # Clean up uploaded file
        try:
            genai.delete_file(video_file.name)
            print("Cleaned up temporary file from Gemini")
        except Exception as cleanup_error:
            print(f"Warning: Could not cleanup file: {cleanup_error}")
        
        return result
        
    except Exception as e:
        print(f"ERROR in analyze_video_with_gemini: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }


def save_analysis_result(filename, gemini_result, metadata):
    """
    Save analysis result with location data to a JSON file
    """
    results_folder = os.path.join(UPLOAD_FOLDER, 'results')
    os.makedirs(results_folder, exist_ok=True)
    
    # Create result filename (same as video but with .json extension)
    result_filename = os.path.splitext(filename)[0] + '_result.json'
    result_path = os.path.join(results_folder, result_filename)
    
    # Combine all data
    full_result = {
        'video_filename': filename,
        'timestamp': time.time(),
        'gemini_analysis': gemini_result,
        'metadata': metadata
    }
    
    # Save to JSON file
    with open(result_path, 'w') as f:
        json.dump(full_result, f, indent=2)
    
    print(f"Analysis result saved to: {result_path}")
    return result_path


@app.route('/api/upload', methods=['POST'])
def upload_video():
    """
    Handle video upload and analysis with location data
    """
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video = request.files['video']
        
        if video.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(video.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save the video file
        filename = secure_filename(video.filename)
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video.save(filepath)
        
        print(f"Video saved to: {filepath}")
        
        # Get data from frontend (includes summary, objects, and location)
        metadata = {}
        data_str = request.form.get('data')
        if data_str:
            data = json.loads(data_str)
            metadata = {
                'summary': data.get('summary', {}),
                'detected_objects': data.get('lastDetectedObjects', []),
                'location': data.get('location')  # GPS coordinates
            }
            print(f"Frontend data received:")
            print(f"  - Summary: {metadata['summary']}")
            print(f"  - Objects: {metadata['detected_objects']}")
            print(f"  - Location: {metadata['location']}")
        
        # Analyze video with Gemini
        gemini_result = analyze_video_with_gemini(filepath)
        
        # Add location to gemini_result
        if metadata.get('location'):
            gemini_result['location'] = metadata['location']
            print(f"Location added to Gemini result: {metadata['location']}")
        
        # Save complete analysis result to file
        result_path = save_analysis_result(filename, gemini_result, metadata)
        
        # Return combined response
        response = {
            'success': True,
            'filename': filename,
            'result_file': os.path.basename(result_path),
            'gemini_analysis': gemini_result,
            'location': metadata.get('location'),
            'message': 'Video uploaded and analyzed successfully'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze-existing', methods=['POST'])
def analyze_existing_video():
    """
    Analyze an existing video in the uploads folder
    """
    try:
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Analyze video with Gemini
        gemini_result = analyze_video_with_gemini(filepath)
        
        # Save result
        metadata = data.get('metadata', {})
        result_path = save_analysis_result(filename, gemini_result, metadata)
        
        response = {
            'success': True,
            'filename': filename,
            'result_file': os.path.basename(result_path),
            'gemini_analysis': gemini_result
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/list-videos', methods=['GET'])
def list_videos():
    """
    List all videos in the uploads folder
    """
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if allowed_file(filename):
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                files.append({
                    'filename': filename,
                    'size': os.path.getsize(filepath),
                    'created': os.path.getctime(filepath)
                })
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/get-result/<filename>', methods=['GET'])
def get_result(filename):
    """
    Get the analysis result for a specific video
    """
    try:
        results_folder = os.path.join(UPLOAD_FOLDER, 'results')
        result_filename = os.path.splitext(filename)[0] + '_result.json'
        result_path = os.path.join(results_folder, result_filename)
        
        if not os.path.exists(result_path):
            return jsonify({'error': 'Result not found'}), 404
        
        with open(result_path, 'r') as f:
            result = json.load(f)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    gemini_configured = GEMINI_API_KEY is not None
    return jsonify({
        'status': 'ok',
        'gemini_configured': gemini_configured,
        'upload_folder': app.config['UPLOAD_FOLDER']
    }), 200


if __name__ == '__main__':
    print("="*50)
    print("Flask Backend with Gemini API Integration")
    print("="*50)
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Gemini API configured: {GEMINI_API_KEY is not None}")
    
    # List available models
    if GEMINI_API_KEY:
        try:
            print("\nAvailable Gemini models:")
            for model in genai.list_models():
                if 'generateContent' in model.supported_generation_methods:
                    print(f"  - {model.name}")
        except Exception as e:
            print(f"Could not list models: {e}")
    
    print("="*50)
    app.run(debug=True, port=5000)