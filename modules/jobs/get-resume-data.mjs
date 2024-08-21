import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

async function getResumeText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else {
        throw new Error('Unsupported file type');
    }
}

export function getResumeDataPrompt(resumeText, resumeDataSchema) {
     const prompt = `
        Resume Text:
        ${resumeText}
        Resume Data Schema String:
        ${resumeDataSchemaStr}

        Please create a resumeData object using the above resumeText and resumeDataSchemaStr.
        `;
    return prompt;
}    

async function getResumeData(resumePath, resumeDataSchema) {
    try {
        const resumeText = await getResumeText(resumePath);
        const resumeDataSchema = JSON.parse(fs.readFileSync(RESUME_DATA_SCHEMA_PATH, 'utf-8'));
        const prompt = getResumeDataPrompt(resumeText, resumeDataSchema);
 

        // Here you would call your LLM with the prompt and await the response
        // For example:
        // const resumeData = await callLLM(prompt);

        // For now, we'll just return the prompt for demonstration purposes
        return prompt;
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error('File not found:', err.path);
        } else {
            console.error('Error reading file:', err);
        }    
    }
}

