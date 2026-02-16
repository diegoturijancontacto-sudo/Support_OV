# Support_OV - Documentación de Arquitectura

## Visión General

Support_OV es una plataforma web completa para proporcionar asistencia psicológica y orientación vocacional a estudiantes que se preparan para ingresar a la universidad.

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (HTML/CSS/JS)                 │
│  - Interfaz de usuario responsiva                           │
│  - Gestión de estado del cliente                            │
│  - Comunicación con API REST                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Backend (Flask)                          │
│  - API REST endpoints                                        │
│  - Lógica de negocio                                         │
│  - Integración con Gemini AI                                 │
│  - Gestión de sesiones                                       │
└────────┬─────────────────────────────────┬─────────────────┘
         │                                 │
         │                                 │
    ┌────▼────┐                      ┌─────▼─────┐
    │ Supabase│                      │  Gemini   │
    │(PostgreSQL)                    │    AI     │
    │  - Auth  │                      │           │
    │  - DB    │                      └───────────┘
    └──────────┘
```

## Flujo de Datos

### 1. Autenticación

```
Usuario → Frontend → API /api/login → Supabase Auth → Token JWT → Frontend
```

### 2. Chat Psicológico/Vocacional

```
Usuario escribe mensaje → Frontend
    ↓
API /api/chat/psychological o /api/chat/vocational
    ↓
Guardar mensaje del usuario en Supabase
    ↓
Obtener historial de conversación
    ↓
Enviar contexto + mensaje a Gemini AI
    ↓
Recibir respuesta de Gemini
    ↓
Guardar respuesta en Supabase
    ↓
Retornar respuesta al Frontend
```

### 3. Examen de Simulación

```
Usuario inicia examen → Frontend
    ↓
API /api/exam/questions → Retorna Preguntas.json
    ↓
Usuario responde preguntas → Frontend guarda respuestas localmente
    ↓
Usuario finaliza → API /api/exam/submit
    ↓
Calcular calificaciones por sección
    ↓
Guardar resultados en Supabase
    ↓
Retornar calificaciones al Frontend
```

## Base de Datos (Supabase)

### Tablas

#### `profiles`
Información del perfil del usuario
- `id` (UUID, PK) - Referencia a auth.users
- `full_name` (text)
- `birth_date` (date)
- `gender` (text)
- `state` (text)
- `phone` (text, opcional)
- `purchasing_power` (text, opcional)
- `desired_career` (text, opcional)
- `socioeconomic_status` (text, opcional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `psychological_conversations`
Historial de conversaciones psicológicas
- `id` (bigint, PK)
- `user_id` (UUID, FK → profiles.id)
- `role` (text: 'user' | 'assistant')
- `message` (text)
- `emotional_tag` (text, opcional)
- `created_at` (timestamp)

#### `vocational_conversations`
Historial de conversaciones de orientación vocacional
- `id` (bigint, PK)
- `user_id` (UUID, FK → profiles.id)
- `role` (text: 'user' | 'assistant')
- `message` (text)
- `created_at` (timestamp)

#### `diagnostic_exam_results`
Resultados de exámenes diagnóstico
- `id` (bigint, PK)
- `user_id` (UUID, FK → profiles.id)
- `math_score` (integer, 0-100)
- `reading_score` (integer, 0-100)
- `science_score` (integer, 0-100)
- `humanities_score` (integer, 0-100)
- `overall_score` (integer, 0-100)
- `taken_at` (timestamp)

## API Endpoints

### Autenticación

#### POST `/api/register`
Registra un nuevo usuario

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña",
  "full_name": "Nombre Completo",
  "birth_date": "2005-01-15",
  "gender": "masculino|femenino|no_binario|prefiero_no_decir",
  "state": "Estado",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": "uuid"
}
```

#### POST `/api/login`
Inicia sesión

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "success": true,
  "session": "jwt_token",
  "user": "uuid",
  "profile": { /* datos del perfil */ }
}
```

### Chat

#### POST `/api/chat/psychological`
Envía un mensaje al chat psicológico

**Request Body:**
```json
{
  "user_id": "uuid",
  "message": "Mensaje del usuario"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Respuesta del asistente"
}
```

#### POST `/api/chat/vocational`
Envía un mensaje al chat de orientación vocacional

(Mismo formato que psychological)

#### GET `/api/chat/history/:chat_type/:user_id`
Obtiene el historial de conversaciones

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "user_id": "uuid",
      "role": "user",
      "message": "Mensaje",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Examen

#### GET `/api/exam/questions`
Obtiene las preguntas del examen

**Response:**
```json
{
  "success": true,
  "exam": {
    "examen": "Simulacro de Admisión Universitaria",
    "total_preguntas": 120,
    "secciones": { /* preguntas por sección */ }
  }
}
```

#### POST `/api/exam/submit`
Envía las respuestas del examen

**Request Body:**
```json
{
  "user_id": "uuid",
  "answers": {
    "1": "a",
    "2": "c",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "user_id": "uuid",
    "math_score": 85,
    "reading_score": 90,
    "science_score": 75,
    "humanities_score": 80,
    "overall_score": 82
  }
}
```

#### GET `/api/exam/results/:user_id`
Obtiene el historial de resultados de exámenes

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "user_id": "uuid",
      "math_score": 85,
      "reading_score": 90,
      "science_score": 75,
      "humanities_score": 80,
      "overall_score": 82,
      "taken_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Configuración

### Variables de Entorno Requeridas

- `GEMINI_API_KEY`: API key de Google Gemini (requerida para funcionalidad de chat)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase (opcional)

### Archivo Keys.txt

Contiene la configuración de Supabase:
```
Variables: 
DB URL: https://[project-id].supabase.co 
anon: [anon_key]
Gemini: https://[project-id].supabase.co/functions/v1/cpalead
Service role(Environment var): SUPABASE_SERVICE_ROLE_KEY
```

## Seguridad

### Medidas Implementadas

1. **Autenticación**: Supabase Auth con JWT tokens
2. **Contraseñas**: Encriptadas por Supabase (bcrypt)
3. **API Keys**: Almacenadas en variables de entorno
4. **Validación**: Validación de datos en frontend y backend
5. **CORS**: Configurado para permitir solo orígenes autorizados

### Consideraciones de Seguridad

- Nunca commitear archivos .env con credenciales reales
- Las API keys deben mantenerse en secreto
- Los tokens de sesión se almacenan en localStorage (considerar usar httpOnly cookies en producción)
- Implementar rate limiting en producción
- Usar HTTPS en producción

## Mejoras Futuras

1. **Funcionalidad**
   - Análisis de sentimientos en conversaciones psicológicas
   - Recomendaciones personalizadas de carrera basadas en resultados de exámenes
   - Sistema de notificaciones por email
   - Chat en tiempo real con WebSockets
   - Exportar resultados en PDF

2. **Técnico**
   - Tests automatizados (unit, integration, e2e)
   - CI/CD pipeline
   - Monitoreo y logging
   - Cache de respuestas frecuentes
   - Optimización de consultas a la base de datos

3. **UI/UX**
   - Modo oscuro
   - Accesibilidad (WCAG 2.1)
   - Versión móvil nativa
   - Internacionalización (i18n)
   - Tutoriales interactivos

4. **Seguridad**
   - Autenticación de dos factores (2FA)
   - Rate limiting
   - Auditoría de seguridad
   - Cifrado de mensajes sensibles
   - Política de privacidad y GDPR compliance
