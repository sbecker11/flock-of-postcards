import re
import PyPDF2

class Section:
    def __init__(self, header):
        self.header = header
        self.content = None

def read_pdf_to_string(file_path):
    """
    Reads a PDF file and returns its content as a string, attempting to preserve line breaks.
    """
    pdf_content = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            page_count = 0
            for page in pdf_reader.pages:
                text = page.extract_text()
                
                # Attempt to reconstruct line breaks
                lines = re.split(r'(?<=[.•])\s+(?=[A-Z])', text)
                print(f'Extracted {len(lines)} lines from page {page_count}')
                for line in lines:
                    print(line)
                    print("-------------------")

                pdf_content += '\n'.join(lines) + "\n\n"  # Add extra newline between pages
    except Exception as e:
        print(f"An error occurred while reading the PDF: {str(e)}")
        return None
    
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

def parse_jobs(text):
    job_header_pattern = r'(?P<employer>.*?); (?P<location>.*?)\s*\((?P<time_period>.*?)\)\s+(?P<role>.*?)\s*'
    jobs = []

    job_headers = list(re.finditer(job_header_pattern, text, re.DOTALL))
    job_start_positions = [match.start() for match in job_headers]
    job_end_positions = job_start_positions[1:] + [len(text)]

    for i, match in enumerate(job_headers):
        employer = match.group('employer')
        location = match.group('location')
        time_period = match.group('time_period')
        role = match.group('role')
        responsibilities_content = text[match.end():job_end_positions[i]].strip()
        responsibilities = [resp.strip() for resp in re.split(r'\s*•\s*', responsibilities_content) if resp.strip()]

        job = {
            'employer': employer.strip(),
            'location': location.strip(),
            'time_period': time_period.strip(),
            'role': role.strip(),
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
    pdf_file_path = 'static_content/jobs/resume.pdf'  # Replace with your actual PDF file path
    pdf_content = read_pdf_to_string(pdf_file_path)
    
    if pdf_content:
        sections = create_section_objects(pdf_content)
        
        # Print the results
        for section in sections:
            print(f"Header: {section.header}")
            print("Parsed Content:")
            print(section.content)
            print()
    else:
        print("Failed to read the PDF file.")

if __name__ == "__main__":
    main()