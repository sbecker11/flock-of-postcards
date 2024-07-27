import pdfplumber
import re
import sys
import anthropic
import json
import os
from dotenv import load_dotenv


# Function to extract text from PDF using pdfplumber
def extract_text_with_formatting(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

# Function to extract text from PDF using PyPDF2
def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py <path_to_input_resume.pdf> <path_to_output_resume.json>")
        return

    pdf_path = sys.argv[1]
    json_path = sys.argv[2]
    resume_text = extract_text_with_formatting(pdf_path)

    # Initialize the Anthropic client
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=anthropic_api_key)
    
    # Your prompt
    prompt = f"""Please analyze the following resume and create a JSON object that puts text for the classified sections into sub-objects. The typical sections for a software developer resume are:

    1. Contact Information
    2. Position or Professional Title
    3. Professional Summary (optional)
    4. Work Experience
    5. Education
    6. Skills
    7. Certifications (optional)
    8. Publications (optional)
    9. Patents (optional)
    10. Websites or Online Profiles (optional)

    Please use these sections to organize the information from the following resume. If an optional section is not present in the resume, omit it from the JSON object.

    {resume_text}

    Please provide only the JSON object in your response, with no additional text."""

    # Send the message to Claude
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4000,
        temperature=0,
        system="You are an expert at parsing resumes and creating structured data from them.",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # Get the generated JSON string
    json_string = response.content[0].text

    # Parse the JSON string
    parsed_json = json.loads(json_string)

    # Print the parsed JSON
    with open(json_path, 'w') as f:
        json.dump(parsed_json, f, indent=2)

    print(f"json response saved to: {json_path}")

if __name__ == "__main__":
    main()
