#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo "Error: Node.js is not installed."
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo "Error: npm is not installed."
    exit 1
fi

# Check for npx
if ! command_exists npx; then
    echo "Error: npx is not installed."
    exit 1
fi

# Check for required environment variables
# if [ -z "$SOME_ENV_VAR" ]; then
#     echo "Error: SOME_ENV_VAR is not set."
#     exit 1
# fi

# Check if required files exist
REQUIRED_FILES=(
    "modules/jobs/json_utils.mjs"
    "modules/jobs/test_json_utils.mjs"
    "modules/jobs/test-files/abbr-resume.docx"
    "modules/jobs/test-files/simple-resume-obj.json"
    "modules/jobs/resume-inputs/resume-schema.json"
    "modules/jobs/resume-inputs/resume.docx"
    "modules/jobs/resume-outputs/resume.docx.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: Required file $file does not exist."
        exit 1
    fi
done

# Run any other pre-run checks or setup tasks here
echo "All pre-run checks passed."

# Optionally, you can run additional setup commands here
# For example, installing dependencies
# npm install

# End of script