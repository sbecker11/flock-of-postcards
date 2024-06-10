#!/bin/bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python xlsx2mjs.py
