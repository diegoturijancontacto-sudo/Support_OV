// Global state
let currentUser = null;
let examData = null;
let currentQuestionIndex = 0;
let userAnswers = {};

// API Base URL
const API_BASE = window.location.origin + '/api';

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
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = {
                id: data.user,
                session: data.session,
                profile: data.profile
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showPage('dashboard-page');
            document.getElementById('user-name').textContent = data.profile.full_name;
            errorDiv.textContent = '';
        } else {
            errorDiv.textContent = data.error || 'Error al iniciar sesión';
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión. Por favor intenta de nuevo.';
        console.error('Login error:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = {
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        full_name: document.getElementById('reg-fullname').value,
        birth_date: document.getElementById('reg-birthdate').value,
        gender: document.getElementById('reg-gender').value,
        state: document.getElementById('reg-state').value,
        phone: document.getElementById('reg-phone').value
    };
    
    const errorDiv = document.getElementById('register-error');
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            errorDiv.textContent = '';
            errorDiv.style.color = 'green';
            errorDiv.textContent = 'Registro exitoso. Por favor inicia sesión.';
            setTimeout(() => showAuthTab('login'), 2000);
        } else {
            errorDiv.style.color = '#e74c3c';
            errorDiv.textContent = data.error || 'Error al registrarse';
        }
    } catch (error) {
        errorDiv.style.color = '#e74c3c';
        errorDiv.textContent = 'Error de conexión. Por favor intenta de nuevo.';
        console.error('Register error:', error);
    }
}

function checkAuth() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        showPage('dashboard-page');
        document.getElementById('user-name').textContent = currentUser.profile.full_name;
    }
}

function logout() {
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
        const response = await fetch(`${API_BASE}/chat/history/${chatType}/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            messagesDiv.innerHTML = '';
            data.history.forEach(msg => {
                appendMessage(chatType, msg.message, msg.role, msg.created_at);
            });
            
            if (data.history.length === 0) {
                messagesDiv.innerHTML = '<div class="loading">No hay mensajes aún. ¡Comienza la conversación!</div>';
            }
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
    
    // Clear input
    input.value = '';
    
    // Show user message immediately
    appendMessage(chatType, message, 'user');
    
    // Show loading indicator
    const messagesDiv = document.getElementById(`${chatType}-messages`);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = '<div class="message-content">Escribiendo...</div>';
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
        const response = await fetch(`${API_BASE}/chat/${chatType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                message: message
            })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        messagesDiv.removeChild(loadingDiv);
        
        if (data.success) {
            appendMessage(chatType, data.message, 'assistant');
        } else {
            appendMessage(chatType, 'Lo siento, hubo un error al procesar tu mensaje.', 'assistant');
        }
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
        const response = await fetch(`${API_BASE}/exam/questions`);
        const data = await response.json();
        
        if (data.success) {
            examData = data.exam;
            currentQuestionIndex = 0;
            userAnswers = {};
            displayQuestion();
        } else {
            examContent.innerHTML = '<div class="loading">Error al cargar el examen</div>';
        }
    } catch (error) {
        console.error('Error loading exam:', error);
        examContent.innerHTML = '<div class="loading">Error de conexión</div>';
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
    
    // Get all questions
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
    // Get all questions and save current answer
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
        // Get all questions and save current answer
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
        const response = await fetch(`${API_BASE}/exam/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                answers: userAnswers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const results = data.results;
            examContent.innerHTML = `
                <div class="exam-intro">
                    <h2>¡Examen Completado!</h2>
                    <p>Tus resultados han sido guardados.</p>
                    
                    <div class="scores-grid" style="margin-top: 30px;">
                        <div class="score-item">
                            <div class="score-label">Español</div>
                            <div class="score-value">${results.reading_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Matemáticas</div>
                            <div class="score-value">${results.math_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Ciencias Naturales</div>
                            <div class="score-value">${results.science_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Ciencias Sociales</div>
                            <div class="score-value">${results.humanities_score}%</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Calificación General</div>
                            <div class="score-value">${results.overall_score}%</div>
                        </div>
                    </div>
                    
                    <button onclick="showPage('dashboard-page')" class="btn-primary">
                        Volver al Panel
                    </button>
                </div>
            `;
        } else {
            examContent.innerHTML = '<div class="loading">Error al enviar el examen</div>';
        }
    } catch (error) {
        console.error('Error submitting exam:', error);
        examContent.innerHTML = '<div class="loading">Error de conexión</div>';
    }
}

// Results Functions
async function loadResults() {
    if (!currentUser) return;
    
    const resultsDiv = document.getElementById('results-list');
    resultsDiv.innerHTML = '<div class="loading">Cargando resultados...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/exam/results/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            if (data.results.length === 0) {
                resultsDiv.innerHTML = '<p>No has realizado ningún examen aún.</p>';
            } else {
                resultsDiv.innerHTML = data.results.map(result => `
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
        } else {
            resultsDiv.innerHTML = '<p>Error al cargar los resultados</p>';
        }
    } catch (error) {
        console.error('Error loading results:', error);
        resultsDiv.innerHTML = '<p>Error de conexión</p>';
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
