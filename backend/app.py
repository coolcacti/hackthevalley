import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
# import google.generativeai as genai
import google.genai as genai
from google.genai import types
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI")
client_db = MongoClient(MONGO_URI)
db = client_db['hackthevalley']
users_collection = db['users']

from datetime import datetime, timezone

from datetime import datetime, timezone

from datetime import datetime, timezone

def update_user_scores(userAuth0Id, gemini_result=None, metadata=None, video_filename=None):
    try:
        compost = recycle = trash = 0
        objects = []
        if gemini_result and isinstance(gemini_result, dict):
            objects = gemini_result.get("objects", []) or []

        any_successful = False
        if objects:
            for obj in objects:
                thrown = str(obj.get("thrown_in_bin", "")).strip().lower()
                ttype = str(obj.get("trash_type", "")).strip().lower()

                if thrown == "yes":
                    any_successful = True
                    if "compost" in ttype or "organic" in ttype or "food" in ttype:
                        compost += 1
                    elif "recycl" in ttype or "plastic" in ttype or "bottle" in ttype or "can" in ttype or "paper" in ttype or "cardboard" in ttype:
                        recycle += 1
                    else:
                        trash += 1

        if not objects and metadata and isinstance(metadata, dict):
            summary = metadata.get("summary", {}) or {}
            try:
                recycle = int(summary.get("Recyclable", 0))
            except Exception:
                recycle = 0
            try:
                compost = int(summary.get("Compost", 0))
            except Exception:
                compost = 0
            try:
                trash = int(summary.get("Trash", 0))
            except Exception:
                trash = 0
            # If summary shows >0 then treat as successful (legacy fallback)
            any_successful = (compost + recycle + trash) > 0

        total = compost + recycle + trash

        update_doc = {}
        inc_doc = {}
        if compost: inc_doc["compost"] = compost
        if recycle: inc_doc["recycle"] = recycle
        if trash: inc_doc["trash"] = trash
        if total: inc_doc["totalItemsCollected"] = total
        if inc_doc:
            update_doc["$inc"] = inc_doc

        if metadata and isinstance(metadata, dict):
            loc = metadata.get("location")
            if loc and isinstance(loc, dict):
                update_doc.setdefault("$push", {})
                update_doc["$push"]["locations"] = {
                    "latitude": loc.get("latitude"),
                    "longitude": loc.get("longitude"),
                    "timestamp": datetime.now(timezone.utc),
                    "successfulDeposit": bool(any_successful)
                }

        if video_filename:
            update_doc.setdefault("$addToSet", {})
            update_doc["$addToSet"]["processedVideos"] = video_filename

        if not update_doc:
            print("update_user_scores: no update required (no counts, no location, no filename).")
            return {"matched_count": 0, "modified_count": 0}

        filter_doc = {"userAuth0Id": userAuth0Id}
        if video_filename:
            filter_doc["processedVideos"] = {"$ne": video_filename}

        result = users_collection.update_one(filter_doc, update_doc)

        print(f"update_user_scores: filter={filter_doc} applying update={update_doc}")
        print(f"update_user_scores: matched={result.matched_count} modified={result.modified_count} (any_successful={any_successful}, compost={compost}, recycle={recycle}, trash={trash})")

        return {"matched_count": result.matched_count, "modified_count": result.modified_count}

    except Exception as e:
        print(f"Error in update_user_scores: {e}")
        import traceback; traceback.print_exc()
        return {"matched_count": 0, "modified_count": 0}

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
    # genai.configure(api_key=GEMINI_API_KEY)
    client = genai.Client(api_key=GEMINI_API_KEY)

# System prompt for Gemini
SYSTEM_PROMPT = """You are an AI assistant that analyzes a video of a user throwing away trash. Your task is to detect every distinct object that the user interacts with and determine whether it was successfully thrown into the garbage bin. For each object, also classify its type as one of: "compost", "recyclable", or "trash".

Count an item only if it clearly leaves the user’s hand and enters the garbage bin.

A valid “thrown_in_bin”: "yes" requires all of the following:
1. The object visibly leaves the user's hand or grasp.
2. The object travels toward the garbage bin.
3. The object clearly lands inside the bin (not beside, behind, or bouncing out).

If the user continues holding the object, waves it near the bin, pretends to throw it, drops it, or its landing is unclear, mark `"thrown_in_bin": "no"`.

Return your analysis strictly in JSON format only, with no text or commentary.

Output format:
{
  "objects": [
    {
      "thrown_in_bin": "yes" | "no",
      "trash_type": "compost" | "recyclable" | "trash"
    },
    ...
  ]
}

Guidelines:
- Detect every visible object the user interacts with in the video.
- Classify each object’s type accurately based on appearance:
  - "compost": food scraps, paper towels, plant material, or organic waste.
  - "recyclable": bottles, cans, cardboard, paper, or plastics.
  - "trash": general non-recyclable waste (e.g., wrappers, mixed materials).
- Each object must have both a `"thrown_in_bin"` and `"trash_type"` field.
- If no objects are seen, return an empty list: { "objects": [] }
- Output must be valid JSON. Do not include markdown, explanations, or any text outside the JSON."""


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_video_with_gemini(video_path, timeout_s=120, poll_interval=2):
    """
    Upload video, wait until Gemini processing completes (ACTIVE), then call generate_content
    using the file object and a text prompt. Returns dict (parsed JSON) or error dict.
    """
    try:
        print(f"Starting video analysis for: {video_path}")
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Upload (use keyword 'file' as shown in official examples)
        print("Uploading video to Gemini...")
        video_file = client.files.upload(file=Path(video_path))
        print(f"Upload complete. File name/ID: {video_file.name}")
        print(f"Initial file state: {getattr(video_file, 'state', None)}")

        # Poll until the file is processed and becomes ACTIVE (or timeout)
        start = time.time()
        while not getattr(video_file, "state", None) or video_file.state.name != "ACTIVE":
            if time.time() - start > timeout_s:
                raise TimeoutError(f"Timed out waiting for file to become ACTIVE (after {timeout_s}s). Last state={getattr(video_file,'state',None)}")
            print("Processing video on Gemini servers... current state:", getattr(video_file, "state", None))
            time.sleep(poll_interval)
            # IMPORTANT: call with keyword 'name'
            video_file = client.files.get(name=video_file.name)

        print("File processing finished, state=ACTIVE. Calling generate_content...")

        # Use the file object directly plus your system prompt (do NOT pass ad-hoc dicts)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[video_file, SYSTEM_PROMPT]
        )

        response_text = response.text.strip()
        print(f"Raw Gemini response:\n{response_text}\n")

        # Same parsing logic you already have:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError(f"Could not parse JSON from response: {response_text}")

        print(f"Parsed result: {result}")

        # Optional: cleanup the uploaded file (use `name=`)
        try:
            client.files.delete(name=video_file.name)
            print("Cleaned up temporary file from Gemini (deleted).")
        except Exception as cleanup_error:
            print(f"Warning: Could not cleanup file: {cleanup_error}")

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "error_type": type(e).__name__}
    
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
    Handle incoming video upload, analyze with Gemini, optionally update user scores,
    save result JSON, and ALWAYS return a valid Flask response (JSON + status).
    """
    try:
        # Validate file
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        if video.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(video.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Save uploaded file
        filename = secure_filename(video.filename)
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video.save(filepath)
        print(f"Video saved to: {filepath}")

        # Parse incoming JSON metadata (once)
        metadata = {}
        data_str = request.form.get('data')
        parsed_data = {}
        if data_str:
            try:
                parsed_data = json.loads(data_str)
            except Exception as e:
                print("Warning: failed to parse request.form['data'] as JSON:", e)
                parsed_data = {}

            metadata = {
                'summary': parsed_data.get('summary', {}),
                'detected_objects': parsed_data.get('lastDetectedObjects', []),
                'location': parsed_data.get('location')
            }
            print("Frontend data received:")
            print(f"  - Summary: {metadata['summary']}")
            print(f"  - Objects: {metadata['detected_objects']}")
            print(f"  - Location: {metadata['location']}")

        # Call Gemini analyzer
        gemini_result = analyze_video_with_gemini(filepath)
        if not isinstance(gemini_result, dict):
            gemini_result = {'error': 'invalid_gemini_response', 'raw': str(gemini_result)}

        # Attach frontend location to gemini_result so it's saved with the result file
        if metadata.get('location'):
            gemini_result['location'] = metadata['location']
            print(f"Location added to Gemini result: {metadata['location']}")

        user_auth0_id = parsed_data.get("userAuth0Id") if parsed_data else None

        if user_auth0_id:
            try:
                res = update_user_scores(user_auth0_id, gemini_result=gemini_result, metadata=metadata, video_filename=filename)
                print(f"Updated user scores for {user_auth0_id}, matched={res.get('matched_count')} modified={res.get('modified_count')}")
            except Exception as e:
                print(f"Failed updating user scores for {user_auth0_id}: {e}")
        else:
            print("No userAuth0Id provided in request — skipping user score update.")

        # Save the analysis result to disk
        result_path = save_analysis_result(filename, gemini_result, metadata)

        # Build and return success response
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
        # Log full traceback and return a 500 JSON response
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'internal_server_error', 'details': str(e)}), 500

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
            print("\nAvailable Gemini models (that support generateContent):")
            client = genai.Client(api_key=GEMINI_API_KEY)
            for m in client.models.list():
                # check supported actions/fields (docs show supported_actions or supported_generation_methods)
                if "generateContent" in getattr(m, "supported_actions", [] ) or "generateContent" in getattr(m, "supported_generation_methods", []):
                    print(f"  - {m.name}")
        except Exception as e:
            print(f"Could not list models: {e}")

    
    print("="*50)
    app.run(host="0.0.0.0", port=5001, debug=True)