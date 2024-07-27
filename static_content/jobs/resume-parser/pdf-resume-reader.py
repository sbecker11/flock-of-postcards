import os
import re
import PyPDF2
import argparse

class Section:
    def __init__(self, name):
        self.name = name
        self.content = None

def read_pdf_to_string(file_path):
    """
    Reads a PDF file and returns its content as a string, adding newline between pages
    """
    pdf_content = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            page_count = 0
            for page in pdf_reader.pages:
                text = page.extract_text()
                pdf_content += text  + '\n' # Add extra newline between pages
    except Exception as e:
        print(f"An error occurred while reading the PDF: {str(e)}")
        return None
    
    # remove the trailing newline
    return pdf_content.strip()

def parse_header(header_content):
    """
    Parses the header section of the resume, which has format:
    'SHAWN BECKER Lehi, UT • (857) 891-0896 • sbecker@alum.mit.edu  •\nDATA ENGINEER / DATA ARCHITECT / MACHINE LEARNING •'
    """
    header_content = header_content.strip().replace('\n',' ')
    part_0, phone, email, title, ignore = header_content.split('•')
    first_name, last_name, city, state, ignore = part_0.split(' ')
    city  = city.replace(',', '')
    phone = phone.strip()
    email = email.strip()
    title = title.strip()
    
    return {
        "first_name": first_name,
        "last_name": last_name,
        "city": city,
        "state": state,
        "phone": phone,
        "email": email,
        "title": title
    }

def parse_summary(lines):
    """
    Parses the summary section of the resume.
    """
    return {"summary": lines}


jobs_test_content = '''
Fannie Mae / Risk Works Analysis Data Lake; Washington, DC (Feb 2024 – Current) Senior Data Engineer • Documented processes to build, test, and deploy data pipeline components for in-house ETL framework. • Extensive work with SQL, AWS Redshift, Glue, S3, IAM, Lambda, REST, API Gateway, Postman, and SNS. • Utilized Agile practices with Jira, including backlog refinements, sprint planning, daily scrums, bi-weekly sprint reviews, and end-of-sprint retrospectives. Enabled the product owner to review each shipped product increment, allowing for potential revision or re-prioritization of backlog items. The Cigna Group / Data Cybersecurity; Bloomfield, CT (May 2023 - Dec 2023) Senior Data Engineer • Modernized apps via Jenkins CI/CD pipeline upgrade, integrating SetupTools, Artifactory/PyPI, SonarQube, and Xray. • Investigated and implemented preparation of legacy ETL data pipeline components. Migration from on- prem Unity IoC apps to the AWS cloud using CDC. • Engineered Python REST API enabling credential retrieval from CyberArk’s identity management platform using mutual TLS/SSL authentication via AWS API Gateway • Initiated CyberArk service updates to extract credentials at runtime, avoiding the need to access locally encrypted files and eliminating engineering efforts to satisfy cybersecurity requirements. The cost was reduced by 95% of the original for each password rollover event.
'''

def parse_jobs(jobs_content):
    jobs_content = jobs_test_content
    
    job_header_pattern = r'(?P<employer>.*?); (?P<location>.*?)\s*\((?P<date_range>.*?)\)\s*(?P<role>.*?)\s*(?P<bullet>•)'

    job_headers = list(re.finditer(job_header_pattern, jobs_content))
    job_header_start_positions = [match.start() for match in job_headers]
    job_header_end_positions = [match.end() for match in job_headers]

    jobs = []
    for i, match in enumerate(job_headers):
        job_header_content = jobs_content[job_header_start_positions[i]:job_header_end_positions[i]].strip()
        employer = match.group('employer')
        location = match.group('location')
        date_range = match.group('date_range')
        role = match.group('role')
        bullet = match.group('bullet')

        responsibilities_start = job_header_end_positions[i]
        responsibilities_end = job_header_start_positions[i+1] if i+1 < len(job_headers) else len(jobs_content)
        responsibilities_content = jobs_content[responsibilities_start:responsibilities_end].strip()
        responsibilities = [resp.strip() for resp in re.split(r'\s*•\s*', responsibilities_content) if resp.strip()]

        job = {
            'employer': employer.strip(),
            'location': location.strip(),
            'date_range': date_range.strip(),
            'role': role.strip(),
            'bullet': bullet.strip(),
            'responsibilities': responsibilities
        }
        jobs.append(job)
        
    return jobs

def parse_education(lines):
    """
    Parses the education section of the resume.
    """
    pattern = r"^(?P<university>.*?),\s+(?P<city>.*?),\s+(?P<state>.*?),\s+(?P<degree>.*?),\s+(?P<college>.*?)(?:,\s*(?P<thesis>.*?)(?:\s*\((?P<year>\d{4})\))?)?$"
    education = []
    current_edu = None
    for line in lines:
        match = re.match(pattern, line)
        if match:
            current_edu = {
                "university": match.group("university"),
                "city": match.group("city"),
                "state": match.group("state"),
                "degree": match.group("degree"),
                "college": match.group("college")
            }
            if match.group("thesis"):
                current_edu["thesis"] = match.group("thesis")
            if match.group("year"):
                current_edu["year"] = match.group("year")
        if current_edu:
            education.append(current_edu)

    return education

def parse_certifications(content_string):
    """
    Parses the certifications, publications, patents, and websites section of the resume.
    """
    pattern = r'(\w+):\s*(\S+)'
    certifications = []
    for match in re.finditer(pattern, content_string):
        certification = {
            'name': match.group(1),
            'url': match.group(2)
        }
        certifications.append(certification)
    return certifications

def parse_skills(lines):
    """
    Parses the skills and expertise section of the resume.
    """
    skills = []
    for line in lines:
        skills.extend([skill.strip() for skill in line.split('•') if skill.strip()])
    return skills

def create_section_objects(pdf_content):
    """
    Creates section objects from the PDF content.
    """
    sections = []

    # Parse the header section
    fifth_bullet_index = pdf_content.find('•', pdf_content.find('•', pdf_content.find('•', pdf_content.find('•') + 1) + 1) + 1)
    header_end = fifth_bullet_index + 1
    header_content = pdf_content[:header_end].strip()
    header_section = Section("HEADER")
    header_section.content = parse_header(header_content)
    sections.append(header_section)

    # Parse the summary section
    summary_start = header_end + 1
    summary_end = pdf_content.find("WORK EXPERIENCE")
    if summary_end == -1:
        summary_end = len(pdf_content)
    summary_content = pdf_content[summary_start:summary_end].strip().replace('\n', ' ')
    summary_lines = [line.strip()+'.' for line in summary_content.split('.') if line.strip()]
    summary_section = Section("SUMMARY")
    summary_section.content = parse_summary(summary_lines)
    sections.append(summary_section)

    # Parse the work experience section
    work_experience_start = summary_end + len("WORK EXPERIENCE")
    work_experience_end = pdf_content.find("EDUCATION")
    if work_experience_end == -1:
        work_experience_end = len(pdf_content)
    work_experience_content = pdf_content[work_experience_start:work_experience_end].strip()
    work_experience_section = Section("WORK EXPERIENCE")
    work_experience_section.content = parse_jobs(work_experience_content)
    sections.append(work_experience_section)

    # Parse the education section
    education_start = work_experience_end + len("EDUCATION")
    education_end = pdf_content.find("CERTIFICATIONS, PUBLICATIONS, PATENTS, WEBSITES")
    if education_end == -1:
        education_end = len(pdf_content)
    education_content = pdf_content[education_start:education_end].strip()
    education_lines = [line.strip() for line in education_content.split('•') if line.strip()]
    education_section = Section("EDUCATION")
    education_section.content = parse_education(education_lines)
    sections.append(education_section)

    # Parse the certifications, publications, patents, and websites section
    certs_start = education_end + len("CERTIFICATIONS, PUBLICATIONS, PATENTS, WEBSITES")
    certs_end = pdf_content.find("SKILLS and EXPERTISE")
    if certs_end == -1:
        certs_end = len(pdf_content)
    certs_content = pdf_content[certs_start:certs_end].strip()
    certs_section = Section("CERTIFICATIONS, PUBLICATIONS, PATENTS, WEBSITES")
    certs_section.content = parse_certifications(certs_content)
    sections.append(certs_section)

    # Parse the skills and expertise section
    skills_start = certs_end + len("SKILLS and EXPERTISE")
    skills_content = pdf_content[skills_start:].strip()
    skills_lines = [line.strip() for line in skills_content.split('\n') if line.strip()]
    skills_section = Section("SKILLS and EXPERTISE")
    skills_section.content = parse_skills(skills_lines)
    sections.append(skills_section)

    return sections

def main():
    """
    Main function to run the PDF resume parser.
    """
    parser = argparse.ArgumentParser(description='PDF Resume Parser')
    parser.add_argument('pdf_file_path', type=str, help='Path to the PDF resume file')

    # Parse the command line arguments
    args = parser.parse_args()

    # Get the PDF file path from the command line argument
    pdf_file_path = args.pdf_file_path

    # Check if the PDF file exists
    if not os.path.isfile(pdf_file_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_file_path}")
    
    pdf_content = read_pdf_to_string(pdf_file_path)
    
    if pdf_content:
        sections = create_section_objects(pdf_content)
        
        # Print the results
        for section in sections:
            print(f"Name: {section.header}")
            print("Parsed Content:")
            print(section.content)
            print()
    else:
        print("Failed to read the PDF file.")

if __name__ == "__main__":
    main()