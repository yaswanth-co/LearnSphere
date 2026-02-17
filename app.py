import os
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import sys
import io
import contextlib
import json

# Debugging Environment
print(f"Current Working Directory: {os.getcwd()}")
env_path = os.path.join(os.getcwd(), '.env')
print(f"Looking for .env at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key' # Change this for production!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///learnsphere.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db, User, LearningHistory
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Configure Gemini API
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
    print("API Key NOT loaded after load_dotenv") # Added this line for clarity

genai.configure(api_key=GENAI_API_KEY)
if GENAI_API_KEY:
    print(f"API Key loaded: {GENAI_API_KEY[:5]}...{GENAI_API_KEY[-5:]}")
else:
    print("API Key NOT loaded") # This line is redundant with the one above, but keeping it as per original structure if GENAI_API_KEY is still None

model = genai.GenerativeModel('gemini-flash-latest')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
            
        new_user = User(username=username, password_hash=generate_password_hash(password))
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return jsonify({'message': 'Registered successfully'})
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return jsonify({'message': 'Logged in successfully'})
            
        return jsonify({'error': 'Invalid credentials'}), 401
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/editor')
def editor():
    return render_template('editor.html')

@app.route('/learning-path')
def learning_path():
    return render_template('learning_path.html')

@app.route('/api/run', methods=['POST'])
def run_code():
    code = request.json.get('code', '')
    
    # SECURITY WARNING: This is unsafe for production!
    # Vulnerable to arbitrary code execution.
    
    output_capture = io.StringIO()
    error_capture = io.StringIO()
    
    try:
        # Redirect stdout and stderr
        with contextlib.redirect_stdout(output_capture), contextlib.redirect_stderr(error_capture):
            exec(code, {"__name__": "__main__"})
            
        output = output_capture.getvalue()
        error = error_capture.getvalue()
        
        return jsonify({"output": output, "error": error})
    except Exception as e:
        return jsonify({"output": output_capture.getvalue(), "error": str(e)})

@app.route('/api/generate', methods=['POST'])
def generate_content():
    data = request.json
    topic = data.get('topic')
    level = data.get('level', 'Beginner')

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    prompt = f"""
    You are an expert ML Learning Assistant.
    The user is at the '{level}' level.
    Explain the concept of '{topic}'.
    
    Structure your response deeply in a JSON object with strictly these keys:
    - explanation: A concise, clear explanation suitable for the user's level. Use Markdown for bolding key terms.
    - code: A Python code snippet demonstrating the concept (use libraries like sklearn, tensorflow, or simple python logic).
    - xray: A dictionary mapping line numbers (as strings, e.g., "1", "2") to a brief explanation of what that specific line does. Ensure the line numbers correspond exactly to the lines in the 'code' snippet.
    - diagram: A Mermaid.js graph definition (e.g., graph LR, sequenceDiagram) to visualize the concept. RETURN ONLY THE MERMAID CODE TEXT, NO WRAPPER. IMPORTANT: Quote all node text to avoid syntax errors, e.g., A["Node Text"]. Do not use parentheses inside labels without quotes.
    
    Make the explanation engaging and the code runnable. Ensure 'xray' covers key lines of the code.
    """

    try:
        if not GENAI_API_KEY:
            raise Exception("API Key not found")
            
        # Try multiple models in case of quota/availability issues
        # Updated list based on list_models.py output
        models_to_try = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.0-flash-exp', 'gemini-flash-lite-latest']
        last_exception = None
        
        print(f"Starting generation for topic: {topic}", flush=True)

        for model_name in models_to_try:
            try:
                print(f"Attempting to generate with model: {model_name}", flush=True)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                
                print(f"Success with model: {model_name}", flush=True)
                
                # Clean up the response text (remove markdown code blocks)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
                # Parse JSON
                try:
                    parsed_data = json.loads(text)
                except json.JSONDecodeError:
                    # Attempt to fix common JSON issues if needed, or just fail to next model
                    print(f"JSON Decode Error for model {model_name}. Raw text: {text[:100]}...", flush=True)
                    raise
                
                import re
                if "diagram" in parsed_data:
                    diagram_code = parsed_data["diagram"]
                    # Remove markdown wrappers like ```mermaid ... ``` or just ``` ... ```
                    # Also handles leading/trailing whitespace and case-insensitive 'mermaid'
                    diagram_code = re.sub(r'^```(?:mermaid)?\s*', '', diagram_code, flags=re.IGNORECASE)
                    diagram_code = re.sub(r'\s*```$', '', diagram_code)
                    parsed_data["diagram"] = diagram_code.strip()
                    print(f"DEBUG: Final Diagram Code:\n{parsed_data['diagram']}", flush=True)

                return jsonify(parsed_data)
            except Exception as e:
                print(f"Error with model {model_name}: {e}", flush=True)
                last_exception = e
                continue
        
        # If all text models fail, raise the last exception to be caught by the outer block
        if last_exception:
            raise last_exception

    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Return mock data for demonstration/fallback
        mock_data = {
            "explanation": f"**{topic}** (Mock Generated Explanation).\n\nSince the API key is missing or an error occurred, this is a placeholder. \n\nMachine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.",
            "code": f"# Example code for {topic}\nimport numpy as np\n\nprint('Hello from the mock backend!')\n# Real code would be generated here.",
            "xray": {
                "1": "Importing the numpy library for numerical operations.",
                "3": "Printing a greeting message to the console.",
                "4": "A comment indicating where real code would be."
            },
            "diagram": "graph LR\n    A[Input] --> B{Process}\n    B -->|Success| C[Output]\n    B -->|Error| D[Fallback]"
        }
        return jsonify(mock_data)

@app.route('/api/onboard', methods=['POST'])
def onboard():
    # In a real app, we would save this to a database session
    data = request.json
    return jsonify({"status": "success", "level": data.get('level')})

if __name__ == '__main__':
    app.run(debug=True)
