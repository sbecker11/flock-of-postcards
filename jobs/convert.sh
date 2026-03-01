#!/bin/bash
set -e  # Exit on error

# Script to convert jobs.xlsx to jobs.mjs with URL validation
# This script sets up a Python virtual environment if needed

cd "$(dirname "$0")"

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip first
echo "Upgrading pip..."
pip install --upgrade pip

# Install/update requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run the converter
echo "Converting jobs.xlsx to jobs.mjs..."
python3 xlsx2mjs.py

# Deactivate venv
deactivate

echo "Done! Generated jobs.mjs with validated URLs."
