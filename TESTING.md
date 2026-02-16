# Support_OV - Testing Guide

## Manual Testing Checklist

### Prerequisites
- Python 3.8+ installed
- Required environment variables set:
  - `GEMINI_API_KEY` - Your Google Gemini API key
  - `DEBUG=True` (optional, only for development)
- Supabase database configured with schema from `db.sql`

### Setup
```bash
# Install dependencies
pip3 install -r requirements.txt

# Or use the setup script
./setup.sh

# Set environment variables
export GEMINI_API_KEY='your_api_key_here'
export DEBUG='True'  # Only for development

# Start the server
python3 app.py
```

The server will start on `http://localhost:5000`

## Test Scenarios

### 1. User Registration
**Steps:**
1. Open `http://localhost:5000` in a browser
2. Click on "Registrarse" tab
3. Fill in the registration form:
   - Nombre completo: Test User
   - Email: test@example.com
   - Contraseña: TestPass123
   - Fecha de nacimiento: 2005-01-15
   - Género: Select any option
   - Estado: Test State
   - Teléfono: (optional)
4. Click "Registrarse"

**Expected Result:**
- Success message appears
- Form automatically switches to login tab after 2 seconds
- User is created in Supabase `profiles` table

### 2. User Login
**Steps:**
1. On login tab, enter:
   - Email: test@example.com
   - Contraseña: TestPass123
2. Click "Ingresar"

**Expected Result:**
- Redirect to dashboard
- User name displayed in navbar
- Four cards visible: Chat Psicológico, Orientación Vocacional, Examen de Simulación, Mis Resultados

### 3. Psychological Chat
**Steps:**
1. From dashboard, click "Chat Psicológico"
2. Type a message: "Me siento un poco ansioso por mis exámenes"
3. Press Enter or click "Enviar"

**Expected Result:**
- User message appears on the right side (blue background)
- "Escribiendo..." indicator appears
- AI response appears on the left side (white background)
- Message is saved to `psychological_conversations` table
- Conversation history loads on page refresh

**Note:** Requires valid `GEMINI_API_KEY` to work

### 4. Vocational Chat
**Steps:**
1. From dashboard, click "Orientación Vocacional"
2. Type a message: "Me interesa la ingeniería, ¿qué opciones tengo?"
3. Press Enter or click "Enviar"

**Expected Result:**
- Similar behavior to psychological chat
- Response tailored to vocational guidance
- Message is saved to `vocational_conversations` table
- Can see user profile information used for context

**Note:** Requires valid `GEMINI_API_KEY` to work

### 5. Simulation Exam
**Steps:**
1. From dashboard, click "Examen de Simulación"
2. Read instructions and click "Comenzar Examen"
3. Answer at least 5 questions
4. Use "Siguiente" and "Anterior" buttons to navigate
5. Click "Finalizar Examen" on the last question

**Expected Result:**
- Questions display correctly from `Preguntas.json`
- Navigation works between questions
- Selected answers are preserved when navigating
- Progress bar updates correctly
- Results page shows scores for each section:
  - Español
  - Matemáticas
  - Ciencias Naturales
  - Ciencias Sociales
  - Calificación General (overall)
- Results are saved to `diagnostic_exam_results` table

### 6. Results History
**Steps:**
1. From dashboard, click "Mis Resultados"

**Expected Result:**
- List of all previous exam attempts
- Each result shows:
  - Date and time taken
  - Scores for all sections
  - Overall score
- Results ordered by date (newest first)

### 7. Session Persistence
**Steps:**
1. Complete login
2. Navigate to any page
3. Refresh the browser
4. Close and reopen the browser tab

**Expected Result:**
- User remains logged in
- Current page state is preserved
- Chat history is maintained

### 8. Logout
**Steps:**
1. From any logged-in page, click "Cerrar Sesión"

**Expected Result:**
- Redirect to login page
- Session cleared from localStorage
- Cannot access protected pages

## API Testing with curl

### Test Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### Test Get Exam Questions
```bash
curl http://localhost:5000/api/exam/questions
```

### Test Submit Exam (replace USER_ID)
```bash
curl -X POST http://localhost:5000/api/exam/submit \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","answers":{"1":"b","2":"c","3":"b"}}'
```

### Test Chat (requires valid USER_ID and GEMINI_API_KEY)
```bash
curl -X POST http://localhost:5000/api/chat/psychological \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","message":"Hola, necesito ayuda"}'
```

## Database Verification

After testing, verify data in Supabase:

1. **profiles table**: Check if test user exists
2. **psychological_conversations**: Check chat messages
3. **vocational_conversations**: Check chat messages
4. **diagnostic_exam_results**: Check exam scores

## Common Issues

### 1. CORS errors
- Make sure Flask-CORS is installed
- Check that the backend is running on the expected port

### 2. Chat not working
- Verify `GEMINI_API_KEY` is set correctly
- Check server logs for API errors
- Ensure you have API quota available

### 3. Login fails
- Check Supabase credentials in `Keys.txt`
- Verify database tables exist
- Check Supabase Auth is enabled

### 4. Database errors
- Ensure all tables from `db.sql` are created
- Check foreign key constraints
- Verify RLS (Row Level Security) policies if enabled

## Browser Compatibility

Test on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Mobile Testing

Test responsive design on:
- Mobile phone (portrait and landscape)
- Tablet (portrait and landscape)

## Performance Notes

- First load may be slow due to loading 120 questions
- Chat responses depend on Gemini API response time (usually 2-5 seconds)
- Database queries are optimized to fetch only necessary data

## Security Considerations

- Never commit real API keys
- Use HTTPS in production
- Implement rate limiting for production
- Review Supabase RLS policies
- Keep dependencies updated

## Accessibility Testing

- Test with screen reader (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation works
- Check color contrast ratios
- Test with browser zoom at 200%
