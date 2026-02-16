# Support_OV - Plataforma de Asistencia Psicológica y Vocacional

Una plataforma web completa para asistencia psicológica y orientación vocacional con integración de Gemini AI y Supabase.

## Características

- 🔐 **Sistema de Autenticación**: Login y registro de usuarios con Supabase Auth
- 💬 **Chat Psicológico**: Asistencia emocional mediante Gemini AI
- 🎓 **Orientación Vocacional**: Guía personalizada para elección de carrera
- 📝 **Examen de Simulación**: 120 preguntas de examen de admisión universitaria
- 📊 **Historial de Resultados**: Seguimiento del progreso académico
- 💾 **Almacenamiento en la Nube**: Todos los datos se guardan en Supabase

## Requisitos Previos

- Python 3.8+
- Cuenta de Supabase
- API Key de Google Gemini

## Configuración

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Crear un archivo `.env` o configurar las variables de entorno:

```
GEMINI_API_KEY=tu_api_key_de_gemini
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
```

**Nota**: Las credenciales de Supabase se leen desde `Keys.txt`, que ya contiene:
- URL de la base de datos
- Anon key para el cliente

### 3. Configurar la base de datos

Las tablas necesarias ya están definidas en `db.sql`. Asegúrate de que tu base de datos de Supabase tenga las siguientes tablas:

- `profiles`: Perfiles de usuarios
- `psychological_conversations`: Conversaciones de chat psicológico
- `vocational_conversations`: Conversaciones de orientación vocacional
- `diagnostic_exam_results`: Resultados de exámenes

### 4. Ejecutar la aplicación

```bash
python app.py
```

La aplicación estará disponible en `http://localhost:5000`

## Estructura del Proyecto

```
Support_OV/
├── app.py                      # Backend Flask
├── requirements.txt            # Dependencias Python
├── Keys.txt                    # Configuración de Supabase
├── Preguntas.json             # 120 preguntas del examen
├── db.sql                      # Schema de la base de datos
├── static/
│   ├── index.html             # Interfaz web principal
│   ├── css/
│   │   └── style.css          # Estilos
│   └── js/
│       └── app.js             # Lógica del frontend
└── README.md

```

## Uso

### Registro e Inicio de Sesión

1. Abre la aplicación en tu navegador
2. Crea una cuenta nueva proporcionando:
   - Nombre completo
   - Email
   - Contraseña
   - Fecha de nacimiento
   - Género
   - Estado
   - Teléfono (opcional)
3. Inicia sesión con tus credenciales

### Chat Psicológico

- Accede desde el panel principal
- Escribe tus preocupaciones o emociones
- Recibe apoyo y orientación de un asistente psicológico virtual
- Todo el historial se guarda automáticamente

### Orientación Vocacional

- Discute tus intereses y aptitudes
- Recibe recomendaciones de carreras
- Obtén información sobre universidades y opciones educativas

### Examen de Simulación

- Realiza un examen completo de 120 preguntas
- Cubre 4 áreas: Español, Matemáticas, Ciencias Naturales y Ciencias Sociales
- Navega entre preguntas libremente
- Recibe resultados detallados por sección
- Consulta tu historial de resultados en cualquier momento

## Tecnologías Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Base de Datos**: Supabase (PostgreSQL)
- **AI**: Google Gemini
- **Autenticación**: Supabase Auth

## Seguridad

- Las contraseñas se manejan mediante Supabase Auth (encriptación automática)
- Los tokens de sesión se almacenan localmente
- Las API keys se gestionan mediante variables de entorno
- Validación de datos en frontend y backend

## Desarrollo

Este proyecto está diseñado para ser simple y fácilmente extensible. Algunas mejoras futuras podrían incluir:

- Tests automatizados
- Más tipos de exámenes
- Análisis avanzado de resultados
- Notificaciones por email
- Panel de administración
- Modo oscuro

## Licencia

Este proyecto es de código abierto para fines educativos.