import pdfplumber
import spacy
import re
import sys

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Custom NER for specific labels
def add_custom_ner_labels(doc):
    entities = []
    for ent in doc.ents:
        if ent.label_ in ["ORG", "GPE", "PERSON", "DATE"]:
            entities.append(ent)
    return entities

# Function to detect and classify sections based on content
def classify_section_by_content(text):
    doc = nlp(text[:500])  # Analyze the first 500 characters for classification
    job_keywords = ["engineer", "developer", "manager", "scientist", "analyst", "consultant", "executive"]
    education_keywords = ["university", "college", "institute", "degree", "bachelor", "master", "phd", "school"]
    
    job_count = sum([1 for token in doc if token.text.lower() in job_keywords])
    education_count = sum([1 for token in doc if token.text.lower() in education_keywords])
    
    if job_count > education_count:
        return "WORK EXPERIENCE"
    elif education_count > job_count:
        return "EDUCATION"
    else:
        return None

# Function to parse jobs
def parse_jobs(section_text):
    jobs = []
    job_entries = section_text.split("\n\n")
    for entry in job_entries:
        doc = nlp(entry)
        entities = add_custom_ner_labels(doc)
        
        job_info = {}
        details = []

        for ent in entities:
            if ent.label_ == "ORG":
                job_info["employer"] = ent.text
            elif ent.label_ == "GPE":
                job_info["location"] = ent.text
            elif ent.label_ == "DATE":
                if "date_started" not in job_info:
                    job_info["date_started"] = ent.text
                else:
                    job_info["date_ended"] = ent.text
            elif ent.label_ == "PERSON":
                job_info["role"] = ent.text
        
        # Fallback mechanism to infer role if not found
        if "role" not in job_info:
            job_info["role"] = entry.split()[-1] if len(entry.split()) > 1 else entry
        
        # Capture remaining details
        details = [sent.text for sent in doc.sents if sent.text not in job_info.values()]
        job_info["details"] = details
        jobs.append(job_info)

    return jobs

# Function to parse education
def parse_education(section_text):
    education = []
    edu_entries = section_text.split("\n")
    for entry in edu_entries:
        doc = nlp(entry)
        entities = add_custom_ner_labels(doc)
        
        edu_info = {}
        for ent in entities:
            if ent.label_ == "ORG":
                edu_info["institution"] = ent.text
            elif ent.label_ == "GPE":
                edu_info["location"] = ent.text
            elif ent.label_ == "PERSON":
                edu_info["degree"] = ent.text
            elif ent.label_ == "DATE":
                edu_info["field_of_study"] = ent.text
        
        education.append(edu_info)
    return education

def extract_information(text):
    # Initialize result dictionaries
    jobs = []
    education = []

    # Split sections based on potential section breaks
    sections = re.split(r'\n(?=\S)', text)

    current_section = None
    current_section_text = ""

    for section in sections:
        if len(section.strip()) == 0:
            continue

        section_type = classify_section_by_content(section.strip())
        
        if section_type:
            if current_section == "WORK EXPERIENCE":
                jobs.extend(parse_jobs(current_section_text))
            elif current_section == "EDUCATION":
                education.extend(parse_education(current_section_text))
            
            current_section = section_type
            current_section_text = section.strip()
        else:
            current_section_text += "\n" + section.strip()

    # Parse the final section
    if current_section == "WORK EXPERIENCE":
        jobs.extend(parse_jobs(current_section_text))
    elif current_section == "EDUCATION":
        education.extend(parse_education(current_section_text))

    return {"jobs": jobs, "education": education}

# Function to extract text from PDF using pdfplumber
def extract_text_with_formatting(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

# Function to extract text from PDF using PyPDF2
def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <path_to_resume.pdf>")
        return

    pdf_path = sys.argv[1]
    try:
        formatted_text = extract_text_with_formatting(pdf_path)

        # Extract information from the formatted text
        info = extract_information(formatted_text)
        
        print("Jobs:")
        for job in info['jobs']:
            print(job)
        
        print("\nEducation:")
        for edu in info['education']:
            print(edu)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
