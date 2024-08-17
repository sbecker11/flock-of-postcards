import time
import pdfplumber
import sys
import anthropic
import json
import os
from dotenv import load_dotenv
from docx import Document

# Function to extract text from PDF using pdfplumber
def extract_text_from_pdf_with_formatting(resume_pdf_path):
    text = ""
    with pdfplumber.open(resume_pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx_with_formatting(resume_input_docx_path):
    text = ""
    doc = Document(resume_input_docx_path)
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def main():
    if len(sys.argv) != 3:
        print("Usage: python resume_parser.py <path_to_input_resume.pdf|docx> <path_to_output_resume.json>")
        return

    resume_input_path = sys.argv[1]
    resume_input_pdf_path = resume_input_path if resume_input_path.lower().endswith('.pdf') else None
    resume_input_docx_path = resume_input_path if resume_input_path.lower().endswith('.docx') else None
    resume_output_json_path = sys.argv[2]
    
    # get resume_input text from either pdf file or docx file
    resume_input_text = None
    start_time = time.time()
    if resume_input_pdf_path:
        if not os.path.exists(resume_input_pdf_path):
            print(f"pdf file not found: {resume_input_pdf_path}")
            return
        resume_input_text = extract_text_from_pdf_with_formatting(resume_input_pdf_path)
    elif resume_input_docx_path:
        if not os.path.exists(resume_input_docx_path):
            print(f"docx file not found: {resume_input_docx_path}")
            return
        resume_input_text = extract_text_from_docx_with_formatting(resume_input_docx_path)
    else:
        print("Invalid input resume file format. Only PDF and DOCX files are supported.")
        return
    elapsed_time = time.time() - start_time
    print(f"text extraction completed in {elapsed_time:.2f} seconds")

    # prompt_template_text includes {resume_input_text}
    prompt_template_text = f"""Please analyze the following resume_text and
    create a JSON object that puts text for the classified sections 
    into sub-objects. The typical sections for a software developer 
    resume are:
    1. Contact Information
    2. Position or Professional Title
    3. Professional Summary (optional)
    4. Work Experience
    4.1. Company Name
    4.2. Location (City, State, Country) or Remote
    4.3. Duration
    4.4. Position or Title
    4.5. Responsibilities
    5. Education
    6. Skills
    7. Certifications (optional)
    8. Publications (optional)
    9. Patents (optional)
    10. Websites or Online Profiles (optional)

    Please use these sections to organize the information from the following resume_text.
      If an optional section is not present in the resume_text, omit it from the JSON object.
    If you encounter a duration with format ( mm/dd/yyyy - mm/dd/yyyy ) or ( mm/yyyy - mm/yyyy ) or ( yyyy - yyyy ), 
      use it to define a "duration" sub-object with properties "start" and "end", retaining the
      original string values, in the JSON object.
    If you encounter a bulletted string with bullet points (•), use a bullet point to split 
      the string into a comma-separated list of strings with no bullet points
      and use it to replace the original bulletted string in the JSON object.

    <resume_text begins here>
    {resume_input_text}
    <resume_text ends here>

    Please provide only the JSON object in your response, with no additional text."""
        
    prompt_text = prompt_template_text.replace("{resume_input_text}", resume_input_text)
    
    # Initialize the Anthropic client, after getting 
    # ANTHROPIC_API_KEY from the .env file at the root of the project
    load_dotenv()    
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY-20240816")
    client = anthropic.Anthropic(api_key=anthropic_api_key)

    model = "claude-3-sonnet-20240229"
    start_time = time.time()
    print(f"prompt sent to {model}")
    response = client.messages.create(
        model=model,
        max_tokens=4000,
        temperature=0,
        system="You are an expert at parsing resumes and creating structured data from them.",
        messages=[
            {"role": "user", "content": prompt_text}
        ]
    )
    elapsed_time = time.time() - start_time
    print(f"response received in {elapsed_time:.2f} seconds")

    # Get the generated JSON string
    json_string = response.content[0].text

    # Parse the JSON string
    parsed_json = json.loads(json_string)

    # Print the parsed JSON
    with open(resume_output_json_path, 'w') as f:
        json.dump(parsed_json, f, indent=2)

    print(f"json response saved to: {resume_output_json_path}")

if __name__ == "__main__":
    main()
