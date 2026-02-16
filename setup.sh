#!/bin/bash

# Support_OV Setup Script

echo "=== Support_OV Platform Setup ==="
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Error installing dependencies. Please check your Python installation."
    exit 1
fi

echo ""
echo "✓ Dependencies installed successfully"
echo ""

# Check for environment variables
echo "Checking environment variables..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠ Warning: GEMINI_API_KEY not set"
    echo "  Chat functionality will not work without a Gemini API key"
    echo "  Set it with: export GEMINI_API_KEY='your_api_key_here'"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠ Warning: SUPABASE_SERVICE_ROLE_KEY not set"
    echo "  Some admin functions may not work"
    echo "  Set it with: export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key_here'"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the application:"
echo "  python3 app.py"
echo ""
echo "The application will be available at:"
echo "  http://localhost:5000"
echo ""
echo "Make sure you have set the required environment variables:"
echo "  - GEMINI_API_KEY (required for chat functionality)"
echo "  - SUPABASE_SERVICE_ROLE_KEY (optional)"
echo ""
