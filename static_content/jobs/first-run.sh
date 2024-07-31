#!/bin/zsh

# Define jobsRootDir as the directory where the script is located
jobsRootDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define the absolute paths for jobs.xlsx and jobs.mjs
xlsxPath="$jobsRootDir/jobs.xlsx"
mjsPath="$jobsRootDir/jobs.mjs"

# Create virtual environment in the jobsRootDir
python -m venv "$jobsRootDir/venv"

# Activate virtual environment
source "$jobsRootDir/venv/bin/activate"

# Install required packages
pip install -r "$jobsRootDir/requirements.txt" -q

# Update obs.mjs from jobs.xlsx
echo "$mjsPath is being updated from $xlsxPath"
python "$jobsRootDir/xlsx2mjs.py" "$xlsxPath" "$mjsPath"
echo "$mjsPath has been updated from $xlsxPath"
