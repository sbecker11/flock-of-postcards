#!/bin/zsh
python -m venv venv
source venv/bin/activate

# Install required packages
pip install -r requirements.txt -q

# Update obs.mjs from jobs.xlsx
echo "obs.mjs is being updated from jobs.xlsx"
python xlsx2mjs.py
echo "obs.mjs has been updated from jobs.xlsx"