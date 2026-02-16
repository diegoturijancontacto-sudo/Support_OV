from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
from supabase import create_client, Client
import google.generativeai as genai

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Load configuration from Keys.txt
def load_config():
    config = {}
    try:
        with open('Keys.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if 'DB URL:' in line:
                    config['supabase_url'] = line.split('DB URL:')[1].strip()
                elif 'anon:' in line:
                    config['supabase_key'] = line.split('anon:')[1].strip()
                elif 'SUPABASE_SERVICE_ROLE_KEY' in line:
                    # Service role key should be set as environment variable
                    config['service_role_key'] = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    except FileNotFoundError:
        print("Error: Keys.txt file not found. Please ensure the file exists in the project root.")
        raise
    except Exception as e:
        print(f"Error reading Keys.txt: {e}")
        raise
    return config

config = load_config()
supabase: Client = create_client(config['supabase_url'], config['supabase_key'])

# Configure Gemini API (you need to set GEMINI_API_KEY environment variable)
gemini_api_key = os.environ.get('GEMINI_API_KEY', '')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None

# Load questions from Preguntas.json
try:
    with open('Preguntas.json', 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
except FileNotFoundError:
    print("Error: Preguntas.json file not found. Please ensure the file exists in the project root.")
    raise
except json.JSONDecodeError as e:
    print(f"Error: Preguntas.json contains invalid JSON: {e}")
    raise

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        birth_date = data.get('birth_date')
        gender = data.get('gender')
        state = data.get('state')
        phone = data.get('phone', '')
        
        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        if auth_response.user:
            # Create profile
            profile_data = {
                "id": auth_response.user.id,
                "full_name": full_name,
                "birth_date": birth_date,
                "gender": gender,
                "state": state,
                "phone": phone
            }
            
            profile_response = supabase.table('profiles').insert(profile_data).execute()
            
            return jsonify({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'user': auth_response.user.id
            }), 201
        else:
            return jsonify({'success': False, 'error': 'Error al registrar usuario'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user:
            # Get user profile
            profile = supabase.table('profiles').select('*').eq('id', auth_response.user.id).execute()
            
            return jsonify({
                'success': True,
                'session': auth_response.session.access_token,
                'user': auth_response.user.id,
                'profile': profile.data[0] if profile.data else None
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Credenciales inválidas'}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 401

@app.route('/api/chat/psychological', methods=['POST'])
def psychological_chat():
    """Handle psychological assistance chat"""
    try:
        data = request.json
        user_id = data.get('user_id')
        message = data.get('message')
        
        # Save user message to database
        supabase.table('psychological_conversations').insert({
            'user_id': user_id,
            'role': 'user',
            'message': message
        }).execute()
        
        # Get conversation history for context
        history = supabase.table('psychological_conversations')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=False)\
            .limit(5)\
            .execute()
        
        # Build context from history
        context = "Eres un psicólogo profesional y empático que brinda apoyo emocional. "
        context += "Tu objetivo es escuchar, comprender y ofrecer orientación psicológica.\n\n"
        
        if history.data:
            context += "Historial de conversación:\n"
            for msg in history.data:  # Use all fetched messages for context
                role = "Usuario" if msg['role'] == 'user' else "Psicólogo"
                context += f"{role}: {msg['message']}\n"
        
        context += f"\nUsuario: {message}\nPsicólogo:"
        
        # Generate response with Gemini
        if model:
            response = model.generate_content(context)
            assistant_message = response.text
        else:
            assistant_message = "Lo siento, el servicio de chat no está disponible en este momento."
        
        # Save assistant response to database
        supabase.table('psychological_conversations').insert({
            'user_id': user_id,
            'role': 'assistant',
            'message': assistant_message
        }).execute()
        
        return jsonify({
            'success': True,
            'message': assistant_message
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/vocational', methods=['POST'])
def vocational_chat():
    """Handle vocational guidance chat"""
    try:
        data = request.json
        user_id = data.get('user_id')
        message = data.get('message')
        
        # Save user message to database
        supabase.table('vocational_conversations').insert({
            'user_id': user_id,
            'role': 'user',
            'message': message
        }).execute()
        
        # Get conversation history for context
        history = supabase.table('vocational_conversations')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=False)\
            .limit(5)\
            .execute()
        
        # Get user profile for personalized advice
        profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
        user_info = ""
        if profile.data and len(profile.data) > 0:
            p = profile.data[0]
            user_info = f"Información del usuario: Estado: {p.get('state', 'N/A')}, "
            if p.get('desired_career'):
                user_info += f"Carrera de interés: {p.get('desired_career')}, "
            if p.get('socioeconomic_status'):
                user_info += f"Nivel socioeconómico: {p.get('socioeconomic_status')}"
        
        # Build context from history
        context = "Eres un orientador vocacional experto que ayuda a los estudiantes a descubrir su vocación. "
        context += "Ofreces consejos sobre carreras universitarias, habilidades necesarias y oportunidades.\n\n"
        
        if user_info:
            context += user_info + "\n\n"
        
        if history.data:
            context += "Historial de conversación:\n"
            for msg in history.data:  # Use all fetched messages for context
                role = "Usuario" if msg['role'] == 'user' else "Orientador"
                context += f"{role}: {msg['message']}\n"
        
        context += f"\nUsuario: {message}\nOrientador:"
        
        # Generate response with Gemini
        if model:
            response = model.generate_content(context)
            assistant_message = response.text
        else:
            assistant_message = "Lo siento, el servicio de chat no está disponible en este momento."
        
        # Save assistant response to database
        supabase.table('vocational_conversations').insert({
            'user_id': user_id,
            'role': 'assistant',
            'message': assistant_message
        }).execute()
        
        return jsonify({
            'success': True,
            'message': assistant_message
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/history/<chat_type>/<user_id>', methods=['GET'])
def get_chat_history(chat_type, user_id):
    """Get chat history for a user"""
    try:
        table_name = f'{chat_type}_conversations'
        history = supabase.table(table_name)\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=False)\
            .execute()
        
        return jsonify({
            'success': True,
            'history': history.data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/exam/questions', methods=['GET'])
def get_exam_questions():
    """Get exam questions"""
    try:
        return jsonify({
            'success': True,
            'exam': questions_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/exam/submit', methods=['POST'])
def submit_exam():
    """Submit exam results"""
    try:
        data = request.json
        user_id = data.get('user_id')
        answers = data.get('answers')  # Dictionary with question_id: answer
        
        # Calculate scores by section
        sections = questions_data['secciones']
        scores = {
            'math_score': 0,
            'reading_score': 0,
            'science_score': 0,
            'humanities_score': 0
        }
        
        section_mapping = {
            'matematicas': 'math_score',
            'espanol': 'reading_score',
            'ciencias_naturales': 'science_score',
            'ciencias_sociales': 'humanities_score'
        }
        
        total_correct = 0
        total_questions = 0
        
        for section_name, questions in sections.items():
            section_score = 0
            for question in questions:
                q_id = str(question.get('id', ''))
                correct_answer = question.get('respuesta_correcta', '')
                if q_id and correct_answer and q_id in answers and answers[q_id] == correct_answer:
                    section_score += 1
                    total_correct += 1
                total_questions += 1
            
            # Calculate percentage for this section
            section_percentage = int((section_score / len(questions)) * 100) if questions else 0
            
            # Map section name to score field
            score_field = section_mapping.get(section_name, 'reading_score')
            scores[score_field] = section_percentage
        
        # Calculate overall score
        overall_score = int((total_correct / total_questions) * 100) if total_questions > 0 else 0
        scores['overall_score'] = overall_score
        
        # Save results to database
        result_data = {
            'user_id': user_id,
            **scores
        }
        
        result = supabase.table('diagnostic_exam_results').insert(result_data).execute()
        
        return jsonify({
            'success': True,
            'results': result_data,
            'message': 'Examen enviado exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/exam/results/<user_id>', methods=['GET'])
def get_exam_results(user_id):
    """Get exam results for a user"""
    try:
        results = supabase.table('diagnostic_exam_results')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('taken_at', desc=True)\
            .execute()
        
        return jsonify({
            'success': True,
            'results': results.data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
