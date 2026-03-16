// Supabase configuration
const SUPABASE_URL = 'https://gqxxnbfkzybbxmxcpcmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHhuYmZrenliYnhteGNwY21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDM1ODEsImV4cCI6MjA4NjE3OTU4MX0.F84DcR660GCGNlKM2SOx7hehwZI3FuQsK4fJ64bGVQQ';
const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/cpalead`;

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let examData = null;
let currentQuestionIndex = 0;
let userAnswers = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Authentication Functions
function showAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            errorDiv.textContent = error.message || 'Error al iniciar sesión';
            return;
        }
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Could not load profile:', profileError.message);
        }
        
        currentUser = {
            id: data.user.id,
            session: data.session.access_token,
            profile: profileData || null
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('dashboard-page');
        document.getElementById('user-name').textContent = profileData ? profileData.full_name : email;
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = 'Error de conexión. Por favor intenta de nuevo.';
        console.error('Login error:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const full_name = document.getElementById('reg-fullname').value;
    const birth_date = document.getElementById('reg-birthdate').value;
    const gender = document.getElementById('reg-gender').value;
    const state = document.getElementById('reg-state').value;
    const phone = document.getElementById('reg-phone').value;
    const errorDiv = document.getElementById('register-error');
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        
        if (error) {
            errorDiv.style.color = '#e74c3c';
            errorDiv.textContent = error.message || 'Error al registrarse';
            return;
        }
        
        if (data.user) {
            // Create profile
            const { error: profileError } = await supabaseClient.from('profiles').insert({
                id: data.user.id,
                full_name,
                birth_date,
                gender,
                state,
                phone
            });
            if (profileError) {
                console.warn('Profile creation warning:', profileError.message);
            }
        }
        
        errorDiv.style.color = 'green';
        errorDiv.textContent = 'Registro exitoso. Por favor inicia sesión.';
        setTimeout(() => showAuthTab('login'), 2000);
    } catch (error) {
        errorDiv.style.color = '#e74c3c';
        errorDiv.textContent = 'Error de conexión. Por favor intenta de nuevo.';
        console.error('Register error:', error);
    }
}

async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        currentUser = {
            id: session.user.id,
            session: session.access_token,
            profile: profileData
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('dashboard-page');
        document.getElementById('user-name').textContent = profileData ? profileData.full_name : session.user.email;
    } else {
        // Try restoring from localStorage as fallback
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            showPage('dashboard-page');
            document.getElementById('user-name').textContent = currentUser.profile ? currentUser.profile.full_name : '';
        }
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    localStorage.removeItem('currentUser');
    showPage('auth-page');
}

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Load data when entering specific pages
    if (pageId === 'psychological-chat-page') {
        loadChatHistory('psychological');
    } else if (pageId === 'vocational-chat-page') {
        loadChatHistory('vocational');
    } else if (pageId === 'results-page') {
        loadResults();
    }
}

// Chat Functions
async function loadChatHistory(chatType) {
    if (!currentUser) return;
    
    const messagesDiv = document.getElementById(`${chatType}-messages`);
    messagesDiv.innerHTML = '<div class="loading">Cargando historial...</div>';
    
    try {
        const { data, error } = await supabaseClient
            .from(`${chatType}_conversations`)
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        messagesDiv.innerHTML = '';
        if (data.length === 0) {
            messagesDiv.innerHTML = '<div class="loading">No hay mensajes aún. ¡Comienza la conversación!</div>';
        } else {
            data.forEach(msg => appendMessage(chatType, msg.message, msg.role, msg.created_at));
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        messagesDiv.innerHTML = '<div class="loading">Error al cargar el historial</div>';
    }
}

async function sendMessage(chatType) {
    if (!currentUser) return;
    
    const inputId = `${chatType}-input`;
    const input = document.getElementById(inputId);
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    appendMessage(chatType, message, 'user');
    
    const messagesDiv = document.getElementById(`${chatType}-messages`);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = '<div class="message-content">Escribiendo...</div>';
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
        // Save user message to database
        await supabaseClient.from(`${chatType}_conversations`).insert({
            user_id: currentUser.id,
            role: 'user',
            message: message
        });
        
        // Get recent conversation history for context
        const { data: history } = await supabaseClient
            .from(`${chatType}_conversations`)
            .select('role, message')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true })
            .limit(10);
        
        // Call Supabase Edge Function for AI response
        const response = await fetch(CHAT_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.session}`,
                "apikey": SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                message: message,
                type: chatType,
                history: history || [],
                user_id: currentUser.id
            })
        });
        
        const responseData = await response.json();
        const assistantMessage = responseData.reply || responseData.response || responseData.message || responseData.text ||
            'Lo siento, no pude procesar tu mensaje en este momento.';
        
        // Save assistant response to database
        await supabaseClient.from(`${chatType}_conversations`).insert({
            user_id: currentUser.id,
            role: 'assistant',
            message: assistantMessage
        });
        
        messagesDiv.removeChild(loadingDiv);
        appendMessage(chatType, assistantMessage, 'assistant');
    } catch (error) {
        console.error('Error sending message:', error);
        messagesDiv.removeChild(loadingDiv);
        appendMessage(chatType, 'Error de conexión. Por favor intenta de nuevo.', 'assistant');
    }
}

function appendMessage(chatType, message, role, timestamp = null) {
    const messagesDiv = document.getElementById(`${chatType}-messages`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = timestamp ? new Date(timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    }) : new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Exam Functions
async function startExam() {
    if (!currentUser) return;
    
    const examContent = document.getElementById('exam-content');
    examContent.innerHTML = '<div class="loading">Cargando examen...</div>';
    
    try {
        const response = await fetch('Preguntas.json');
        const data = await response.json();
        
        examData = data;
        currentQuestionIndex = 0;
        userAnswers = {};
        displayQuestion();
    } catch (error) {
        console.error('Error loading exam:', error);
        examContent.innerHTML = '<div class="loading">Error al cargar el examen</div>';
    }
}

// Helper function to get all questions from all sections
function getAllQuestions() {
    const allQuestions = [];
    const sections = examData.secciones;
    
    for (const sectionName in sections) {
        sections[sectionName].forEach(q => {
            allQuestions.push({ ...q, section: sectionName });
        });
    }
    
    return allQuestions;
}

// Helper function to save current answer
function saveCurrentAnswer(allQuestions) {
    const selected = document.querySelector('input[name="answer"]:checked');
    if (selected) {
        const currentQuestion = allQuestions[currentQuestionIndex];
        userAnswers[currentQuestion.id] = selected.value;
    }
}

function displayQuestion() {
    const examContent = document.getElementById('exam-content');
    
    const allQuestions = getAllQuestions();
    const question = allQuestions[currentQuestionIndex];
    const totalQuestions = allQuestions.length;
    const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
    
    examContent.innerHTML = `
        <div class="exam-header">
            <h3>Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}</h3>
            <div class="exam-progress">${progress}% completado</div>
        </div>
        
        <div class="question-card">
            <div class="question-text">${question.pregunta}</div>
            <ul class="options-list">
                ${Object.entries(question.opciones).map(([key, value]) => `
                    <li class="option-item">
                        <label>
                            <input type="radio" name="answer" value="${key}" 
                                ${userAnswers[question.id] === key ? 'checked' : ''}>
                            <span><strong>${key.toUpperCase()})</strong> ${value}</span>
                        </label>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="exam-navigation">
            <button onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                Anterior
            </button>
            <button onclick="saveAndNext()">
                ${currentQuestionIndex === totalQuestions - 1 ? 'Finalizar Examen' : 'Siguiente'}
            </button>
        </div>
    `;
}

function saveAndNext() {
    const allQuestions = getAllQuestions();
    saveCurrentAnswer(allQuestions);
    
    const totalQuestions = allQuestions.length;
    
    if (currentQuestionIndex === totalQuestions - 1) {
        submitExam();
    } else {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        const allQuestions = getAllQuestions();
        saveCurrentAnswer(allQuestions);
        
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function submitExam() {
    if (!currentUser) return;
    
    const examContent = document.getElementById('exam-content');
    examContent.innerHTML = '<div class="loading">Enviando examen...</div>';
    
    try {
        const sections = examData.secciones;
        const scores = {
            math_score: 0,
            reading_score: 0,
            science_score: 0,
            humanities_score: 0
        };
        
        const sectionMapping = {
            'matematicas': 'math_score',
            'espanol': 'reading_score',
            'ciencias_naturales': 'science_score',
            'ciencias_sociales': 'humanities_score'
        };
        
        let totalCorrect = 0;
        let totalQuestions = 0;
        
        for (const sectionName in sections) {
            const questions = sections[sectionName];
            let sectionScore = 0;
            
            questions.forEach(question => {
                const qId = String(question.id);
                if (userAnswers[qId] === question.respuesta_correcta) {
                    sectionScore++;
                    totalCorrect++;
                }
                totalQuestions++;
            });
            
            const sectionPercentage = questions.length > 0 ? Math.round((sectionScore / questions.length) * 100) : 0;
            const scoreField = sectionMapping[sectionName] || 'reading_score';
            scores[scoreField] = sectionPercentage;
        }
        
        const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        scores.overall_score = overallScore;
        
        // Save results to Supabase
        await supabaseClient.from('diagnostic_exam_results').insert({
            user_id: currentUser.id,
            ...scores
        });
        
        examContent.innerHTML = `
            <div class="exam-intro">
                <h2>¡Examen Completado!</h2>
                <p>Tus resultados han sido guardados.</p>
                
                <div class="scores-grid" style="margin-top: 30px;">
                    <div class="score-item">
                        <div class="score-label">Español</div>
                        <div class="score-value">${scores.reading_score}%</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Matemáticas</div>
                        <div class="score-value">${scores.math_score}%</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Ciencias Naturales</div>
                        <div class="score-value">${scores.science_score}%</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Ciencias Sociales</div>
                        <div class="score-value">${scores.humanities_score}%</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">Calificación General</div>
                        <div class="score-value">${scores.overall_score}%</div>
                    </div>
                </div>
                
                <button onclick="showPage('dashboard-page')" class="btn-primary">
                    Volver al Panel
                </button>
            </div>
        `;
    } catch (error) {
        console.error('Error submitting exam:', error);
        examContent.innerHTML = '<div class="loading">Error al enviar el examen</div>';
    }
}

// Results Functions
async function loadResults() {
    if (!currentUser) return;
    
    const resultsDiv = document.getElementById('results-list');
    resultsDiv.innerHTML = '<div class="loading">Cargando resultados...</div>';
    
    try {
        const { data, error } = await supabaseClient
            .from('diagnostic_exam_results')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('taken_at', { ascending: false });
        
        if (error) throw error;
        
        if (data.length === 0) {
            resultsDiv.innerHTML = '<p>No has realizado ningún examen aún.</p>';
        } else {
            resultsDiv.innerHTML = data.map(result => `
                <div class="result-card">
                    <div class="result-date">
                        Realizado el: ${new Date(result.taken_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div class="scores-grid">
                        <div class="score-item">
                            <div class="score-label">Español</div>
                            <div class="score-value">${result.reading_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Matemáticas</div>
                            <div class="score-value">${result.math_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Ciencias Naturales</div>
                            <div class="score-value">${result.science_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Ciencias Sociales</div>
                            <div class="score-value">${result.humanities_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Calificación General</div>
                            <div class="score-value">${result.overall_score}%</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading results:', error);
        resultsDiv.innerHTML = '<p>Error al cargar los resultados</p>';
    }
}

// Allow sending message with Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeInput = document.activeElement;
        if (activeInput.tagName === 'TEXTAREA') {
            if (activeInput.id === 'psych-input') {
                e.preventDefault();
                sendMessage('psychological');
            } else if (activeInput.id === 'vocational-input') {
                e.preventDefault();
                sendMessage('vocational');
            }
        }
    }
});
