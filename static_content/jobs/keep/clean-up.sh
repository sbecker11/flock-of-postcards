#!/bin/zsh

# Define jobsRootDir as the directory where the script is located
jobsRootDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Clean up the virtual environment
deactivate
rm -rf $jobsRootDir/venv

