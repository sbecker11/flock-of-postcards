#!/bin/zsh
python -m venv venv
source venv/bin/activate

# Function to add directory to PATH if not already present
add-dir-to-path() {
    local DIR_TO_ADD=$(realpath "$1")
    if [[ ":$PATH:" != *":$DIR_TO_ADD:"* ]]; then
        export PATH="$DIR_TO_ADD:$PATH"
    fi
}

# Add directory to PATH
add-dir-to-path resume-parser

# Install required packages
pip install -r requirements.txt -q

# Update obs.mjs from jobs.xlsx
echo "obs.mjs is being updated from jobs.xlsx"
python xlsx2mjs.py
echo "obs.mjs has been updated from jobs.xlsx"